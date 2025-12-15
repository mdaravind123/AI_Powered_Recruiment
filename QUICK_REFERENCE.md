# 🚀 Quick Reference - AI Recruiter Testing Feature

## File Locations

### Backend Models
```
backend/models/Test.js              → Test definitions
backend/models/TestResult.js        → Test submissions  
backend/models/Application.js       → Job applications
```

### Backend Routes
```
backend/routes/tests.js             → Test API endpoints
backend/routes/applications.js      → Application API endpoints
```

### Frontend Components
```
frontend/src/pages/ApplyJob.jsx                    → Candidate application page
frontend/src/componets/RecruiterDashboard.jsx      → Recruiter main view
frontend/src/componets/EmployeeDashboard.jsx       → Candidate main view
frontend/src/componets/CreateTest.jsx              → Test creation modal
frontend/src/componets/TakeTest.jsx                → Test taking interface
```

---

## API Quick Reference

### Create Test
```bash
POST /api/tests
{
  jobId, recruiterId, testName, description, duration,
  totalQuestions, questions, passingScore, proctoring,
  scheduledDate, scheduledTime
}
```

### Get Applications for Job
```bash
GET /api/applications/job/:jobId
→ Returns array of applications sorted by matchScore
```

### Assign Test to Candidate
```bash
PUT /api/applications/:applicationId/assign-test
{ testId }
```

### Submit Test Result
```bash
POST /api/tests/:testId/submit
{
  candidateId, candidateName, candidateEmail, jobId,
  answers, totalScore, correctAnswers, totalQuestions, timeUsed
}
```

### Get Test Results
```bash
GET /api/tests/:testId/results
→ Returns array of all results for that test
```

---

## Database Fields Reference

### Test
- jobId (required)
- recruiterId (required)
- testName
- description
- duration (minutes)
- totalQuestions
- questions[] (with questionText, questionType, options, etc.)
- passingScore (%)
- proctoring { enableProctoring, rules[] }
- scheduledDate, scheduledTime
- isActive

### TestResult
- testId, jobId, candidateId
- candidateName, candidateEmail
- answers[] (with questionId, userAnswer, correctAnswer, isCorrect, timeSpent)
- totalScore (%)
- correctAnswers / totalQuestions
- status: 'completed' | 'pending' | 'failed'
- passed (Boolean)
- timeUsed (seconds)
- completedAt

### Application
- jobId, candidateId
- candidateName, candidateEmail
- resumeUrl
- matchScore (%)
- status: 'applied' | 'shortlisted' | 'rejected' | 'test_assigned' | 'test_completed'
- testId, testResult
- resumeAnalysis { summary, skills[], experience }
- Timestamps: appliedAt, shortlistedAt, testAssignedAt, testCompletedAt

---

## Component Props

### RecruiterDashboard
- No props (uses user context)
- Fetches jobs and applications internally

### EmployeeDashboard
- No props (uses user context)
- Fetches applications for current user

### CreateTest
```jsx
<CreateTest
  jobId={string}              // Required
  onTestCreated={function}    // Callback when test created
  onCancel={function}         // Callback on cancel
/>
```

### TakeTest
```jsx
<TakeTest
  testId={string}             // Required
  jobId={string}              // Required
  applicationId={string}      // Required
  onCompleted={function}      // Callback after submission
/>
```

---

## Utility Functions

### Frontend (utils/resumeAnalyzer.js)
```javascript
extractSkills(resumeText)           → [skills]
calculateMatchScore(required, candidate) → number (%)
extractExperience(resumeText)       → number (years)
generateResumeSummary(resumeText)   → string
analyzeResume(resumeText)           → {skills, experience, summary}
```

### Backend (utils/resumeAnalyzer.js)
```javascript
extractSkills(resumeText)           → [skills]
calculateMatchScore(jobSkills, resumeSkills) → number (%)
extractExperience(resumeText)       → number (years)
generateResumeSummary(resumeText)   → string
analyzeResume(resumeText, jobSkills) → {skills, matchScore, experience, summary}
rankCandidates(candidates)          → sorted array
```

