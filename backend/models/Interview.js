import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    // Reference to application
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },

    // Reference to job
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },

    // Recruiter who scheduled
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    recruiterName: {
      type: String,
      required: true
    },

    recruiterEmail: {
      type: String,
      required: true
    },

    companyName: {
      type: String,
      required: true
    },

    // Candidate information
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    candidateName: {
      type: String,
      required: true
    },

    candidateEmail: {
      type: String,
      required: true
    },

    // Interview details
    interviewDate: {
      type: String,
      required: true
    },

    interviewTime: {
      type: String,
      required: true
    },

    interviewType: {
      type: String,
      enum: ['online', 'offline', 'phone'],
      required: true
    },

    // Location or meeting link
    meetingLink: {
      type: String,
      default: null
    },

    location: {
      type: String,
      default: null
    },

    // Additional information
    additionalNotes: {
      type: String,
      default: ''
    },

    jobTitle: {
      type: String,
      required: true
    },

    // Interview status
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },

    // Feedback from recruiter after interview
    recruiterFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comments: String,
      decision: {
        type: String,
        enum: ['pass', 'fail', 'pending', null],
        default: null
      },
      feedbackDate: Date
    },

    // Feedback from candidate
    candidateFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comments: String,
      feedbackDate: Date
    },

    // Notification tracking
    emailSentToCandidate: {
      type: Boolean,
      default: false
    },

    reminderSentToCandidate: {
      type: Boolean,
      default: false
    },

    reminderSentAt: Date,

    // Rescheduling
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null
    },

    rescheduleReason: String,

    // Timestamps
    scheduledAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
interviewSchema.index({ applicationId: 1 });
interviewSchema.index({ jobId: 1 });
interviewSchema.index({ recruiterId: 1 });
interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ interviewDate: 1 });
interviewSchema.index({ status: 1 });

export default mongoose.model('Interview', interviewSchema);
