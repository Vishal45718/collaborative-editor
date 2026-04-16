import { Router } from 'express';
import { executeCode } from '../services/pistonService.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({ status: '✅ Server is running', timestamp: new Date().toISOString() });
});

// Piston Code Execution Endpoint
router.post('/execute', async (req, res) => {
  try {
    const { language, version, code, stdin, timeout, memoryLimit } = req.body;

    if (!language || !version || !code) {
      return res.status(400).json({ error: 'Missing required fields: language, version, code' });
    }

    const result = await executeCode({ language, version, code, stdin, timeout, memoryLimit });

    res.json(result);
  } catch (err) {
    console.error('Execution route error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
