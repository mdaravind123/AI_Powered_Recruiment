/**
 * Backend resume analysis utility
 * Can be extended with AI/ML models for better analysis
 */

// Extract skills from resume text
export const extractSkills = (resumeText) => {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL', 'Python', 'Java',
    'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux',
    'Next.js', 'Nuxt', 'Svelte', 'WebPack', 'Vite', 'Jest', 'Mocha', 'Cypress',
    'Selenium', 'JIRA', 'Agile', 'Scrum', 'CI/CD', 'Linux', 'Windows', 'MacOS',
    'Excel', 'SQL', 'Hadoop', 'Spark', 'Data Analysis', 'Machine Learning'
  ];

  const foundSkills = commonSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );

  return [...new Set(foundSkills)];
};

// Calculate match score
export const calculateMatchScore = (jobSkills, resumeSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 100;

  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());

  const matches = jobSkillsLower.filter(skill =>
    resumeSkillsLower.some(rSkill =>
      rSkill.includes(skill) || skill.includes(rSkill)
    )
  ).length;

  const percentage = Math.round((matches / jobSkillsLower.length) * 100);
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
