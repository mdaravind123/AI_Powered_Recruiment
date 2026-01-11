# Testing Checklist - AI Recruiter App

## Pre-Testing Setup

### Prerequisites
- [ ] Node.js v16+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Cloudinary account created and configured
- [ ] Google Gemini API key obtained
- [ ] Backend `.env` configured with all credentials
- [ ] Frontend `.env` configured with API URL
- [ ] All npm dependencies installed
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```

### Services Status
- [ ] Backend running: `npm run dev` (port 5000)
- [ ] Frontend running: `npm run dev` (port 5173)
- [ ] MongoDB connected
- [ ] No console errors in either terminal

---

## Feature 1: User Authentication

### Registration
- [ ] Candidate signup successful
  - Email validation works
  - Password confirmation matches
  - User created in database
- [ ] Recruiter signup successful
- [ ] Duplicate email prevented
- [ ] Password strength validation (if implemented)

### Login
- [ ] Candidate login with correct credentials
- [ ] Recruiter login with correct credentials
- [ ] Wrong password rejected
- [ ] Non-existent email rejected
- [ ] Token stored in cookies
- [ ] User data persists after page refresh

### Logout
- [ ] Token cleared from cookies
- [ ] Redirected to login page
- [ ] Cannot access protected routes after logout

---

## Feature 2: Job Management (Recruiter)

### Create Job
- [ ] Form displays correctly
- [ ] All fields required: title, description, company, salary, location
- [ ] Requirements can be added/removed
- [ ] Job created in database
- [ ] Confirmation message displayed
- [ ] Redirect to job list

### View Jobs (List)
- [ ] All posted jobs display
- [ ] Job card shows: title, company, salary, location, requirements
- [ ] Pagination works (if list > 10 items)
- [ ] Search function filters jobs
- [ ] Filter by status works

### View Job Details
- [ ] Full job details display
- [ ] "Apply Now" button visible to candidates
- [ ] Edit/Delete buttons visible to recruiter who posted it
- [ ] Test associated with job (if any) displays

### Update Job
- [ ] Edit form pre-fills with current data
- [ ] Changes saved to database
- [ ] Confirmation message shown

### Delete Job
- [ ] Confirmation dialog appears
- [ ] Job removed from list
- [ ] Applications for this job handled appropriately

---

## Feature 3: Resume Upload & Analysis ⭐ NEW

### File Upload
- [ ] File input accepts PDF files
- [ ] File input accepts DOCX files
- [ ] File input accepts DOC files
- [ ] File input accepts TXT files
- [ ] File size limit enforced (>5MB rejected)
- [ ] Invalid file types rejected
- [ ] Progress bar shows during upload

### Upload to Cloudinary
- [ ] File successfully uploaded to Cloudinary
- [ ] File URL returned and stored
- [ ] File accessible via returned URL
- [ ] Files organized in "resumes" folder on Cloudinary

### Gemini API Analysis
- [ ] Resume text extracted successfully
  - PDF extraction works
  - DOCX extraction works
  - TXT extraction works
- [ ] Gemini API called with extracted text
- [ ] Analysis returns structured data:
  - [ ] Summary (2-3 sentences)
  - [ ] Skills array (5-10 items)
  - [ ] Years of experience
  - [ ] Education details
  - [ ] Work experience
  - [ ] Email extracted
  - [ ] Phone extracted
- [ ] Analysis displayed immediately after upload
- [ ] Loading spinner shows during processing

### Fallback Handling
- [ ] If Gemini API fails, fallback extraction works
- [ ] User notified of fallback mode
- [ ] Application still submits successfully

### Dual Mode (Upload vs Text Paste)
- [ ] Toggle button switches between modes
- [ ] Upload mode shows file input
- [ ] Text mode shows textarea
- [ ] Previous input cleared when switching modes
- [ ] Both modes produce analysis

### Legacy Text Paste
- [ ] Text paste still works (backward compatibility)
- [ ] Analysis calculated from pasted text
- [ ] Match score computed
- [ ] Application can be submitted

---

## Feature 4: Job Application (Candidate)

### Apply to Job
- [ ] "Apply Now" button on job details
- [ ] ApplyJob form displays correctly
- [ ] Resume can be uploaded OR pasted
- [ ] Match score displays:
  - Green if > 70%
  - Yellow if 50-70%
  - Red if < 50%
- [ ] Application submitted successfully
- [ ] Confirmation message displayed
- [ ] Application saved in database with:
  - Candidate ID
  - Job ID
  - Resume URL (if file upload)
  - Resume analysis
  - Match score

### Prevent Duplicate Applications
- [ ] Cannot apply to same job twice
- [ ] "Already Applied" message displays
- [ ] Duplicate rejection handled gracefully

### View My Applications
- [ ] Candidate can view all their applications
- [ ] Application list shows:
  - Job title
  - Company
  - Applied date
  - Status (pending, reviewed, accepted, rejected)
  - Match score

---

## Feature 5: Test Creation & Management (Recruiter)

### Create Test
- [ ] Test creation form displays
- [ ] Add multiple choice questions
- [ ] Add coding questions
- [ ] Test saved successfully
- [ ] Can preview test

### Multiple Choice Questions
- [ ] Add question text
- [ ] Add 4-5 options
- [ ] Mark correct answer
- [ ] Set points value
- [ ] Required: question, options, correct answer

### Coding Questions ⭐ NEW
- [ ] Question text input
- [ ] Language selector (Python, JavaScript, Java, C++)
  - [ ] Multiple languages selectable
  - [ ] Default language set
- [ ] Add test cases
  - [ ] Input field
  - [ ] Expected output field
  - [ ] "Sample" checkbox (marks visible to candidates)
  - [ ] Add multiple test cases
  - [ ] Remove test case button works
- [ ] At least 2 test cases required (1 sample, 1 hidden)
- [ ] Validation prevents submission without test cases

### Edit Test
- [ ] Can edit test details
- [ ] Can modify questions
- [ ] Can add/remove test cases
- [ ] Changes saved successfully

### View Test
- [ ] Recruiter sees full test (all test cases visible)
- [ ] Can see marked answers (if test submitted)

---

## Feature 6: Taking Tests (Candidate)

### Start Test
- [ ] Test displays correctly
- [ ] Questions load in order
- [ ] Timer displays (if set)
- [ ] No "Submit" visible until end

### Answer Multiple Choice
- [ ] Can select one option per question
- [ ] Selected option highlighted
- [ ] Can change answer
- [ ] Navigation between questions works

### Answer Coding Questions ⭐ NEW
- [ ] Language selector shows only allowed languages
- [ ] Default language pre-selected
- [ ] Code textarea displays with monospace font
- [ ] Syntax highlighting (if implemented)

### Run Code
- [ ] "Run" button calls code execution
- [ ] Loading spinner shows during execution
- [ ] Sample test cases run
- [ ] Results display:
  - [ ] Input shown
  - [ ] Expected output shown
  - [ ] Actual output shown
  - [ ] Passed/Failed indicator (green/red)
  - [ ] Error message if any
- [ ] Can run code multiple times
- [ ] Run doesn't submit test

### Submit Test
- [ ] "Submit" button visible at end
- [ ] Confirmation dialog appears
- [ ] Test submitted successfully
- [ ] Redirected to results page

### Test Results
- [ ] Score calculated and displayed
- [ ] Percentage shown
- [ ] Individual question results shown
- [ ] For coding:
  - [ ] Number of passed test cases shown
  - [ ] Hidden test cases evaluated server-side
  - [ ] Code not visible to recruiter (or sanitized)

---

## Feature 7: Code Execution Engine ⭐ NEW

### Test Support
- [ ] Python code execution works
- [ ] JavaScript code execution works
- [ ] Java code execution works
- [ ] C++ code execution works

### Input/Output Handling
- [ ] Standard input (stdin) processed correctly
- [ ] Standard output (stdout) captured
- [ ] Error output (stderr) captured
- [ ] Output trimmed properly (no extra whitespace)

### Test Case Evaluation
- [ ] Multiple test cases run sequentially
- [ ] Each test case compared against expected output
- [ ] Case-sensitive comparison
- [ ] Whitespace handled correctly
- [ ] Timeout error if code takes too long

### Sandbox Security
- [ ] Code cannot access file system
- [ ] Code cannot make network requests
- [ ] Code execution limited to 30 seconds
- [ ] Memory limits enforced

### Hidden Test Cases
- [ ] Sample test cases shown to candidate
- [ ] Hidden test cases NOT shown to candidate
- [ ] Hidden test cases evaluated on server
- [ ] Score reflects all test cases (hidden + sample)
- [ ] Candidate cannot see hidden test case inputs/outputs

---

## Feature 8: Recruiter Dashboard

### Analytics Display
- [ ] Total applications count
- [ ] Total jobs posted count
- [ ] Application status breakdown (pie chart)
- [ ] Skills distribution (bar chart)
- [ ] Recent applications list
- [ ] Charts render correctly

### Application Management
- [ ] View all applications
- [ ] Filter by job
- [ ] Filter by status
- [ ] View application details:
  - [ ] Candidate name
  - [ ] Resume analysis with extracted skills
  - [ ] Match score
  - [ ] Applied date
- [ ] Update application status
- [ ] Delete application

### Job Management
- [ ] View all created jobs
- [ ] Edit job
- [ ] Delete job
- [ ] View applications for each job

### Test Management
- [ ] View created tests
- [ ] Create new test
- [ ] Edit test
- [ ] Delete test
- [ ] View test submissions
- [ ] View individual test results

---

## Feature 9: Candidate Dashboard

### Profile
- [ ] View/edit profile information
- [ ] Upload profile picture (if implemented)

### Applications
- [ ] View all applications
- [ ] Filter by status
- [ ] View application details
- [ ] Track status changes

### Tests
- [ ] View available tests
- [ ] Take available tests
- [ ] View test history
- [ ] View results and scores

### Messages
- [ ] View conversations with recruiters
- [ ] Send messages
- [ ] Receive messages
- [ ] Real-time updates (if implemented)

---

## Feature 10: Messaging System

### Send Message
- [ ] Message textarea displays
- [ ] Send button works
- [ ] Message stored in database
- [ ] Message displays in conversation

### View Conversation
- [ ] Conversation history loads
- [ ] Messages sorted by date
- [ ] Both parties' messages visible
- [ ] Timestamps displayed

### Real-Time Updates
- [ ] New messages appear without page refresh (if WebSocket implemented)
- [ ] Message status updated

---

## Feature 11: Interview Scheduling

### Schedule Interview
- [ ] Date/time picker displays
- [ ] Can select future date/time
- [ ] Meeting link input field
- [ ] Interview scheduled successfully

### View Interviews
- [ ] Scheduled interviews displayed
- [ ] Status shown (upcoming, completed, cancelled)
- [ ] Date/time correct

### Update Interview
- [ ] Can mark as completed
- [ ] Can add notes
- [ ] Can rate interview
- [ ] Changes saved

---

## API Testing

### Resume Endpoints
- [ ] `POST /api/resumes/upload-and-process` returns correct response
- [ ] `POST /api/resumes/upload` returns file URL
- [ ] `POST /api/resumes/analyze` calls Gemini correctly

### Test Endpoints
- [ ] `GET /api/tests/:testId` sanitizes for candidates
- [ ] Hidden test cases not in response
- [ ] Correct answers not exposed
- [ ] `POST /api/tests/:testId/submit` evaluates hidden cases

### Code Endpoints
- [ ] `POST /api/code/execute` runs code correctly
- [ ] Multiple languages supported
- [ ] Test cases evaluated
- [ ] Timeout handled

### Application Endpoints
- [ ] `POST /api/applications` accepts file URL OR resumeAnalysis
- [ ] Automatic Gemini extraction if resumeAnalysis missing
- [ ] Match score calculated correctly

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Performance Testing

### Load Times
- [ ] Page load < 3 seconds
- [ ] File upload < 30 seconds (5MB file)
- [ ] Resume analysis < 10 seconds
- [ ] Code execution < 5 seconds

### Responsiveness
- [ ] Mobile layout works (< 768px)
- [ ] Tablet layout works (768-1024px)
- [ ] Desktop layout works (> 1024px)
- [ ] No horizontal scrolling on mobile

---

## Security Testing

### Authentication
- [ ] Cannot access protected routes without login
- [ ] Token expiration works
- [ ] CORS configured correctly
- [ ] No sensitive data in local storage

### File Upload
- [ ] Only allowed file types accepted
- [ ] File size limit enforced
- [ ] File names sanitized
- [ ] No script injection via file uploads

### Code Execution
- [ ] Code sandbox prevents malicious operations
- [ ] Timeouts prevent infinite loops
- [ ] Memory limits enforced

### Data Privacy
- [ ] Hidden test cases not exposed
- [ ] Correct answers not visible
- [ ] Personal info only visible to authorized users

---

## Error Handling

### Network Errors
- [ ] Offline detection works
- [ ] Retry mechanism functions
- [ ] Error messages clear and helpful

### Validation Errors
- [ ] Form validation messages displayed
- [ ] Invalid file types rejected with message
- [ ] File size limit enforced with message

### Server Errors
- [ ] 500 errors handled gracefully
- [ ] 404 errors show not found message
- [ ] 403 errors show permission denied

### API Errors
- [ ] Gemini API failure handled (fallback)
- [ ] Cloudinary failure shown with message
- [ ] MongoDB connection error displayed

---

## Database Testing

### Collections Created
- [ ] Users
- [ ] Jobs
- [ ] Applications
- [ ] Tests
- [ ] TestResults
- [ ] Messages
- [ ] Interviews

### Data Integrity
- [ ] No orphaned records
- [ ] Foreign key relationships intact
- [ ] Unique constraints enforced
- [ ] Required fields populated

### Data Retrieval
- [ ] Queries return correct data
- [ ] Pagination works correctly
- [ ] Filters work as expected
- [ ] Sorting works correctly

---

## Deployment Testing

### Backend Deployment
- [ ] Builds without errors
- [ ] Environment variables configured
- [ ] Database connected
- [ ] All endpoints accessible

### Frontend Deployment
- [ ] Builds without errors
- [ ] API URL correct
- [ ] Assets load correctly
- [ ] Routes work

---

## Regression Testing

### After New Features
- [ ] All previous features still work
- [ ] No broken functionality
- [ ] No new console errors
- [ ] Database migrations successful (if any)

---

## Sign-Off

### QA Approval
- [ ] All tests passed: ___________
- [ ] Known issues documented: ___________
- [ ] Date: ___________

### Deployment Approval
- [ ] Ready for production: ___________
- [ ] Rollback plan in place: ___________
- [ ] Monitoring configured: ___________

---

## Notes & Issues Found

```
[Document any issues found during testing here]

Issue #1:
- Description:
- Severity: (Critical/High/Medium/Low)
- Fix:
- Status:

Issue #2:
...
```

---

## Testing Summary

- Total Test Cases: ___
- Passed: ___
- Failed: ___
- Skipped: ___
- Success Rate: ___%

**Tester Name**: ___________
**Date**: ___________
**Signature**: ___________
