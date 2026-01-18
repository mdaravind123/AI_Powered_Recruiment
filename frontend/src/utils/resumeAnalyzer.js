import axios from 'axios';

/**
 * Utility functions for resume analysis and matching
 */

// Skill synonyms and normalizations
const skillSynonyms = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'py': 'Python',
  'nodejs': 'Node.js',
  'node': 'Node.js',
  'react.js': 'React',
  'reactjs': 'React',
  'vue.js': 'Vue',
  'vuejs': 'Vue',
  'angular.js': 'Angular',
  'angularjs': 'Angular',
  'express.js': 'Express',
  'expressjs': 'Express',
  'mongo': 'MongoDB',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'mariadb': 'MySQL',
  'firebase': 'Firebase',
  'aws': 'AWS',
  'amazon': 'AWS',
  'azure': 'Azure',
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'git': 'Git',
  'rest': 'REST API',
  'restful': 'REST API',
  'graphql': 'GraphQL',
  'java': 'Java',
  'cplusplus': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'dotnet': '.NET',
  'php': 'PHP',
  'laravel': 'Laravel',
  'django': 'Django',
  'flask': 'Flask',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'SCSS',
  'tailwind': 'Tailwind',
  'bootstrap': 'Bootstrap',
  'materialui': 'Material UI',
  'material-ui': 'Material UI',
  'redux': 'Redux',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'nuxtjs': 'Nuxt',
  'nuxt.js': 'Nuxt',
  'svelte': 'Svelte',
  'webpack': 'Webpack',
  'vite': 'Vite',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'cypress': 'Cypress',
  'selenium': 'Selenium',
  'jira': 'JIRA',
  'agile': 'Agile',
  'scrum': 'Scrum',
  'cicd': 'CI/CD',
  'ci/cd': 'CI/CD',
  'linux': 'Linux',
  'windows': 'Windows',
  'macos': 'MacOS',
  'excel': 'Excel',
  'sql': 'SQL',
  'hadoop': 'Hadoop',
  'spark': 'Spark',
  'data analysis': 'Data Analysis',
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence'
};

// Normalize skill name
const normalizeSkill = (skill) => {
  const trimmed = skill.trim();
  const lower = trimmed.toLowerCase();
  
  // Check if there's an exact synonym match
  if (skillSynonyms[lower]) {
    return skillSynonyms[lower];
  }
  
  // Return original with proper casing
  return trimmed;
};

// Simple skill extraction from resume text with better matching
export const extractSkills = (resumeText) => {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL', 'Python', 'Java',
    'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux',
    'Next.js', 'Nuxt', 'Svelte', 'Webpack', 'Vite', 'Jest', 'Mocha', 'Cypress',
    'Selenium', 'JIRA', 'Agile', 'Scrum', 'CI/CD', 'Linux', 'Windows', 'MacOS',
    'Excel', 'SQL', 'Hadoop', 'Spark', 'Data Analysis', 'Machine Learning',
    'Artificial Intelligence', 'API', 'Microservices', 'Cloud Computing'
  ];

  const textLower = resumeText.toLowerCase();
  const foundSkills = commonSkills.filter(skill =>
    textLower.includes(skill.toLowerCase())
  );

  return [...new Set(foundSkills)]; // Remove duplicates
};

// Calculate match score based on skills with improved logic
export const calculateMatchScore = (requiredSkills, candidateSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // Normalize all skills
  const normalizedRequired = requiredSkills
    .map(s => normalizeSkill(s))
    .filter(Boolean);
  
  const normalizedCandidate = candidateSkills
    .map(s => normalizeSkill(s))
    .filter(Boolean);

  if (normalizedRequired.length === 0) return 100;
  if (normalizedCandidate.length === 0) return 0;

  // Count exact matches
  const matches = normalizedRequired.filter(reqSkill =>
    normalizedCandidate.includes(reqSkill)
  ).length;

  // Calculate percentage based on required skills
  return Math.round((matches / normalizedRequired.length) * 100);
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
