/**
 * Advanced Resume Analysis with Cosine Similarity
 * Compares job description with resume content using TF-IDF and cosine similarity
 */

// Calculate TF (Term Frequency)
const calculateTF = (text) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf = {};
  
  words.forEach(word => {
    // Skip common words
    const commonWords = ['the', 'a', 'is', 'at', 'which', 'on', 'and', 'or', 'in', 'to', 'for', 'of', 'by', 'with'];
    if (!commonWords.includes(word)) {
      tf[word] = (tf[word] || 0) + 1;
    }
  });

  // Normalize TF
  const totalWords = Object.values(tf).reduce((a, b) => a + b, 0);
  Object.keys(tf).forEach(word => {
    tf[word] = tf[word] / totalWords;
  });

  return tf;
};

// Calculate IDF (Inverse Document Frequency)
const calculateIDF = (documents) => {
  const idf = {};
  const totalDocs = documents.length;

  documents.forEach(doc => {
    const words = new Set(doc.toLowerCase().match(/\b\w+\b/g) || []);
    words.forEach(word => {
      idf[word] = (idf[word] || 0) + 1;
    });
  });

  Object.keys(idf).forEach(word => {
    idf[word] = Math.log(totalDocs / idf[word]);
  });

  return idf;
};

// Calculate TF-IDF vector
const calculateTFIDF = (tf, idf) => {
  const vector = {};
  Object.keys(tf).forEach(word => {
    vector[word] = tf[word] * (idf[word] || 0);
  });
  return vector;
};

// Cosine Similarity
const cosineSimilarity = (vec1, vec2) => {
  const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach(word => {
    const val1 = vec1[word] || 0;
    const val2 = vec2[word] || 0;
    
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return (dotProduct / (magnitude1 * magnitude2)) * 100;
};

// Calculate match score using cosine similarity
export const calculateMatchScoreWithCosineSimilarity = (jobDescription, resumeContent, jobSkills = []) => {
  try {
    // Ensure inputs are strings
    const jobDesc = String(jobDescription || '').toLowerCase();
    const resumeText = String(resumeContent || '').toLowerCase();

    if (!jobDesc || !resumeText) {
      return 0;
    }

    // Method 1: Cosine Similarity
    const idf = calculateIDF([jobDesc, resumeText]);
    const tf1 = calculateTF(jobDesc);
    const tf2 = calculateTF(resumeText);
    
    const vector1 = calculateTFIDF(tf1, idf);
    const vector2 = calculateTFIDF(tf2, idf);
    
    const cosineSim = cosineSimilarity(vector1, vector2);

    // Method 2: Skill-based matching
    let skillMatch = 100;
    if (jobSkills && jobSkills.length > 0) {
      const commonSkills = ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes'];
      const resumeSkillsInText = commonSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
      const jobSkillsMatched = jobSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
      
      skillMatch = jobSkills.length > 0 
        ? Math.round((jobSkillsMatched.length / jobSkills.length) * 100)
        : 100;
    }

    // Combine both methods (weighted average)
    const finalScore = Math.round((cosineSim * 0.6) + (skillMatch * 0.4));
    
    return Math.min(finalScore, 100);
  } catch (err) {
    console.error('Error calculating match score:', err);
    return 0;
  }
};

// Extract text from resume file (if it's a URL or readable text)
export const extractResumeText = async (resumeFile) => {
  try {
    if (typeof resumeFile === 'string') {
      // If it's a URL or text content
      return resumeFile;
    }
    
    // If it's a File object, read it
    if (resumeFile instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(resumeFile);
      });
    }
    
    return '';
  } catch (err) {
    console.error('Error extracting resume text:', err);
    return '';
  }
};

// Main analysis function with cosine similarity
export const analyzeResumeAdvanced = (resumeText, jobDescription, jobSkills = []) => {
  const matchScore = calculateMatchScoreWithCosineSimilarity(jobDescription, resumeText, jobSkills);
  
  return {
    matchScore,
    similarity: matchScore,
    lastUpdated: new Date()
  };
};

export default {
  calculateTF,
  calculateIDF,
  calculateTFIDF,
  cosineSimilarity,
  calculateMatchScoreWithCosineSimilarity,
  extractResumeText,
  analyzeResumeAdvanced
};
