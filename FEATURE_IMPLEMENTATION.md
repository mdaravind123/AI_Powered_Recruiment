# AI-Recruiter App - Feature Implementation Guide

## 📋 Overview
This document describes the complete implementation of the resume screening → skill validation workflow, enabling seamless recruitment from AI-based resume analysis through online proctored testing.

---

## 🏗️ Architecture Overview

### Backend Components
```
backend/
├── models/
│   ├── User.js (existing)
│   ├── Job.js (existing)
│   ├── Candidate.js (existing)
│   ├── Test.js (NEW) - Online test definitions
│   ├── TestResult.js (NEW) - Test submission results
│   └── Application.js (NEW) - Job applications tracking
├── routes/
│   ├── auth.js (existing)
│   ├── jobs.js (existing)
│   ├── upload.js (existing)
│   ├── tests.js (NEW) - Test management APIs
│   └── applications.js (NEW) - Application management APIs
├── utils/
│   └── resumeAnalyzer.js (NEW) - Resume analysis utilities
└── index.js (UPDATED)
```

### Frontend Components
```
frontend/src/
├── pages/
│   ├── Dashboard.jsx (UPDATED) - Role-based dashboard routing
│   ├── Jobs.jsx (existing)
│   ├── JobDetails.jsx (existing)
│   ├── Login.jsx (existing)
│   ├── Signup.jsx (existing)
│   └── ApplyJob.jsx (NEW) - Candidate job application page
├── componets/
│   ├── RecruiterDashboard.jsx (NEW) - Recruiter main dashboard
│   ├── EmployeeDashboard.jsx (NEW) - Candidate main dashboard
│   ├── CreateTest.jsx (NEW) - Test creation modal
│   ├── TakeTest.jsx (NEW) - Test taking interface
│   └── [existing components]
├── utils/
│   └── resumeAnalyzer.js (NEW) - Frontend resume analysis
└── App.jsx (UPDATED) - New routes
```

---

## 🔄 Workflow Implementation

### 1. FOR RECRUITERS

#### A. Job Posting
- Navigate to Jobs page
- Click "Post a Job" (visible only for recruiters)
- Fill job details: title, description, required skills
- Job is created and candidates can view it

#### B. Candidate Review & Shortlisting
1. **View Applications**
   - Navigate to Dashboard
   - RecruiterDashboard automatically loads
   - Select a job to view applications
   - View candidates sorted by AI resume match score (highest first)

2. **Shortlist Candidates**
   - Click "Shortlist" button on candidate row
   - Status changes to "SHORTLISTED"
   - Candidate can now be assigned tests

3. **Reject Candidates**
   - Click "Reject" button
   - Status changes to "REJECTED"

#### C. Create Online Proctored Tests
1. **Create Test**
   - Click "+ Create Online Test" button on recruiter dashboard
   - Fill test details:
     - Test Name
     - Description
     - Duration (minutes)
     - Passing Score (%)
     - Scheduled Date & Time (optional)

2. **Configure Proctoring Rules**
   - Enable proctoring (checkbox)
   - Add proctoring rules:
     - "No tab switching"
     - "Webcam monitoring"
     - "Single monitor only"
     - etc.

3. **Add Questions**
   - Add MCQ, Essay, or Coding questions
   - For MCQ: add options and mark correct answer
   - Set difficulty level (easy/medium/hard)
   - Set time limit per question
   - Add as many questions as needed

4. **Save Test**
   - Test is saved and linked to the job
   - Can now be assigned to candidates

#### D. Assign Tests to Candidates
1. In candidate row, click "Assign Test" dropdown
2. Select a test from available tests
3. Test appears in "Test" column as "Assigned"
4. Candidate receives notification (in production)

#### E. Review Test Results
1. Click "View Results" next to test name
2. See all candidate results:
   - Candidate name & email
   - Total score (%)
   - Correct/Total answers
   - Time spent
   - Detailed answer breakdown
3. Compare with resume match scores
4. Make hiring decisions

#### F. Analytics Dashboard
- Total applications count
- Shortlisted candidates count
- Tests assigned count
- Tests completed count
- All in real-time cards

---

### 2. FOR EMPLOYEES/CANDIDATES

