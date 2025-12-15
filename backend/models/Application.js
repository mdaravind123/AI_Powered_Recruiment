import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateName: String,
  candidateEmail: String,
  resumeUrl: String,
  matchScore: Number, // AI-generated resume match score

  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected', 'test_assigned', 'test_completed', 'interview_scheduled', 'interview_completed'],
    default: 'applied'
  },
  testIds: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    },
    assignedAt: Date,
    completedAt: Date,
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestResult'
    }
  }],
  testResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult'
  },
  resumeAnalysis: {
    summary: String,
    skills: [String],
    experience: String
  },
  interviewScheduled: {
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview"
  },
  date: {
    type: Date
  },
  time: {
    type: String
  },
  type: {
    type: String
  }
},

  appliedAt: { type: Date, default: Date.now },
  shortlistedAt: Date,
  testAssignedAt: Date,
  testCompletedAt: Date
});

export default mongoose.model('Application', applicationSchema);
