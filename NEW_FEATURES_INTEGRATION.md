# 🆕 NEW FEATURES INTEGRATION GUIDE

## Overview
This document explains how to integrate the 4 new features into your existing codebase.

---

## Feature 1: Cosine Similarity Algorithm

### File Created:
`backend/utils/cosineSimilarity.js`

### What it does:
- Compares job description with resume content using TF-IDF and cosine similarity
- Provides advanced matching score calculation
- More accurate than simple keyword matching

### How to Use in Backend Routes:

```javascript
// In your applications.js route file
import { calculateMatchScoreWithCosineSimilarity } from '../utils/cosineSimilarity.js';

// When creating an application:
const matchScore = calculateMatchScoreWithCosineSimilarity(
  job.description,        // Job description text
  resumeContent,          // Resume content/text
  job.skills              // Array of required skills
);

// Save with the calculated score
const application = await Application.create({
  // ... other fields
  matchScore: matchScore
});
```

### Example Functions Available:
```javascript
// 1. Calculate match score
calculateMatchScoreWithCosineSimilarity(jobDesc, resumeText, jobSkills)

// 2. Analyze resume
analyzeResumeAdvanced(resumeText, jobDescription, jobSkills)

// 3. Extract resume text (handles files and strings)
extractResumeText(resumeFile)
```

---

## Feature 2: Recharts Dashboard Analytics

### File Created:
`frontend/src/componets/RecruiterDashboardWithCharts.jsx`

### What it displays:
- Bar chart: Application status distribution
- Pie chart: Match score distribution
- Stats cards with metrics
- Top candidates list
- **NEW**: Batch test assignment interface

### How to Integrate:

In `frontend/src/App.jsx`, update the dashboard route:

```jsx
import RecruiterDashboardWithCharts from './componets/RecruiterDashboardWithCharts';

// In your routes:
<Route 
  path="/dashboard/recruiter"
  element={user?.role === 'recruiter' ? <RecruiterDashboardWithCharts /> : <Navigate to="/" />}
/>
```

Or replace the existing RecruiterDashboard in Dashboard.jsx:

```jsx
import RecruiterDashboardWithCharts from '../componets/RecruiterDashboardWithCharts';

// In Dashboard component:
{user?.role === "recruiter" ? (
  <RecruiterDashboardWithCharts />
) : (
  <EmployeeDashboard />
)}
```

### Dependencies Required:
```bash
npm install recharts
```

Make sure `recharts` is in your frontend `package.json`.

---

## Feature 3: Resume File Upload (Instead of Paste)

### File Created:
`frontend/src/componets/ApplyJobWithFileUpload.jsx`

### What it does:
- Upload resume as PDF, DOC, DOCX, or TXT file
- Shows file preview
- File size validation (max 5MB)
- Sends file to backend

### Backend Setup Required:

#### Step 1: Update backend index.js

```javascript
import resumeUploadRoutes from './routes/resume-upload.js';

// Add this route
app.use('/api/jobs', resumeUploadRoutes);
```

#### Step 2: Install multer (if not already installed)

```bash
cd backend
npm install multer
```

#### Step 3: Create uploads directory

```bash
mkdir -p uploads/resumes
```

#### Step 4: Serve uploaded files as static

In `backend/index.js`, add:

```javascript
// After other middleware
app.use('/uploads', express.static('uploads'));
```

### Frontend Integration:

In `frontend/src/pages/ApplyJob.jsx` or use the new component:

```jsx
import ApplyJobWithFileUpload from '../componets/ApplyJobWithFileUpload';

// Use it in your routes:
<Route 
  path="/jobs/:id"
  element={user?.role === 'recruiter' ? <JobDetails /> : <ApplyJobWithFileUpload />}
/>
```

### Modified ApplyJob Component:

If you want to update existing ApplyJob.jsx with file upload:

