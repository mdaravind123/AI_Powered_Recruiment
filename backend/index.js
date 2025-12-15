import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import uploadRoutes from './routes/upload.js';
import testRoutes from './routes/tests.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import interviewRoutes from './routes/interviews.js';
dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobs', uploadRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interviews', interviewRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('Connected to MongoDb'))
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Server running')))
  .catch(err => console.error(err));


  