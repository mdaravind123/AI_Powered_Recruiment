import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import TakeTest from './TakeTest';
import ChatWindow from './ChatWindow';

export default function EmployeeDashboard() {
  const { user } = useUserStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [interviews, setInterviews] = useState({});
  const [openChatApp, setOpenChatApp] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchInterviews();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/applications/candidate/${user._id}`);
      setApplications(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResult = async (testId, candidateId) => {
    try {
      const { data } = await axios.get(`/api/tests/${testId}/result/${candidateId}`);
      setTestResults(prev => ({
        ...prev,
        [testId]: data
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInterviews = async () => {
    try {
      const { data } = await axios.get(`/api/interviews/candidate/${user._id}`);
      const interviewMap = {};
      data.forEach(interview => {
        if (!interviewMap[interview.applicationId]) {
          interviewMap[interview.applicationId] = [];
        }
        interviewMap[interview.applicationId].push(interview);
      });
      setInterviews(interviewMap);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

  const handleTakeTest = (application, assignmentId = null) => {
    setSelectedTest(application);
    setSelectedAssignmentId(assignmentId);
  };

  const handleTestCompleted = () => {
    setSelectedTest(null);
    fetchApplications();
    toast.success('Test completed!');
  };

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    testsAssigned: applications.reduce((sum, a) => sum + ((a.testIds && a.testIds.length) || (a.testId ? 1 : 0)), 0),
    testsCompleted: applications.filter(a => a.status === 'test_completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-blue-100">Track your job applications and complete assigned tests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
          <p className="text-gray-600">Total Applied</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
          <p className="text-gray-600">Shortlisted</p>
          <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
          <p className="text-gray-600">Tests Assigned</p>
          <p className="text-2xl font-bold text-orange-600">{stats.testsAssigned}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
          <p className="text-gray-600">Tests Completed</p>
          <p className="text-2xl font-bold text-purple-600">{stats.testsCompleted}</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Applied Jobs</h2>

        {loading ? (
          <p className="text-gray-600">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-600 text-center py-8">You haven't applied for any jobs yet</p>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{app.jobId?.title}</h3>
                    <p className="text-sm text-gray-600">{app.jobId?.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${
                    app.status === 'applied' ? 'bg-gray-100 text-gray-800' :
                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                    app.status === 'test_assigned' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'test_completed' ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Match Score */}
                {app.matchScore && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-semibold">Resume Match:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          app.matchScore >= 80 ? 'bg-green-500' :
                          app.matchScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{app.matchScore}%</span>
                  </div>
                )}

                {/* Interview Section */}
                {interviews[app._id] && interviews[app._id].length > 0 && (
                  <div className="bg-green-50 p-3 rounded mb-3 border border-green-200">
                    <p className="font-semibold text-green-900 mb-2">📅 Interview Scheduled</p>
                    {interviews[app._id].map((interview, idx) => (
                      <div key={idx} className="bg-white p-2 rounded mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm text-gray-700">
                              <strong>Date:</strong> {new Date(interview.interviewDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Time:</strong> {interview.interviewTime}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Type:</strong> {interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            interview.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {interview.status.toUpperCase()}
                          </span>
                        </div>

                        {interview.interviewType === 'online' && interview.meetingLink && (
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Meeting Link:</strong>{' '}
                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {interview.meetingLink}
                            </a>
                          </p>
                        )}

                        {interview.interviewType === 'offline' && interview.location && (
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Location:</strong> {interview.location}
                          </p>
                        )}

                        {interview.additionalNotes && (
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Notes:</strong> {interview.additionalNotes}
                          </p>
                        )}

                        {interview.recruiterFeedback?.rating && (
                          <div className="mt-2 p-2 bg-purple-50 rounded">
                            <p className="text-sm font-semibold text-purple-900">Feedback:</p>
                            <p className="text-sm text-purple-700">⭐ Rating: {interview.recruiterFeedback.rating}/5</p>
                            {interview.recruiterFeedback.comments && (
                              <p className="text-sm text-purple-700 mt-1">{interview.recruiterFeedback.comments}</p>
                            )}
                            <p className="text-sm text-purple-700 font-semibold mt-1">
                              Decision: {interview.recruiterFeedback.decision?.toUpperCase()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Button */}
                {app.status !== 'rejected' && (
                  <button
                    onClick={() => setOpenChatApp(app)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mb-3 transition-colors"
                  >
                    💬 Chat with Recruiter
                  </button>
                )}

                {/* Test Section - support multiple assigned tests */}
                {((app.testId) || (app.testIds && app.testIds.length > 0)) && (
                  <div className="bg-blue-50 p-3 rounded mb-3 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">Assigned Tests</p>
                    <div className="space-y-2">
                      {app.testIds && app.testIds.length > 0 ? (
                        app.testIds.map((ta, idx) => {
                          const t = ta.testId || ta; // populated object or id
                          const tId = t?._id || t;
                          const completed = !!ta.completedAt;
                          return (
                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                              <div>
                                <div className="font-semibold text-blue-800">{t?.testName || 'Test'}</div>
                                <div className="text-sm text-gray-600">{t?.duration || '—'} mins • {t?.totalQuestions || '—'} questions</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!completed && app.status === 'test_assigned' && (
                                  <button onClick={() => handleTakeTest(app, tId)} className="px-3 py-1 bg-green-600 text-white rounded">Start</button>
                                )}
                                {completed && (
                                  <span className="text-sm text-purple-700 font-semibold">Completed</span>
                                )}
                                {app.status === 'test_completed' && tId && !testResults[tId] && (
                                  <button onClick={() => fetchTestResult(tId, user._id)} className="text-purple-600 text-sm">View Results</button>
                                )}
                                {app.status === 'test_completed' && tId && testResults[tId] && (
                                  <div className="text-sm ml-2 font-bold">{testResults[tId].totalScore}%</div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : app.testId ? (
                        // legacy single testId
                        (() => {
                          const t = app.testId;
                          const tId = t?._id || t;
                          return (
                            <div className="flex items-center justify-between bg-white p-2 rounded">
                              <div>
                                <div className="font-semibold text-blue-800">{t?.testName || 'Test'}</div>
                                <div className="text-sm text-gray-600">{t?.duration || '—'} mins • {t?.totalQuestions || '—'} questions</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {app.status === 'test_assigned' && <button onClick={() => handleTakeTest(app, tId)} className="px-3 py-1 bg-green-600 text-white rounded">Start</button>}
                                {app.status === 'test_completed' && tId && !testResults[tId] && (
                                  <button onClick={() => fetchTestResult(tId, user._id)} className="text-purple-600 text-sm">View Results</button>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Application Info */}
                <div className="text-xs text-gray-500 flex gap-4">
                  <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  {app.shortlistedAt && <span>Shortlisted: {new Date(app.shortlistedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Modal */}
      {selectedTest && (() => {
        // determine testIdValue from selectedAssignmentId if present, otherwise fall back
        let testIdValue = null;
        if (selectedAssignmentId) {
          testIdValue = selectedAssignmentId;
        } else {
          const assignedTest = selectedTest.testId || (selectedTest.testIds && selectedTest.testIds.length > 0 ? selectedTest.testIds[selectedTest.testIds.length - 1].testId : null);
          testIdValue = assignedTest ? (assignedTest._id || assignedTest) : null;
        }
        const jobIdValue = selectedTest.jobId ? (selectedTest.jobId._id || selectedTest.jobId) : null;

        if (!testIdValue) {
          console.warn('Assigned test not found for application', selectedTest._id);
          return null;
        }

        return (
          <TakeTest
            testId={testIdValue}
            jobId={jobIdValue}
            applicationId={selectedTest._id}
            onCompleted={() => { setSelectedAssignmentId(null); handleTestCompleted(); }}
          />
        );
      })()}

      {/* Chat Window Modal */}
      {openChatApp && (
        <ChatWindow
          applicationId={openChatApp._id}
          jobId={openChatApp.jobId}
          jobTitle={openChatApp.jobId?.title}
          candidateName={user.name}
          candidateEmail={user.email}
          candidateId={user._id}
          recruiterId={openChatApp.jobId?.recruiterId}
          recruiterName="Recruiter"
          companyName={import.meta.env.VITE_COMPANY_NAME || 'Company'}
          userRole="candidate"
          onClose={() => setOpenChatApp(null)}
        />
      )}
    </div>
  );
}
