import express from 'express';
import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import {
  sendInterviewScheduledEmail,
  sendInterviewReminderEmail,
  sendInterviewCancellationEmail
} from '../utils/emailService.js';

const router = express.Router();

/**
 * POST /api/interviews
 * Schedule a new interview
 */
router.post('/', async (req, res) => {
  try {
    const {
      applicationId,
      jobId,
      recruiterId,
      recruiterName,
      recruiterEmail,
      companyName,
      candidateId,
      candidateName,
      candidateEmail,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      location,
      additionalNotes,
      jobTitle
    } = req.body;

    // Validate required fields
    if (!applicationId || !jobId || !recruiterId || !candidateId || !interviewDate || !interviewTime || !interviewType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['online', 'offline', 'phone'].includes(interviewType)) {
      return res.status(400).json({ message: 'Invalid interview type' });
    }

    // Validate meeting link or location based on type
    if (interviewType === 'online' && !meetingLink) {
      return res.status(400).json({ message: 'Meeting link required for online interviews' });
    }

    if (interviewType === 'offline' && !location) {
      return res.status(400).json({ message: 'Location required for offline interviews' });
    }

    // Create interview record
    const interview = await Interview.create({
      applicationId,
      jobId,
      recruiterId,
      recruiterName,
      recruiterEmail,
      companyName,
      candidateId,
      candidateName,
      candidateEmail,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink: interviewType === 'online' ? meetingLink : null,
      location: interviewType === 'offline' ? location : null,
      additionalNotes,
      jobTitle,
      status: 'scheduled'
    });

    // Update application status
    await Application.findByIdAndUpdate(
      applicationId,
      {
        status: 'interview_scheduled',
        interviewScheduled: {
          interviewId: interview._id,
          date: interviewDate,
          time: interviewTime,
          type: interviewType
        }
      }
    );

    // Send email notification to candidate
    try {
      await sendInterviewScheduledEmail({
        candidateEmail,
        candidateName,
        recruiterName,
        companyName,
        jobTitle,
        interviewDate,
        interviewTime,
        interviewType,
        meetingLink: interviewType === 'online' ? meetingLink : null,
        location: interviewType === 'offline' ? location : null,
        additionalNotes
      });
    } catch (emailErr) {
      console.log('Email notification failed (non-critical):', emailErr.message);
    }

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview
    });
  } catch (err) {
    console.error('Error scheduling interview:', err);
    res.status(500).json({ message: 'Failed to schedule interview', error: err.message });
  }
});

/**
 * GET /api/interviews/:interviewId
 * Get interview details
 */
router.get('/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId)
      .populate('applicationId')
      .populate('jobId', 'title')
      .populate('recruiterId', 'name email')
      .populate('candidateId', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (err) {
    console.error('Error fetching interview:', err);
    res.status(500).json({ message: 'Failed to fetch interview', error: err.message });
  }
});

/**
 * GET /api/interviews/application/:applicationId
 * Get interviews for a specific application
 */
router.get('/application/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const interviews = await Interview.find({ applicationId })
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).json({ message: 'Failed to fetch interviews', error: err.message });
  }
});

/**
 * GET /api/interviews/job/:jobId/scheduled
 * Get all scheduled interviews for a job (recruiter dashboard)
 */
router.get('/job/:jobId/scheduled', async (req, res) => {
  try {
    const { jobId } = req.params;

    const interviews = await Interview.find({
      jobId,
      status: 'scheduled'
    })
      .populate('applicationId')
      .populate('candidateId', 'name email')
      .sort({ interviewDate: 1, interviewTime: 1 });

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching scheduled interviews:', err);
    res.status(500).json({ message: 'Failed to fetch scheduled interviews', error: err.message });
  }
});

/**
 * GET /api/interviews/candidate/:candidateId
 * Get all interviews for a candidate (employee dashboard)
 */
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;

    const interviews = await Interview.find({
      candidateId,
      status: { $in: ['scheduled', 'completed'] }
    })
      .populate('jobId', 'title')
      .populate('recruiterId', 'name email')
      .sort({ interviewDate: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching candidate interviews:', err);
    res.status(500).json({ message: 'Failed to fetch interviews', error: err.message });
  }
});

/**
 * PUT /api/interviews/:interviewId/update-status
 * Update interview status
 */
