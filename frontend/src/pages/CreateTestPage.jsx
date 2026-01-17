import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import './CreateTestPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateTestPage() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [loading, setLoading] = useState(false);
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(60);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [enableProctoring, setEnableProctoring] = useState(true);
  const [proctorRules, setProctorRules] = useState(['No tab switching', 'Webcam monitoring']);
  const [questions, setQuestions] = useState([
    { questionText: '', questionType: 'mcq', options: ['', '', '', ''], correctAnswer: '', difficulty: 'medium', timeLimit: 5 }
  ]);

  useEffect(() => {
    if (!jobId) {
      toast.error('No job selected');
      navigate('/');
    }
  }, [jobId, navigate]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', questionType: 'mcq', options: ['', '', '', ''], correctAnswer: '', difficulty: 'medium', timeLimit: 5 }]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('At least one question is required');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleProctorRuleChange = (index, value) => {
    const newRules = [...proctorRules];
    newRules[index] = value;
    setProctorRules(newRules);
  };

  const handleAddRule = () => {
    setProctorRules([...proctorRules, '']);
  };

  const handleRemoveRule = (index) => {
    setProctorRules(proctorRules.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!testName.trim()) {
      toast.error('Test name is required');
      return false;
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please set a scheduled start date and time for the test');
      return false;
    }
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime < new Date()) {
      toast.error('Scheduled start time cannot be in the past');
      return false;
    }
    if (questions.length === 0) {
      toast.error('At least one question is required');
      return false;
    }
    for (let q of questions) {
      if (!q.questionText.trim()) {
        toast.error('All questions must have text');
        return false;
      }
      if (q.questionType === 'mcq' && (!q.correctAnswer || q.options.some(o => !o.trim()))) {
        toast.error('MCQ questions must have all options and correct answer');
        return false;
      }
      if (q.questionType === 'coding') {
        const cases = q.testCases || [];
        if (!cases.length) {
          toast.error('Coding questions must have at least one test case');
          return false;
        }
        for (const tc of cases) {
          if ((tc.input ?? '') === '' || (tc.expectedOutput ?? '') === '') {
            toast.error('All coding test cases must have input and expected output');
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/tests`, {
        jobId,
        recruiterId: user._id,
        testName,
        description,
        duration,
        totalQuestions: questions.length,
        questions,
        passingScore,
        proctoring: {
          enableProctoring,
          rules: proctorRules.filter(r => r.trim())
        },
        scheduledDate,
        scheduledTime
      });

      toast.success('Test created successfully!');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-test-page">
      <div className="create-test-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Create Online Test</h1>
            <p className="page-subtitle">Design a comprehensive assessment for your candidates</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-back">
            ← Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleCreateTest} className="test-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon"></span>
              Basic Information
            </h2>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Test Name *</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Frontend Developer Assessment"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="form-input"
                  min="5"
                  max="480"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows="4"
                placeholder="Provide a brief description of what this test assesses..."
              />
            </div>
          </div>

          {/* Scheduling & Scoring Section */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon"></span>
              Scheduling & Scoring
            </h2>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Passing Score (%) *</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="form-input"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {scheduledDate && scheduledTime && (
              <div className="schedule-preview">
                <strong> Test will be available at:</strong> {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Proctoring Settings */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon"></span>
              Proctoring Settings
            </h2>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enableProctoring}
                onChange={(e) => setEnableProctoring(e.target.checked)}
                className="checkbox-input"
              />
              <span>Enable Proctoring for this test</span>
            </label>

            {enableProctoring && (
              <div className="proctoring-rules">
                <p className="rules-label">Proctoring Rules:</p>
                <div className="rules-list">
                  {proctorRules.map((rule, idx) => (
                    <div key={idx} className="rule-item">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleProctorRuleChange(idx, e.target.value)}
                        className="rule-input"
                        placeholder="e.g., No tab switching"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="btn-remove-small"
                      >
                        
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="btn-add-small"
                >
                  + Add Rule
                </button>
              </div>
            )}
          </div>

          {/* Questions Section */}
          <div className="form-section questions-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">❓</span>
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn-add"
              >
                + Add Question
              </button>
            </div>

            <div className="questions-list">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Question {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="btn-remove"
                    >
                      Remove Question
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Text *</label>
                    <textarea
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                      className="form-textarea"
                      placeholder="Enter your question here..."
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select
                        value={q.questionType}
                        onChange={(e) => handleQuestionChange(qIdx, 'questionType', e.target.value)}
                        className="form-select"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="essay">Essay</option>
                        <option value="coding">Coding</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Difficulty</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                        className="form-select"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Limit (min)</label>
                      <input
                        type="number"
                        value={q.timeLimit}
                        onChange={(e) => handleQuestionChange(qIdx, 'timeLimit', Number(e.target.value))}
                        className="form-input"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {q.questionType === 'mcq' && (
                    <div className="mcq-options">
                      <label className="form-label">Options (select correct answer)</label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="option-item">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswer === opt}
                            onChange={() => handleQuestionChange(qIdx, 'correctAnswer', opt)}
                            className="option-radio"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="option-input"
                            placeholder={`Option ${oIdx + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coding Question */}
                  {q.questionType === 'coding' && (
                    <div className="coding-section">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Allowed Languages</label>
                          <div className="language-checkboxes">
                            {['python', 'javascript', 'java', 'cpp'].map(lang => {
                              const allowed = q.allowedLanguages || [];
                              const checked = allowed.includes(lang);
                              return (
                                <label key={lang} className="language-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = new Set(allowed);
                                      if (e.target.checked) next.add(lang);
                                      else next.delete(lang);
                                      const arr = Array.from(next);
                                      handleQuestionChange(qIdx, 'allowedLanguages', arr);
                                      if (!arr.includes(q.defaultLanguage))
                                        handleQuestionChange(qIdx, 'defaultLanguage', arr[0] || 'python');
                                    }}
                                  />
                                  <span>{lang}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Default Language</label>
                          <select
                            value={q.defaultLanguage || 'python'}
                            onChange={(e) => handleQuestionChange(qIdx, 'defaultLanguage', e.target.value)}
                            className="form-select"
                          >
                            {(q.allowedLanguages?.length
                              ? q.allowedLanguages
                              : ['python', 'javascript', 'java', 'cpp']
                            ).map(lang => (
                              <option key={lang} value={lang}>
                                {lang}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="test-cases-section">
                        <label className="form-label">Test Cases</label>
                        <div className="test-cases-list">
                          {(q.testCases || []).map((tc, tcIdx) => (
                            <div key={tcIdx} className="test-case-item">
                              <div className="test-case-inputs">
                                <div className="form-group">
                                  <label className="test-case-label">Input</label>
                                  <textarea
                                    value={tc.input || ''}
                                    onChange={(e) => {
                                      const next = [...(q.testCases || [])];
                                      next[tcIdx] = { ...next[tcIdx], input: e.target.value };
                                      handleQuestionChange(qIdx, 'testCases', next);
                                    }}
                                    className="test-case-textarea"
                                    placeholder="Input data"
                                    rows={2}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="test-case-label">Expected Output</label>
                                  <textarea
                                    value={tc.expectedOutput || ''}
                                    onChange={(e) => {
                                      const next = [...(q.testCases || [])];
                                      next[tcIdx] = { ...next[tcIdx], expectedOutput: e.target.value };
                                      handleQuestionChange(qIdx, 'testCases', next);
                                    }}
                                    className="test-case-textarea"
                                    placeholder="Expected output"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <div className="test-case-actions">
                                <label className="checkbox-label-small">
                                  <input
                                    type="checkbox"
                                    checked={!!tc.isSample}
                                    onChange={(e) => {
                                      const next = [...(q.testCases || [])];
                                      next[tcIdx] = { ...next[tcIdx], isSample: e.target.checked };
                                      handleQuestionChange(qIdx, 'testCases', next);
                                    }}
                                  />
                                  <span>Sample (visible)</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(q.testCases || [])];
                                    next.splice(tcIdx, 1);
                                    handleQuestionChange(qIdx, 'testCases', next);
                                  }}
                                  className="btn-remove-small"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(q.testCases || [])];
                            next.push({ input: '', expectedOutput: '', isSample: false });
                            handleQuestionChange(qIdx, 'testCases', next);
                          }}
                          className="btn-add-small"
                        >
                          + Add Test Case
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Test...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Create Test
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
