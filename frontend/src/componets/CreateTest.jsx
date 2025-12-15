import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateTest({ jobId, onTestCreated, onCancel }) {
  const { user } = useUserStore();
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

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', questionType: 'mcq', options: ['', '', '', ''], correctAnswer: '', difficulty: 'medium', timeLimit: 5 }]);
  };

  const handleRemoveQuestion = (index) => {
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
      onTestCreated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Online Test</h2>
          <button onClick={onCancel} className="text-2xl hover:text-red-600">&times;</button>
        </div>

        <form onSubmit={handleCreateTest} className="space-y-4">
          {/* Test Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Test Name *</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Frontend Developer Assessment"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Duration (minutes) *</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min="5"
                max="480"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="Test description..."
            />
          </div>

          {/* Passing Score & Scheduling */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2">Passing Score (%) *</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Scheduled Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Proctoring Settings */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={enableProctoring}
                onChange={(e) => setEnableProctoring(e.target.checked)}
              />
              <span className="font-semibold">Enable Proctoring</span>
            </label>

            {enableProctoring && (
              <div className="ml-4 space-y-2">
                <p className="font-semibold text-sm">Proctoring Rules:</p>
                {proctorRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleProctorRuleChange(idx, e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="e.g., No tab switching"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-green-600 font-semibold text-sm mt-2"
                >
                  + Add Rule
                </button>
              </div>
            )}
          </div>

          {/* Questions Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Questions ({questions.length})</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">Question {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    className="w-full border rounded px-2 py-1 mb-2 text-sm"
                    placeholder="Question text..."
                  />

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <select
                      value={q.questionType}
                      onChange={(e) => handleQuestionChange(qIdx, 'questionType', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="essay">Essay</option>
                      <option value="coding">Coding</option>
                    </select>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input
                      type="number"
                      value={q.timeLimit}
                      onChange={(e) => handleQuestionChange(qIdx, 'timeLimit', Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Time (min)"
                      min="1"
                      max="60"
                    />
                  </div>

                  {q.questionType === 'mcq' && (
                    <div className="space-y-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswer === opt}
                            onChange={() => handleQuestionChange(qIdx, 'correctAnswer', opt)}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
