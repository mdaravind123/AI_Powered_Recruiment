import axios from 'axios';

/**
 * Utility functions for resume analysis and matching
 */

// Simple skill extraction from resume text
export const extractSkills = (resumeText) => {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL', 'Python', 'Java',
    'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux',
    'Next.js', 'Nuxt', 'Svelte', 'WebPack', 'Vite', 'Jest', 'Mocha', 'Cypress',
    'Selenium', 'JIRA', 'Agile', 'Scrum', 'CI/CD', 'Linux', 'Windows', 'MacOS'
  ];

  const foundSkills = commonSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );

  return [...new Set(foundSkills)]; // Remove duplicates
};

// Calculate match score based on skills
export const calculateMatchScore = (requiredSkills, candidateSkills) => {
  if (requiredSkills.length === 0) return 100;

  const requiredLower = requiredSkills.map(s => s.toLowerCase());
  const candidateLower = candidateSkills.map(s => s.toLowerCase());

  const matches = requiredLower.filter(skill =>
    candidateLower.some(cSkill =>
      cSkill.includes(skill) || skill.includes(cSkill)
    )
  ).length;

  return Math.round((matches / requiredSkills.length) * 100);
};

// Extract years of experience from resume
export const extractExperience = (resumeText) => {
  const experiencePattern = /(\d+)\+?\s*(?:years|yrs)\s*(?:of\s+)?experience/gi;
  const matches = resumeText.match(experiencePattern);

  if (matches && matches.length > 0) {
    const years = parseInt(matches[0].match(/\d+/)[0]);
    return years;
  }
  return 0;
};

// Generate resume summary
export const generateResumeSummary = (resumeText) => {
  // Simple summary generation - in production, use AI/NLP
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  const summary = lines.slice(0, 3).join(' ').substring(0, 200);
  return summary || 'Resume content provided';
};

// Analyze resume and return structured data
export const analyzeResume = (resumeText) => {
  return {
    skills: extractSkills(resumeText),
    experience: extractExperience(resumeText),
    summary: generateResumeSummary(resumeText),
    lastUpdated: new Date()
  };
};

export default {
  extractSkills,
  calculateMatchScore,
  extractExperience,
  generateResumeSummary,
  analyzeResume
};
