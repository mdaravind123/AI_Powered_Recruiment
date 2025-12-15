import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: String,
  questionType: { type: String, enum: ['mcq', 'coding', 'essay'], default: 'mcq' },
  options: [String], // for MCQ
  correctAnswer: String,
  timeLimit: { type: Number, default: 5 }, // in minutes
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
}, { _id: false });

const testSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testName: String,
  description: String,
  duration: { type: Number, required: true }, // in minutes
  totalQuestions: { type: Number, required: true },
  questions: [questionSchema],
  passingScore: { type: Number, default: 60 }, // percentage
  proctoring: {
    enableProctoring: { type: Boolean, default: true },
    rules: [String], // e.g., "No tab switching", "Camera required", "Single monitor only"
  },
  scheduledDate: Date,
  scheduledTime: String, // HH:MM format
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Test', testSchema);
