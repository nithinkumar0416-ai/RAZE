import { 
  ReleaseRecommendation, 
  TestResult, 
  SecurityFinding, 
  Counterexample,
  MutationResult 
} from '../models/types.js';

export interface PolicyEvaluationInput {
  testResults: TestResult[];
  securityFindings: SecurityFinding[];
  confirmedCounterexamples: Counterexample[];
  mutationResults: MutationResult[];
  circuitBreakerTripped: boolean;
  circuitBreakerReason?: string;
  patchHashMatches: boolean;
  attemptNumber: number;
  maxRetries: number;
}

export interface PolicyDecision {
  recommendation: ReleaseRecommendation;
  verifiedChecks: string[];
  failedChecks: string[];
  blockingReasons: string[];
  remainingRisks: string[];
  explanation: string;
}

export class PolicyEngine {
  /**
   * Agent 6: Evidence Judge & Release Gate
   * Strictly enforces deterministic policy rules without LLM speculation or probabilistic guesswork.
   */
  public evaluate(input: PolicyEvaluationInput): PolicyDecision {
    const verifiedChecks: string[] = [];
    const failedChecks: string[] = [];
    const blockingReasons: string[] = [];
    const remainingRisks: string[] = [];

    // 1. Circuit Breaker Check
    if (input.circuitBreakerTripped) {
      blockingReasons.push(`Security Circuit Breaker Tripped: ${input.circuitBreakerReason || 'Execution stopped due to safety control'}`);
      failedChecks.push('Safety Circuit Breaker Enforced');
    } else {
      verifiedChecks.push('Safety Circuit Breaker: Operational & Untripped');
    }

    // 2. Patch Hash Integrity
    if (!input.patchHashMatches) {
      blockingReasons.push('Patch Identity Violation: Reviewed patch content SHA-256 does not match tested sandbox artifact.');
      failedChecks.push('Patch Identity SHA-256 Binding');
    } else {
      verifiedChecks.push('Patch Identity Verified: Byte-for-byte SHA-256 Match');
    }

    // 3. Test Suite Executions
    const baselineFailed = input.testResults.filter(t => t.status === 'FAILED' && t.test_type === 'BASELINE');
    const regressionFailed = input.testResults.filter(t => t.status === 'FAILED' && t.test_type === 'REGRESSION');
    const adversarialFailed = input.testResults.filter(t => t.status === 'FAILED' && t.test_type === 'ADVERSARIAL_EDGE');

    if (baselineFailed.length > 0) {
      blockingReasons.push(`${baselineFailed.length} baseline tests failed`);
      failedChecks.push('Baseline Functional Suite');
    } else if (input.testResults.some(t => t.test_type === 'BASELINE')) {
      verifiedChecks.push('Baseline Functional Suite: All Tests Passed');
    }

    if (regressionFailed.length > 0) {
      blockingReasons.push(`${regressionFailed.length} regression tests failed`);
      failedChecks.push('Standard Regression Suite');
    } else if (input.testResults.some(t => t.test_type === 'REGRESSION')) {
      verifiedChecks.push('Standard Regression Suite: All Tests Passed');
    }

    if (adversarialFailed.length > 0) {
      blockingReasons.push(`${adversarialFailed.length} adversarial boundary checks exposed active counterexamples`);
      failedChecks.push('Adversarial Boundary Validation');
    } else if (input.testResults.some(t => t.test_type === 'ADVERSARIAL_EDGE')) {
      verifiedChecks.push('Adversarial Boundary Validation: Counterexamples Resisted');
    }

    // 4. Confirmed Counterexamples
    if (input.confirmedCounterexamples.length > 0) {
      const titles = input.confirmedCounterexamples.map(c => c.title).join('; ');
      blockingReasons.push(`Trust Collapse Triggered: ${input.confirmedCounterexamples.length} confirmed counterexample(s) detected: ${titles}`);
      failedChecks.push('Counterexample Falsification Test');
    } else {
      verifiedChecks.push('Trust Falsification: No Counterexamples Discovered');
    }

    // 5. Security Analysis
    const criticalFindings = input.securityFindings.filter(f => f.severity === 'CRITICAL' && f.status !== 'RESOLVED');
    const highFindings = input.securityFindings.filter(f => f.severity === 'HIGH' && f.status !== 'RESOLVED');
    const mediumFindings = input.securityFindings.filter(f => f.severity === 'MEDIUM' && f.status !== 'RESOLVED');

    if (criticalFindings.length > 0) {
      blockingReasons.push(`${criticalFindings.length} unresolved critical security finding(s) detected`);
      failedChecks.push('Critical Security Vulnerability Gate');
    } else {
      verifiedChecks.push('Critical Security Scan: Clear');
    }

    if (highFindings.length > 0) {
      remainingRisks.push(`${highFindings.length} unresolved high-severity security finding(s) require manual review`);
    }

    if (mediumFindings.length > 0) {
      remainingRisks.push(`${mediumFindings.length} medium-severity finding(s) noted for review`);
    }

    // 6. Mutation Test Completeness
    const survivedMutants = input.mutationResults.filter(m => m.status === 'SURVIVED');
    if (survivedMutants.length > 0) {
      remainingRisks.push(`${survivedMutants.length} mutant(s) survived execution (potential test suite blindspot)`);
    }

    // Always document honest known limitations
    remainingRisks.push('Verification proves resistance against executed tests and simulated adversaries; it cannot guarantee total mathematical absence of defects in arbitrary unconstrained inputs.');

    // Deterministic Verdict Logic
    let recommendation: ReleaseRecommendation = 'READY_FOR_HUMAN_REVIEW';
    let explanation = '';

    if (blockingReasons.length > 0) {
      recommendation = 'BLOCKED';
      explanation = `Automated release recommendation is strictly BLOCKED due to ${blockingReasons.length} mandatory failure condition(s). An approval cannot proceed until all counterexamples and blocking tests are resolved.`;
    } else if (highFindings.length > 0 || input.testResults.length === 0) {
      recommendation = 'NEEDS_REVIEW';
      explanation = 'Automated checks passed baseline thresholds, but unresolved high-severity security risks or missing evidence require senior engineering review before approval.';
    } else {
      recommendation = 'READY_FOR_HUMAN_REVIEW';
      explanation = 'All mandatory executable tests passed, adversarial counterexamples were resolved, no critical security vulnerabilities were discovered, and patch SHA-256 matches. The patch is ready for explicit human review and sign-off.';
    }

    return {
      recommendation,
      verifiedChecks,
      failedChecks,
      blockingReasons,
      remainingRisks,
      explanation
    };
  }
}

export const policyEngine = new PolicyEngine();
