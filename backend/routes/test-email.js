import express from 'express';
import { sendInterviewScheduledEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * Test email endpoint - use this to verify email configuration
 * POST /api/test-email
 */
router.post('/', async (req, res) => {
  try {
    console.log('\n🧪 Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
    
    const testEmail = req.body.email || 'test@example.com';
    
    console.log(`\n📧 Attempting to send test email to: ${testEmail}`);
    
    const result = await sendInterviewScheduledEmail({
      candidateEmail: testEmail,
      candidateName: 'Test Candidate',
      recruiterName: 'Test Recruiter',
      companyName: 'Test Company',
      jobTitle: 'Software Engineer',
      interviewDate: new Date().toISOString(),
      interviewTime: '2:00 PM',
      interviewType: 'online',
      meetingLink: 'https://meet.google.com/test-meeting',
      additionalNotes: 'This is a test email to verify email configuration'
    });
    
    console.log('\n📨 Email result:', result);
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Test email sent successfully to ${testEmail}. Check your inbox!`
        : `Email failed: ${result.error || result.message}`,
      details: result
    });
  } catch (err) {
    console.error('\n❌ Test email error:', err);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: err.message,
      stack: err.stack
    });
  }
});

export default router;
