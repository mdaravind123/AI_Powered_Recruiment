import express from 'express';
import Message from '../models/Message.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { sendNewMessageNotificationEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * GET /api/messages/:applicationId
 * Get all messages for a specific job application (chat history)
 */
router.get('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Verify application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get all messages for this application, sorted by date
    const messages = await Message.find({ applicationId })
      .sort({ createdAt: 1 })
      .select('-__v');

    // Mark messages as read for the current user
    const userId = req.user?.id || req.body?.userId || req.headers['x-user-id'];
    if (userId) {
      try {
        await Message.updateMany(
          { applicationId, recipientId: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
      } catch (updateErr) {
        // Silently fail if marking as read fails - still return messages
        console.log('Could not mark messages as read:', updateErr.message);
      }
    }

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
});

/**
 * GET /api/messages/job/:jobId/unread
 * Get unread message count for a job
 */
router.get('/job/:jobId/unread', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const unreadCount = await Message.countDocuments({
      jobId,
      recipientId: userId,
      isRead: false
    });

    res.json({ jobId, unreadCount });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Failed to fetch unread count', error: err.message });
  }
});

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/', async (req, res) => {
  try {
    const {
      applicationId,
      jobId,
      senderId,
      senderName,
      senderRole,
      senderEmail,
      recipientId,
      recipientName,
      recipientEmail,
      content,
      messageType = 'text'
    } = req.body;

    // Validate required fields
    if (!applicationId || !jobId || !senderId || !recipientId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (senderRole !== 'recruiter' && senderRole !== 'candidate') {
      return res.status(400).json({ message: 'Invalid sender role' });
    }

    // Create new message
    const message = await Message.create({
      applicationId,
      jobId,
      senderId,
      senderName,
      senderRole,
      senderEmail,
      recipientId,
      recipientName,
      recipientEmail,
      content,
      messageType,
      isRead: false,
      createdAt: new Date()
    });

    // Send email notification to recipient (optional - can be disabled in settings)
    try {
      const job = await Job.findById(jobId).select('title');
      await sendNewMessageNotificationEmail({
        recipientEmail,
        recipientName,
        senderName,
        companyName: process.env.COMPANY_NAME || 'AI Recruiter',
        jobTitle: job?.title || 'Job Application',
        messagePreview: content
      });
    } catch (emailErr) {
      console.log('Email notification failed (non-critical):', emailErr.message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

/**
 * PUT /api/messages/:messageId/read
 * Mark a message as read
 */
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ message: 'Failed to mark message as read', error: err.message });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete or hard delete based on preference)
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || req.body.userId;

    // Verify user is sender before deleting
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId && message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Failed to delete message', error: err.message });
  }
});

/**
 * GET /api/messages/application/:applicationId/conversation
 * Get complete conversation details between recruiter and candidate
 */
router.get('/application/:applicationId/conversation', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('jobId', 'title')
      .populate('candidateId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const messages = await Message.find({ applicationId })
      .sort({ createdAt: 1 });

    res.json({
      application: {
        _id: application._id,
        jobTitle: application.jobId?.title,
        candidateName: application.candidateId?.name,
        candidateEmail: application.candidateId?.email,
        status: application.status
      },
      messages
    });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ message: 'Failed to fetch conversation', error: err.message });
  }
});

/**
 * GET /api/messages/search/:applicationId
 * Search messages in a conversation
 */
router.get('/search/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: 'Search keyword required' });
    }

    const messages = await Message.find({
      applicationId,
      content: { $regex: keyword, $options: 'i' }
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error('Error searching messages:', err);
    res.status(500).json({ message: 'Failed to search messages', error: err.message });
  }
});

export default router;
