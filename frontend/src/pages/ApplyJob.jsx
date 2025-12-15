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
  const [resumeUrl, setResumeUrl] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

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

    // Analyze resume in real-time
    if (content.trim() && job) {
      const analysis = analyzeResume(content);
      const score = calculateMatchScore(job.skills, analysis.skills);
      setMatchScore(score);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!resumeUrl.trim()) {
      toast.error('Please paste your resume content or provide a resume URL');
      return;
    }

    if (alreadyApplied) {
      toast.error('You have already applied for this job');
      return;
    }

    setSubmitting(true);
    try {
      const analysis = analyzeResume(resumeUrl);
      const score = calculateMatchScore(job.skills, analysis.skills);

      await axios.post(`${API_BASE_URL}/api/applications`, {
        jobId,
        candidateId: user._id,
        candidateName: user.name,
        candidateEmail: user.email,
        resumeUrl,
        matchScore: score,
        resumeAnalysis: {
          summary: analysis.summary,
          skills: analysis.skills,
          experience: `${analysis.experience}+ years`
        }
      });

      toast.success(`Application submitted! Match Score: ${score}%`);
      navigate('/');
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
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Your Resume (Paste content or URL)</label>
              <textarea
                value={resumeUrl}
                onChange={handleResumeChange}
                className="w-full border rounded px-3 py-2 h-40"
                placeholder="Paste your resume content here or provide a link..."
                required
              />
              {matchScore > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">AI Match Score:</span>
                    <span className={`text-lg font-bold ${
                      matchScore >= 80 ? 'text-green-600' :
                      matchScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {matchScore}%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        matchScore >= 80 ? 'bg-green-500' :
                        matchScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

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
