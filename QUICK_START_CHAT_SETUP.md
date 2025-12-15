# 🚀 QUICK START SETUP GUIDE

## Step 1: Install Dependencies (5 minutes)

### Backend
```bash
cd backend
npm install nodemailer
```

**Output:** Should show `added X packages`

---

## Step 2: Configure Environment Variables

### File: `backend/.env`

Add these lines (update with your values):

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Company Details
COMPANY_NAME=AI Recruiter

# Database & Server (existing)
MONGO_URI=mongodb://...your-connection-string...
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Get Gmail App Password (2 minutes)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in left menu
3. Enable "2-Step Verification" if not enabled
4. Find "App passwords" 
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password
7. Paste in `.env` as `EMAIL_PASSWORD`

---

## Step 3: Verify All Files Created

### Backend Files
```
✅ backend/models/Message.js
✅ backend/models/Interview.js
✅ backend/utils/emailService.js
✅ backend/routes/messages.js
✅ backend/routes/interviews.js
```

### Frontend Files
```
✅ frontend/src/componets/ChatWindow.jsx
✅ frontend/src/componets/ScheduleInterview.jsx
```

### Updated Files
```
✅ backend/index.js (routes added)
✅ backend/models/Application.js (fields updated)
✅ frontend/src/componets/RecruiterDashboard.jsx (chat button added)
✅ frontend/src/componets/EmployeeDashboard.jsx (interview display added)
```

---

## Step 4: Start the Application

### Terminal 1: Backend
```bash
cd backend
npm start
# Expected output:
# Connected to MongoDb
# Server running on port 5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Expected output:
# VITE v... ready in ... ms
# ➜  Local:   http://localhost:5173/
```

---

## Step 5: Test the Features

### Create Test Accounts

**Account 1 (Recruiter)**
- Name: John Recruiter
- Email: recruiter@test.com
- Password: Test@123
- Role: Recruiter

**Account 2 (Candidate)**
- Name: Jane Candidate
- Email: candidate@test.com
- Password: Test@123
- Role: Candidate

### Test 1: Post a Job (Recruiter)
1. Login as recruiter
2. Go to Dashboard
3. Click "+ Post New Job"
4. Fill:
   - Title: Senior Developer
   - Description: 5+ years experience
   - Skills: React, Node.js, MongoDB
5. Post Job
6. ✅ Job should appear in list

### Test 2: Apply for Job (Candidate)
1. Login as candidate
2. Go to "Jobs"
3. Find the posted job
4. Click "Apply"
5. Upload resume (or paste content)
6. Submit application
7. ✅ Application should appear in candidate's dashboard

### Test 3: Chat System
1. **Recruiter Dashboard:**
   - Select job
   - Find candidate in table
   - Click "💬 Chat" button
   - Type message: "Hi Jane! Interested in interview?"
   - Click Send
   - ✅ Message appears immediately

2. **Candidate Dashboard:**
   - Open My Applications
   - Click "💬 Chat with Recruiter"
   - ✅ Should see recruiter's message
   - Reply: "Yes, interested!"
   - ✅ Message appears in recruiter's chat

### Test 4: Interview Scheduling
1. **Recruiter Chat Window:**
   - Click "📅 Schedule Interview"
   - Fill form:
     - Date: (Select future date)
     - Time: 14:00
     - Type: Online
     - Meeting Link: https://zoom.us/meeting/123456
     - Notes: "Coding interview"
   - Click "Schedule Interview"
   - ✅ Confirmation toast shows

2. **Check Emails:**
   - Go to recruiter's email inbox
   - Look for "Interview Scheduled" email
   - ✅ Email should contain all details
   - ✅ Meeting link should be clickable

3. **Candidate Dashboard:**
   - Refresh page
   - In "My Applications" section
   - ✅ Should see new "Interview Scheduled" status
   - ✅ Interview details displayed:
     - Date: [scheduled date]
     - Time: 14:00
     - Type: Online
     - Meeting Link: [clickable link]

### Test 5: Candidate Feedback
1. **Candidate Dashboard:**
   - After interview is marked complete
   - Should see "Feedback" section in interview details
   - ✅ Shows recruiter's rating and comments

---

## Complete API Testing

### Using Postman/cURL

**1. Send Message**
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app-id-here",
    "jobId": "job-id-here",
    "senderId": "user-id-here",
    "senderName": "John",
    "senderRole": "recruiter",
    "senderEmail": "john@company.com",
    "recipientId": "candidate-id-here",
    "recipientName": "Jane",
    "recipientEmail": "jane@email.com",
    "content": "Hello! Are you interested?"
  }'