---

## State Management

### Dashboard Component Flow
```
Dashboard.jsx
  ↓
  → User role = "recruiter" → RecruiterDashboard.jsx
  → User role = "employee" → EmployeeDashboard.jsx
```

### RecruiterDashboard State
```
jobs: []
selectedJob: string
applications: []
tests: []
testResults: {}
```

### EmployeeDashboard State
```
applications: []
selectedTest: object | null
testResults: {}
```

---

## Common Tasks

### Test a Recruiter Flow
```
1. Sign up as recruiter
2. Post a job
3. Navigate to /
4. See RecruiterDashboard loads
5. Click "+ Create Online Test"
6. Create test with 2+ questions
7. (Candidate applies)
8. See application in dashboard
9. Click "Assign Test"
10. Select test
11. Click "View Results" after candidate takes test
```

### Test a Candidate Flow
```
1. Sign up as employee
2. Navigate to /jobs
3. Click on job
4. Paste resume
5. See match score calculated
6. Click "Apply Now"
7. Navigate to /
8. See EmployeeDashboard loads
9. (Wait for recruiter to assign test)
10. Click "Start Test"
11. Answer questions
12. Click "Submit Test"
13. See results
```

---

## Error Handling

### Common Errors
```
400 - Bad Request → Check request data
401 - Unauthorized → Check authentication
404 - Not Found → Check IDs exist
500 - Server Error → Check backend logs
```

### Frontend Error Handling
```javascript
// All API calls wrapped with try-catch
// Error messages shown via toast notifications
// Validation before submission
```

---

## Performance Tips

1. **Images/Files**
   - Store URLs in database, not binary data
   - Use CDN for resume files

2. **Queries**
   - Applications sorted by matchScore by default
   - Indexes on frequently queried fields

3. **Frontend**
   - Components lazy-loaded as needed
   - Modals only render when needed
   - Tailwind for efficient styling

---

## Debugging

### Check Browser DevTools
1. Network tab → See API requests/responses
2. Console → See JavaScript errors
3. Application tab → Check local storage (user token)

### Check Backend Logs
```bash
Look for console.log statements in backend
Check MongoDB Atlas for data
```

### MongoDB Queries
```javascript
// Check applications
db.applications.find().sort({matchScore: -1})

// Check tests
db.tests.find({jobId: "..."})

// Check results
db.testresults.find({testId: "..."})
```

---

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
```

---

## CSS Classes

### Status Badges
```
Shortlisted   → bg-green-100 text-green-800
Test Assigned → bg-blue-100 text-blue-800
Test Completed → bg-purple-100 text-purple-800
Rejected      → bg-red-100 text-red-800
Applied       → bg-gray-100 text-gray-800
```

### Match Score Colors
```
80%+  → Green (bg-green-500)
60-80% → Yellow (bg-yellow-500)
<60%  → Red (bg-red-500)
```

---

## Key Insights

1. **Match Score** - Calculated on frontend before submission
2. **Test Results** - Auto-calculated on backend
3. **Application Status** - Updated based on actions
4. **Role-based UI** - Different dashboard for recruiter vs candidate
5. **Real-time Updates** - Fetched when dashboard loads
6. **Responsive Design** - Works on mobile with Tailwind
7. **User Context** - Used for auth throughout app

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on test routes | Check tests.js imported in index.js |
| Match score not showing | Check resume analyzer utility imported |
| Tests not assigned | Check application/:id/assign-test endpoint |
| Results not loading | Verify test/:id/results endpoint |
| CORS error | Check CLIENT_URL in backend .env |
| Components not showing | Clear cache, restart dev server |
| MongoDB error | Check MONGO_URI, IP whitelist |

---

**Last Updated:** December 15, 2025

