import { Router } from 'express';
import { executeCode, listRuntimes } from '../services/pistonService.js';
import { executeLocally } from '../services/localExecutor.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: '✅ Server is running', timestamp: new Date().toISOString() });
});

// List available Piston runtimes (proxy to Piston engine)
router.get('/runtimes', async (req, res) => {
  try {
    const runtimes = await listRuntimes();
    res.json(runtimes);
  } catch (err) {
    console.warn('[Runtimes] Piston unavailable:', err.message);
    // Return a minimal list of locally available runtimes
    res.json([
      { language: 'javascript', version: process.version.replace('v', '') },
      { language: 'python', version: '3.x' },
      { language: 'c++', version: 'gcc' },
      { language: 'c', version: 'gcc' },
      { language: 'go', version: '1.x' },
      { language: 'bash', version: '5.x' },
    ]);
  }
});

// Code Execution — tries Piston first, falls back to local execution
router.post('/execute', async (req, res) => {
  const { language, version, code, stdin } = req.body;

  if (!language || !version || !code) {
    return res.status(400).json({ error: 'Missing required fields: language, version, code' });
  }

  // 1️⃣ Try Piston (Docker-based, sandboxed)
  try {
    const result = await executeCode({ language, version, code, stdin });
    console.log(`[Execute] Piston OK — ${language}@${version}`);
    return res.json({ ...result, executor: 'piston' });
  } catch (pistonErr) {
    console.warn(`[Execute] Piston failed (${pistonErr.message?.slice(0, 80)}), trying local fallback...`);
  }

  // 2️⃣ Fallback — run with system-installed runtimes
  try {
    const result = await executeLocally({ language, code, stdin });
    console.log(`[Execute] Local OK — ${language}`);
    return res.json({ ...result, executor: 'local' });
  } catch (localErr) {
    console.error('[Execute] Both Piston and local executor failed:', localErr.message);
    return res.status(500).json({
      error: localErr.message,
      hint: 'Start the Piston Docker engine for full language support: docker-compose up -d',
    });
  }
});

export default router;
