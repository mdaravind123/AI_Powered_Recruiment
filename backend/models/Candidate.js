import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: String,
  email: String, 
  matchScore: Number,
  skills: [String],
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeUrl: String,
  summary:String,
});

export default mongoose.model('Candidate', candidateSchema);
