import mongoose from 'mongoose';


const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  skills: [String],
});

export default mongoose.model('Job', jobSchema);
