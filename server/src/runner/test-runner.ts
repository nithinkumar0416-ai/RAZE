import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { TestResult, TestType } from '../models/types.js';

export interface RunOptions {
  timeoutMs?: number;
  maxBufferBytes?: number;
}

export class TestRunner {
  private defaultTimeoutMs = 7000;
  private maxLogBytes = 64 * 1024; // 64KB bound

  /**
   * Executes a test file or command in the shadow workspace and returns structured results.
   */
  public async executeTestFile(
    workspacePath: string,
    relativeTestFile: string,
    testType: TestType,
    runId: string,
    attemptNumber: number,
    options?: RunOptions
  ): Promise<TestResult[]> {
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const testFullPath = path.resolve(workspacePath, relativeTestFile);

    const startTime = Date.now();
    
    // Resolve tsx cli path from node_modules for high performance direct execution
    const tsxPath = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const command = process.execPath; // node binary
    const args = fs.existsSync(tsxPath)
      ? [tsxPath, '--test', testFullPath]
      : ['--test', testFullPath];

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killedDueToTimeout = false;

      const proc = spawn(command, args, {
        cwd: workspacePath,
        shell: false,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          FORCE_COLOR: '0'
        }
      });

      const timer = setTimeout(() => {
        killedDueToTimeout = true;
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) proc.kill('SIGKILL');
        }, 500);
      }, timeoutMs);

      proc.stdout.on('data', (chunk) => {
        if (stdout.length < this.maxLogBytes) {
          stdout += chunk.toString();
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (stderr.length < this.maxLogBytes) {
          stderr += chunk.toString();
        }
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        const results = this.parseNodeTestOutput(
          stdout,
          stderr,
          code ?? 1,
          duration,
          killedDueToTimeout,
          path.basename(relativeTestFile),
          testType,
          runId,
          attemptNumber,
          `node --test ${relativeTestFile}`
        );
        resolve(results);
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        resolve([{
          id: `test-err-${Date.now()}`,
          run_id: runId,
          attempt_number: attemptNumber,
          suite_name: path.basename(relativeTestFile),
          test_name: 'Process Execution',
          test_type: testType,
          status: 'FAILED',
          duration_ms: duration,
          failure_message: `Failed to spawn test process: ${err.message}`,
          reproduction_command: `node --test ${relativeTestFile}`,
          stdout,
          stderr: err.message,
          created_at: new Date().toISOString()
        }]);
      });
    });
  }

  /**
   * Parses Node.js TAP/test runner output into structured test cases.
   */
  private parseNodeTestOutput(
    stdout: string,
    stderr: string,
    exitCode: number,
    durationMs: number,
    isTimeout: boolean,
    suiteName: string,
    testType: TestType,
    runId: string,
    attemptNumber: number,
    reproCmd: string
  ): TestResult[] {
    const results: TestResult[] = [];
    const lines = stdout.split('\n');

    // Parse TAP or TAP-like lines: "ok 1 - test description" or "not ok 2 - test description"
    const tapRegex = /^(ok|not ok)\s+\d+\s+-\s+(.+?)(?:\s+#\s+time=([\d.]+)ms)?$/;

    for (const line of lines) {
      const match = line.trim().match(tapRegex);
      if (match) {
        const isOk = match[1] === 'ok';
        const testName = match[2].trim();
        const testTime = match[3] ? Math.round(parseFloat(match[3])) : Math.round(durationMs / 4);

        results.push({
          id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          run_id: runId,
          attempt_number: attemptNumber,
          suite_name: suiteName,
          test_name: testName,
          test_type: testType,
          status: isOk ? 'PASSED' : (isTimeout ? 'TIMED_OUT' : 'FAILED'),
          duration_ms: testTime,
          failure_message: isOk ? undefined : (isTimeout ? `Execution timed out after ${durationMs}ms` : `Assertion failed in ${testName}`),
          reproduction_command: reproCmd,
          stdout,
          stderr,
          created_at: new Date().toISOString()
        });
      }
    }

    // Fallback if output format wasn't standard TAP
    if (results.length === 0) {
      const passed = exitCode === 0 && !isTimeout;
      results.push({
        id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        run_id: runId,
        attempt_number: attemptNumber,
        suite_name: suiteName,
        test_name: `${suiteName} Suite`,
        test_type: testType,
        status: passed ? 'PASSED' : (isTimeout ? 'TIMED_OUT' : 'FAILED'),
        duration_ms: durationMs,
        failure_message: passed ? undefined : (isTimeout ? `Execution timed out after ${durationMs}ms` : `Process exited with code ${exitCode}`),
        reproduction_command: reproCmd,
        stdout,
        stderr,
        created_at: new Date().toISOString()
      });
    }

    return results;
  }
}

export const testRunner = new TestRunner();
