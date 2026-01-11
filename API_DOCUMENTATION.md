# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Routes (`/auth`)

### Register User
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "candidate" | "recruiter"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "userId": "60d5ec49c1234567890abcde"
}
```

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate"
  }
}
```

### Logout
**POST** `/auth/logout`

---

## Job Routes (`/jobs`)

### Get All Jobs
**GET** `/jobs`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: "open", "closed"

Response:
```json
{
  "jobs": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "title": "Senior Developer",
      "description": "We are looking for...",
      "company": "Tech Corp",
      "salary": 120000,
      "location": "Remote",
      "requirements": ["JavaScript", "React", "Node.js"],
      "status": "open",
      "postedBy": "60d5ec49c1234567890abcd00",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "pages": 3
}
```

### Get Single Job
**GET** `/jobs/:jobId`

Response: Single job object with all details

### Create Job (Recruiter only)
**POST** `/jobs`

Request:
```json
{
  "title": "Senior Developer",
  "description": "We are looking for...",
  "company": "Tech Corp",
  "salary": 120000,
  "location": "Remote",
  "requirements": ["JavaScript", "React", "Node.js"],
  "testId": "60d5ec49c1234567890abcde" // Optional
}
```

### Update Job
**PUT** `/jobs/:jobId`

Same fields as create

### Delete Job
**DELETE** `/jobs/:jobId`

---

## Resume Upload Routes (`/resumes`) ⭐ NEW

### Upload & Process Resume
**POST** `/resumes/upload-and-process`

Request:
```
Content-Type: multipart/form-data
Body:
  file: <PDF/DOC/DOCX/TXT file, max 5MB>
```

Response:
```json
{
  "resumeUrl": "https://cloudinary.com/res/image/upload/...",
  "fileName": "JohnDoe_Resume.pdf",
  "size": 245632,
  "analysis": {
    "summary": "Experienced full-stack developer with 5 years of expertise...",
    "skills": ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
    "experience": 5,
    "education": [
      "BS Computer Science - State University, 2019"
    ],
    "workExperience": [
      "Senior Developer at Tech Corp (2022-Present)",
      "Full Stack Developer at StartupXYZ (2020-2022)"
    ],
    "email": "john@example.com",
    "phone": "+1-234-567-8900"
  }
}
```

### Upload Only
**POST** `/resumes/upload`

Request:
```
Content-Type: multipart/form-data
Body:
  file: <resume file>
```

Response:
```json
{
  "resumeUrl": "https://cloudinary.com/...",
  "fileName": "resume.pdf",
  "size": 245632
}
```

### Analyze Resume
**POST** `/resumes/analyze`

Request:
```json
{
  "resumeUrl": "https://cloudinary.com/res/image/upload/...",
  "mimeType": "application/pdf"
}
```

Response:
```json
{
  "analysis": { /* same as above */ }
}
```

---

## Application Routes (`/applications`)

### Get All Applications
**GET** `/applications`

Query:
- `status`: "pending", "reviewed", "accepted", "rejected"
- `jobId`: Filter by job
- `candidateId`: Filter by candidate

