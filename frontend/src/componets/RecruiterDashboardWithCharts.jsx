import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RecruiterDashboardWithCharts() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [batchTestId, setBatchTestId] = useState('');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob);
      fetchTests(selectedJob);
      generateChartData();
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

  const generateChartData = () => {
    // Generate sample chart data based on applications
    if (applications.length === 0) {
      setChartData([
        { name: 'Applied', count: 0 },
        { name: 'Shortlisted', count: 0 },
        { name: 'Tested', count: 0 },
        { name: 'Rejected', count: 0 }
      ]);
      return;
    }

    const data = [
      { name: 'Applied', count: applications.filter(a => a.status === 'applied').length },
      { name: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length },
      { name: 'Test Assigned', count: applications.filter(a => a.status === 'test_assigned').length },
      { name: 'Test Completed', count: applications.filter(a => a.status === 'test_completed').length },
      { name: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
    ];
    setChartData(data);
  };

  const handleSelectCandidate = (applicationId) => {
    const newSet = new Set(selectedCandidates);
    if (newSet.has(applicationId)) {
      newSet.delete(applicationId);
    } else {
      newSet.add(applicationId);
    }
    setSelectedCandidates(newSet);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === applications.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(applications.map(a => a._id)));
    }
  };

  const handleBatchAssignTest = async () => {
    if (selectedCandidates.size === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    if (!batchTestId) {
      toast.error('Please select a test');
      return;
    }

    try {
      const promises = Array.from(selectedCandidates).map(appId =>
        axios.put(`/api/applications/${appId}/assign-test`, { testId: batchTestId })
      );

      await Promise.all(promises);
      toast.success(`Test assigned to ${selectedCandidates.size} candidates!`);
      setSelectedCandidates(new Set());
      setBatchTestId('');
      fetchApplications(selectedJob);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign tests');
    }
  };

  const scoreDistribution = applications.reduce((acc, app) => {
    if (app.matchScore >= 80) acc['80-100']++;
    else if (app.matchScore >= 60) acc['60-80']++;
    else if (app.matchScore >= 40) acc['40-60']++;
    else acc['0-40']++;
    return acc;
  }, { '80-100': 0, '60-80': 0, '40-60': 0, '0-40': 0 });

  const scoreChartData = [
    { name: '80-100', value: scoreDistribution['80-100'] },
    { name: '60-80', value: scoreDistribution['60-80'] },
    { name: '40-60', value: scoreDistribution['40-60'] },
    { name: '0-40', value: scoreDistribution['0-40'] }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const currentJob = jobs.find(j => j._id === selectedJob);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Recruiter Analytics Dashboard</h1>
        <p className="text-green-100">Advanced analytics and batch operations</p>
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Application Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Match Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {scoreChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
          <p className="text-gray-600">Total Applications</p>
          <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
          <p className="text-gray-600">Shortlisted</p>
          <p className="text-2xl font-bold text-green-600">{applications.filter(a => a.status === 'shortlisted').length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
          <p className="text-gray-600">Tests Assigned</p>
          <p className="text-2xl font-bold text-purple-600">{applications.filter(a => a.testId).length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
          <p className="text-gray-600">Tests Completed</p>
          <p className="text-2xl font-bold text-orange-600">{applications.filter(a => a.status === 'test_completed').length}</p>
        </div>
      </div>

      {/* Batch Test Assignment */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🚀 Batch Test Assignment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Select Test</label>
            <select
              value={batchTestId}
              onChange={(e) => setBatchTestId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Choose a test --</option>
              {tests.map(test => (
                <option key={test._id} value={test._id}>
                  {test.testName} ({test.totalQuestions} questions)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Selected</label>
            <p className="py-2 px-3 bg-gray-50 rounded border">{selectedCandidates.size} candidates</p>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBatchAssignTest}
              disabled={selectedCandidates.size === 0 || !batchTestId}
              className="w-full bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Assign Test to Selected
            </button>
          </div>
        </div>

        {/* Candidates Selection Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-3">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.size === applications.length && applications.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Match Score</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Test Assigned</th>
              </tr>
            </thead>
            <tbody>
              {applications.filter(a => a.status === 'shortlisted' || !a.testId).map(app => (
                <tr key={app._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(app._id)}
                      onChange={() => handleSelectCandidate(app._id)}
                      className="w-4 h-4"
                    />
                  </td>
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
                  <td className="p-3 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {app.testId ? '✓ Assigned' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Candidates by Score */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🏆 Top Candidates by Match Score</h2>
        <div className="space-y-2">
          {applications
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5)
            .map((app, idx) => (
              <div key={app._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                  <div>
                    <p className="font-semibold">{app.candidateName}</p>
                    <p className="text-sm text-gray-600">{app.candidateEmail}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${
                  app.matchScore >= 80 ? 'text-green-600' :
                  app.matchScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {app.matchScore}%
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