#### A. Browse & Apply for Jobs
1. **View Available Jobs**
   - Navigate to "Find Jobs" page
   - See all posted jobs
   - Click on job to view details

2. **Apply for Job**
   - Click on job card
   - ApplyJob page loads
   - Paste resume content or link
   - Click "Apply Now"
   - Application submitted with AI match score

#### B. Dashboard View
1. **View Applications**
   - Navigate to Dashboard
   - EmployeeDashboard automatically loads
   - See all applied jobs in cards
   - View status: APPLIED, SHORTLISTED, TEST_ASSIGNED, TEST_COMPLETED

2. **Track Progress**
   - Resume Match Score (visual progress bar)
   - Color coded: Green (80%+), Yellow (60-80%), Red (<60%)
   - Applied date
   - Shortlist date (if shortlisted)

#### C. Take Assigned Tests
1. **View Assigned Test**
   - When recruiter assigns test, it appears in application card
   - Test details visible:
     - Test name
     - Description
     - Duration
     - Number of questions
     - Passing score
     - Scheduled date/time (if applicable)

2. **Start Test**
   - Click "Start Test" button
   - Pre-test information screen
   - Confirms understanding of proctoring rules
   - Click "Start Test" again

3. **Take Test**
   - Timer shows remaining time (top right)
   - Progress bar shows question progress
   - Question navigator shows: attempted vs unattempted
   - Navigate: Previous/Next buttons or click question numbers
   - For MCQ: select one option
   - For Essay/Coding: type answer in text area

4. **Submit Test**
   - On last question, "Submit Test" button appears
   - Confirmation dialog before submission
   - Test auto-submits when time runs out

#### D. View Test Results
1. **After Test Completion**
   - Results page shows immediately
   - Score (%)
   - Correct/Total answers
   - Pass/Fail status
   - Option to view detailed results

2. **On Dashboard**
   - Test result card in application
   - Score badge
   - Pass/Fail indicator
   - Detailed answer breakdown if clicked

#### E. Analytics (Stats)
- Total applications
- Shortlisted count
- Tests assigned (pending)
- Tests completed

---

## 📊 Database Models

