import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import ChatWindow from './ChatWindow';
import SkillDistribution from './SkillDistribution';

export default function RecruiterDashboard() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [selectedTestResults, setSelectedTestResults] = useState(null);
  const [selectedTestName, setSelectedTestName] = useState('');
  const [openChatApp, setOpenChatApp] = useState(null);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkTestId, setBulkTestId] = useState('');
  const [topNCandidates, setTopNCandidates] = useState(5);
  const userId = user?._id;
  const location = useLocation(); // Track navigation changes

  useEffect(() => {
    if (userId) {
      fetchJobs();
    }
  }, [userId, location.pathname]); // Re-fetch on navigation

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

  const handleViewTestResults = async (testId, testName) => {
    try {
      const { data } = await axios.get(`/api/tests/${testId}/results`);
      setSelectedTestResults(data);
      setSelectedTestName(testName);
    } catch (err) {
      toast.error('Failed to fetch test results');
    }
  };

  const handleBulkAssignTest = async () => {
    if (!bulkTestId) {
      toast.error('Please select a test');
      return;
    }
    if (topNCandidates < 1 || topNCandidates > applications.length) {
      toast.error(`Please enter a number between 1 and ${applications.length}`);
      return;
    }

    try {
      const { data } = await axios.post('/api/applications/bulk-assign-test', {
        jobId: selectedJob,
        testId: bulkTestId,
        topN: topNCandidates
      });
      
      toast.success(`Test assigned to top ${topNCandidates} candidates!`);
      setShowBulkAssign(false);
      setBulkTestId('');
      setTopNCandidates(5);
      fetchApplications(selectedJob);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assign test');
    }
  };

  const handleToggleJobStatus = async () => {
    try {
      const newStatus = currentJob.status === 'open' ? 'closed' : 'open';
      const { data } = await axios.put(`/api/jobs/${selectedJob}/status`, { status: newStatus });
      
      const statusText = newStatus === 'open' ? 'reopened' : 'closed';
      toast.success(`Job ${statusText} successfully!`);
      
      // Update jobs list
      setJobs(jobs.map(j => j._id === selectedJob ? data : j));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update job status');
    }
  };

  const currentJob = jobs.find(j => j._id === selectedJob);
  
  // Calculate stats based on status for consistency
  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    testsAssigned: applications.filter(a => 
      a.status === 'test_assigned' || 
      a.status === 'test_completed' || 
      (a.testIds && a.testIds.length > 0)
    ).length,
    testsCompleted: applications.filter(a => a.status === 'test_completed').length
  };
  
  // Filter for specific stat displays (no longer needed as stats object is used)
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
      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Select Job to Manage</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <select
            value={selectedJob || ''}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="flex-1 min-w-[300px] border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title} - {job.status === 'open' ? '✓ Open' : '✕ Closed'} - {applications.filter(a => a.jobId === job._id).length} applications
              </option>
            ))}
          </select>
          {currentJob && (
            <div className={`px-4 py-2 rounded-full font-bold text-white ${
              currentJob.status === 'open' 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                : 'bg-gradient-to-r from-red-400 to-red-600'
            }`}>
              {currentJob.status === 'open' ? '🟢 Open' : '🔴 Closed'}
            </div>
          )}
        </div>
      </div>

      {/* Job Stats */}
      {currentJob && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <p className="text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
            <p className="text-gray-600">Shortlisted</p>
            <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
            <p className="text-gray-600">Tests Assigned</p>
            <p className="text-2xl font-bold text-purple-600">{stats.testsAssigned}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
            <p className="text-gray-600">Tests Completed</p>
            <p className="text-2xl font-bold text-orange-600">{stats.testsCompleted}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => navigate(`/create-test?jobId=${selectedJob}`)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
        >
          + Create Online Test
        </button>
        
        {tests.length > 0 && applications.length > 0 && (
          <button
            onClick={() => setShowBulkAssign(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            Bulk Assign Test
          </button>
        )}

        <button
          onClick={handleToggleJobStatus}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 text-white ${
            currentJob?.status === 'open' 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
          }`}
        >
          {currentJob?.status === 'open' ? 'Close Job' : 'Reopen Job'}
        </button>
      </div>

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
                  onClick={() => handleViewTestResults(test._id, test.testName)}
                  className="text-blue-600 font-semibold text-sm"
                >
                  View Results
                </button>
              </div>
            ))}
          </div>

          {/* Test Results Modal */}
          {selectedTestResults && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-gray-800">Test Results: {selectedTestName}</h3>
                  <button
                    onClick={() => setSelectedTestResults(null)}
                    className="text-2xl hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedTestResults.map(result => (
                    <div key={result._id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                      <div>
                        <p className="font-semibold text-gray-800">{result.candidateName}</p>
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
              </div>
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

      {/* Bulk Assign Test Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Bulk Assign Test</h2>
              <button onClick={() => setShowBulkAssign(false)} className="text-2xl hover:text-red-600">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Select Test</label>
                <select
                  value={bulkTestId}
                  onChange={(e) => setBulkTestId(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Choose a test...</option>
                  {tests.map(test => (
                    <option key={test._id} value={test._id}>
                      {test.testName} ({test.totalQuestions} questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Number of Top Candidates (by Match Score)
                </label>
                <input
                  type="number"
                  value={topNCandidates}
                  onChange={(e) => setTopNCandidates(Number(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  min="1"
                  max={applications.length}
                  placeholder="e.g., 5"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Total candidates: {applications.length}
                </p>
              </div>

              {topNCandidates > 0 && topNCandidates <= applications.length && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="font-semibold text-blue-800 mb-2">Preview: Top {topNCandidates} Candidates</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {applications
                      .sort((a, b) => b.matchScore - a.matchScore)
                      .slice(0, topNCandidates)
                      .map((app, idx) => (
                        <div key={app._id} className="text-sm text-gray-700 flex justify-between">
                          <span>{idx + 1}. {app.candidateName}</span>
                          <span className="font-semibold text-blue-600">{app.matchScore}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssignTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Assign to Top {topNCandidates}
              </button>
            </div>
          </div>
        </div>
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
