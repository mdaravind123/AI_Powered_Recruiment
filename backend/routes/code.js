import express from 'express';
import { runAgainstTestCases } from '../utils/codeRunner.js';

const router = express.Router();

// Execute candidate code against provided test cases (used for Run in UI)
// Body: { language, code, testCases: [{ input, expectedOutput }] }
router.post('/execute', async (req, res) => {
  try {
    const { language, code, testCases } = req.body || {};
    if (!language || !code || !Array.isArray(testCases)) {
      return res.status(400).json({ message: 'language, code, and testCases are required' });
    }
    const results = await runAgainstTestCases({ language, code, testCases });
    res.json({ results });
  } catch (err) {
    console.error('Code execute error:', err.message);
    res.status(500).json({ message: 'Execution failed', error: err.message });
  }
});

export default router;