router.put('/:interviewId/update-status', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (err) {
    console.error('Error updating interview status:', err);
    res.status(500).json({ message: 'Failed to update interview status', error: err.message });
  }
});

/**
 * PUT /api/interviews/:interviewId/feedback
 * Add recruiter feedback after interview
 */
router.put('/:interviewId/feedback', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { rating, comments, decision } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating (1-5)' });
    }

    if (!['pass', 'fail', 'pending'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        'recruiterFeedback.rating': rating,
        'recruiterFeedback.comments': comments,
        'recruiterFeedback.decision': decision,
        'recruiterFeedback.feedbackDate': new Date(),
        status: 'completed'
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (err) {
    console.error('Error adding feedback:', err);
    res.status(500).json({ message: 'Failed to add feedback', error: err.message });
  }
});

/**
 * PUT /api/interviews/:interviewId/candidate-feedback
 * Add candidate feedback after interview
 */
router.put('/:interviewId/candidate-feedback', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating (1-5)' });
    }

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        'candidateFeedback.rating': rating,
        'candidateFeedback.comments': comments,
        'candidateFeedback.feedbackDate': new Date()
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (err) {
    console.error('Error adding candidate feedback:', err);
    res.status(500).json({ message: 'Failed to add candidate feedback', error: err.message });
  }
});

/**
 * PUT /api/interviews/:interviewId/reschedule
 * Reschedule an interview
 */
router.put('/:interviewId/reschedule', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const {
      newInterviewDate,
      newInterviewTime,
      rescheduleReason,
      candidateName,
      candidateEmail,
      recruiterName,
      companyName,
      jobTitle
    } = req.body;

    const oldInterview = await Interview.findById(interviewId);
    if (!oldInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Create a note about the reschedule
    const rescheduleNote = `Interview rescheduled from ${oldInterview.interviewDate} ${oldInterview.interviewTime}. Reason: ${rescheduleReason}`;

    // Update the existing interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        interviewDate: newInterviewDate,
        interviewTime: newInterviewTime,
        additionalNotes: `${oldInterview.additionalNotes}\n${rescheduleNote}`,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Send rescheduling email
    try {
      await sendInterviewCancellationEmail({
        candidateEmail,
        candidateName,
        recruiterName,
        companyName,
        jobTitle,
        interviewDate: oldInterview.interviewDate,
        interviewTime: oldInterview.interviewTime,
        rescheduleReason
      });
    } catch (emailErr) {
      console.log('Reschedule email failed (non-critical):', emailErr.message);
    }

    res.json({
      message: 'Interview rescheduled successfully',
      interview: updatedInterview
    });
  } catch (err) {
    console.error('Error rescheduling interview:', err);
    res.status(500).json({ message: 'Failed to reschedule interview', error: err.message });
  }
});

/**
 * DELETE /api/interviews/:interviewId/cancel
 * Cancel an interview
 */
router.delete('/:interviewId/cancel', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { cancellationReason } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'cancelled',
        additionalNotes: `Cancelled. Reason: ${cancellationReason}`
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Update application status back
    await Application.findByIdAndUpdate(interview.applicationId, {
      status: 'shortlisted'
    });

    // Send cancellation email
    try {
      await sendInterviewCancellationEmail({
        candidateEmail: interview.candidateEmail,
        candidateName: interview.candidateName,
        recruiterName: interview.recruiterName,
        companyName: interview.companyName,
        jobTitle: interview.jobTitle,
        interviewDate: interview.interviewDate,
        interviewTime: interview.interviewTime,
        rescheduleReason: cancellationReason
      });
    } catch (emailErr) {
      console.log('Cancellation email failed (non-critical):', emailErr.message);
    }

    res.json({ message: 'Interview cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling interview:', err);
    res.status(500).json({ message: 'Failed to cancel interview', error: err.message });
  }
});

/**
 * GET /api/interviews/recruiter/:recruiterId/upcoming
 * Get upcoming interviews for a recruiter
 */
router.get('/recruiter/:recruiterId/upcoming', async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const interviews = await Interview.find({
      recruiterId,
      interviewDate: { $gte: today.toISOString().split('T')[0] },
      status: 'scheduled'
    })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ interviewDate: 1, interviewTime: 1 });

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching upcoming interviews:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming interviews', error: err.message });
  }
});

export default router;
