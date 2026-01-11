# Resume Upload & Gemini AI Extraction Feature

## Overview

The application now supports candidate resume uploads with automatic content extraction and analysis using Google Gemini API. This feature eliminates the need for manual resume text input while maintaining backward compatibility.

## Key Features

### Candidate Side (ApplyJob)
- **Dual Input Mode**: Toggle between text paste and file upload
- **File Upload Support**: PDF, DOC, DOCX, and TXT files
- **Automatic Analysis**: Gemini API extracts skills, experience, education, and contact info
- **Real-time Matching**: AI match score calculated immediately after upload
- **Progress Tracking**: Visual upload progress indicator

### Recruiter Side
- **Structured Resume Data**: Received resume analysis includes:
  - Professional summary
  - Extracted skills
  - Years of experience
  - Education details
  - Work experience
  - Contact information (email, phone)
- **Match Scoring**: Automatic skill matching against job requirements
- **Resume Viewing**: Cloudinary-hosted resume accessible as a link

### Backend Processing
- **Cloudinary Integration**: All uploads stored in Cloudinary
- **Automatic Extraction**: Gemini API parses resume files
- **Fallback Logic**: Graceful degradation if Gemini processing fails
- **Backward Compatibility**: Supports both manual text and file uploads

## Architecture

### New API Endpoints

```
POST /api/resumes/upload-and-process
- Uploads file to Cloudinary
- Extracts text using pdf-parse (PDF) or basic extraction (DOC/DOCX)
- Analyzes with Gemini API
- Returns: { resumeUrl, analysis }

POST /api/resumes/upload
- Upload only (no processing)
- Backward compatibility

POST /api/resumes/analyze
- Analyze resume from existing Cloudinary URL
- Useful for reprocessing
```

### Data Flow

```
Candidate Upload
    ↓
Frontend (ApplyJob.jsx) - File selection & validation
    ↓
Backend (POST /api/resumes/upload-and-process)
    ↓
Cloudinary - File storage
    ↓
File Buffer → Text Extraction (pdf-parse, basic DOC parsing)
    ↓
Gemini API - Structured analysis
    ↓
Resume Analysis Object
    ↓
Application Creation (POST /api/applications)
    ↓
Database - Stored with resumeAnalysis field
```

## Installation & Setup

### Backend Requirements

1. **Install dependencies**:
```bash
npm install @google/generative-ai pdf-parse cloudinary multer-storage-cloudinary
```

2. **Environment Variables** (`.env`):
```
GEMINI_API_KEY=your_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Key files created/modified**:
- `backend/utils/resumeExtractor.js` - Core extraction & analysis
- `backend/routes/resumes.js` - New API endpoints
- `backend/routes/applications.js` - Updated to call resumeExtractor
- `backend/index.js` - Register routes

### Frontend Changes

Files modified:
- `frontend/src/pages/ApplyJob.jsx` - Dual upload/paste mode
- `frontend/src/componets/ApplyJobWithFileUpload.jsx` - Updated to use new API

## Usage Examples

### For Candidates

**Option 1: Upload Resume File**
1. Click "Upload Resume File" tab
2. Select PDF/DOC/DOCX/TXT file (max 5MB)
3. File is uploaded to Cloudinary & analyzed by Gemini
4. Match score displays immediately
5. Click "Apply Now"

**Option 2: Paste Resume Text (Legacy)**
1. Click "Paste Resume Text" tab
2. Paste resume content
3. Local analysis for match score preview
4. Click "Apply Now"

### For Recruiters

View applications with:
- `resumeAnalysis.summary` - AI-extracted professional summary
- `resumeAnalysis.skills` - Array of detected technical skills
- `resumeAnalysis.experience` - Years of experience as number
- `resumeAnalysis.education` - Education details
- `resumeAnalysis.email` - Extracted email
- `resumeAnalysis.phone` - Extracted phone number
- `resumeUrl` - Cloudinary link to actual resume file

## Gemini API Prompt Design

The system uses this structured prompt:
```
Analyze the following resume and extract:
- summary: 2-3 sentence professional summary
- skills: Array of technical and professional skills
- experience_years: Total years of experience
- education: Array of education details
- work_experience: Array of job titles and companies
- email: Email address if found
- phone: Phone number if found

