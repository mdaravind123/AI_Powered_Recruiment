# 🔧 CODE REFERENCE & QUICK SNIPPETS

## Quick Copy-Paste Code

### 1. Email Configuration (.env)

```env
# Add to backend/.env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
COMPANY_NAME=AI Recruiter
```

---

### 2. Import Statements

#### Backend (add to index.js)
```javascript
import messageRoutes from './routes/messages.js';
import interviewRoutes from './routes/interviews.js';
```

#### Register Routes (add to index.js)
```javascript
app.use('/api/messages', messageRoutes);
app.use('/api/interviews', interviewRoutes);
```

#### Frontend (add to RecruiterDashboard.jsx)
```javascript
import ChatWindow from './ChatWindow';
```

#### Frontend (add to EmployeeDashboard.jsx)
```javascript
import ChatWindow from './ChatWindow';
```

---

### 3. State Management Examples

#### In RecruiterDashboard.jsx
```javascript
const [openChatApp, setOpenChatApp] = useState(null);

// In render/JSX:
{openChatApp && (
  <ChatWindow
    applicationId={openChatApp._id}
    jobId={openChatApp.jobId}
    jobTitle={currentJob?.title}
    candidateName={openChatApp.candidateName}
    candidateEmail={openChatApp.candidateEmail}
    recruiterId={user._id}
    recruiterName={user.name}
    companyName="Your Company"
    userRole="recruiter"
    onClose={() => setOpenChatApp(null)}
  />
)}
```

#### In EmployeeDashboard.jsx
```javascript
const [interviews, setInterviews] = useState({});
const [openChatApp, setOpenChatApp] = useState(null);

// Fetch interviews
const fetchInterviews = async () => {
  try {
    const { data } = await axios.get(`/api/interviews/candidate/${user._id}`);
    const interviewMap = {};
    data.forEach(interview => {
      if (!interviewMap[interview.applicationId]) {
        interviewMap[interview.applicationId] = [];
      }
      interviewMap[interview.applicationId].push(interview);
    });
    setInterviews(interviewMap);
  } catch (err) {
    console.error('Error fetching interviews:', err);
  }
};
```

---

### 4. API Call Examples

#### Send Message
```javascript
const sendMessage = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));

    const response = await axios.post('/api/messages', {
      applicationId: "app-id",
      jobId: "job-id",
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      senderEmail: user.email,
      recipientId: "recipient-id",
      recipientName: "Recipient Name",
      recipientEmail: "recipient@email.com",
      content: "Your message here",
      messageType: "text"
    });

    console.log('Message sent:', response.data);
  } catch (err) {
    console.error('Error sending message:', err);
  }
};
```

#### Schedule Interview
```javascript
const scheduleInterview = async () => {
  try {
    const response = await axios.post('/api/interviews', {
      applicationId: "app-id",
      jobId: "job-id",
      recruiterId: "recruiter-id",
      recruiterName: "John Recruiter",
      recruiterEmail: "recruiter@company.com",
      companyName: "Tech Corp",
      candidateId: "candidate-id",
      candidateName: "Jane Candidate",
      candidateEmail: "jane@email.com",
      interviewDate: "2024-12-25",
      interviewTime: "14:00",
      interviewType: "online", // "online", "offline", "phone"
      meetingLink: "https://zoom.us/meeting/123456",
      location: "Office Room 201",
      additionalNotes: "Bring laptop",
      jobTitle: "Senior Developer"
    });

    console.log('Interview scheduled:', response.data);
  } catch (err) {
    console.error('Error scheduling interview:', err);
  }
};
```

#### Get Messages
```javascript
const fetchMessages = async (applicationId) => {
  try {
    const response = await axios.get(`/api/messages/${applicationId}`);
    console.log('Messages:', response.data);
    setMessages(response.data);
  } catch (err) {
    console.error('Error fetching messages:', err);
  }
};
```

#### Get Candidate Interviews
```javascript
const fetchCandidateInterviews = async (candidateId) => {
  try {
    const response = await axios.get(`/api/interviews/candidate/${candidateId}`);
    console.log('Interviews:', response.data);
    setInterviews(response.data);
  } catch (err) {
    console.error('Error fetching interviews:', err);
  }
};
```

---

### 5. Database Query Examples

