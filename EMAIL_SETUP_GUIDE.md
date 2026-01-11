# Email Configuration Guide for Interview Notifications

## Overview
When a recruiter schedules an interview via chat, the system automatically sends a professional email notification to the candidate with all interview details.

## Current Status
✅ Email functionality is **already implemented** in the backend  
⚠️  Email credentials need to be configured in `.env`

## Quick Setup (Gmail - Recommended for Testing)

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Generate a new app password:
   - App: Select "Mail"
   - Device: Select "Other" and name it "AI Recruiter App"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update `.env` File

Add these lines to `backend/.env`:

```env
# Email Configuration for Interview Notifications
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
COMPANY_NAME=Your Company Name
```

**Example:**
```env
EMAIL_USER=nithish.recruiter@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
COMPANY_NAME=Tech Innovations Inc
```

### Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

You should see: ✅ Email service ready to send notifications

## What Happens When Interview is Scheduled

1. Recruiter clicks "Schedule Interview" in chat
2. System creates interview record in database
3. **Email is automatically sent to candidate** with:
   - Interview date and time
   - Meeting link (for online) or location (for offline)
   - Interviewer name
   - Job title and company
   - Additional notes (if any)
4. Candidate receives professional HTML email

## Email Template Preview

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Interview Scheduled!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear [Candidate Name],

Great news! We are pleased to invite you for an 
interview for the [Job Title] position at [Company].

📅 Date: Monday, January 15, 2026
⏰ Time: 2:00 PM
📱 Type: Online
🔗 Meeting Link: https://meet.google.com/xyz
👤 Interviewer: [Recruiter Name]

📝 Additional Notes: Please prepare...

Please mark your calendar and be available.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Alternative: SendGrid (Production Recommended)

For production with higher email limits:

1. Create free account: https://sendgrid.com
2. Verify your sender email
3. Get API key from SendGrid dashboard
4. Update `backend/utils/emailService.js`:

```javascript
// Replace Gmail config with SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## Troubleshooting

### Email not sending?

**Check backend logs for:**
- ⚠️  "Email credentials not found" → Add EMAIL_USER and EMAIL_PASSWORD to .env
- ❌ "Authentication failed" → Check Gmail app password is correct
- ❌ "Connection timeout" → Check internet connection

**Common fixes:**
1. Make sure 2-Step Verification is enabled on Gmail
2. Use App Password, NOT your regular Gmail password
3. Remove spaces from app password in .env file
4. Restart backend server after updating .env

### Test email manually:

Add this test endpoint to `backend/routes/interviews.js`:

```javascript
// Test email endpoint
router.post('/test-email', async (req, res) => {
  const result = await sendInterviewScheduledEmail({
    candidateEmail: 'test@example.com',
    candidateName: 'Test User',
    recruiterName: 'John Recruiter',
    companyName: 'Test Company',
    jobTitle: 'Software Engineer',
    interviewDate: new Date(),
    interviewTime: '2:00 PM',
    interviewType: 'online',
    meetingLink: 'https://meet.google.com/test',
    additionalNotes: 'This is a test'
  });
  res.json(result);
});
```

Then test: `POST http://localhost:5000/api/interviews/test-email`

## Security Notes

- ✅ Never commit `.env` file to Git (already in `.gitignore`)
- ✅ Use App Passwords, not regular passwords
- ✅ For production, use SendGrid or professional SMTP service
- ✅ Current implementation doesn't expose email credentials to frontend

## Features Included

✅ Professional HTML email template  
✅ Automatic sending on interview schedule  
✅ Different templates for online/offline/phone interviews  
✅ Meeting links clickable in email  
✅ Graceful fallback (interview saves even if email fails)  
✅ Detailed logging for debugging  
✅ Returns email status in API response  

## Files Modified

- ✅ `backend/utils/emailService.js` - Email service with improved error handling
- ✅ `backend/routes/interviews.js` - Sends email when interview scheduled
- ✅ Backend validates email config on startup
- ✅ Logs email success/failure for monitoring

## Next Steps

1. Add EMAIL_USER and EMAIL_PASSWORD to `.env`
2. Restart backend
3. Schedule an interview from recruiter chat
4. Check candidate's email inbox
5. Verify email delivery in backend logs

That's it! The email notification system is ready to use. 🎉
