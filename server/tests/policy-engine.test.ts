import { describe, it, expect } from 'vitest';
import { policyEngine } from '../src/services/policy-engine.js';
import { TestResult, SecurityFinding, Counterexample, MutationResult } from '../src/models/types.js';

describe('Deterministic Policy Engine (Agent 6)', () => {
  it('blocks approval if any baseline or regression test fails', () => {
    const failedTest: TestResult = {
      id: 't-1',
      run_id: 'r-1',
      attempt_number: 1,
      suite_name: 'discount.test.js',
      test_name: 'normal discount',
      test_type: 'BASELINE',
      status: 'FAILED',
      duration_ms: 12,
      created_at: new Date().toISOString()
    };

    const decision = policyEngine.evaluate({
      testResults: [failedTest],
      securityFindings: [],
      confirmedCounterexamples: [],
      mutationResults: [],
      circuitBreakerTripped: false,
      patchHashMatches: true,
      attemptNumber: 1,
      maxRetries: 3
    });

    expect(decision.recommendation).toBe('BLOCKED');
    expect(decision.blockingReasons.some(r => r.includes('baseline tests failed'))).toBe(true);
    expect(decision.failedChecks).toContain('Baseline Functional Suite');
  });

  it('blocks approval if active confirmed counterexamples exist', () => {
    const counterexample: Counterexample = {
      id: 'ce-1',
      run_id: 'r-1',
      attempt_number: 1,
      title: 'Negative discount exploit',
      input_payload: 'calculateDiscount(100, -20)',
      expected_behavior: 'Throw error',
      actual_behavior: 'Final price 120',
      reproduction_command: 'node --test',
      confirmed: true,
      created_at: new Date().toISOString()
    };

    const decision = policyEngine.evaluate({
      testResults: [],
      securityFindings: [],
      confirmedCounterexamples: [counterexample],
      mutationResults: [],
      circuitBreakerTripped: false,
      patchHashMatches: true,
      attemptNumber: 1,
      maxRetries: 3
    });

    expect(decision.recommendation).toBe('BLOCKED');
    expect(decision.blockingReasons.some(r => r.includes('Trust Collapse'))).toBe(true);
  });

  it('blocks approval if reviewed patch hash does not match tested sandbox artifact', () => {
    const decision = policyEngine.evaluate({
      testResults: [{
        id: 't-1',
        run_id: 'r-1',
        attempt_number: 1,
        suite_name: 'discount.test.js',
        test_name: 'pass',
        test_type: 'REGRESSION',
        status: 'PASSED',
        duration_ms: 10,
        created_at: new Date().toISOString()
      }],
      securityFindings: [],
      confirmedCounterexamples: [],
      mutationResults: [],
      circuitBreakerTripped: false,
      patchHashMatches: false, // MISMATCH!
      attemptNumber: 1,
      maxRetries: 3
    });

    expect(decision.recommendation).toBe('BLOCKED');
    expect(decision.blockingReasons.some(r => r.includes('Patch Identity Violation'))).toBe(true);
  });

  it('evaluates to READY_FOR_HUMAN_REVIEW when all required checks pass and hashes match', () => {
    const passedTest: TestResult = {
      id: 't-1',
      run_id: 'r-1',
      attempt_number: 2,
      suite_name: 'discount.test.js',
      test_name: 'applies normal discount correctly',
      test_type: 'REGRESSION',
      status: 'PASSED',
      duration_ms: 15,
      created_at: new Date().toISOString()
    };

    const decision = policyEngine.evaluate({
      testResults: [passedTest],
      securityFindings: [],
      confirmedCounterexamples: [],
      mutationResults: [{
        id: 'm-1',
        run_id: 'r-1',
        attempt_number: 2,
        mutant_id: 'MUT-001',
        file_path: 'src/discount.ts',
        line_number: 10,
        mutator_name: 'BoundaryMutation',
        original_code: '>',
        mutated_code: '>=',
        status: 'KILLED',
        created_at: new Date().toISOString()
      }],
      circuitBreakerTripped: false,
      patchHashMatches: true,
      attemptNumber: 2,
      maxRetries: 3
    });

    expect(decision.recommendation).toBe('READY_FOR_HUMAN_REVIEW');
    expect(decision.blockingReasons.length).toBe(0);
    // Explicit rule from prompt: NEVER output "100% SAFE"
    expect(decision.recommendation).not.toBe('100% SAFE');
    expect(decision.remainingRisks.length).toBeGreaterThan(0);
  });
});
