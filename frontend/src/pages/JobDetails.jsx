// src/pages/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";
import { useUserStore } from "../store/useUserStore";
import CandidateCard from "../componets/CandidateCard";
import AlreadyApplied from "../componets/AlreadyApplied";
import SkillBadgeList from "../componets/SkillBadgeList";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sort, setSort] = useState("desc");
  const { user } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);

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
      const { data } = await axios.get(
        `/api/jobs/${id}/candidates?sort=${sort}`
      );
      setCandidates(data);
    } catch (err) {
      toast.error("Failed to load candidates");
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    fetchCandidates();
  }, [sort, id, user.role]);

  const alreadyApplied = candidates.some((c) => c.email === user.email);

  const avgMatchScore =
    candidates.length === 0
      ? 0
      : candidates.reduce((sum, c) => sum + c.matchScore, 0) /
        candidates.length;

  const topCandidate =
    candidates.length > 0
      ? candidates.reduce((top, c) => (c.matchScore > top.matchScore ? c : top))
      : null;

  const aggregateSkills = (candidates) => {
    const skillMap = {};
    candidates.forEach((c) => {
      c.skills.forEach((skill) => {
        skillMap[skill] = (skillMap[skill] || 0) + 1;
      });
    });
    return Object.entries(skillMap).map(([skill, count]) => ({ skill, count }));
  };

  return (
    <div>
      {user.role === "employee" &&
        (!alreadyApplied ? (
          <>
            <h2 className="text-2xl font-bold mb-4">{job?.title}</h2>
            <p className="mb-4">{job?.description}</p>
            <SkillBadgeList skills={job?.skills} />
            <form className="mb-6 mt-3 flex flex-col" onSubmit={handleUpload}>
              <input
                type="text"
                className="w-4/12 border p-2 mb-2 text-base"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                className="w-4/12 border p-2 mb-2 text-base"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block m-3 w-full text-sm text-gray-500 font-extrabold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-400 hover:file:bg-green-100"
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  type="submit"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ClipLoader size={20} color="#fff" />
                  ) : (
                    "Upload Resume"
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <AlreadyApplied />
        ))}

      {user.role === "recruiter" && (
        <>
          <h2 className="text-2xl font-bold mb-4">{job?.title}</h2>
          <p className="mb-6">{job?.description}</p>
          <SkillBadgeList skills={job?.skills} />
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-bold mb-3">📈 Job Analytics</h3>
              <p>
                <strong>Total Candidates:</strong> {candidates.length}
              </p>
              <p>
                <strong>Average Match Score:</strong> {avgMatchScore.toFixed(2)}
                %
              </p>
              {topCandidate && (
                <p>
                  <strong>Top Candidate:</strong> {topCandidate.name} (
                  {topCandidate.matchScore}%)
                  <a
              href={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(topCandidate.resumeUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 ml-2 underline"
                  >
                    View Resume
                  </a>
                </p>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-bold mb-3">📊 Skill Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregateSkills(candidates)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 mb-4">
            <h3 className="text-xl font-semibold">Candidates</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="desc">Highest Match First</option>
              <option value="asc">Lowest Match First</option>
            </select>
          </div>
          <div className="space-y-3">
            {candidates.map((c) => (
              <CandidateCard key={c._id} candidate={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
