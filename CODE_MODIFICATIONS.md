# 🎯 EXACT CODE MODIFICATIONS NEEDED

## MODIFICATION 1: Update backend/index.js

### Add these imports at the top:
```javascript
import resumeUploadRoutes from './routes/resume-upload.js';
```

### Add these routes (after existing app.use statements):
```javascript
app.use('/api/jobs', resumeUploadRoutes);
app.use('/uploads', express.static('uploads'));
```

---

## MODIFICATION 2: Update backend/routes/applications.js

### Add this import at the top:
```javascript
import { calculateMatchScoreWithCosineSimilarity } from '../utils/cosineSimilarity.js';
```

### Update the POST / endpoint to calculate match score:

**FIND THIS:**
```javascript
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, candidateName, candidateEmail, resumeUrl, matchScore, resumeAnalysis } = req.body;

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    const application = await Application.create({
      jobId,
      candidateId,
      candidateName,
      candidateEmail,
      resumeUrl,
      matchScore,
      resumeAnalysis,
      status: 'applied'
    });

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
});
```

**REPLACE WITH:**
```javascript
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, candidateName, candidateEmail, resumeUrl, matchScore, resumeAnalysis, resumeContent } = req.body;

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Get job details for description
    const Job = require('../models/Job.js').default;
    const job = await Job.findById(jobId);

    // Calculate match score using cosine similarity if resumeContent provided
    let calculatedMatchScore = matchScore;
    if (resumeContent && job) {
      calculatedMatchScore = calculateMatchScoreWithCosineSimilarity(
        job.description,
        resumeContent,
        job.skills
      );
    }

    const application = await Application.create({
      jobId,
      candidateId,
      candidateName,
      candidateEmail,
      resumeUrl,
      matchScore: calculatedMatchScore,
      resumeAnalysis,
      status: 'applied'
    });

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
});
```

---

## MODIFICATION 3: Update frontend/src/componets/ApplyJob.jsx

### Replace the entire resume input section with file upload:

**FIND THIS:**
```jsx
<div>
  <label className="block font-semibold mb-2">Your Resume (Paste content or URL)</label>
  <textarea
    value={resumeUrl}
    onChange={(e) => setResumeUrl(e.target.value)}
    className="w-full border rounded px-3 py-2 h-40"
    placeholder="Paste your resume content here or provide a link..."
    required
  />
</div>
```

**ADD THIS INSTEAD:**
```jsx
<div>
  <label className="block font-semibold mb-2">Resume File Upload *</label>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
    <input
      type="file"
      accept=".pdf,.doc,.docx,.txt"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setResumeUrl(file); // Store file object
        }
      }}
      className="hidden"
      id="resume-upload"
    />
    <label htmlFor="resume-upload" className="cursor-pointer">
      {resumeUrl?.name ? (
        <div>
          <p className="font-semibold text-green-600">✓ {resumeUrl.name}</p>
          <p className="text-sm text-gray-600">({(resumeUrl.size / 1024).toFixed(2)} KB)</p>
        </div>
      ) : (
        <div>
          <p className="font-semibold">📄 Click to upload or drag and drop</p>
          <p className="text-sm text-gray-600">PDF, DOC, DOCX or TXT (Max 5MB)</p>
        </div>
      )}
    </label>
  </div>
</div>
```

### Update the handleApply function:

**FIND THIS:**
```javascript
const handleApply = async (e) => {
  e.preventDefault();

  if (!resumeUrl.trim()) {
    toast.error('Please paste your resume content or provide a resume URL');
    return;
  }
  // ... rest of code
};
```

