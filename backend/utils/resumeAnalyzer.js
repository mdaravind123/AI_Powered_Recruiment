/**
 * Backend resume analysis utility
 * Can be extended with AI/ML models for better analysis
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

// Extract skills from resume text with better matching
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

  return [...new Set(foundSkills)];
};

// Calculate match score with improved logic
export const calculateMatchScore = (jobSkills, resumeSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 100;
  if (!resumeSkills || resumeSkills.length === 0) return 0;

  // Normalize all skills
  const normalizedJobSkills = jobSkills
    .map(s => normalizeSkill(s))
    .filter(Boolean);
  
  const normalizedResumeSkills = resumeSkills
    .map(s => normalizeSkill(s))
    .filter(Boolean);

  if (normalizedJobSkills.length === 0) return 100;
  if (normalizedResumeSkills.length === 0) return 0;

  // Count exact matches
  const matches = normalizedJobSkills.filter(jobSkill =>
    normalizedResumeSkills.includes(jobSkill)
  ).length;

  // Calculate percentage based on required skills
  const percentage = Math.round((matches / normalizedJobSkills.length) * 100);
  return Math.min(percentage, 100);
};

// Extract years of experience
export const extractExperience = (resumeText) => {
  const patterns = [
    /(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:professional\s+)?experience/gi,
    /experience:\s*(\d+)\+?\s*(?:years|yrs)/gi,
    /(\d+)\+?\s*(?:years|yrs)\s+in\s+(?:the\s+)?industry/gi
  ];

  for (let pattern of patterns) {
    const match = resumeText.match(pattern);
    if (match) {
      const years = parseInt(match[0].match(/\d+/)[0]);
      return years;
    }
  }
  return 0;
};

// Generate resume summary
export const generateResumeSummary = (resumeText) => {
  const lines = resumeText
    .split('\n')
    .filter(line => line.trim().length > 10)
    .slice(0, 5);

  return lines.join(' ').substring(0, 250) + '...';
};

// Comprehensive resume analysis
export const analyzeResume = (resumeText, jobSkills = []) => {
  const skills = extractSkills(resumeText);
  const matchScore = calculateMatchScore(jobSkills, skills);
  const experience = extractExperience(resumeText);
  const summary = generateResumeSummary(resumeText);

  return {
    skills,
    matchScore,
    experience,
    summary,
    analyzedAt: new Date()
  };
};

// Rank candidates based on match score
export const rankCandidates = (candidates) => {
  return candidates.sort((a, b) => b.matchScore - a.matchScore);
};

export default {
  extractSkills,
  calculateMatchScore,
  extractExperience,
  generateResumeSummary,
  analyzeResume,
  rankCandidates
};
