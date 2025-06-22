import express from 'express';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { title, description, skills, recruiterId } = req.body;

    const job = await Job.create({
      title,
      description,
      skills,
      recruiterId, 
    });

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

router.get('/', async (req, res) => {
  const { recruiterId } = req.query;

  const filter = recruiterId ? { recruiterId } : {};
  const jobs = await Job.find(filter);
  res.json(jobs);
});

router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  const candidates = await Candidate.find({ jobId: job._id });
  res.json({ job, candidates });
});

router.get('/:id/candidates', async (req, res) => {
  try {
    const jobId = req.params.id;
    const sortOrder = req.query.sort === 'asc' ? 1 : -1;

    const candidates = await Candidate.find({ jobId }).sort({ matchScore: sortOrder });
    res.json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});


export default router;
