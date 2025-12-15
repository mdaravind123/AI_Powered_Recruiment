import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/useUserStore";
import { useNavigate } from "react-router-dom";

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DashboardAnalytics() {
  const { user } = useUserStore();
  const [analytics, setAnalytics] = useState([]);
  const navigate = useNavigate();

  const calculateAnalytics = async () => {
    try {
      const { data: jobs } = await axios.get(`${API_BASE_URL}/api/jobs`);
       const recruiterJobs = jobs.filter(job => job.recruiterId === user._id);
      const result = await Promise.all(
        recruiterJobs.map(async (job) => {
          const { data: candidates } = await axios.get(
            `${API_BASE_URL}/api/jobs/${job._id}/candidates`
          );

          const totalCandidates = candidates.length;
          const avgMatchScore =
            totalCandidates === 0
              ? 0
              : candidates.reduce((sum, c) => sum + c.matchScore, 0) /
                totalCandidates;

          const topCandidate =
            candidates.length > 0
              ? candidates.reduce((top, c) =>
                  c.matchScore > top.matchScore ? c : top
                )
              : null;

          return {
            _id: job._id,
            title: job.title,
            totalCandidates,
            avgMatchScore,
            topCandidate,
          };
        })
      );

      setAnalytics(result);
    } catch (err) {
      toast.error("Failed to load analytics");
    }
  };

  useEffect(() => {
    if (user.role === "recruiter") calculateAnalytics();
  }, [user.role]);

  if (user.role !== "recruiter") return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mt-6 mb-6">Dashboard Analytics</h2>
      <div className="grid gap-6">
        {analytics.map((job) => (
          <div
            key={job._id}
            onClick={() => navigate(`/jobs/${job._id}`)}
            className="border rounded-lg p-4 shadow bg-white hover:shadow-md transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
            <p className="text-gray-700 mb-1">
              <strong>Candidates Applied:</strong> {job.totalCandidates}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Average Match Score:</strong>{" "}
              {job.avgMatchScore.toFixed(2)}%
            </p>
            {job.topCandidate ? (
              <div className="text-sm mt-2 bg-gray-50 p-2 rounded">
                <p>
                  🏆 <strong>Top Candidate:</strong> {job.topCandidate.name} (
                  {job.topCandidate.matchScore}%)
                </p>
                <a
                  href={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(job.topCandidate.resumeUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Resume
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No candidates yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
