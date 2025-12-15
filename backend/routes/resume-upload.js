import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed'));
    }
  }
});

// Resume file upload endpoint
router.post('/upload-resume', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    
    res.json({
      success: true,
      resumeUrl,
      fileName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload resume', error: err.message });
  }
});

// Read resume file content
router.get('/resume-content/:filename', (req, res) => {
  try {
    const filePath = path.join('uploads/resumes', req.params.filename);
    
    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.includes('uploads/resumes')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: 'Failed to read resume', error: err.message });
  }
});

export default router;
