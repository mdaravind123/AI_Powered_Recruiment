import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { processResumeFromUrl, processResumeFromFile } from '../utils/resumeExtractor.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'resumes',
      resource_type: 'raw', // Use 'raw' for PDFs and documents
      allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
      public_id: `resume_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`
    };
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed'));
    }
  }
});

/**
 * Upload resume to Cloudinary and process it
 * POST /api/resumes/upload-and-process
 * Body: multipart/form-data with 'file' field
 * Returns: { success, resumeUrl, analysis }
 */
router.post('/upload-and-process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Full req.file object:', JSON.stringify(req.file, null, 2));

    // Cloudinary storage provides these fields
    let cloudinaryUrl = req.file.path || req.file.secure_url || req.file.url;
    // Ensure we have a full HTTPS URL; if not, build from public_id
    if (!cloudinaryUrl || !/^https?:\/\//i.test(cloudinaryUrl)) {
      const publicId = req.file.filename || req.file.public_id || req.file.path;
      if (publicId) {
        cloudinaryUrl = cloudinary.url(publicId, { resource_type: 'raw', secure: true });
      }
    }
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;

    console.log('File uploaded to Cloudinary:', {
      url: cloudinaryUrl,
      mime: mimeType,
      name: originalName,
      size: req.file.size
    });

    // Validate Cloudinary URL
    if (!cloudinaryUrl || !cloudinaryUrl.startsWith('http')) {
      throw new Error('Invalid Cloudinary URL received');
    }

    // Process the resume (extract and analyze)
    let analysis;
    try {
      // Download and process from Cloudinary URL
      console.log('Starting resume processing...');
      analysis = await processResumeFromUrl(cloudinaryUrl, mimeType);
      console.log('Resume processing completed successfully');
      console.log('Analysis result:', {
        summary: analysis.summary?.substring(0, 50) + '...',
        skillsCount: analysis.skills?.length || 0,
        skills: analysis.skills?.slice(0, 5),
        experience: analysis.experience
      });
    } catch (err) {
      console.error('Resume processing error:', err.message);
      console.error('Error stack:', err.stack);
      // Return basic fallback with empty but valid structure
      analysis = {
        summary: 'Resume uploaded successfully',
        skills: [],
        experience: 0,
        education: [],
        workExperience: [],
        email: null,
        phone: null,
        error: 'Analysis pending'
      };
    }

    res.json({
      success: true,
      resumeUrl: cloudinaryUrl,
      fileName: originalName,
      size: req.file.size,
      analysis
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({
      message: 'Failed to upload and process resume',
      error: err.message
    });
  }
});

/**
 * Just upload resume to Cloudinary (no processing)
 * POST /api/resumes/upload
 * For backward compatibility
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      success: true,
      resumeUrl: req.file.secure_url,
      fileName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to upload resume',
      error: err.message
    });
  }
});

/**
 * Extract and analyze resume text from Cloudinary URL
 * POST /api/resumes/analyze
 * Body: { resumeUrl, mimeType }
 * Returns: { success, analysis }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { resumeUrl, mimeType } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'resumeUrl is required' });
    }

    const analysis = await processResumeFromUrl(resumeUrl, mimeType || 'application/pdf');

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({
      message: 'Failed to analyze resume',
      error: err.message
    });
  }
});

export default router;