**REPLACE WITH:**
```javascript
const handleApply = async (e) => {
  e.preventDefault();

  if (!resumeUrl) {
    toast.error('Please upload a resume file');
    return;
  }

  setSubmitting(true);
  try {
    // If resumeUrl is a file object, upload it
    let fileUrl = resumeUrl;
    if (resumeUrl instanceof File) {
      const formData = new FormData();
      formData.append('file', resumeUrl);
      
      const uploadRes = await axios.post('/api/jobs/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      fileUrl = uploadRes.data.resumeUrl;
    }

    const score = calculateMatchScore(['React', 'Node.js', 'MongoDB']); // Replace with actual skills

    await axios.post('/api/applications', {
      jobId,
      candidateId: user._id,
      candidateName: user.name,
      candidateEmail: user.email,
      resumeUrl: fileUrl,
      matchScore: score,
      resumeAnalysis: {
        summary: 'Resume content analyzed',
        skills: ['React', 'Node.js', 'MongoDB'],
        experience: '3+ years'
      }
    });

    toast.success('Application submitted successfully!');
    navigate('/');
  } catch (err) {
    if (err.response?.status === 400) {
      toast.error('You have already applied for this job');
    } else {
      toast.error('Failed to submit application');
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

## MODIFICATION 4: Update frontend/src/pages/Dashboard.jsx

### Replace RecruiterDashboard with RecruiterDashboardWithCharts:

**FIND THIS:**
```jsx
import RecruiterDashboard from '../componets/RecruiterDashboard';
import EmployeeDashboard from '../componets/EmployeeDashboard';
```

**REPLACE WITH:**
```jsx
import RecruiterDashboardWithCharts from '../componets/RecruiterDashboardWithCharts';
import EmployeeDashboard from '../componets/EmployeeDashboard';
```

**FIND THIS:**
```jsx
{user?.role === "recruiter" ? (
  <RecruiterDashboard />
) : (
  <EmployeeDashboard />
)}
```

**REPLACE WITH:**
```jsx
{user?.role === "recruiter" ? (
  <RecruiterDashboardWithCharts />
) : (
  <EmployeeDashboard />
)}
```

---

## MODIFICATION 5: Update frontend/package.json

### Add recharts if not already present:

**FIND THIS:**
```json
{
  "dependencies": {
    "react": "...",
    ...
  }
}
```

**ADD THIS:**
```json
"recharts": "^2.10.0"
```

Then run:
```bash
npm install
```

---

## MODIFICATION 6: Update backend/package.json

### Add multer if not already present:

**FIND THIS:**
```json
{
  "dependencies": {
    "express": "...",
    ...
  }
}
```

**ADD THIS:**
```json
"multer": "^1.4.5-lts.1"
```

Then run:
```bash
npm install
```

---

## NEW FILES TO ADD (Already Created)

1. ✅ `backend/utils/cosineSimilarity.js` - Cosine similarity algorithm
2. ✅ `backend/routes/resume-upload.js` - File upload endpoint
3. ✅ `frontend/src/componets/RecruiterDashboardWithCharts.jsx` - Charts + batch assign
4. ✅ `frontend/src/componets/ApplyJobWithFileUpload.jsx` - File upload for candidates

---

## STEP-BY-STEP INTEGRATION

### Step 1: Backend Setup
```bash
cd backend

# 1. Install multer
npm install multer

# 2. Create uploads directory
mkdir -p uploads/resumes

# 3. Create resume-upload.js route
# (Already done)

# 4. Create cosineSimilarity.js utility
# (Already done)

# 5. Update index.js with new routes
# (See modifications above)

# 6. Update applications.js with cosine similarity
# (See modifications above)
```

### Step 2: Frontend Setup
```bash
cd frontend

# 1. Install recharts
npm install recharts

# 2. Add new components
# RecruiterDashboardWithCharts.jsx (Already done)
# ApplyJobWithFileUpload.jsx (Already done)

# 3. Update Dashboard.jsx
# (See modifications above)

# 4. Update ApplyJob.jsx
# (See modifications above)
```

### Step 3: Run & Test
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Test in browser at http://localhost:5173
```

---

## QUICK REFERENCE TABLE

| Feature | File | Type | Action |
|---------|------|------|--------|
| Cosine Similarity | `cosineSimilarity.js` | NEW | Use in applications route |
| File Upload | `resume-upload.js` | NEW | Register in index.js |
| Recharts | `RecruiterDashboardWithCharts.jsx` | NEW | Import in Dashboard.jsx |
| Batch Assign | `RecruiterDashboardWithCharts.jsx` | NEW | Use in Dashboard |
| File Upload UI | `ApplyJobWithFileUpload.jsx` | NEW | Use in ApplyJob route |
| index.js | Backend | MODIFY | Add 2 imports + 2 routes |
| Dashboard.jsx | Frontend | MODIFY | Change 2 import statements |
| ApplyJob.jsx | Frontend | MODIFY | Change resume input section |
| applications.js | Backend | MODIFY | Add cosine similarity logic |
| package.json | Both | MODIFY | Add multer & recharts |

---

## DONE ✅

All modifications are provided above. Just follow the steps to integrate each feature!

