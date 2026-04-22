/**
 * Local Code Execution Service
 *
 * Executes code using system-installed runtimes as a fallback
 * when the Piston Docker instance is unavailable.
 *
 * Supported locally: JavaScript (Node), Python, C++, C, Go, Bash
 */

import { exec, spawn } from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Map of language -> how to compile+run locally
 */
const LOCAL_RUNTIMES = {
  javascript: {
    ext: '.js',
    run: (file) => ['node', [file]],
  },
  typescript: {
    ext: '.ts',
    run: (file) => ['npx', ['--yes', 'tsx', file]],
  },
  python: {
    ext: '.py',
    run: (file) => ['python3', [file]],
  },
  'c++': {
    ext: '.cpp',
    compile: (src, bin) => ['g++', ['-O2', '-o', bin, src]],
    run: (_, bin) => [bin, []],
  },
  c: {
    ext: '.c',
    compile: (src, bin) => ['gcc', ['-O2', '-o', bin, src]],
    run: (_, bin) => [bin, []],
  },
  go: {
    ext: '.go',
    run: (file) => ['go', ['run', file]],
  },
  bash: {
    ext: '.sh',
    run: (file) => ['bash', [file]],
  },
};

/**
 * Runs a process and collects stdout/stderr with a timeout.
 */
function runProcess(cmd, args, { stdin = '', timeoutMs = 10000 } = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(cmd, args, {
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    });

    let stdout = '';
    let stderr = '';

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code, signal) => {
      resolve({
        stdout,
        stderr,
        code: signal === 'SIGKILL' ? -1 : (code ?? 0),
        signal,
        elapsed: Date.now() - startTime,
      });
    });

    child.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, code: -1, signal: null, elapsed: Date.now() - startTime });
    });
  });
}

/**
 * Execute code locally using system runtimes.
 */
export const executeLocally = async ({ language, code, stdin = '' }) => {
  const runtime = LOCAL_RUNTIMES[language];
  if (!runtime) {
    throw new Error(`Local execution not supported for language: "${language}". Please start the Piston Docker engine.`);
  }

  // Write code to a temp file
  const tmpDir = await mkdtemp(join(tmpdir(), 'codesync-'));
  const srcFile = join(tmpDir, `main${runtime.ext}`);
  const binFile = join(tmpDir, 'main.out');

  try {
    await writeFile(srcFile, code, 'utf8');

    const startTime = Date.now();

    // Compile step (if needed)
    if (runtime.compile) {
      const [compileCmd, compileArgs] = runtime.compile(srcFile, binFile);
      const compileResult = await runProcess(compileCmd, compileArgs);
      if (compileResult.code !== 0) {
        return {
          compile: { stdout: compileResult.stdout, stderr: compileResult.stderr, code: compileResult.code },
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    // Run step
    const [runCmd, runArgs] = runtime.run(srcFile, binFile);
    const runResult = await runProcess(runCmd, runArgs, { stdin });

    return {
      run: {
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        code: runResult.code,
        signal: runResult.signal,
        output: runResult.stdout,
      },
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    // Cleanup temp files
    try { await unlink(srcFile); } catch (_) { /* ignore */ }
    try { await unlink(binFile); } catch (_) { /* ignore */ }
    try { await promisify(exec)(`rm -rf "${tmpDir}"`); } catch (_) { /* ignore */ }
  }
};
