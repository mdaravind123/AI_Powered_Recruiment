import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Reference to job application
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

    // Sender information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    senderName: {
      type: String,
      required: true
    },

    senderRole: {
      type: String,
      enum: ['recruiter', 'candidate'],
      required: true
    },

    senderEmail: {
      type: String,
      required: true
    },

    // Recipient information
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    recipientName: {
      type: String,
      required: true
    },

    // Message content
    content: {
      type: String,
      required: true,
      trim: true
    },

    // Message metadata
    messageType: {
      type: String,
      enum: ['text', 'system', 'interview-scheduled'],
      default: 'text'
    },

    // For interview scheduled system messages
    interviewDetails: {
      interviewId: mongoose.Schema.Types.ObjectId,
      date: String,
      time: String,
      type: String,
      link: String
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    },

    // Attachment support (optional)
    attachment: {
      url: String,
      fileName: String,
      fileType: String,
      fileSize: Number
    },

    // Timestamps
    createdAt: {
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
messageSchema.index({ applicationId: 1, createdAt: -1 });
messageSchema.index({ jobId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ recipientId: 1 });
messageSchema.index({ isRead: 1 });

export default mongoose.model('Message', messageSchema);
