import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: String,
  questionText: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  timeSpent: Number // in seconds
}, { _id: false });

const testResultSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateName: String,
  candidateEmail: String,
  answers: [answerSchema],
  totalScore: { type: Number, required: true }, // percentage
  correctAnswers: Number,
  totalQuestions: Number,
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  passed: Boolean,
  timeUsed: Number, // in seconds
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  proctorNotes: String,
  suspiciousActivity: [String] // flags for suspicious behavior
});

export default mongoose.model('TestResult', testResultSchema);
