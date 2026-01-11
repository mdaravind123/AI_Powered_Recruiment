# AI Recruiter App - Setup & Getting Started Guide

## Project Structure

```
Ai-Recruiter-App-main/
├── backend/                 # Node.js/Express API
│   ├── index.js            # Main server
│   ├── package.json        # Dependencies
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   └── utils/              # Helper functions
├── frontend/               # React application
│   ├── vite.config.js
│   ├── package.json
│   └── src/
└── README.md              # Main documentation
```

## Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB instance (local or cloud)
- Cloudinary account (free tier OK)
- Google Gemini API key

## Environment Configuration

### Backend (.env in root directory)

Create a `.env` file in the `backend` folder:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-recruiter
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-recruiter

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini API (for resume analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Email (optional, for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server Port
PORT=5000
```

### Frontend (.env in frontend directory)

Create `.env` in `frontend` folder:

```env
VITE_API_URL=http://localhost:5000
```

## Installation Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Getting API Keys

### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API key"
3. Create new API key
4. Copy and paste into `.env` as `GEMINI_API_KEY`

### Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Paste into `.env`

### MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community
# Start MongoDB service
mongo
# Connection string: mongodb://localhost:27017/ai-recruiter
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Add to `.env` as `MONGODB_URI`

### JWT Secret

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Models Overview

### User
- Email, password (hashed), name, role (candidate/recruiter)

### Job
- Title, description, requirements, salary, company
- Posted by recruiter

### Application
- Candidate applies to job
- Resume analysis, match score, status

### Test
- Recruiter creates tests with questions
- Supports multiple choice and coding questions

### TestResult
- Candidate submission with answers and score

### Interview
- Scheduling between recruiter and candidate

### Message
- Chat between recruiter and candidate

## Key Features

### For Candidates

1. **Job Browsing**
   - Search and filter jobs
   - View job details

2. **Job Application**
   - Upload resume (PDF/DOC/DOCX)
   - OR paste resume text
   - AI match scoring

3. **Testing**
   - Take online tests
   - Coding problems with multiple language support
   - Real-time execution feedback

4. **Interviews**
   - Schedule interviews
   - Messaging with recruiter

### For Recruiters

1. **Job Management**
   - Create and publish jobs
   - View applications
   - Track applicants

2. **Testing System**
   - Create tests with questions
   - Support for coding questions with test cases
   - Auto-grading of submissions

3. **Candidate Management**
   - View extracted resume data
   - Match scoring
   - Interview scheduling
   - Messaging

4. **Analytics Dashboard**
   - Applications statistics
   - Test performance metrics
   - Skill distribution

## Common Issues & Solutions

### "Cannot find module '@google/generative-ai'"
```bash
cd backend
npm install @google/generative-ai
```

### "Cloudinary upload failed"
- Check `CLOUDINARY_CLOUD_NAME` in `.env`
- Verify API key and secret
- Ensure folder permission in Cloudinary dashboard

### "Gemini API error: 401"
- Verify `GEMINI_API_KEY` is correct
- Check API key has proper permissions

### MongoDB Connection Error
- If local: Ensure MongoDB service is running (`mongod`)
- If Atlas: Check connection string and whitelist IP

### Frontend "Cannot GET /"
- Backend must be running on port 5000
- Check `VITE_API_URL` in frontend `.env`

### Port Already in Use
```bash
# Find and kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

## Testing Workflow

### Test Application End-to-End

1. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Create Test Data**
   - Recruiter signup
   - Create a job
   - Create a test with questions
   - Publish job

3. **Apply as Candidate**
   - Candidate signup
   - Browse jobs
   - Upload resume or paste text
   - Apply to job
   - Verify match score

4. **Complete Test**
   - Take online test
   - Submit answers
   - View score

5. **Check Database**
   ```bash
   mongo
   use ai-recruiter
   db.applications.findOne()  # View application with resume analysis
   ```

## Monitoring & Debugging

### Backend Logging

Check console output for:
- "Resume extracted via Gemini"
- "File uploaded to Cloudinary"
- "Code execution completed"

### Frontend Console

Open browser DevTools (F12) to see:
- API request/response logs
- Component rendering errors
- Network requests

### Database Inspection

```bash
mongo
use ai-recruiter
db.applications.find().pretty()      # View all applications
db.tests.find().pretty()             # View all tests
db.users.find().pretty()             # View all users
```

## Performance Tips

1. **Use MongoDB Indexes**
   ```javascript
   db.applications.createIndex({ candidateId: 1, createdAt: -1 })
   db.jobs.createIndex({ status: 1, createdAt: -1 })
   ```

2. **Cloudinary Configuration**
   - Use eager transforms for resumes (optional)
   - Configure responsive images for frontend

3. **Caching**
   - Frontend caches job listings
   - Backend caches user roles

## Deployment

### Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Procfile** (in root)
   ```
   web: cd backend && npm start
   ```

3. **Deploy**
   ```bash
   heroku create your-app-name
   heroku config:set MONGODB_URI=...
   heroku config:set GEMINI_API_KEY=...
   # ... set other env vars
   git push heroku main
   ```

### Docker Deployment

See Docker documentation for containerization setup.

## Security Considerations

- Always use HTTPS in production
- Rotate JWT secret regularly
- Use environment variables for all secrets
- Implement rate limiting on APIs
- Validate all user inputs
- Enable CORS only for known domains

## Support & Contributing

For issues or questions, check:
1. Backend logs for errors
2. MongoDB connection
3. API credentials in `.env`
4. Frontend network tab in DevTools

## Next Steps

1. Complete setup following this guide
2. Read [RESUME_UPLOAD_FEATURE.md](./RESUME_UPLOAD_FEATURE.md) for new features
3. Test end-to-end workflow
4. Customize for your needs
5. Deploy to production

Happy recruiting! 🚀
