import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {useUserStore} from '../store/useUserStore';
import SkillBadgeList from '../componets/SkillBadgeList';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const {user} = useUserStore();

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/jobs`, {
        title,
        description,
        skills: skills.split(',').map(s => s.trim()),
        recruiterId: user._id,
      });
      toast.success('Job posted successfully');
      fetchJobs();
       setTitle('');
      setDescription('');
      setSkills('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    }
  };

  const fetchJobs = async () => {
     try {
      let url = '/api/jobs';
      if (user.role === 'recruiter') {
        url += `?recruiterId=${user._id}`;
      }
      const { data } = await axios.get(url);
      setJobs(data);
    } catch (err) {
      toast.error('Failed to fetch jobs');
    }
  };
useEffect(() => {
    if (user?._id) fetchJobs();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {user.role === 'recruiter' && (
          <div className="mb-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-3xl font-black text-white">
                Post a New Job
              </h2>
              <p className="text-blue-100 mt-2 text-lg">Attract top talent by creating compelling job listings</p>
            </div>
            <form className="p-8 space-y-6" onSubmit={handlePostJob}>
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-lg">Job Title</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="e.g., Senior Full Stack Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-lg">Job Description</label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300 min-h-[150px]"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-lg">Required Skills</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="React, Node.js, MongoDB, TypeScript"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">Separate skills with commas</p>
              </div>
              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-black text-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]" 
                type="submit"
              >
                Post Job
              </button>
            </form>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-800 mb-3">
            {user.role === 'recruiter' ? 'Your Job Listings' : 'Find Your Dream Job'}
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            {user.role === 'recruiter' 
              ? `Manage and track your ${jobs.length} active job postings` 
              : `Browse ${jobs.length} exciting opportunities`}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job._id}
              className={`group bg-white p-6 shadow-lg rounded-2xl transition-all duration-300 border-2 hover:scale-[1.02] transform ${
                job.status === 'closed' 
                  ? 'border-red-300 hover:border-red-500 opacity-90' 
                  : 'border-transparent hover:border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className={`font-black text-2xl flex-1 transition-colors duration-300 ${
                  job.status === 'closed' ? 'text-gray-500' : 'text-gray-800 group-hover:text-blue-600'
                }`}>
                  {job.title}
                </h3>
                <div className="ml-4">
                  {job.status === 'open' ? (
                    <span className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm rounded-full shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold text-sm rounded-full shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Closed
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-base mb-4 line-clamp-2 leading-relaxed ${
                job.status === 'closed' ? 'text-gray-500' : 'text-gray-600'
              }`}>{job.description}</p>
              <SkillBadgeList skills={job.skills} />
              <div className="mt-4 pt-4 border-t border-gray-100">
                {user.role === 'recruiter' ? (
                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center gap-2 text-blue-600 font-bold text-lg group-hover:gap-4 transition-all duration-300"
                  >
                    Manage Job 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : job.status === 'closed' ? (
                  <div className="inline-flex items-center gap-2 text-red-600 font-bold text-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                    Applications Closed
                  </div>
                ) : (
                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center gap-2 text-blue-600 font-bold text-lg group-hover:gap-4 transition-all duration-300"
                  >
                    View & Apply 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <h3 className="text-3xl font-bold text-gray-700 mb-3">No Jobs Available</h3>
            <p className="text-xl text-gray-500">
              {user.role === 'recruiter' 
                ? 'Start by posting your first job above!' 
                : 'Check back soon for new opportunities'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
