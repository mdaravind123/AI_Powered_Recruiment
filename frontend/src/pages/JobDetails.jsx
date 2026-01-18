// src/pages/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";
import { useUserStore } from "../store/useUserStore";
import CandidateCard from "../componets/CandidateCard";
import SkillBadgeList from "../componets/SkillBadgeList";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("desc");
  const { user } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`/api/jobs/${id}`);
      setJob(data.job);
    } catch (err) {
      toast.error("Failed to load job details");
    }
  };

  const fetchCandidates = async () => {
    try {
      // Fetch applications for this job
      const { data } = await axios.get(`/api/applications/job/${id}`);
      // Sort based on user preference
      const sorted = sort === 'asc' 
        ? data.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0))
        : data.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setCandidates(sorted);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      toast.error("Failed to load candidates");
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("name", name);
      formData.append("email", email);
      await axios.post(`/api/jobs/${id}/upload`, formData);
      toast.success("Resume uploaded successfully");
      
      fetchCandidates();
      setName("");
      setEmail("");
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-refresh candidates every 5 seconds for recruiters
  useEffect(() => {
    if (user?.role === 'recruiter') {
      fetchJob();
      fetchCandidates();
      
      const interval = setInterval(() => {
        fetchCandidates();
      }, 5000); // Auto-refresh every 5 seconds

      return () => clearInterval(interval);
    } else {
      fetchJob();
      fetchCandidates();
    }
  }, [id, sort, user]);

  // Filter candidates based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCandidates(candidates);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCandidates(
        candidates.filter(c => 
          c.candidateName.toLowerCase().includes(query) ||
          c.candidateEmail.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, candidates]);

  const alreadyApplied = candidates.some((c) => c.candidateEmail === user.email);

  // Calculate analytics (only for active candidates, rejected are already filtered server-side)
  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    testsAssigned: candidates.filter(c => 
      c.status === 'test_assigned' || c.status === 'test_completed' || (c.testIds && c.testIds.length > 0)
    ).length,
    testsCompleted: candidates.filter(c => c.status === 'test_completed').length,
    avgMatchScore: candidates.length > 0 
      ? (candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / candidates.length).toFixed(2)
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Employee Apply Section */}
        {user.role === "employee" && (
          <div className="mb-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-3xl font-black text-white">{job?.title}</h2>
              <p className="text-blue-100 mt-2">{job?.description}</p>
            </div>

            {job?.status === 'closed' ? (
              <div className="p-8">
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    <div>
                      <h3 className="font-bold text-lg text-red-700">Applications Closed</h3>
                      <p className="text-red-600">This job is no longer accepting applications</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : !alreadyApplied ? (
              <div className="p-8 space-y-6">
                <div>
                  <SkillBadgeList skills={job?.skills} />
                </div>
                <form className="space-y-4" onSubmit={handleUpload}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Upload Resume</label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 font-extrabold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx"
                      required
                    />
                  </div>
                  <button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    type="submit"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ClipLoader size={20} color="#fff" />
                    ) : (
                      "Apply for Job"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-8">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <div>
                      <h3 className="font-bold text-lg text-green-700">Already Applied</h3>
                      <p className="text-green-600">You have already applied for this job</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recruiter Job Management Section */}
        {user.role === "recruiter" && job && (
          <div className="space-y-8">
            {/* Header with Job Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-blue-600">
              <h1 className="text-4xl font-black text-gray-800 mb-3">{job.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{job.description}</p>
              <SkillBadgeList skills={job.skills} />
              <div className="mt-4 flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full font-bold text-white ${
                  job.status === 'open' 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}>
                  {job.status === 'open' ? 'Open for Applications' : 'Closed'}
                </span>
              </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-600 shadow-md">
                <p className="text-gray-600 text-sm font-semibold">Total Applicants</p>
                <p className="text-4xl font-black text-blue-600 mt-2">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-600 shadow-md">
                <p className="text-gray-600 text-sm font-semibold">Shortlisted</p>
                <p className="text-4xl font-black text-green-600 mt-2">{stats.shortlisted}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-l-4 border-purple-600 shadow-md">
                <p className="text-gray-600 text-sm font-semibold">Tests Assigned</p>
                <p className="text-4xl font-black text-purple-600 mt-2">{stats.testsAssigned}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-l-4 border-orange-600 shadow-md">
                <p className="text-gray-600 text-sm font-semibold">Tests Completed</p>
                <p className="text-4xl font-black text-orange-600 mt-2">{stats.testsCompleted}</p>
              </div>
            </div>

            {/* Average Match Score */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600">
              <p className="text-gray-600 font-semibold">Average Match Score</p>
              <p className="text-5xl font-black text-indigo-600 mt-2">{stats.avgMatchScore}%</p>
            </div>

            {/* Candidates Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-black text-white">Candidates List</h2>
                <p className="text-blue-100">Real-time applicants (auto-updating)</p>
              </div>

              <div className="p-8 space-y-6">
                {/* Search and Sort Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by candidate name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all min-w-[200px]"
                  >
                    <option value="desc">Highest Match First</option>
                    <option value="asc">Lowest Match First</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600 font-semibold">
                  Showing {filteredCandidates.length} of {candidates.length} candidates
                </div>

                {/* Candidates List */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <ClipLoader color="#2563eb" size={40} />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600">
                      {searchQuery ? 'No candidates match your search' : 'No applications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCandidates.map((candidate) => (
                      <CandidateCard key={candidate._id} candidate={candidate} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

