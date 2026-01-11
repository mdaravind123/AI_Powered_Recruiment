import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Resume extraction and analysis using Gemini API
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Download file from Cloudinary URL as buffer
 */
async function downloadFile(url) {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid URL: Must start with http:// or https://, got: ${url}`);
    }
    
    console.log('Downloading file from:', url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });
    return response.data;
  } catch (err) {
    console.error('Error downloading file:', err.message);
    throw new Error(`Failed to download resume file: ${err.message}`);
  }
}

/**
 * Extract text from PDF using basic text extraction
 * For production, consider using a PDF library like pdf-parse or pdfjs
 */
async function extractTextFromPDF(buffer) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX file (basic extraction)
 */
async function extractTextFromDOCX(buffer) {
  try {
    // For a production solution, use libraries like docx-parser or mammoth
    // For now, return a basic placeholder - you'd implement actual extraction
    // This is a simplified version that extracts readable text from the buffer
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
    const cleaned = text.replace(/[^\x20-\x7E\n]/g, '');
    return cleaned || 'DOCX file content (requires proper parser)';
  } catch (err) {
    console.error('DOCX extraction error:', err.message);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract resume content from file buffer based on MIME type
 */
export async function extractResumeText(fileBuffer, mimeType) {
  if (mimeType === 'application/pdf') {
    return await extractTextFromPDF(fileBuffer);
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await extractTextFromDOCX(fileBuffer);
  } else if (mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Use Gemini API to structure and analyze extracted resume text
 */
export async function analyzeResumeWithGemini(resumeText) {
  try {
    // Use a widely available text model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze the following resume and extract structured information. Return a JSON object with the following fields:
- summary: A 2-3 sentence professional summary (string)
- skills: Array of technical and professional skills (array of strings)
- experience_years: Total years of experience as a number (number)
- education: Array of education details (array of strings with degree and institution)
- work_experience: Array of job titles and companies (array of strings)
- email: Email address if found (string or null)
- phone: Phone number if found (string or null)

Return ONLY valid JSON, no markdown or additional text.

Resume Content:
${resumeText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonString = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else if (responseText.includes('{')) {
      jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    }

    const parsed = JSON.parse(jsonString);

    return {
      summary: parsed.summary || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: typeof parsed.experience_years === 'number' ? parsed.experience_years : 0,
      education: Array.isArray(parsed.education) ? parsed.education : [],
      workExperience: Array.isArray(parsed.work_experience) ? parsed.work_experience : [],
      email: parsed.email || null,
      phone: parsed.phone || null,
      rawText: resumeText
    };
  } catch (err) {
    console.error('Gemini API analysis error:', err.message);
    // Fallback: basic extraction to avoid empty skills
    const commonSkills = [
      'JavaScript','TypeScript','React','Vue','Angular','Node.js','Express',
      'MongoDB','PostgreSQL','MySQL','Firebase','AWS','Azure','GCP',
      'Docker','Kubernetes','Git','REST API','GraphQL','Python','Java',
      'C++','C#','.NET','PHP','Laravel','Django','Flask','Spring Boot',
      'HTML','CSS','SCSS','Tailwind','Bootstrap','Material UI','Redux',
      'Next.js','Nuxt','Svelte','Webpack','Vite','Jest','Mocha','Cypress',
      'Selenium','JIRA','Agile','Scrum','CI/CD','Linux','Windows','MacOS'
    ];
    const lower = resumeText.toLowerCase();
    const skills = Array.from(new Set(commonSkills.filter(s => lower.includes(s.toLowerCase()))));
    const expMatch = resumeText.match(/(\d+)\+?\s*(?:years|yrs)\s*(?:of\s+)?experience/gi);
    const exp = expMatch && expMatch.length > 0 ? parseInt(expMatch[0].match(/\d+/)[0], 10) : 0;
    const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
    const summary = lines.slice(0, 3).join(' ').substring(0, 220) || 'Resume content provided';

    return {
      summary,
      skills,
      experience: isNaN(exp) ? 0 : exp,
      education: [],
      workExperience: [],
      email: null,
      phone: null,
      rawText: resumeText,
      error: 'Gemini analysis failed - used basic extraction'
    };
  }
}

/**
 * Full pipeline: download, extract, and analyze resume from Cloudinary URL
 */
export async function processResumeFromUrl(cloudinaryUrl, mimeType) {
  try {
    console.log('Processing resume from URL:', cloudinaryUrl, 'MIME:', mimeType);
    
    if (!cloudinaryUrl) {
      throw new Error('Cloudinary URL is required');
    }
    
    // Download file from Cloudinary
    const fileBuffer = await downloadFile(cloudinaryUrl);
    console.log('File downloaded, size:', fileBuffer.length);
    
    // Extract text content
    const resumeText = await extractResumeText(fileBuffer, mimeType);
    console.log('Text extracted, length:', resumeText.length);
    
    // Analyze with Gemini
    const analysis = await analyzeResumeWithGemini(resumeText);
    console.log('Resume analyzed successfully');
    
    return analysis;
  } catch (err) {
    console.error('Resume processing error:', err.message);
    console.error('Stack:', err.stack);
    throw err;
  }
}

/**
 * Process resume from local file path
 */
export async function processResumeFromFile(filePath, mimeType) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const resumeText = await extractResumeText(fileBuffer, mimeType);
    const analysis = await analyzeResumeWithGemini(resumeText);
    return analysis;
  } catch (err) {
    console.error('Local file processing error:', err.message);
    throw err;
  }
}

export default {
  extractResumeText,
  analyzeResumeWithGemini,
  processResumeFromUrl,
  processResumeFromFile,
  downloadFile
};
