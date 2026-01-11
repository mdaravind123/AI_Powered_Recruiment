import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import { analyzeResume, calculateMatchScore } from '../utils/resumeAnalyzer';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ApplyJob() {
  const { id: jobId } = useParams();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [matchScore, setMatchScore] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useFileUpload, setUseFileUpload] = useState(false);

  useEffect(() => {
    fetchJob();
    checkApplication();
  }, [jobId, user._id]);

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`/api/jobs/${jobId}`);
      setJob(data.job);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch job');
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      const { data } = await axios.get(`/api/applications/candidate/${user._id}`);
      const hasApplied = data.some(app => app.jobId === jobId);
      setAlreadyApplied(hasApplied);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeChange = (e) => {
    const content = e.target.value;
    setResumeUrl(content);
    setResumeAnalysis(null);

    // Analyze resume in real-time using client-side utility
    if (content.trim() && job) {
      const analysis = analyzeResume(content);
      const score = calculateMatchScore(job.skills, analysis.skills);
      setMatchScore(score);
      setResumeAnalysis(analysis);
    }
  };

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setResumeFile(file);
    setUploadProgress(0);
  };

  const uploadAndProcessResume = async () => {
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const response = await axios.post(`${API_BASE_URL}/api/resumes/upload-and-process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { resumeUrl: cloudUrl, analysis } = response.data;
      setResumeUrl(cloudUrl);
      setResumeAnalysis(analysis);

      // Calculate match score
      if (job && analysis && analysis.skills) {
        const score = calculateMatchScore(job.skills, analysis.skills);
        setMatchScore(score);
      }

      toast.success('Resume uploaded and analyzed successfully');
      return { url: cloudUrl, analysis }; // Return both URL and analysis
    } catch (err) {
      console.error('Resume upload error:', err);
      toast.error('Failed to upload and process resume');
      return null;
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (useFileUpload) {
      if (!resumeFile) {
        toast.error('Please select a resume file');
        return;
      }
    } else {
      if (!resumeUrl.trim()) {
        toast.error('Please paste your resume content');
        return;
      }
    }

    if (alreadyApplied) {
      toast.error('You have already applied for this job');
      return;
    }

    setSubmitting(true);
    try {
      let finalResumeUrl = resumeUrl;
      let finalAnalysis = resumeAnalysis;

      // If using file upload mode and haven't uploaded yet
      if (useFileUpload) {
        if (!resumeUrl) {
          const uploadResult = await uploadAndProcessResume();
          if (!uploadResult) {
            setSubmitting(false);
            return;
          }
          finalResumeUrl = uploadResult.url;
          finalAnalysis = uploadResult.analysis; // Use returned analysis directly
        }
      } else {
        // Text paste mode - analyze the pasted text
        if (!finalAnalysis) {
          finalAnalysis = analyzeResume(finalResumeUrl);
        }
      }

      // Ensure finalAnalysis has required structure
      if (!finalAnalysis || typeof finalAnalysis !== 'object') {
        toast.error('Failed to analyze resume. Please try again.');
        setSubmitting(false);
        return;
      }

      // Ensure skills array exists
      const analysisSkills = Array.isArray(finalAnalysis.skills) ? finalAnalysis.skills : [];
      const jobSkills = Array.isArray(job?.skills) ? job.skills : [];

      const score = calculateMatchScore(jobSkills, analysisSkills);

      const applicationData = {
        jobId,
        candidateId: user._id,
        candidateName: user.name,
        candidateEmail: user.email,
        resumeUrl: finalResumeUrl,
        matchScore: score,
        resumeAnalysis: {
          summary: finalAnalysis.summary || 'N/A',
          skills: analysisSkills,
          experience: finalAnalysis.experience ? `${finalAnalysis.experience}+ years` : '0+ years',
          education: finalAnalysis.education || [],
          email: finalAnalysis.email || user.email,
          phone: finalAnalysis.phone || ''
        }
      };

      console.log('Submitting application:', applicationData);
      
      await axios.post(`${API_BASE_URL}/api/applications`, applicationData);

      toast.success(`Application submitted! Match Score: ${score}%`);
      
      // Force reload by adding a timestamp or navigate with state
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('You have already applied for this job');
      } else {
        console.error(err);
        toast.error('Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading job...</div>;
  if (!job) return <div className="text-center py-8">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <p className="text-gray-600 mb-4">{job.description}</p>
        <div className="mb-4">
          <p className="font-semibold mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill, idx) => (
              <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {alreadyApplied && (
        <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg mb-6">
          <p className="text-blue-900 font-semibold">✓ You have already applied for this job</p>
          <p className="text-blue-700 text-sm">Check your dashboard to view the application status and any assigned tests.</p>
        </div>
      )}

      {!alreadyApplied && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Apply for this Job</h2>

          {/* Toggle between upload and paste */}
          <div className="mb-6 flex gap-4 border-b pb-4">
            <button
              onClick={() => {
                setUseFileUpload(false);
                setResumeFile(null);
                setUploadProgress(0);
              }}
              className={`px-4 py-2 rounded font-semibold ${
                !useFileUpload
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Paste Resume Text
            </button>
            <button
              onClick={() => {
                setUseFileUpload(true);
                setResumeUrl('');
                setResumeAnalysis(null);
              }}
              className={`px-4 py-2 rounded font-semibold ${
                useFileUpload
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload Resume File
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            {!useFileUpload ? (
              // Text paste mode
              <div>
                <label className="block font-semibold mb-2">Your Resume Content</label>
                <textarea
                  value={resumeUrl}
                  onChange={handleResumeChange}
                  className="w-full border rounded px-3 py-2 h-40"
                  placeholder="Paste your resume content here..."
                  required
                />
              </div>
            ) : (
              // File upload mode
              <div>
                <label className="block font-semibold mb-3">Upload Your Resume File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeFileSelect}
                    className="hidden"
                    id="resume-file-input"
                  />
                  <label htmlFor="resume-file-input" className="cursor-pointer">
                    {resumeFile ? (
                      <div>
                        <p className="font-semibold text-green-600">✓ {resumeFile.name}</p>
                        <p className="text-sm text-gray-600">({(resumeFile.size / 1024).toFixed(2)} KB)</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">📄 Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-600">PDF, DOC, DOCX or TXT (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">Uploading: {uploadProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {matchScore > 0 && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">AI Match Score:</span>
                  <span
                    className={`text-lg font-bold ${
                      matchScore >= 80
                        ? 'text-green-600'
                        : matchScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {matchScore}%
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      matchScore >= 80
                        ? 'bg-green-500'
                        : matchScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${matchScore}%` }}
                  />
                </div>
              </div>
            )}

            {resumeAnalysis && (
              <div className="p-3 bg-green-50 rounded border border-green-200 text-sm">
                <p className="font-semibold text-green-800 mb-2">Resume Analyzed</p>
                {resumeAnalysis.skills && resumeAnalysis.skills.length > 0 && (
                  <p className="text-green-700">Skills detected: {resumeAnalysis.skills.slice(0, 5).join(', ')}{resumeAnalysis.skills.length > 5 ? '...' : ''}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || alreadyApplied}
              className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Apply Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
