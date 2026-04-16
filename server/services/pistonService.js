

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
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Piston API Error: ${response.status} - ${errorText}`);
      throw new Error(`Piston API returned status ${response.status}`);
    }

    const data = await response.json();
    return { ...data, executionTimeMs };
  } catch (err) {
    console.error('Code execution failed:', err);
    throw err;
  }
};