#### Find Messages
```javascript
// MongoDB Shell
db.messages.find({ applicationId: ObjectId("...") }).sort({ createdAt: -1 })

// Count messages
db.messages.countDocuments({ applicationId: ObjectId("...") })

// Messages between two users
db.messages.find({
  $or: [
    { senderId: ObjectId("..."), recipientId: ObjectId("...") },
    { senderId: ObjectId("..."), recipientId: ObjectId("...") }
  ]
})
```

#### Find Interviews
```javascript
// MongoDB Shell
db.interviews.find({ candidateId: ObjectId("...") })

// Scheduled interviews for recruiter
db.interviews.find({ 
  recruiterId: ObjectId("..."),
  status: "scheduled"
}).sort({ interviewDate: 1 })

// Interviews for specific job
db.interviews.find({ jobId: ObjectId("...") })
```

---

### 6. Environment Variables Template

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@yourcompany.com

# Company Information
COMPANY_NAME=AI Recruiter
COMPANY_EMAIL=info@yourcompany.com
COMPANY_WEBSITE=https://yourcompany.com

# Application URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Server
PORT=5000
NODE_ENV=development
```

---

### 7. Frontend Button Examples

#### Chat Button (Recruiter)
```jsx
<button
  onClick={() => setOpenChatApp(app)}
  className="text-blue-600 font-semibold text-sm hover:underline"
  title="Open chat with candidate"
>
  💬 Chat
</button>
```

#### Chat Button (Candidate)
```jsx
<button
  onClick={() => setOpenChatApp(app)}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mb-3 transition-colors"
>
  💬 Chat with Recruiter
</button>
```

#### Schedule Interview Button (in ChatWindow)
```jsx
{userRole === 'recruiter' && (
  <div className="px-4 py-2 border-b border-gray-200 bg-white">
    <button
      onClick={() => setShowScheduleModal(true)}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
    >
      📅 Schedule Interview
    </button>
  </div>
)}
```

---

### 8. Common Error Fixes

#### Error: Email not sending
```javascript
// Check .env file has:
EMAIL_USER=correct-email@gmail.com
EMAIL_PASSWORD=16-character-app-password (NOT regular password)

// In terminal, test:
console.log(process.env.EMAIL_USER); // Should print email
console.log(process.env.EMAIL_PASSWORD); // Should print password

// For Gmail:
// 1. Go to myaccount.google.com
// 2. Click Security
// 3. Find "App passwords"
// 4. Generate one for Mail
// 5. Copy the 16-char password to EMAIL_PASSWORD
```

#### Error: Chat modal won't open
```javascript
// Check 1: ChatWindow imported?
import ChatWindow from './ChatWindow';

// Check 2: openChatApp state initialized?
const [openChatApp, setOpenChatApp] = useState(null);

// Check 3: Button click sets state?
onClick={() => setOpenChatApp(app)}

// Check 4: Modal renders?
{openChatApp && <ChatWindow ... />}

// Check 5: Browser console for errors?
// Press F12, go to Console tab
```

#### Error: Interview not showing in candidate dashboard
```javascript
// Check 1: fetchInterviews called in useEffect?
useEffect(() => {
  fetchInterviews(); // This must be called
}, []);

// Check 2: Interview document exists in DB?
// In MongoDB Compass, check interviews collection

// Check 3: Candidate ID matches?
// Interview.candidateId === User._id

// Check 4: Try refreshing page?
// Location component won't auto-update until fetch runs again
```

---

### 9. Testing Code

#### Test Chat Endpoint
```bash
# Using curl
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "your-app-id",
    "jobId": "your-job-id",
    "senderId": "your-user-id",
    "senderName": "John",
    "senderRole": "recruiter",
    "senderEmail": "john@company.com",
    "recipientId": "candidate-id",
    "recipientName": "Jane",
    "recipientEmail": "jane@email.com",
    "content": "Hello Jane!"
  }'
```

#### Test Interview Endpoint
```bash
# Using curl
curl -X POST http://localhost:5000/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "your-app-id",
    "jobId": "your-job-id",
    "recruiterId": "recruiter-id",
    "recruiterName": "John",
    "recruiterEmail": "john@company.com",
    "companyName": "Tech Corp",
    "candidateId": "candidate-id",
    "candidateName": "Jane",
    "candidateEmail": "jane@email.com",
    "interviewDate": "2024-12-25",
    "interviewTime": "14:00",
    "interviewType": "online",
    "meetingLink": "https://zoom.us/meeting/123456",
    "additionalNotes": "Test interview",
    "jobTitle": "Developer"
  }'
