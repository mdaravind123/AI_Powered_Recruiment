import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ApplyJobWithFileUpload() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/jobs`);
      setJobs(data);
    } catch (err) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
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

    // Read file preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setResumePreview(text.substring(0, 500) + '...'); // Show first 500 chars
    };
    reader.readAsText(file);
  };

  const uploadResumeFile = async () => {
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/jobs/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data.resumeUrl;
    } catch (err) {
      toast.error('Failed to upload resume');
      throw err;
    }
  };

  const handleApply = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    if (!resumeFile) {
      toast.error('Please upload a resume file');
      return;
    }

    setSubmitting(true);
    try {
      // Upload resume file
      const resumeUrl = await uploadResumeFile();

      // Create application
      await axios.post(`${API_BASE_URL}/api/applications`, {
        jobId: selectedJob._id,
        candidateId: user._id,
        candidateName: user.name,
        candidateEmail: user.email,
        resumeUrl,
        // Placeholder - match score will be calculated by backend
        matchScore: 0,
        resumeAnalysis: {
          summary: 'Resume uploaded and will be analyzed',
          skills: [],
          experience: 'Pending analysis'
        }
      });

      toast.success('Application submitted! Resume uploaded successfully');
      setResumeFile(null);
      setResumePreview('');
      setSelectedJob(null);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('You have already applied for this job');
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading jobs...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Apply for Jobs</h1>
        <p className="text-blue-100">Upload your resume and apply to positions</p>
      </div>

      {/* Job Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Select a Job</h2>
        <div className="space-y-2">
          {jobs.map(job => (
            <label
              key={job._id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedJob?._id === job._id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="job"
                value={job._id}
                checked={selectedJob?._id === job._id}
                onChange={() => setSelectedJob(job)}
                className="mr-3"
              />
              <div className="inline-block">
                <p className="font-bold">{job.title}</p>
                <p className="text-sm text-gray-600">{job.description}</p>
                <div className="flex gap-2 mt-2">
                  {job.skills?.map((skill, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Resume Upload */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Upload Your Resume</h2>
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Resume File *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
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
        </div>

        {/* Resume Preview */}
        {resumePreview && (
          <div className="mb-4">
            <p className="font-semibold mb-2">Resume Preview:</p>
            <div className="bg-gray-50 p-4 rounded border max-h-40 overflow-y-auto text-sm">
              <p>{resumePreview}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={submitting || !selectedJob || !resumeFile}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
}