```

**Expected Response:**
```json
{
  "_id": "...",
  "applicationId": "...",
  "content": "Hello! Are you interested?",
  "isRead": false,
  "createdAt": "2024-12-15T..."
}
```

**2. Get Messages**
```bash
curl http://localhost:5000/api/messages/APPLICATION-ID-HERE
```

**Expected Response:**
```json
[
  { "content": "...", "senderName": "John", ... },
  { "content": "...", "senderName": "Jane", ... }
]
```

**3. Schedule Interview**
```bash
curl -X POST http://localhost:5000/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app-id-here",
    "jobId": "job-id-here",
    "recruiterId": "recruiter-id-here",
    "recruiterName": "John Recruiter",
    "recruiterEmail": "recruiter@company.com",
    "companyName": "Tech Corp",
    "candidateId": "candidate-id-here",
    "candidateName": "Jane Candidate",
    "candidateEmail": "jane@email.com",
    "interviewDate": "2024-12-25",
    "interviewTime": "14:00",
    "interviewType": "online",
    "meetingLink": "https://zoom.us/meeting/123456",
    "additionalNotes": "Bring laptop",
    "jobTitle": "Senior Developer"
  }'
```

---

## 🐛 Debugging

### Issue: Messages don't appear immediately
- **Current:** 3-second polling (not real-time)
- **Solution:** Refresh page to see new messages
- **Future:** Can add WebSocket for instant messages

### Issue: Email not sending
```javascript
// Check in backend console
// Error: "Invalid login"
// Solution: Verify EMAIL_USER and EMAIL_PASSWORD in .env
// Make sure Gmail App Password is correct (16 characters)
```

### Issue: Chat modal won't open
- Open browser DevTools (F12)
- Go to Console tab
- Check for errors
- Verify applicationId exists in database

### Issue: Interview not showing in candidate dashboard
- Refresh the page
- Check MongoDB: Does Interview record exist?
- Verify candidate ID matches the interview

---

## 📊 Check Database Records

### Using MongoDB Compass

1. Connect to your MongoDB
2. Find database: `your-db-name`
3. Check collections:

```
messages
  - Should have documents with senderId, recipientId, content
  - Check: isRead, messageType, createdAt

interviews
  - Should have documents with interviewDate, interviewTime
  - Check: status, recruiterFeedback, emailSentToCandidate

applications
  - Should have status: "interview_scheduled" or "interview_completed"
  - Check: interviewScheduled field populated
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Messages send and receive between recruiter/candidate
✅ Chat window opens without errors
✅ Interview scheduling form submits
✅ Email arrives in candidate inbox within 10 seconds
✅ Interview details visible in candidate dashboard
✅ Interview status shows "scheduled"
✅ All timestamps are correct

---

## 🚀 Performance Tips

1. **Optimize Message Polling:**
   - Increase interval from 3000ms for less frequent updates
   - Or implement WebSocket for true real-time

2. **Reduce Email Load:**
   - Disable message notifications for high-volume conversations
   - Only email on important messages (interview scheduling, rejection, etc.)

3. **Database Indexing:**
   - Already indexed on: applicationId, jobId, senderId, recipientId
   - Good for large message datasets

---

## 📱 Mobile Testing

1. Open frontend on mobile browser
2. Chat window should adapt to mobile screen
3. Try scheduling interview on mobile
4. Verify email link opens properly on mobile

---

## 🔄 Next Steps After Setup

1. **Customize Email Templates:**
   - Edit `backend/utils/emailService.js`
   - Change company logo/colors
   - Add branding

2. **Add More Interview Types:**
   - Currently: online, offline, phone
   - Could add: coding challenge, HR round, etc.

3. **Implement Reminders:**
   - Auto-send email 24 hours before interview
   - Consider using node-schedule package

4. **Add Real-Time Chat:**
   - Install Socket.io
   - Replace polling with WebSocket
   - Add typing indicators

5. **Analytics Dashboard:**
   - Track message volume
   - Interview completion rates
   - Average response times

---

## 📞 Quick Reference

| Feature | Location | Status |
|---------|----------|--------|
| Chat System | Frontend: ChatWindow.jsx | ✅ Live |
| Interview Scheduling | Frontend: ScheduleInterview.jsx | ✅ Live |
| Message API | Backend: routes/messages.js | ✅ Live |
| Interview API | Backend: routes/interviews.js | ✅ Live |
| Email Notifications | Backend: utils/emailService.js | ✅ Live |
| Recruiter Chat | RecruiterDashboard.jsx | ✅ Live |
| Candidate Interview View | EmployeeDashboard.jsx | ✅ Live |

---

## ✅ CHECKLIST

Before going to production:

- [ ] All dependencies installed
- [ ] .env file configured with EMAIL_USER and EMAIL_PASSWORD
- [ ] Backend server running without errors
- [ ] Frontend running at localhost:5173
- [ ] Can create recruiter and candidate accounts
- [ ] Can post jobs and apply
- [ ] Chat works both directions
- [ ] Interview scheduling works
- [ ] Email arrives in inbox
- [ ] Interview details visible in candidate dashboard
- [ ] No console errors in frontend
- [ ] No errors in backend console
- [ ] Tested on mobile browser
- [ ] Database records appear correctly

---

**Setup Time: ~15 minutes**
**Testing Time: ~10 minutes**
**Total: ~25 minutes**

Once all tests pass, system is ready for production! 🎉
