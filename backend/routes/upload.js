import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import axios from 'axios';
import { pipeline } from '@xenova/transformers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import dotenv from 'dotenv';
import stringSimilarity from 'string-similarity';

dotenv.config();

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'resumes',
    allowed_formats: ['pdf'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage });

let embedder;
(async () => {
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
})();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB || 1);
}

async function getEmbedding(text) {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return output.data;
}

async function summarizeResume(text) {
  const prompt = `Summarize this resume in 3-4 lines. Focus on key technical skills, work experience, and education:\n\n${text}`;
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

async function extractSkills(text) {
  const prompt = `From the following resume text, extract only the technical skills (like programming languages, tools, frameworks). Return them as a comma-separated list:\n\n${text}`;
  const result = await geminiModel.generateContent(prompt);
  const raw = result.response.text();
  return Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
}

function fuzzySkillMatch(required, found) {
  return found.filter(resumeSkill =>
    required.some(jobSkill =>
      stringSimilarity.compareTwoStrings(resumeSkill.toLowerCase(), jobSkill.toLowerCase()) > 0.8
    )
  );
}

router.post('/:id/upload', upload.single('resume'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { name, email } = req.body;
    const fileUrl = req.file.path;

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const resumeBuffer = Buffer.from(response.data);
    const resumeText = (await pdf(resumeBuffer)).text;

    const job = await Job.findById(jobId);
    const jobText = `${job.title}. ${job.description}. Required skills: ${job.skills.join(', ')}`;

    const [jobVector, resumeVector, skillsExtracted, summary] = await Promise.all([
      getEmbedding(jobText),
      getEmbedding(resumeText),
      extractSkills(resumeText),
      summarizeResume(resumeText)
    ]);

    const rawSimilarity = cosineSimilarity(jobVector, resumeVector);
    const matchedSkills = fuzzySkillMatch(job.skills, skillsExtracted);
    const skillScore = matchedSkills.length / job.skills.length;

    const matchScore = Math.round(((rawSimilarity * 0.6) + (skillScore * 0.4)) * 100);

    const candidate = await Candidate.create({
      name,
      email,
      matchScore,
      summary,
      skills: skillsExtracted,
      jobId,
      resumeUrl: fileUrl,
    });

    res.json(candidate);
  } catch (err) {
    console.error('Resume upload failed:', err.message);
    res.status(500).json({ message: 'Resume upload failed' });
  }
});

export default router;
