import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';

export default function TakeTest({ testId, jobId, applicationId, onCompleted }) {
  const { user } = useUserStore();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState(0);
  const submittedRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testStarted, setTestStarted] = useState(false);
  const [timeSpent, setTimeSpent] = useState({});
  const [finishedResult, setFinishedResult] = useState(null);
  const containerRef = useRef(null);
  const proctorListenersRef = useRef(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  // Persistent test state key
  const storageKey = `testState:${user?._id}:${testId || applicationId}`;

  // react-hot-toast doesn't provide `toast.warn` — create a small helper
  const toastWarn = (msg) => {
    try {
      toast(msg, { icon: '⚠️' });
    } catch (e) {
      // fallback
      toast(msg);
    }
  };


  useEffect(() => {
    if (!testStarted || !test) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, test]);

  // Persist state periodically and on changes
  useEffect(() => {
    if (!test) return;
    const save = () => {
      const state = {
        answers,
        currentQuestion,
        timeRemaining,
        timeSpent,
        violations,
        testStarted
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to persist test state', e);
      }
    };

    // save on changes
    save();

    const t = setInterval(save, 5000);
    return () => clearInterval(t);
  }, [answers, currentQuestion, timeRemaining, timeSpent, violations, testStarted, test]);

  useEffect(() => {
    if (!testStarted) return;

    const questionTimer = setInterval(() => {
      setTimeSpent(prev => ({
        ...prev,
        [currentQuestion]: (prev[currentQuestion] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(questionTimer);
  }, [testStarted, currentQuestion]);

  const fetchTest = async () => {
    try {
      if (!testId) {
        console.error('TakeTest: missing testId');
        toast.error('Test not found (missing test id)');
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`/api/tests/${testId}`);
      setTest(data);
      // restore persisted state if available
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          // restore answers, currentQuestion, timeRemaining, timeSpent, violations, testStarted
          if (saved.answers) setAnswers(saved.answers);
          if (typeof saved.currentQuestion === 'number') setCurrentQuestion(saved.currentQuestion);
          if (typeof saved.timeRemaining === 'number') setTimeRemaining(saved.timeRemaining);
          else setTimeRemaining(data.duration * 60);
          if (saved.timeSpent) setTimeSpent(saved.timeSpent);
          if (typeof saved.violations === 'number') setViolations(saved.violations);
          if (saved.testStarted) {
            // resume in-progress test
            setTestStarted(true);
          }
        } catch (e) {
          console.warn('Failed to parse saved test state', e);
          setTimeRemaining(data.duration * 60);
        }
      } else {
        setTimeRemaining(data.duration * 60); // Convert to seconds
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch test');
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    test.questions.forEach((q, idx) => {
      if (q.questionType === 'mcq' && answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    return Math.round((correctCount / test.questions.length) * 100);
  };

  const handleAutoSubmit = async () => {
    toast.error('Time is up! Submitting your test...');
    await submitTest();
  };

  // Proctoring: handle visibility/blur/unload violations
  useEffect(() => {
    if (!testStarted) return;
    if (!test || !test.proctoring || !test.proctoring.enableProctoring) return;

    const maxViolations = test.proctoring.maxViolations || 3;
    // store listeners so we can remove them from submitTest
    const listeners = {};

    listeners.onVisibilityChange = () => {
      if (document.hidden) {
        setViolations(v => {
          const next = v + 1;
          if (next >= maxViolations) {
            if (!submittedRef.current) {
              toast.error('Maximum proctoring violations reached. Submitting test.');
              // cleanup listeners will be done inside submitTest
              submitTest();
            }
          } else {
            toastWarn(`You left the test window (${next}/${maxViolations}). Please return.`);
          }
          return next;
        });
      }
    };

    listeners.onBlur = () => {
      setViolations(v => {
        const next = v + 1;
        if (next >= maxViolations) {
          if (!submittedRef.current) {
            toast.error('Maximum proctoring violations reached. Submitting test.');
            submitTest();
          }
        } else {
          toastWarn(`You switched away from the test (${next}/${maxViolations}).`);
        }
        return next;
      });
    };

    listeners.onBeforeUnload = (e) => {
      // count as a violation and prompt user before unload
      setViolations(v => v + 1);
      e.preventDefault();
      e.returnValue = '';
    };

    // handle fullscreen exit detection — do NOT auto re-enter fullscreen (user gesture required)
    listeners.onFullScreenChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) {
        setViolations(v => {
          const next = v + 1;
          if (next >= maxViolations) {
            if (!submittedRef.current) {
              toast.error('You exited full-screen too many times. Submitting test.');
              submitTest();
            }
          } else {
            toastWarn(`You exited full-screen (${next}/${maxViolations}). Please return to full-screen via the Start Test button.`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', listeners.onVisibilityChange);
    window.addEventListener('blur', listeners.onBlur);
    window.addEventListener('beforeunload', listeners.onBeforeUnload);
    document.addEventListener('fullscreenchange', listeners.onFullScreenChange);
    document.addEventListener('webkitfullscreenchange', listeners.onFullScreenChange);

    // expose listeners so submitTest can remove them
    proctorListenersRef.current = listeners;

    return () => {
      if (proctorListenersRef.current) {
        const l = proctorListenersRef.current;
        document.removeEventListener('visibilitychange', l.onVisibilityChange);
        window.removeEventListener('blur', l.onBlur);
        window.removeEventListener('beforeunload', l.onBeforeUnload);
        document.removeEventListener('fullscreenchange', l.onFullScreenChange);
        document.removeEventListener('webkitfullscreenchange', l.onFullScreenChange);
        proctorListenersRef.current = null;
      }
    };
  }, [testStarted, test]);

  const handleSubmitTest = async () => {
    if (window.confirm('Are you sure you want to submit? You cannot redo this test.')) {
      await submitTest();
    }
  };

  const submitTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    // remove proctoring listeners to avoid repeat submissions
    try {
      if (proctorListenersRef.current) {
        const l = proctorListenersRef.current;
        document.removeEventListener('visibilitychange', l.onVisibilityChange);
        window.removeEventListener('blur', l.onBlur);
        window.removeEventListener('beforeunload', l.onBeforeUnload);
        document.removeEventListener('fullscreenchange', l.onFullScreenChange);
        document.removeEventListener('webkitfullscreenchange', l.onFullScreenChange);
        proctorListenersRef.current = null;
      }
    } catch (e) {/* ignore */}
    setSubmitting(true);
    try {
      const correctAnswers = test.questions.filter((q, idx) => {
        if (q.questionType === 'mcq') {
          return answers[idx] === q.correctAnswer;
        }
        return false;
      }).length;

      const totalScore = calculateScore();
      const totalTimeUsed = Object.values(timeSpent).reduce((a, b) => a + b, 0);

      const resultAnswers = test.questions.map((q, idx) => ({
        questionId: idx,
        questionText: q.questionText,
        userAnswer: answers[idx] || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect: q.questionType === 'mcq' && answers[idx] === q.correctAnswer,
        timeSpent: timeSpent[idx] || 0
      }));

      const resp = await axios.post(`/api/tests/${testId}/submit`, {
        candidateId: user._id,
        candidateName: user.name,
        candidateEmail: user.email,
        jobId,
        answers: resultAnswers,
        totalScore,
        correctAnswers,
        totalQuestions: test.questions.length,
        timeUsed: totalTimeUsed
      });

      toast.success(`Test submitted! Your score: ${totalScore}%`);
      // clear persisted state
      try { localStorage.removeItem(storageKey); } catch(e){}

      // set local finished result and show completion UI to avoid updating parent during render
      setFinishedResult({ totalScore, passed: resp.data.passed, appUpdated: !!resp.data.appUpdated });
      // exit fullscreen if active (best-effort)
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        }
      } catch (e) {}
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading test...</div>;
  if (!test) return <div className="text-center py-8">Test not found</div>;

  if (!testStarted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4">
          <h2 className="text-3xl font-bold mb-4">{test.testName}</h2>
          <p className="text-gray-600 mb-4">{test.description}</p>

          <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded">
            <p><strong>Duration:</strong> {test.duration} minutes</p>
            <p><strong>Total Questions:</strong> {test.questions.length}</p>
            <p><strong>Passing Score:</strong> {test.passingScore}%</p>
            {test.proctoring?.enableProctoring && (
              <div>
                <p><strong>Proctoring Rules:</strong></p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {test.proctoring.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              // request fullscreen then start
              try {
                if (containerRef.current && containerRef.current.requestFullscreen) {
                  await containerRef.current.requestFullscreen();
                } else if (document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
              } catch (e) {
                // ignore; proceed to start even if fullscreen blocked
              }
              setTestStarted(true);
            }}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-semibold text-lg"
          >
            Start Test (Full Screen)
          </button>
        </div>
      </div>
    );
  }

  // Completion screen after submit
  if (finishedResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Test Submitted</h2>
          <p className="mb-4">Your score: <span className="font-semibold">{finishedResult.totalScore}%</span></p>
          <p className="mb-4 text-sm text-gray-600">{finishedResult.passed ? 'You passed the test.' : 'You did not pass.'}</p>
          {!finishedResult.appUpdated && (
            <p className="text-sm text-red-600 mb-4">Note: application not updated on server. Reload dashboard to refresh.</p>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                // ensure local UI resets and notify parent afterwards
                setTestStarted(false);
                setTimeout(() => {
                  onCompleted();
                }, 150);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = test.questions[currentQuestion];

  // Fullscreen immersive layout
  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => { if (test.proctoring?.disableContextMenu) e.preventDefault(); }}
      onCopy={(e) => { if (test.proctoring?.disableCopyPaste) e.preventDefault(); }}
      onCut={(e) => { if (test.proctoring?.disableCopyPaste) e.preventDefault(); }}
      onPaste={(e) => { if (test.proctoring?.disableCopyPaste) e.preventDefault(); }}
      className="fixed inset-0 bg-gray-900 text-white z-50 flex flex-col"
    >
      {/* Top bar - minimal */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/70">
        <div className="font-semibold text-lg">{test.testName}</div>
        <div className="flex items-center gap-6">
          <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-400' : ''}`}>{formatTime(timeRemaining)}</div>
          <div className="text-sm">Q {currentQuestion + 1}/{test.questions.length}</div>
          <div className="text-sm">Violations: {violations}</div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-8 bg-gray-900">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-white">{question.questionText}</h3>

          {question.questionType === 'mcq' && (
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <label key={idx} className="flex items-center p-4 border rounded bg-gray-700 hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === option}
                    onChange={() => handleAnswerChange(option)}
                    className="w-4 h-4"
                  />
                  <span className="ml-4">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.questionType === 'essay' && (
            <textarea
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full border rounded p-4 h-48 bg-gray-800"
              placeholder="Type your answer here..."
            />
          )}

          {question.questionType === 'coding' && (
            <textarea
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full border rounded p-4 h-64 font-mono text-sm bg-gray-800"
              placeholder="Write your code here..."
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <div>
              <button onClick={handlePreviousQuestion} disabled={currentQuestion === 0} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50">← Previous</button>
            </div>

            <div className="space-x-2">
              {test.questions.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentQuestion(idx)} className={`px-3 py-1 rounded ${idx === currentQuestion ? 'bg-green-600' : (answers[idx] !== undefined ? 'bg-blue-600' : 'bg-gray-700')}`}>{idx + 1}</button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleNextQuestion} disabled={currentQuestion === test.questions.length - 1} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50">Next →</button>
              {currentQuestion === test.questions.length - 1 && (
                <button onClick={handleSubmitTest} disabled={submitting} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">{submitting ? 'Submitting...' : 'Submit Test'}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
