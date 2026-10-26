import { Counterexample, TestResult } from '../models/types.js';
import { testRunner } from '../runner/test-runner.js';

export interface HunterCandidate {
  title: string;
  inputPayload: string;
  expectedBehavior: string;
  codeLocation: string;
  reproductionCommand: string;
}

export class CounterexampleService {
  /**
   * Generates candidate adversarial counterexamples to challenge the patch.
   */
  public generateCandidates(): HunterCandidate[] {
    return [
      {
        title: 'Negative discount percentage causes price inflation exploit',
        inputPayload: 'calculateDiscount(100, -20)',
        expectedBehavior: 'Throws Error: "Discount percentage cannot be negative"',
        codeLocation: 'src/discount.ts:16',
        reproductionCommand: 'node --test tests/adversarial.test.js --grep="rejects negative discount"'
      },
      {
        title: 'Negative base price allows inverted invoicing balance',
        inputPayload: 'calculateDiscount(-50, 10)',
        expectedBehavior: 'Throws Error: "Price cannot be negative"',
        codeLocation: 'src/discount.ts:13',
        reproductionCommand: 'node --test tests/adversarial.test.js --grep="rejects negative base price"'
      },
      {
        title: 'NaN base price corrupts numeric transaction pipeline',
        inputPayload: 'calculateDiscount(NaN, 15)',
        expectedBehavior: 'Throws Error: "Price must be a valid finite number"',
        codeLocation: 'src/discount.ts:10',
        reproductionCommand: 'node --test tests/adversarial.test.js --grep="rejects NaN base price"'
      },
      {
        title: 'Excessive discount percentage (>100%) drains store funds',
        inputPayload: 'calculateDiscount(100, 150)',
        expectedBehavior: 'Throws Error: "Discount percentage cannot exceed 100%"',
        codeLocation: 'src/discount.ts:19',
        reproductionCommand: 'node --test tests/adversarial.test.js --grep="exceeding 100%"'
      },
      {
        title: 'Infinity numerical state causes endless float arithmetic',
        inputPayload: 'calculateDiscount(100, Infinity)',
        expectedBehavior: 'Throws Error: "Discount percentage must be a valid finite number"',
        codeLocation: 'src/discount.ts:16',
        reproductionCommand: 'node --test tests/adversarial.test.js --grep="rejects Infinity"'
      }
    ];
  }

  /**
   * Executes adversarial tests against the shadow workspace to confirm whether any counterexample succeeds in falsifying trust!
   */
  public async executeAdversarialTests(
    workspacePath: string,
    runId: string,
    attemptNumber: number
  ): Promise<{ testResults: TestResult[]; confirmedCounterexamples: Counterexample[] }> {
    const testResults = await testRunner.executeTestFile(
      workspacePath,
      'tests/adversarial.test.ts',
      'ADVERSARIAL_EDGE',
      runId,
      attemptNumber
    );

    const candidates = this.generateCandidates();
    const confirmedCounterexamples: Counterexample[] = [];

    // Any failed test in adversarial suite represents a confirmed counterexample!
    const failedTests = testResults.filter(t => t.status === 'FAILED');

    for (const failed of failedTests) {
      // Match candidate or build counterexample
      const candidate = candidates.find(c => 
        failed.test_name.toLowerCase().includes('negative') || 
        failed.test_name.toLowerCase().includes('nan') ||
        failed.test_name.toLowerCase().includes('infinity')
      ) || candidates[0];

      confirmedCounterexamples.push({
        id: `ce-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        run_id: runId,
        attempt_number: attemptNumber,
        title: candidate.title,
        input_payload: candidate.inputPayload,
        expected_behavior: candidate.expectedBehavior,
        actual_behavior: failed.failure_message || 'Unhandled return value without exception',
        code_location: candidate.codeLocation,
        reproduction_command: candidate.reproductionCommand,
        confirmed: true, // Only confirmed because actual execution failed!
        evidence_artifact: `Execution exit code 1. Stderr: ${failed.stderr || 'Assertion failed'}`,
        created_at: new Date().toISOString()
      });
    }

    return {
      testResults,
      confirmedCounterexamples
    };
  }
}

export const counterexampleService = new CounterexampleService();