```jsx
// Add file input
const [resumeFile, setResumeFile] = useState(null);

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    setResumeFile(file);
  }
};

const uploadFile = async () => {
  const formData = new FormData();
  formData.append('file', resumeFile);
  
  const { data } = await axios.post('/api/jobs/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return data.resumeUrl;
};
```

---

## Feature 4: Batch Test Assignment

### File Created:
`frontend/src/componets/RecruiterDashboardWithCharts.jsx` (includes batch assignment UI)

### What it does:
- Select multiple candidates with checkboxes
- Select a test from dropdown
- Assign test to all selected candidates in one click
- Shows confirmation of bulk assignment

### UI Components:

```jsx
// Checkbox for each candidate
<input
  type="checkbox"
  checked={selectedCandidates.has(app._id)}
  onChange={() => handleSelectCandidate(app._id)}
/>

// Select all button
<input
  type="checkbox"
  checked={selectedCandidates.size === applications.length}
  onChange={handleSelectAll}
/>

// Test selection dropdown
<select value={batchTestId} onChange={(e) => setBatchTestId(e.target.value)}>
  {tests.map(test => <option value={test._id}>{test.testName}</option>)}
</select>

// Batch assign button
<button onClick={handleBatchAssignTest}>
  Assign Test to Selected
</button>
```

### How It Works:

```javascript
const handleBatchAssignTest = async () => {
  // 1. Validate selections
  if (selectedCandidates.size === 0) {
    toast.error('Select at least one candidate');
    return;
  }
  
  if (!batchTestId) {
    toast.error('Select a test');
    return;
  }

  // 2. Send parallel requests
  const promises = Array.from(selectedCandidates).map(appId =>
    axios.put(`/api/applications/${appId}/assign-test`, { testId: batchTestId })
  );

  // 3. Wait for all to complete
  await Promise.all(promises);
  
  // 4. Clear selections and refresh
  setSelectedCandidates(new Set());
  setBatchTestId('');
  fetchApplications(selectedJob);
  
  toast.success(`Test assigned to ${selectedCandidates.size} candidates!`);
};
```

---

## Integration Checklist

### Backend Setup:
- [ ] Create `backend/utils/cosineSimilarity.js` ✅
- [ ] Create `backend/routes/resume-upload.js` ✅
- [ ] Install multer: `npm install multer`
- [ ] Update `backend/index.js`:
  - [ ] Import `cosineSimilarity` functions
  - [ ] Import `resume-upload` routes
  - [ ] Add `app.use('/uploads', express.static('uploads'))`
- [ ] Create `uploads/resumes` directory
- [ ] Update applications.js to use cosine similarity

### Frontend Setup:
- [ ] Install recharts: `npm install recharts`
- [ ] Create `frontend/src/componets/RecruiterDashboardWithCharts.jsx` ✅
- [ ] Create `frontend/src/componets/ApplyJobWithFileUpload.jsx` ✅
- [ ] Update `frontend/src/pages/Dashboard.jsx` or create new route
- [ ] Update `frontend/src/App.jsx` with new routes

### Testing:
- [ ] Test cosine similarity with sample data
- [ ] Test file upload (PDF, DOC, DOCX, TXT)
- [ ] Test batch assignment (select 2-3 candidates)
- [ ] Test charts render with data
- [ ] Verify match scores calculated correctly

---

## Code Snippets for Quick Integration

### In backend/index.js:

```javascript
// Add these imports
import resumeUploadRoutes from './routes/resume-upload.js';
import { calculateMatchScoreWithCosineSimilarity } from './utils/cosineSimilarity.js';

// Add these after existing routes
app.use('/api/jobs', resumeUploadRoutes);
app.use('/uploads', express.static('uploads'));
```

### In backend/routes/applications.js (create application endpoint):

