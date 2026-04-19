

export const executeCode = async ({ language, version, code, stdin, timeout, memoryLimit }) => {
  try {
    const requestBody = {
      language,
      version,
      files: [
        {
          content: code
        }
      ],
      stdin: stdin || '',
      run_timeout: timeout ? parseInt(timeout, 10) : 3000,
      run_memory_limit: memoryLimit ? parseInt(memoryLimit, 10) : -1
    };

    const startTime = Date.now();
    
    // Provide a way to use a custom Piston instance or an API key
    // The public API at emkc.org is whitelist-only as of Feb 2026.
    const pistonUrl = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';
    const pistonApiKey = process.env.PISTON_API_KEY;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (pistonApiKey) {
      headers['Authorization'] = pistonApiKey; // Usually passed raw or as Bearer token
    }

    const response = await fetch(pistonUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Piston API Error: ${response.status} - ${errorText}`);
      
      let errorMessage = `Piston API returned status ${response.status}`;
      if (response.status === 401) {
        errorMessage += ` (Unauthorized). The public Piston API is whitelist-only. Please set PISTON_URL to a local Piston instance (e.g., http://localhost:2000/api/v2/execute) or provide a PISTON_API_KEY.`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { ...data, executionTimeMs };
  } catch (err) {
    console.error('Code execution failed:', err);
    throw err;
  }
};
