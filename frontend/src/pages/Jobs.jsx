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
    <div>
       {user.role === 'recruiter' && (
        <>
          <h2 className="text-xl font-bold mb-4">Post a Job</h2>
          <form className="mb-6" onSubmit={handlePostJob}>
            <input
              className="w-full border p-2 mb-2"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full border p-2 mb-2"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              className="w-full border p-2 mb-2"
              placeholder="Required Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">
              Post Job
            </button>
          </form>
        </>
      )}

      <h2 className="text-xl font-bold mb-4">
        {user.role === 'recruiter' ? 'Your Job Listings' : 'Available Jobs'}
      </h2>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Link
            to={`/jobs/${job._id}`}
            key={job._id}
            className="bg-white p-4 shadow rounded hover:bg-gray-50"
          >
            <h3 className="font-bold text-lg">{job.title}</h3>
            <p className="text-sm text-gray-700">{job.description}</p>
            <SkillBadgeList skills={job.skills} />
          </Link>
        ))}
      </div>
    </div>
  );
}