```

---

### 10. Component Integration Template

#### RecruiterDashboard.jsx - Full Integration
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import CreateTest from './CreateTest';
import ChatWindow from './ChatWindow'; // ADD THIS

export default function RecruiterDashboard() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [openChatApp, setOpenChatApp] = useState(null); // ADD THIS

  // ... existing code ...

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ... existing code ... */}

      {/* Chat Button in Actions */}
      <button
        onClick={() => setOpenChatApp(app)}
        className="text-blue-600 font-semibold text-sm hover:underline"
      >
        💬 Chat
      </button>

      {/* Chat Modal */}
      {openChatApp && ( // ADD THIS
        <ChatWindow
          applicationId={openChatApp._id}
          jobId={openChatApp.jobId}
          jobTitle={currentJob?.title}
          candidateName={openChatApp.candidateName}
          candidateEmail={openChatApp.candidateEmail}
          recruiterId={user._id}
          recruiterName={user.name}
          companyName="Your Company"
          userRole="recruiter"
          onClose={() => setOpenChatApp(null)}
        />
      )}
    </div>
  );
}
```

---

### 11. Styling Utilities

#### Interview Details Box
```jsx
<div className="bg-green-50 p-3 rounded mb-3 border border-green-200">
  <p className="font-semibold text-green-900 mb-2">📅 Interview Details</p>
  <p className="text-sm text-gray-700">
    <strong>Date:</strong> {new Date(interview.interviewDate).toLocaleDateString()}
  </p>
  <p className="text-sm text-gray-700">
    <strong>Time:</strong> {interview.interviewTime}
  </p>
  <p className="text-sm text-gray-700">
    <strong>Type:</strong> {interview.interviewType.toUpperCase()}
  </p>
</div>
```

#### Status Badge
```jsx
<span className={`px-3 py-1 rounded-full text-sm font-semibold ${
  interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
  interview.status === 'completed' ? 'bg-purple-100 text-purple-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {interview.status.toUpperCase()}
</span>
```

#### Chat Message Bubble
```jsx
<div className={`max-w-xs px-4 py-2 rounded-lg ${
  msg.senderRole === 'recruiter' 
    ? 'bg-blue-500 text-white rounded-bl-none' 
    : 'bg-gray-300 text-gray-900 rounded-br-none'
}`}>
  <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
  <p>{msg.content}</p>
  <p className="text-xs mt-1 opacity-70">
    {new Date(msg.createdAt).toLocaleTimeString()}
  </p>
</div>
```

---

### 12. Useful MongoDB Queries

#### Get all messages for an application
```javascript
db.messages.aggregate([
  { $match: { applicationId: ObjectId("...") } },
  { $sort: { createdAt: 1 } },
  { $project: { content: 1, senderName: 1, createdAt: 1, isRead: 1 } }
])
```

#### Get unread messages for a user
```javascript
db.messages.find({
  recipientId: ObjectId("..."),
  isRead: false
}).count()
```

#### Get upcoming interviews for recruiter
```javascript
db.interviews.find({
  recruiterId: ObjectId("..."),
  status: "scheduled",
  interviewDate: { $gte: new Date().toISOString().split('T')[0] }
}).sort({ interviewDate: 1 })
```

#### Get all interviews with feedback
```javascript
db.interviews.find({
  "recruiterFeedback.rating": { $exists: true, $ne: null }
})
```

---

## 📞 Quick Reference Table

| Feature | File | Line | Function |
|---------|------|------|----------|
| Send Message | messages.js | 40 | router.post('/') |
| Get Messages | messages.js | 11 | router.get('/:applicationId') |
| Schedule Interview | interviews.js | 10 | router.post('/') |
| Get Interview | interviews.js | 70 | router.get('/:interviewId') |
| Send Email | emailService.js | 15 | sendInterviewScheduledEmail |
| Chat UI | ChatWindow.jsx | 1 | export default ChatWindow |
| Schedule Form | ScheduleInterview.jsx | 1 | export default ScheduleInterview |
| Recruiter Integration | RecruiterDashboard.jsx | 95 | Chat button in Actions |
| Employee Integration | EmployeeDashboard.jsx | 125 | Interview display |

---

**These are your complete code references for quick copy-paste implementation!** ✅