```javascript
// When creating an application, calculate match score
const { calculateMatchScoreWithCosineSimilarity } = await import('../utils/cosineSimilarity.js');

// Calculate score
const matchScore = calculateMatchScoreWithCosineSimilarity(
  job.description,
  resumeContent,
  job.skills
);

const application = await Application.create({
  jobId,
  candidateId,
  // ... other fields
  matchScore
});
```

### In frontend/src/App.jsx:

```jsx
// For charts dashboard
import RecruiterDashboardWithCharts from './componets/RecruiterDashboardWithCharts';

// For file upload apply
import ApplyJobWithFileUpload from './componets/ApplyJobWithFileUpload';

// Update routes:
<Route path="/jobs/:id" element={
  user?.role === 'recruiter' 
    ? <JobDetails /> 
    : <ApplyJobWithFileUpload />
} />
```

---

## API Endpoints Added

### Resume Upload
```
POST /api/jobs/upload-resume
- Body: FormData with 'file' field
- Returns: { success, resumeUrl, fileName, size }
```

### Read Resume Content
```
GET /api/jobs/resume-content/:filename
- Returns: { content: string }
```

---

## File Structure After Integration

```
backend/
├── utils/
│   ├── resumeAnalyzer.js (existing)
│   └── cosineSimilarity.js (NEW ⭐)
└── routes/
    ├── resume-upload.js (NEW ⭐)
    ├── applications.js (existing)
    └── tests.js (existing)

frontend/src/
└── componets/
    ├── RecruiterDashboard.jsx (existing)
    ├── RecruiterDashboardWithCharts.jsx (NEW ⭐)
    ├── ApplyJob.jsx (existing)
    └── ApplyJobWithFileUpload.jsx (NEW ⭐)

uploads/ (created by system)
└── resumes/ (auto-created)
```

---

## Testing the New Features

### Test 1: Cosine Similarity
```javascript
// In browser console or test file
import { calculateMatchScoreWithCosineSimilarity } from './backend/utils/cosineSimilarity.js';

const jobDesc = "Senior React developer with Node.js and MongoDB";
const resume = "Experienced in React, JavaScript, Node.js, MongoDB, REST APIs";
const skills = ["React", "Node.js", "MongoDB"];

const score = calculateMatchScoreWithCosineSimilarity(jobDesc, resume, skills);
console.log(score); // Should be high (80+)
```

### Test 2: File Upload
```bash
# Upload a resume file
curl -X POST http://localhost:5000/api/jobs/upload-resume \
  -F "file=@resume.pdf"
```

### Test 3: Batch Assignment
1. Login as recruiter
2. Go to dashboard charts
3. Select 3 candidates using checkboxes
4. Select a test
5. Click "Assign Test to Selected"
6. All 3 should get the test assigned

---

## Troubleshooting

### Issue: Multer not recognized
```bash
# Solution: Install multer
npm install multer
```

### Issue: Recharts not rendering
```bash
# Solution: Install recharts
npm install recharts
```

### Issue: File upload returns 400
- Check file size (max 5MB)
- Check file type (PDF, DOC, DOCX, TXT)
- Check `uploads/resumes` directory exists

### Issue: Match score always 0
- Ensure cosine similarity is imported
- Check job description and resume are strings
- Check job skills array is valid

---

## Performance Notes

1. **Cosine Similarity**: O(n²) where n = unique words. Cached when possible.
2. **File Upload**: Streams large files. 5MB limit prevents abuse.
3. **Batch Assignment**: Uses Promise.all for parallel processing.
4. **Charts**: Rendered with Recharts (optimized for React).

---

## Production Checklist

- [ ] Configure multer storage (cloud storage like S3 recommended)
- [ ] Add virus scanning for uploaded files
- [ ] Implement rate limiting for uploads
- [ ] Add CDN for resume file distribution
- [ ] Enable GZIP compression for charts
- [ ] Add caching for match score calculations
- [ ] Monitor file storage usage
- [ ] Setup cleanup job for old files

---

**All new features are ready to integrate! Follow the steps above for seamless integration.** ✅