### Test Model
```javascript
{
  jobId: ObjectId (required),
  recruiterId: ObjectId (required),
  testName: String,
  description: String,
  duration: Number (minutes),
  totalQuestions: Number,
  questions: [{
    questionText: String,
    questionType: 'mcq' | 'essay' | 'coding',
    options: [String], // for MCQ
    correctAnswer: String,
    timeLimit: Number,
    difficulty: 'easy' | 'medium' | 'hard'
  }],
  passingScore: Number (percentage),
  proctoring: {
    enableProctoring: Boolean,
    rules: [String]
  },
  scheduledDate: Date,
  scheduledTime: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### TestResult Model
```javascript
{
  testId: ObjectId (required),
  jobId: ObjectId (required),
  candidateId: ObjectId (required),
  candidateName: String,
  candidateEmail: String,
  answers: [{
    questionId: String,
    questionText: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number (seconds)
  }],
  totalScore: Number (percentage),
  correctAnswers: Number,
  totalQuestions: Number,
  status: 'pending' | 'completed' | 'failed',
  passed: Boolean,
  timeUsed: Number (seconds),
  startedAt: Date,
  completedAt: Date,
  proctorNotes: String,
  suspiciousActivity: [String]
}
```

### Application Model
```javascript
{
  jobId: ObjectId (required),
  candidateId: ObjectId (required),
  candidateName: String,
  candidateEmail: String,
  resumeUrl: String,
  matchScore: Number (percentage),
  status: 'applied' | 'shortlisted' | 'rejected' | 'test_assigned' | 'test_completed',
  testId: ObjectId,
  testResult: ObjectId,
  resumeAnalysis: {
    summary: String,
    skills: [String],
    experience: String
  },
  appliedAt: Date,
  shortlistedAt: Date,
  testAssignedAt: Date,
  testCompletedAt: Date
}
```

---

## 🔌 API Endpoints

### Tests Routes (`/api/tests`)
```
POST   /api/tests                           - Create test
GET    /api/tests/job/:jobId                - Get tests for job
GET    /api/tests/:testId                   - Get test details
GET    /api/tests/:testId/results           - Get test results
POST   /api/tests/:testId/submit            - Submit test result
GET    /api/tests/:testId/result/:candidateId - Get specific result
PUT    /api/tests/:testId                   - Update test
DELETE /api/tests/:testId                   - Delete test
```

### Applications Routes (`/api/applications`)
```
POST   /api/applications                              - Create application
GET    /api/applications/job/:jobId                   - Get job applications
GET    /api/applications/candidate/:candidateId       - Get candidate applications
PUT    /api/applications/:applicationId/shortlist     - Shortlist candidate
PUT    /api/applications/:applicationId/reject        - Reject candidate
PUT    /api/applications/:applicationId/assign-test   - Assign test
GET    /api/applications/:applicationId               - Get application details
GET    /api/applications/job/:jobId/shortlist-candidates - Get shortlist pool
```

---

## 🎨 UI Components

### RecruiterDashboard
- Job selection dropdown
- Stats cards (total, shortlisted, tested, completed)
- Create test button
- Available tests list with view results button
- Candidates table with:
  - Name, email, match score (color-coded)
  - Skills from resume
  - Current status badge
  - Test assignment dropdown
  - Shortlist/Reject actions

### EmployeeDashboard
- Stats cards (same as recruiter)
- Applied jobs list
- For each application:
  - Job title and description
  - Status badge
  - Resume match progress bar
  - Test card (if assigned):
    - Test details
    - Start Test button (if not taken)
    - Results card (if completed)
  - Applied date

### CreateTest Modal
- Test details form
- Proctoring settings
- Questions builder with add/remove
- Question details for each type
- Submit button

### TakeTest Modal
- Pre-test info screen
- Test interface with:
  - Timer (top right)
  - Progress bar
  - Question navigator
  - Navigation buttons
  - Question content area
  - Submit button

---

## 🔐 Key Features

### For Recruiters
✅ Post jobs with required skills
✅ View applications ranked by AI match score
✅ Shortlist candidates
✅ Create unlimited online tests
✅ Configure proctoring rules
✅ Support MCQ, Essay, Coding questions
✅ Set passing score and time limits
✅ Assign tests to candidates
✅ View comprehensive test results
✅ Compare resume scores with test scores
✅ Analytics dashboard

### For Candidates
✅ Browse and apply for jobs
✅ AI resume analysis shows match score
✅ View application status in one place
✅ Receive test assignments
✅ Take timed, proctored tests
✅ See immediate results
✅ Track progress with visual indicators
✅ View detailed answer breakdown

---

## 🚀 Getting Started

### Backend Setup
1. Install dependencies
```bash
npm install
```

2. Add to .env
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

3. Start server
```bash
npm start
```

### Frontend Setup
1. Install dependencies
```bash
npm install
```

2. Start dev server
```bash
npm run dev
```

3. Access http://localhost:5173

---

## 📝 Testing Guide

### Test as Recruiter
1. Sign up with role: "recruiter"
2. Navigate to Jobs → Post a Job
3. Go to Dashboard
4. RecruiterDashboard loads
5. Create a test
6. (Wait for candidate application)
7. Assign test to candidate
8. View results when complete

### Test as Candidate
1. Sign up with role: "employee"
2. Navigate to Find Jobs
3. Click job → Apply
4. Paste resume (will calculate match score)
5. Go to Dashboard
6. EmployeeDashboard loads
7. (Wait for recruiter to assign test)
8. Click "Start Test"
9. Answer questions
10. Submit test
11. View results

---

## 🔄 Workflow Summary

```
Resume Screening → AI Matching
         ↓
Candidate Shortlisting
         ↓
Online Test Assignment
         ↓
Test Taking (Proctored)
         ↓
Auto-Evaluation
         ↓
Results & Comparison
         ↓
Hiring Decision
```

---

## 🛠️ Future Enhancements

- [ ] Integration with real AI models (Hugging Face, OpenAI)
- [ ] Advanced proctoring with ML (eye tracking, face detection)
- [ ] Video recording during test
- [ ] Email notifications
- [ ] Bulk test assignment
- [ ] Custom test templates
- [ ] Performance analytics dashboard
- [ ] Interview scheduling
- [ ] Document verification
- [ ] Integration with ATS systems

---

## 📞 Support

For issues or questions, check:
1. Console logs for error details
2. Network tab for API responses
3. MongoDB connection string
4. CORS configuration

