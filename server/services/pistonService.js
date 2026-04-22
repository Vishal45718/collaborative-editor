
/**
 * Piston Code Execution Service
 *
 * Requires a running Piston instance (self-hosted via Docker).
 * Set PISTON_URL in .env to point to it (default: http://localhost:2000/api/v2/execute).
 *
 * Quick start:
 *   docker-compose up -d
 *   # Then install a runtime, e.g.:
 *   curl -X POST http://localhost:2000/api/v2/packages \
 *     -H 'Content-Type: application/json' \
 *     -d '{"language":"python","version":"3.10.0"}'
 */

const PISTON_BASE = process.env.PISTON_URL
  ? process.env.PISTON_URL.replace('/api/v2/execute', '')
  : 'http://localhost:2000';

const PISTON_EXECUTE_URL = `${PISTON_BASE}/api/v2/execute`;
const PISTON_RUNTIMES_URL = `${PISTON_BASE}/api/v2/runtimes`;

/**
 * List all runtimes installed on the Piston instance.
 */
export const listRuntimes = async () => {
  const response = await fetch(PISTON_RUNTIMES_URL);
  if (!response.ok) throw new Error(`Cannot reach Piston at ${PISTON_RUNTIMES_URL}`);
  return response.json();
};

/**
 * Execute code via the local Piston engine.
 * @param {{ language: string, version: string, code: string, stdin?: string }} params
 */
export const executeCode = async ({ language, version, code, stdin }) => {
  const requestBody = {
    language,
    version,
    files: [{ content: code }],
    stdin: stdin || '',
    run_timeout: 10000,   // 10 seconds – internal only, not exposed in UI
    run_memory_limit: -1, // unlimited – managed by Piston/Docker
  };

  const startTime = Date.now();

  const response = await fetch(PISTON_EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const executionTimeMs = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[Piston] Error ${response.status}: ${errorText}`);

    if (response.status === 404) {
      // Runtime not installed on the Piston instance
      let parsed = {};
      try { parsed = JSON.parse(errorText); } catch (_) { /* ignore */ }
      const msg = parsed.message || `Runtime "${language}@${version}" not found.`;
      throw new Error(
        `${msg}\n\nInstall it with:\ncurl -X POST ${PISTON_BASE}/api/v2/packages \\\n  -H 'Content-Type: application/json' \\\n  -d '{"language":"${language}","version":"${version}"}'`
      );
    }

    if (response.status === 503 || response.status === 502) {
      throw new Error(
        `Piston engine is unavailable (${response.status}).\nMake sure it's running:\n  docker-compose up -d`
      );
    }

    throw new Error(`Piston returned HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`[Piston] ${language}@${version} executed in ${executionTimeMs}ms`);
  return { ...data, executionTimeMs };
};
