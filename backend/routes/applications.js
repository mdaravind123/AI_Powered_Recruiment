import express from 'express';
import Application from '../models/Application.js';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';
import Job from '../models/Job.js';
import { processResumeFromUrl } from '../utils/resumeExtractor.js';
import { sendTestAssignedEmail } from '../utils/emailService.js';
import axios from 'axios';

const router = express.Router();

// Create a job application (candidate applies for a job)
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, candidateName, candidateEmail, resumeUrl, matchScore, resumeAnalysis } = req.body;

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status === 'closed') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // If resumeAnalysis is not provided or incomplete, try to extract from resumeUrl
    let finalAnalysis = resumeAnalysis;
    // Normalize provided analysis skills (trim, dedupe)
    if (finalAnalysis && Array.isArray(finalAnalysis.skills)) {
      finalAnalysis.skills = Array.from(
        new Set(
          finalAnalysis.skills
            .filter(s => typeof s === 'string')
            .map(s => s.trim())
            .filter(Boolean)
        )
      );
    }

    if (!finalAnalysis || !finalAnalysis.skills || finalAnalysis.skills.length === 0) {
      try {
        // Attempt to extract and analyze resume if it's a Cloudinary URL
        if (resumeUrl && resumeUrl.includes('cloudinary')) {
          // Infer MIME type from file extension
          let inferredMime = 'application/pdf';
          const lowerUrl = resumeUrl.toLowerCase();
          if (lowerUrl.endsWith('.pdf')) inferredMime = 'application/pdf';
          else if (lowerUrl.endsWith('.docx')) inferredMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (lowerUrl.endsWith('.doc')) inferredMime = 'application/msword';
          else if (lowerUrl.endsWith('.txt')) inferredMime = 'text/plain';

          const extracted = await processResumeFromUrl(resumeUrl, inferredMime);
          const skills = Array.isArray(extracted.skills)
            ? Array.from(new Set(extracted.skills.filter(s => typeof s === 'string').map(s => s.trim()).filter(Boolean)))
            : [];
          finalAnalysis = {
            summary: extracted.summary,
            skills,
            experience: `${extracted.experience}+ years`,
            education: extracted.education,
            email: extracted.email,
            phone: extracted.phone
          };
        }
      } catch (err) {
        console.warn('Resume extraction on application submit failed:', err.message);
        // Use provided analysis or defaults
        finalAnalysis = resumeAnalysis || {
          summary: 'Resume provided',
          skills: [],
          experience: '0+ years'
        };
      }
    }

    // Import and use improved match score calculation
    const { calculateMatchScore } = await import('../utils/resumeAnalyzer.js');
    
    // Calculate match score server-side for accuracy
    const jobSkills = Array.isArray(job.skills) ? job.skills : [];
    const resumeSkills = Array.isArray(finalAnalysis.skills) ? finalAnalysis.skills : [];
    const calculatedScore = calculateMatchScore(jobSkills, resumeSkills);
    
    console.log(`Match Score Calculation - Job: ${job.title}, Job Skills: ${jobSkills.join(', ')}, Resume Skills: ${resumeSkills.join(', ')}, Score: ${calculatedScore}%`);

    const application = await Application.create({
      jobId,
      candidateId,
      candidateName,
      candidateEmail,
      resumeUrl,
      matchScore: calculatedScore, // Use server-calculated score
      resumeAnalysis: finalAnalysis,
      status: 'applied'
    });

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
});

// Get statistics for a job (recruiter view)
router.get('/job/:jobId/stats', async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId });
    // Active applications exclude rejected
    const activeApplications = applications.filter(a => a.status !== 'rejected');

    const stats = {
      total: activeApplications.length, // Show only active applicants to recruiters
      shortlisted: activeApplications.filter(a => a.status === 'shortlisted').length,
      testsAssigned: activeApplications.filter(a => 
        a.status === 'test_assigned' || 
        a.status === 'test_completed' || 
        (a.testIds && a.testIds.length > 0)
      ).length,
      testsCompleted: activeApplications.filter(a => a.status === 'test_completed').length,
      rejected: applications.filter(a => a.status === 'rejected').length, // Track rejected separately
      interviewed: activeApplications.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_completed').length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job statistics' });
  }
});

