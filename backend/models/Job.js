import mongoose from 'mongoose';


const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  skills: [String],
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  }
});

export default mongoose.model('Job', jobSchema);
