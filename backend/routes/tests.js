import express from 'express';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';
import Application from '../models/Application.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create a new test
router.post('/', async (req, res) => {
  try {
    const { jobId, recruiterId, testName, description, duration, totalQuestions, questions, passingScore, proctoring, scheduledDate, scheduledTime } = req.body;

    const test = await Test.create({
      jobId,
      recruiterId,
      testName,
      description,
      duration,
      totalQuestions,
      questions,
      passingScore,
      proctoring,
      scheduledDate,
      scheduledTime
    });

    res.json(test);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create test', error: err.message });
  }
});

// Get all tests for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const tests = await Test.find({ jobId }).populate('recruiterId', 'name email');
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tests' });
  }
});

// Get test by ID (for test taking)
router.get('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch test' });
  }
});

// Get test results for a test
router.get('/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    const results = await TestResult.find({ testId: new mongoose.Types.ObjectId(testId) }).populate('candidateId', 'name email');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch test results' });
  }
});

// Submit test result
router.post('/:testId/submit', async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    const { candidateId, candidateName, candidateEmail, jobId, answers, totalScore, correctAnswers, totalQuestions, timeUsed } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const passed = totalScore >= test.passingScore;

    console.log('Creating TestResult for testId=', testId, 'candidate=', candidateId);
    const testObjIdForResult = new mongoose.Types.ObjectId(testId);
    const jobObjIdForResult = jobId ? new mongoose.Types.ObjectId(jobId) : undefined;
    const candObjIdForResult = new mongoose.Types.ObjectId(candidateId);

    // fetch test name for logging
    let testNameForLog = null;
    try {
      const testDoc = await Test.findById(testObjIdForResult).lean();
      testNameForLog = testDoc?.testName || null;
    } catch (e) {
      // ignore
    }

    const result = await TestResult.create({
      testId: testObjIdForResult,
      jobId: jobObjIdForResult,
      candidateId: candObjIdForResult,
      candidateName,
      candidateEmail,
      answers,
      totalScore,
      correctAnswers,
      totalQuestions,
      status: 'completed',
      passed,
      timeUsed,
      completedAt: new Date()
    });
    console.log('Created TestResult id=', result._id, 'stored testId=', result.testId, 'testName=', testNameForLog);

    // Update application status - support both legacy `testId` and new `testIds` array
    let app = null;
    try {
      // Convert to ObjectId for reliable matching
      const testObjId = new mongoose.Types.ObjectId(testId);
      const candidateObjId = new mongoose.Types.ObjectId(candidateId);

      // First, try to update an element inside testIds array atomically
      let updatedApp = await Application.findOneAndUpdate(
        { candidateId: candidateObjId, 'testIds.testId': testObjId },
        {
          $set: {
            'testIds.$.completedAt': new Date(),
            'testIds.$.result': result._id,
            status: 'test_completed',
            testCompletedAt: new Date()
          }
        },
        { new: true }
      );

      // If not found, try legacy single testId field
      if (!updatedApp) {
        updatedApp = await Application.findOneAndUpdate(
          { candidateId: candidateObjId, testId: testObjId },
          {
            $set: {
              testResult: result._id,
              status: 'test_completed',
              testCompletedAt: new Date()
            }
          },
          { new: true }
        );
      }

      // If still not found, try matching with jobId (when provided)
      if (!updatedApp && jobId) {
        const jobObjId = new mongoose.Types.ObjectId(jobId);
        updatedApp = await Application.findOneAndUpdate(
          { jobId: jobObjId, candidateId: candidateObjId, 'testIds.testId': testObjId },
          {
            $set: {
              'testIds.$.completedAt': new Date(),
              'testIds.$.result': result._id,
              status: 'test_completed',
              testCompletedAt: new Date()
            }
          },
          { new: true }
        );
      }

      if (!updatedApp) {
        console.warn('No matching application found to update for submitted test', testId, 'candidate', candidateId);
        // log candidate applications for debugging
        try {
          const apps = await Application.find({ candidateId: candidateId }).populate('testIds.testId').lean();
          console.warn('Candidate applications (raw):', JSON.stringify(apps, null, 2));
        } catch (ldErr) {
          console.warn('Failed to list candidate applications for debugging:', ldErr.message);
        }
      }

      // assign app variable for response
      app = updatedApp;
    } catch (uErr) {
      console.warn('Failed to update application test status:', uErr.message);
    }

    res.json({ success: true, result, passed, appUpdated: !!app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit test result', error: err.message });
  }
});

// Get test result for a candidate
router.get('/:testId/result/:candidateId', async (req, res) => {
  try {
    const { testId, candidateId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    const result = await TestResult.findOne({ testId: new mongoose.Types.ObjectId(testId), candidateId: new mongoose.Types.ObjectId(candidateId) });

    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch test result' });
  }
});

// Update test
router.put('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    const updatedTest = await Test.findByIdAndUpdate(testId, req.body, { new: true });
    res.json(updatedTest);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update test' });
  }
});

// Delete test
router.delete('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id' });
    }
    await Test.findByIdAndDelete(testId);
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete test' });
  }
});

export default router;

// Debug: grouped test results counts (not exported as route earlier)
router.get('/debug/grouped-results', async (req, res) => {
  try {
    const agg = await TestResult.aggregate([
      { $group: { _id: '$testId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(agg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch grouped results', error: err.message });
  }
});

// Debug: list recent test results with populated test name and candidate
router.get('/debug/recent-results', async (req, res) => {
  try {
    const results = await TestResult.find({}).sort({ completedAt: -1 }).limit(50).populate('testId', 'testName').populate('candidateId', 'name email');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recent results', error: err.message });
  }
});
