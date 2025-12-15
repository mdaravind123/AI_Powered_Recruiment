# Quick Setup Guide - AI Recruiter App with Testing Feature

## ✅ What's Been Implemented

### Backend (Node.js + Express + MongoDB)
- ✅ **3 New Models**: Test, TestResult, Application
- ✅ **2 New Route Files**: tests.js, applications.js
- ✅ **Resume Analyzer Utility** for AI-based matching
- ✅ **All API Endpoints** for test management and applications
- ✅ **Integrated Routes** in main server file

### Frontend (React + Tailwind)
- ✅ **RecruiterDashboard**: For recruiters to manage candidates and tests
- ✅ **EmployeeDashboard**: For candidates to view applications and tests
- ✅ **CreateTest Component**: Modal for creating online tests
- ✅ **TakeTest Component**: Full-featured test-taking interface
- ✅ **ApplyJob Page**: For candidates to apply with AI matching
- ✅ **Updated Dashboard**: Role-based routing
- ✅ **Updated App.jsx**: New routes for all features
- ✅ **Resume Analyzer Utility**: Frontend skill extraction and matching

---

## 🚀 Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Ensure .env file has:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db-name
JWT_SECRET=your-secret-key-here
PORT=5000
CLIENT_URL=http://localhost:5173

# Start the server
npm start
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

### 3. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📋 Testing Checklist

### Test as Recruiter

- [ ] **Sign Up**: Create account with role "recruiter"
- [ ] **Post Job**: Jobs → Create a job with 3-4 skills
- [ ] **View Dashboard**: Should see RecruiterDashboard
- [ ] **Create Test**: 
  - [ ] Click "+ Create Online Test"
  - [ ] Fill test details (name, duration, questions)
  - [ ] Add at least 2 MCQ questions
  - [ ] Enable proctoring with rules
  - [ ] Create test
- [ ] **Create Another Account**: As employee (for testing)

### Test as Employee/Candidate

- [ ] **Sign Up**: Create account with role "employee"
- [ ] **Browse Jobs**: Go to "Find Jobs"
- [ ] **Apply for Job**:
  - [ ] Click job card
  - [ ] Paste sample resume text
  - [ ] See AI match score calculated in real-time
  - [ ] Click "Apply Now"
- [ ] **View Dashboard**: Should see EmployeeDashboard
- [ ] **Check Application**: 
  - [ ] See applied job with status
  - [ ] See resume match score (with progress bar)
  - [ ] See applied date

### Test Recruiter Actions (After Candidate Applied)

- [ ] **Go to Recruiter Dashboard**
- [ ] **Select Job**: Dropdown should show job with applications
- [ ] **View Candidates**: 
  - [ ] Candidates sorted by match score
  - [ ] Color-coded badges (green/yellow/red)
- [ ] **Shortlist Candidate**: Click "Shortlist" button
- [ ] **Assign Test**: 
  - [ ] Click "Assign Test" dropdown
  - [ ] Select the test you created
  - [ ] Status changes to "TEST_ASSIGNED"
- [ ] **View Test Results**: Click "View Results"

### Test Taking (Candidate)

- [ ] **Go to Employee Dashboard**
- [ ] **Find Application**: Look for test assignment
- [ ] **Start Test**:
  - [ ] Click "Start Test"
  - [ ] See proctoring rules
  - [ ] Click "Start Test" again
- [ ] **Take Test**:
  - [ ] See timer at top right
  - [ ] Progress bar
  - [ ] Question navigator
  - [ ] Answer MCQ questions
  - [ ] Click Next to move through questions
- [ ] **Submit Test**:
  - [ ] On last question, click "Submit Test"
  - [ ] Confirm submission
- [ ] **View Results**: See score immediately

### Back to Recruiter

- [ ] **Refresh Results**: Click "View Results" again
- [ ] **See Test Score**: Displayed with candidate's resume score

---

## 📁 File Structure - What's New

```
backend/
├── models/
│   ├── Test.js (NEW)
│   ├── TestResult.js (NEW)
│   └── Application.js (NEW)
├── routes/
│   ├── tests.js (NEW)
│   └── applications.js (NEW)
├── utils/
│   └── resumeAnalyzer.js (NEW/UPDATED)
└── index.js (UPDATED)

frontend/src/
├── componets/
│   ├── CreateTest.jsx (NEW)
│   ├── TakeTest.jsx (NEW)
│   ├── RecruiterDashboard.jsx (NEW)
│   └── EmployeeDashboard.jsx (NEW)
├── pages/
│   ├── ApplyJob.jsx (NEW)
│   ├── Dashboard.jsx (UPDATED)
│   └── App.jsx (UPDATED)
└── utils/
    └── resumeAnalyzer.js (NEW)
```

---

## 🔑 Key Features Summary

### For Recruiters
1. **Post Jobs** - Title, description, required skills
2. **Create Online Tests** - MCQ, Essay, Coding questions
3. **Configure Proctoring** - Add proctoring rules
4. **Shortlist Candidates** - Based on AI resume match
5. **Assign Tests** - To shortlisted candidates
6. **View Results** - Score, answers, time spent
7. **Analytics** - Real-time stats dashboard

### For Candidates
1. **Browse Jobs** - See all posted jobs
2. **Apply Online** - Paste resume, get AI match score
3. **Track Applications** - Dashboard with statuses
4. **Take Tests** - Timed, proctored tests
5. **View Results** - Immediate score feedback
6. **Progress Tracking** - Resume match + test scores

---

## 🛠️ Troubleshooting

### Backend Issues
1. **MongoDB Connection Failed**
   - Check MONGO_URI in .env
   - Ensure IP is whitelisted in MongoDB Atlas

2. **Routes Not Found (404)**
   - Check tests.js and applications.js are imported in index.js
   - Verify route paths in App.jsx

3. **CORS Errors**
   - Check CLIENT_URL in .env matches frontend URL
   - Should be http://localhost:5173 for dev

### Frontend Issues
1. **Components Not Showing**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Restart dev server

2. **API Calls Failing**
   - Check Network tab in DevTools
   - Verify backend is running on port 5000
   - Check browser console for errors

3. **Job ID Parameter Issue**
   - Use `:id` in route path, not `:jobId`
   - Frontend App.jsx already fixed

---

## 📞 Quick Command Reference

```bash
# Backend
cd backend
npm start              # Start server
npm install            # Install deps

# Frontend
cd frontend
npm run dev            # Start dev server
npm install            # Install deps
npm run build          # Build for production
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications** - Notify candidates when tests assigned
2. **Advanced Proctoring** - Video recording, face detection
3. **Batch Operations** - Assign test to multiple candidates
4. **Test Templates** - Reusable test templates
5. **Performance Charts** - Analytics with charts
6. **Interview Scheduling** - Calendar integration
7. **Document Upload** - File upload for resumes
8. **Bulk Import** - CSV import for jobs

---

## 📊 Sample Test Data

### Sample Resume for Testing
```
Experienced Full Stack Developer

Skills: JavaScript, React, Node.js, MongoDB, Express, AWS, Docker, HTML, CSS

Experience: 5+ years in web development

Education: B.Tech Computer Science

Projects: Built multiple e-commerce platforms, SaaS applications

Contact: candidate@example.com
```

### Sample Job for Testing
```
Title: Senior Full Stack Developer
Description: Looking for experienced developer with MERN stack
Required Skills: JavaScript, React, Node.js, MongoDB, Express
```

---

## ✨ You're All Set!

The feature is fully implemented and ready to use. Follow the testing checklist above to verify all functionality works as expected.

For detailed information about the workflow and architecture, see **FEATURE_IMPLEMENTATION.md**

