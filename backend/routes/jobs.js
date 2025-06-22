import express from 'express';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();


router.post('/', async (req, res) => {
  const job = await Job.create(req.body);
  res.json(job);
});

router.get('/', async (req, res) => {
  const jobs = await Job.find();
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
