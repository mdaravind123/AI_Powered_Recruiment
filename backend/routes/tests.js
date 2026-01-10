import express from 'express';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';
import Application from '../models/Application.js';
import mongoose from 'mongoose';
import { runAgainstTestCases } from '../utils/codeRunner.js';

const router = express.Router();

// Create a new test
router.post('/', async (req, res) => {
  try {
    const { jobId, recruiterId, testName, description, duration, totalQuestions, questions, passingScore, proctoring, scheduledDate, scheduledTime } = req.body;

    // Combine scheduledDate and scheduledTime into scheduledStartDateTime
    let scheduledStartDateTime = null;
    if (scheduledDate && scheduledTime) {
      const dateObj = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      scheduledStartDateTime = dateObj;
    }

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
      scheduledTime,
      scheduledStartDateTime
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

    // Check if test has a scheduled start time
    const now = new Date();
    let isAvailable = true;
    let availableAt = null;

    if (test.scheduledStartDateTime) {
      isAvailable = now >= test.scheduledStartDateTime;
      availableAt = test.scheduledStartDateTime;
    }

    // Sanitize questions for candidate view
    const raw = test.toObject();
    const sanitizedQuestions = (raw.questions || []).map(q => {
      const base = {
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        timeLimit: q.timeLimit,
        difficulty: q.difficulty
      };
      if (q.questionType === 'coding') {
        const sample = (q.testCases || []).filter(tc => tc.isSample).map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }));
        return {
          ...base,
          sampleTestCases: sample,
          allowedLanguages: q.allowedLanguages?.length ? q.allowedLanguages : ['python', 'javascript', 'java', 'cpp'],
          defaultLanguage: q.defaultLanguage || 'python'
        };
      }
      // Do NOT expose correctAnswer for MCQ/essay in candidate view
      return base;
    });

    res.json({
      ...raw,
      questions: sanitizedQuestions,
      isAvailable,
      availableAt
    });
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
    const { candidateId, candidateName, candidateEmail, jobId, answers, timeUsed } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Server-side validation: Check if test can be started based on scheduled time
    if (test.scheduledStartDateTime) {
      const now = new Date();
      if (now < test.scheduledStartDateTime) {
        return res.status(403).json({ 
          message: 'Test cannot be submitted before the scheduled start time',
          availableAt: test.scheduledStartDateTime
        });
      }
    }

    // Recalculate score server-side (secure), evaluating coding questions using hidden test cases
    let secureCorrectCount = 0;
    let secureTotalQuestions = test.questions.length;
    let calculatedScoreAccum = 0; // sum of per-question score fraction

    const resultAnswers = [];

    for (let idx = 0; idx < test.questions.length; idx++) {
      const q = test.questions[idx];
      const clientAnswer = Array.isArray(answers) ? answers[idx] : null;
      const baseAnswer = {
        questionId: String(idx),
        questionText: q.questionText,
        questionType: q.questionType,
        timeSpent: (clientAnswer && clientAnswer.timeSpent) || 0
      };

      if (q.questionType === 'mcq') {
        const userAns = clientAnswer?.userAnswer ?? '';
        const isCorrect = !!q.correctAnswer && userAns === q.correctAnswer;
        if (isCorrect) secureCorrectCount += 1;
        calculatedScoreAccum += isCorrect ? 1 : 0;
        resultAnswers.push({
          ...baseAnswer,
          userAnswer: userAns,
          correctAnswer: undefined,
          isCorrect
        });
      } else if (q.questionType === 'coding') {
        const language = clientAnswer?.language || q.defaultLanguage || 'python';
        const code = clientAnswer?.code || clientAnswer?.userAnswer || '';
        const hiddenCases = (q.testCases || []).map(tc => ({ input: tc.input ?? '', expectedOutput: tc.expectedOutput ?? '' }));
        let passedCases = 0;
        let outputs = [];
        let stderrCombined = '';
        try {
          const results = await runAgainstTestCases({ language, code, testCases: hiddenCases });
          results.forEach(r => {
            outputs.push(r.stdout);
            if (r.passed) passedCases += 1;
            if (r.stderr) stderrCombined = (stderrCombined ? (stderrCombined + '\n') : '') + r.stderr;
          });
        } catch (e) {
          stderrCombined = e.message || 'Execution error';
        }
        const totalCases = hiddenCases.length || 1;
        const fraction = totalCases ? (passedCases / totalCases) : 0;
        calculatedScoreAccum += fraction;
        resultAnswers.push({
          ...baseAnswer,
          language,
          code,
          passedCases,
          totalCases,
          stderr: stderrCombined,
          outputs,
          isCorrect: fraction === 1
        });
      } else {
        // essay: currently not auto-graded
        resultAnswers.push({
          ...baseAnswer,
          userAnswer: clientAnswer?.userAnswer ?? clientAnswer ?? '',
          isCorrect: false
        });
      }
    }

    const secureTotalScore = Math.round((calculatedScoreAccum / secureTotalQuestions) * 100);
    const passed = secureTotalScore >= test.passingScore;

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
      answers: resultAnswers,
      totalScore: secureTotalScore,
      correctAnswers: secureCorrectCount,
      totalQuestions: secureTotalQuestions,
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

    res.json({ success: true, result, score: secureTotalScore, passed, appUpdated: !!app });
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