// Get all applications for a job (recruiter view)
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    // Exclude rejected candidates from recruiter dashboard view (kept in DB for audit)
    const applications = await Application.find({ jobId, status: { $ne: 'rejected' } })
      .populate('testIds.testId')
      .populate('testIds.result')
      .populate('testResult')
      .sort({ matchScore: -1 }); // Sort by match score descending

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get statistics for a candidate (exclude rejected from active counts)
router.get('/candidate/:candidateId/stats', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const applications = await Application.find({ candidateId });
    // Active applications exclude rejected
    const activeApplications = applications.filter(a => a.status !== 'rejected');

    const stats = {
      total: activeApplications.length, // Count only active applications
      shortlisted: activeApplications.filter(a => a.status === 'shortlisted').length,
      testsAssigned: activeApplications.filter(a => 
        a.status === 'test_assigned' || 
        a.status === 'test_completed' ||
        (a.testIds && a.testIds.length > 0) ||
        (a.testId ? true : false)
      ).length,
      testsCompleted: activeApplications.filter(a => a.status === 'test_completed').length,
      rejected: applications.filter(a => a.status === 'rejected').length, // Separate count for rejected
      interviewed: activeApplications.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_completed').length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidate statistics' });
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

    // Send email notification to candidate
    console.log('\n🔔 Attempting to send test assignment email...');
    try {
      const emailResult = await sendTestAssignedEmail({
        candidateEmail: application.candidateEmail,
        candidateName: application.candidateName,
        recruiterName: test.recruiterId?.name || 'Recruiter',
        companyName: process.env.COMPANY_NAME || 'AI Recruiter',
        jobTitle: application.jobId?.title || 'Position',
        testName: test.testName,
        testDescription: test.description,
        totalQuestions: test.totalQuestions,
        duration: test.duration,
        passingScore: test.passingScore,
        scheduledDate: test.scheduledDate,
        scheduledTime: test.scheduledTime
      });
      
      if (emailResult.success) {
        console.log('✅ Test assignment email sent successfully');
      } else {
        console.log('⚠️  Test assigned but email notification failed:', emailResult.message || emailResult.error);
      }
    } catch (emailErr) {
      console.log('⚠️  Email notification failed (non-critical):', emailErr.message);
    }

    const populated = await Application.findById(applicationId).populate('testIds.testId').populate('testIds.result');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign test', error: err.message });
  }
});

// Bulk assign test to top N candidates by match score
router.post('/bulk-assign-test', async (req, res) => {
  try {
    const { jobId, testId, topN } = req.body;

    if (!jobId || !testId || !topN) {
      return res.status(400).json({ message: 'jobId, testId, and topN are required' });
    }

    if (topN < 1) {
      return res.status(400).json({ message: 'topN must be at least 1' });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Get all applications for the job, sorted by match score (descending)
    const applications = await Application.find({ jobId })
      .sort({ matchScore: -1 })
      .limit(topN);

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for this job' });
    }

    // Assign test to each of the top N candidates
    const assignedCandidates = [];
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const application of applications) {
      // Skip if already assigned this test
      const alreadyAssigned = application.testIds.some(t => t.testId.toString() === testId);
      if (!alreadyAssigned) {
        application.testIds.push({
          testId,
          assignedAt: new Date()
        });
        
        if (application.status !== 'rejected') {
          application.status = 'test_assigned';
        }
        application.testAssignedAt = new Date();
        await application.save();

        // Send email notification to each candidate
        try {
          const emailResult = await sendTestAssignedEmail({
            candidateEmail: application.candidateEmail,
            candidateName: application.candidateName,
            recruiterName: test.recruiterId?.name || 'Recruiter',
            companyName: process.env.COMPANY_NAME || 'AI Recruiter',
            jobTitle: 'Position',
            testName: test.testName,
            testDescription: test.description,
            totalQuestions: test.totalQuestions,
            duration: test.duration,
            passingScore: test.passingScore,
            scheduledDate: test.scheduledDate,
            scheduledTime: test.scheduledTime
          });
          
          if (emailResult.success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        } catch (emailErr) {
          console.log(`⚠️  Email failed for ${application.candidateEmail}:`, emailErr.message);
          emailsFailed++;
        }
      }
      
      assignedCandidates.push({
        candidateName: application.candidateName,
        candidateEmail: application.candidateEmail,
        matchScore: application.matchScore
      });
    }

    console.log(`\n✅ Bulk assignment complete: ${emailsSent} emails sent, ${emailsFailed} failed`);

    res.json({
      message: `Test assigned to top ${applications.length} candidates`,
      assignedCandidates,
      testName: test.testName,
      emailNotifications: {
        sent: emailsSent,
        failed: emailsFailed
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to bulk assign test', error: err.message });
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

// Sync application statuses - ensure testIds array changes trigger status updates
router.post('/sync-statuses', async (req, res) => {
  try {
    const applications = await Application.find({});
    let updated = 0;

    for (const app of applications) {
      let needsUpdate = false;
      const oldStatus = app.status;

      // If test is completed, status should be test_completed
      if (app.status === 'test_completed') {
        // This is correct, no change needed
        continue;
      }

      // If testIds has entries, status should be at least test_assigned
      if (app.testIds && app.testIds.length > 0) {
        if (app.status !== 'test_assigned' && app.status !== 'test_completed' && app.status !== 'rejected') {
          app.status = 'test_assigned';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await app.save();
        updated++;
        console.log(`Synced application ${app._id}: ${oldStatus} -> ${app.status}`);
      }
    }

    res.json({ message: `Synced ${updated} applications`, count: updated });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ message: 'Failed to sync statuses', error: err.message });
  }
});

export default router;