Response:
```json
{
  "applications": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "candidateId": "60d5ec49c1234567890abcd01",
      "jobId": "60d5ec49c1234567890abcd02",
      "resumeUrl": "https://cloudinary.com/...",
      "resumeAnalysis": {
        "summary": "...",
        "skills": ["JavaScript", "React"],
        "experience": 5,
        "education": ["BS Computer Science"],
        "email": "john@example.com",
        "phone": "+1-234-567-8900"
      },
      "matchScore": 85,
      "status": "pending",
      "appliedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Single Application
**GET** `/applications/:applicationId`

### Submit Application
**POST** `/applications`

Request:
```json
{
  "candidateId": "60d5ec49c1234567890abcd01",
  "jobId": "60d5ec49c1234567890abcd02",
  "resumeUrl": "https://cloudinary.com/...",
  "resumeAnalysis": {
    "summary": "...",
    "skills": ["JavaScript"],
    "experience": 5,
    "education": ["BS CS"],
    "email": "john@example.com",
    "phone": "+1-234-567-8900"
  }
}
```

If `resumeAnalysis` is missing but `resumeUrl` is a Cloudinary URL, backend will automatically extract and analyze it using Gemini API.

### Update Application Status
**PUT** `/applications/:applicationId`

Request:
```json
{
  "status": "accepted" | "rejected" | "reviewed"
}
```

---

## Test Routes (`/tests`)

### Create Test (Recruiter)
**POST** `/tests`

Request:
```json
{
  "title": "JavaScript Fundamentals",
  "description": "Test basic JavaScript knowledge",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "What is JavaScript?",
      "options": ["A scripting language", "A database", "A server"],
      "correctAnswer": 0,
      "points": 10
    },
    {
      "type": "coding",
      "question": "Write a function that returns sum of two numbers",
      "language": "javascript",
      "defaultLanguage": "javascript",
      "allowedLanguages": ["javascript", "python"],
      "points": 25,
      "testCases": [
        {
          "input": "2 3",
          "expectedOutput": "5",
          "isSample": true
        },
        {
          "input": "10 -5",
          "expectedOutput": "5",
          "isSample": false
        }
      ]
    }
  ]
}
```

### Get Test
**GET** `/tests/:testId`

**Important**: For candidates, response sanitizes:
- `correctAnswer` hidden
- Only `sampleTestCases` shown
- `testCases` with `isSample: false` are filtered out

**For recruiters**: Full test data visible

### Submit Test
**POST** `/tests/:testId/submit`

Request:
```json
{
  "candidateId": "60d5ec49c1234567890abcd01",
  "answers": [
    {
      "questionId": "60d5ec49c1234567890abcde",
      "type": "multiple-choice",
      "selectedOption": 0
    },
    {
      "questionId": "60d5ec49c1234567890abcdf",
      "type": "coding",
      "language": "python",
      "code": "def sum(a, b):\n  return a + b"
    }
  ]
}
```

Response:
```json
{
  "testResultId": "60d5ec49c1234567890abce0",
  "score": 28,
  "totalPoints": 35,
  "percentage": 80,
  "answers": [
    {
      "questionId": "...",
      "correct": true,
      "points": 10
    },
    {
      "questionId": "...",
      "correct": true,
      "language": "python",
      "passedCases": 2,
      "totalCases": 2,
      "points": 25
    }
  ]
}
```

---

## Code Execution Routes (`/code`)

### Execute Code
**POST** `/code/execute`

Request:
```json
{
  "language": "python" | "javascript" | "java" | "cpp",
  "code": "print('Hello')",
  "testCases": [
    {
      "input": "5",
      "expectedOutput": "Hello"
    }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "input": "5",
      "expectedOutput": "Hello",
      "stdout": "Hello",
      "stderr": "",
      "passed": true
    }
  ],
  "executionTime": "0.245s"
}
```

---

## Message Routes (`/messages`)

### Send Message
**POST** `/messages`

Request:
```json
{
  "senderId": "60d5ec49c1234567890abcd01",
  "receiverId": "60d5ec49c1234567890abcd02",
  "content": "Hello! I'm interested in the position."
}
```

### Get Conversation
**GET** `/messages/conversation/:userId`

Returns all messages with a specific user

### Get All Messages
**GET** `/messages`

Returns all messages for authenticated user

---

## Interview Routes (`/interviews`)

### Schedule Interview
**POST** `/interviews`

Request:
```json
{
  "candidateId": "60d5ec49c1234567890abcd01",
  "jobId": "60d5ec49c1234567890abcd02",
  "scheduledTime": "2024-02-15T10:00:00Z",
  "meetingLink": "https://zoom.us/meeting/..."
}
```

### Get Interviews
**GET** `/interviews`

Query:
- `status`: "scheduled", "completed", "cancelled"

### Update Interview
**PUT** `/interviews/:interviewId`

Request:
```json
{
  "status": "completed" | "cancelled",
  "notes": "Good communication skills",
  "rating": 4.5
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "details": "Resume file is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Please login first"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Server Error",
  "message": "Something went wrong"
}
```

---

## Authentication

All endpoints (except auth) require authentication via:
- JWT token in cookies (automatically sent with requests)
- Or Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Pagination

Endpoints supporting pagination use:
- `page`: Page number (1-indexed)
- `limit`: Items per page
- Response includes: `total`, `pages`, `currentPage`

---

## File Upload Limits

| Format | Max Size | Supported |
|--------|----------|-----------|
| PDF    | 5 MB     | ✅        |
| DOCX   | 5 MB     | ✅        |
| DOC    | 5 MB     | ✅        |
| TXT    | 5 MB     | ✅        |

---

## Rate Limiting

- Resume uploads: 10 per minute per user
- Test submissions: 1 per test per user
- Messages: 50 per minute per user

---

## Webhooks (Future)

Reserved for:
- Application status changes
- Interview reminders
- Test result notifications

---

## API Status

Current version: **v1.0**

Last updated: **2024-01-15**

For issues, contact: **support@airecruiter.com**
