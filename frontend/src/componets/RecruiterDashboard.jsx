import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import CreateTest from './CreateTest';
import ChatWindow from './ChatWindow';
import SkillDistribution from './SkillDistribution';

export default function RecruiterDashboard() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [openChatApp, setOpenChatApp] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob);
      fetchTests(selectedJob);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(`/api/jobs?recruiterId=${user._id}`);
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to fetch jobs');
    }
  };

  const fetchApplications = async (jobId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/applications/job/${jobId}`);
      setApplications(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async (jobId) => {
    try {
      const { data } = await axios.get(`/api/tests/job/${jobId}`);
      setTests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShortlist = async (applicationId) => {
    try {
      await axios.put(`/api/applications/${applicationId}/shortlist`);
      toast.success('Candidate shortlisted!');
      fetchApplications(selectedJob);
    } catch (err) {
      toast.error('Failed to shortlist candidate');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await axios.put(`/api/applications/${applicationId}/reject`);
      toast.success('Candidate rejected');
      fetchApplications(selectedJob);
    } catch (err) {
      toast.error('Failed to reject candidate');
    }
  };

  const handleAssignTest = async (applicationId, testId) => {
    try {
      await axios.put(`/api/applications/${applicationId}/assign-test`, { testId });
      toast.success('Test assigned to candidate!');
      fetchApplications(selectedJob);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign test');
    }
  };

  const handleViewTestResults = async (testId) => {
    try {
      const { data } = await axios.get(`/api/tests/${testId}/results`);
      setTestResults(prev => ({
        ...prev,
        [testId]: data
      }));
    } catch (err) {
      toast.error('Failed to fetch test results');
    }
  };

  const currentJob = jobs.find(j => j._id === selectedJob);
  const shortlistedCandidates = applications.filter(a => a.status === 'shortlisted');
  const testedCandidates = applications.filter(a => a.status === 'test_completed');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-green-100">Manage candidates, create tests, and track progress</p>
      </div>

      {/* Job Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Select Job</h2>
        <select
          value={selectedJob || ''}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          {jobs.map(job => (
            <option key={job._id} value={job._id}>
              {job.title} - {applications.filter(a => a.jobId === job._id).length} applications
            </option>
          ))}
        </select>
      </div>

      {/* Job Stats */}
      {currentJob && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <p className="text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
            <p className="text-gray-600">Shortlisted</p>
            <p className="text-2xl font-bold text-green-600">{shortlistedCandidates.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
            <p className="text-gray-600">Tests Assigned</p>
            <p className="text-2xl font-bold text-purple-600">{applications.filter(a => a.testIds && a.testIds.length > 0).length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
            <p className="text-gray-600">Tests Completed</p>
            <p className="text-2xl font-bold text-orange-600">{testedCandidates.length}</p>
          </div>
        </div>
      )}

      {/* Create Test Button */}
      <button
        onClick={() => setShowCreateTest(true)}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
      >
        + Create Online Test
      </button>

      {/* Tests List */}
      {tests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Available Tests</h2>
          <div className="space-y-2">
            {tests.map(test => (
              <div key={test._id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <div>
                  <p className="font-semibold">{test.testName}</p>
                  <p className="text-sm text-gray-600">{test.totalQuestions} questions • {test.duration} mins</p>
                </div>
                <button
                  onClick={() => handleViewTestResults(test._id)}
                  className="text-blue-600 font-semibold text-sm"
                >
                  View Results
                </button>
              </div>
            ))}
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-bold text-lg">Test Results</h3>
              {Object.entries(testResults).map(([testId, results]) => (
                <div key={testId} className="max-h-48 overflow-y-auto border rounded p-4 bg-gray-50">
                  {results.map(result => (
                    <div key={result._id} className="flex justify-between items-center mb-2 pb-2 border-b">
                      <div>
                        <p className="font-semibold">{result.candidateName}</p>
                        <p className="text-sm text-gray-600">{result.candidateEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.totalScore}%
                        </p>
                        <p className="text-sm text-gray-600">{result.correctAnswers}/{result.totalQuestions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skill Distribution */}
      {applications.length > 0 && (
        <SkillDistribution applications={applications} />
      )}

      {/* Candidates List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Candidates (Sorted by Match Score)</h2>

        {loading ? (
          <p className="text-gray-600">Loading candidates...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-600">No applications yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Match Score</th>
                  <th className="text-left p-3">Skills</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Test</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.sort((a, b) => b.matchScore - a.matchScore).map(app => (
                  <tr key={app._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{app.candidateName}</td>
                    <td className="p-3 text-sm">{app.candidateEmail}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        app.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                        app.matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="p-3 text-sm">{app.resumeAnalysis?.skills?.join(', ') || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                        app.status === 'test_assigned' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'test_completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      {app.testIds && app.testIds.length > 0 ? (
                        <div className="space-y-1">
                          {app.testIds.map((testAssignment, idx) => (
                            <div key={idx} className="text-sm text-green-600 font-semibold">
                              {testAssignment.testId?.testName || 'Test'} ✓
                            </div>
                          ))}
                          <select
                            onChange={(e) => handleAssignTest(app._id, e.target.value)}
                            defaultValue=""
                            className="text-sm border rounded px-2 py-1 mt-2 w-full"
                          >
                            <option value="">+ Assign Another</option>
                            {tests.map(test => (
                              <option key={test._id} value={test._id}>
                                {test.testName}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleAssignTest(app._id, e.target.value)}
                          defaultValue=""
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="">Assign Test</option>
                          {tests.map(test => (
                            <option key={test._id} value={test._id}>
                              {test.testName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => setOpenChatApp(app)}
                        className="text-blue-600 font-semibold text-sm hover:underline"
                        title="Open chat"
                      >
                        💬 Chat
                      </button>
                      {app.status !== 'shortlisted' && app.status !== 'rejected' && (
                        <button
                          onClick={() => handleShortlist(app._id)}
                          className="text-green-600 font-semibold text-sm hover:underline"
                        >
                          Shortlist
                        </button>
                      )}
                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => handleReject(app._id)}
                          className="text-red-600 font-semibold text-sm hover:underline"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      {showCreateTest && (
        <CreateTest
          jobId={selectedJob}
          onTestCreated={() => {
            setShowCreateTest(false);
            fetchTests(selectedJob);
            toast.success('Test created successfully!');
          }}
          onCancel={() => setShowCreateTest(false)}
        />
      )}

      {/* Chat Window Modal */}
      {openChatApp && (
        <ChatWindow
          applicationId={openChatApp._id}
          jobId={openChatApp.jobId}
          jobTitle={currentJob?.title}
          candidateName={openChatApp.candidateName}
          candidateEmail={openChatApp.candidateEmail}
          candidateId={openChatApp.candidateId}
          recruiterId={user._id}
          recruiterName={user.name}
          companyName={import.meta.env.VITE_COMPANY_NAME || 'Company'}
          userRole="recruiter"
          onClose={() => setOpenChatApp(null)}
        />
      )}
    </div>
  );
}
