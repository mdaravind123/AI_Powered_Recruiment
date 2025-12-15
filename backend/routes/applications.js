import express from 'express';
import Application from '../models/Application.js';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';

const router = express.Router();

// Create a job application (candidate applies for a job)
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, candidateName, candidateEmail, resumeUrl, matchScore, resumeAnalysis } = req.body;

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    const application = await Application.create({
      jobId,
      candidateId,
      candidateName,
      candidateEmail,
      resumeUrl,
      matchScore,
      resumeAnalysis,
      status: 'applied'
    });

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
});

// Get all applications for a job (recruiter view)
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate('testIds.testId')
      .populate('testIds.result')
      .populate('testResult')
      .sort({ matchScore: -1 }); // Sort by match score descending

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get all applications for a candidate (employee view)
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const applications = await Application.find({ candidateId })
      .populate('jobId')
      .populate('testIds.testId')
      .populate('testIds.result')
      .populate('testResult')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Shortlist candidate
router.put('/:applicationId/shortlist', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByIdAndUpdate(
      applicationId,
      {
        status: 'shortlisted',
        shortlistedAt: new Date()
      },
      { new: true }
    );

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to shortlist candidate' });
  }
});

// Reject candidate
router.put('/:applicationId/reject', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByIdAndUpdate(
      applicationId,
      {
        status: 'rejected'
      },
      { new: true }
    );

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject candidate' });
  }
});

// Assign test to candidate
router.put('/:applicationId/assign-test', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { testId } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Add test to testIds array if not already assigned
    if (!application.testIds.some(t => t.testId.toString() === testId)) {
      application.testIds.push({
        testId,
        assignedAt: new Date()
      });
    }

    // Ensure status reflects that a test is assigned (do not change if rejected)
    if (application.status !== 'rejected') {
      application.status = 'test_assigned';
    }
    
    application.testAssignedAt = new Date();
    await application.save();

    const populated = await Application.findById(applicationId).populate('testIds.testId').populate('testIds.result');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign test', error: err.message });
  }
});

// Get application details
router.get('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('testIds.testId')
      .populate('testIds.result')
      .populate('testResult');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch application' });
  }
});

// Get candidates with high match scores for a job (shortlisting)
router.get('/job/:jobId/shortlist-candidates', async (req, res) => {
  try {
    const { jobId } = req.params;
    const minScore = req.query.minScore || 70; // Default 70% match

    const applications = await Application.find({
      jobId,
      matchScore: { $gte: minScore }
    })
      .populate('testIds.testId')
      .populate('testIds.result')
      .populate('testResult')
      .sort({ matchScore: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidates for shortlisting' });
  }
});

export default router;