Return ONLY valid JSON.
```

## Error Handling

### Graceful Degradation
- If Gemini API fails: System uses basic text extraction
- If file upload fails: User can retry or switch to text mode
- If Cloudinary is unavailable: Returns error with fallback guidance

### Validation
- Frontend: File type, size (max 5MB)
- Backend: Mime type validation, file structure verification

## Backward Compatibility

### Existing Flows Preserved
1. **Text Paste Mode**: Still fully supported in ApplyJob.jsx
2. **Application Schema**: resumeAnalysis field optional (backward compatible)
3. **Resume Retrieval**: resumeUrl always available whether file or text

### Migration Path
- Old applications with text resumes continue to work
- New applications can use file uploads
- No database schema changes required

## Performance Considerations

### Optimization Strategies
1. **Async Processing**: Gemini calls don't block upload response
2. **Cloudinary CDN**: Resume files served from global CDN
3. **Caching**: Resume analysis cached in Application document
4. **Fallback**: Fast fallback if Gemini unavailable

### Limits
- Max file size: 5MB
- Max skills extracted: ~50 (Gemini output)
- API timeout: 30 seconds (configurable)

## Security Measures

1. **File Validation**:
   - MIME type checking (PDF, DOCX, etc.)
   - File size limits (5MB)
   - Cloudinary virus scanning

2. **Data Privacy**:
   - Files stored in Cloudinary (HTTPS)
   - No personal data logged
   - Extraction happens server-side

3. **Input Sanitization**:
   - File names sanitized by Cloudinary
   - Gemini API input validated
   - XSS protection via React escaping

## Troubleshooting

### "Failed to upload and process resume"
- Check Gemini API key in `.env`
- Verify Cloudinary credentials
- Ensure file is valid PDF/DOC/DOCX

### "Resume analysis failed - using fallback extraction"
- Gemini API might be rate-limited or unavailable
- Fallback extraction will still work
- Check Gemini API quota

### File upload stuck
- Verify network connectivity
- Check file size (must be < 5MB)
- Try switching to text mode

## Future Enhancements

1. **Advanced Parsing**:
   - Support for more file formats (.odt, .rtf)
   - Better DOCX parsing with `mammoth` or `docx-parser`

2. **UI/UX**:
   - Resume preview before upload
   - Extracted data preview & edit
   - Bulk candidate analysis

3. **Analysis Features**:
   - Resume scoring by job fit
   - Keyword matching visualization
   - ATS (Applicant Tracking System) score

4. **Integrations**:
   - LinkedIn profile import
   - Integration with AI models for job recommendations

## Code Examples

### Using the Resume Extractor (Backend)

```javascript
import { processResumeFromUrl } from './utils/resumeExtractor.js';

// Extract from Cloudinary URL
const analysis = await processResumeFromUrl(
  'https://cloudinary.com/.../resume.pdf',
  'application/pdf'
);

console.log(analysis);
// {
//   summary: "...",
//   skills: ["JavaScript", "React", "Node.js"],
//   experience: 5,
//   education: ["BS Computer Science"],
//   email: "user@example.com",
//   phone: "+1-234-567-8900"
// }
```

### Uploading from Frontend

```javascript
const formData = new FormData();
formData.append('file', resumeFile);

const response = await axios.post(
  '/api/resumes/upload-and-process',
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);

const { resumeUrl, analysis } = response.data;
```

## Testing

### Manual Testing Checklist
- [ ] Upload PDF resume
- [ ] Upload DOCX resume
- [ ] Verify Gemini analysis displayed
- [ ] Check match score calculated
- [ ] Verify application created with analysis
- [ ] Test text paste mode still works
- [ ] Test file size limit (>5MB fails)
- [ ] Test invalid file type

### Integration Testing
- [ ] Resume accessible via resumeUrl
- [ ] Analysis fields properly stored in database
- [ ] Match scoring consistent between uploads and text
- [ ] Fallback works when Gemini unavailable

## Support & Issues

For issues or questions:
1. Check backend logs for Gemini API errors
2. Verify `.env` configuration
3. Review Cloudinary dashboard for uploads
4. Test with sample resumes first
