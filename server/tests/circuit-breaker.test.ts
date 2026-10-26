import { describe, it, expect } from 'vitest';
import { circuitBreaker } from '../src/services/circuit-breaker.js';
import { SecurityFinding } from '../src/models/types.js';

describe('Security Circuit Breaker', () => {
  it('trips immediately on prohibited file access (.env or credentials)', () => {
    const status = circuitBreaker.evaluate(
      ['src/index.ts', '.env.production'],
      [],
      false,
      false
    );

    expect(status.tripped).toBe(true);
    expect(status.triggerType).toBe('PROHIBITED_FILE_ACCESS');
    expect(status.reason).toContain('.env.production');
  });

  it('trips on critical security vulnerabilities in patch', () => {
    const criticalFinding: SecurityFinding = {
      id: 's-1',
      run_id: 'r-1',
      attempt_number: 1,
      rule_id: 'SEC-001',
      severity: 'CRITICAL',
      title: 'Arbitrary Code Execution via eval()',
      file_path: 'src/discount.ts',
      line_number: 14,
      code_snippet: 'eval(userInput)',
      detection_method: 'Static AST/Regex Rule Engine',
      mitigation: 'Refactor to deterministic code',
      confirmed: true,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };

    const status = circuitBreaker.evaluate(
      ['src/discount.ts'],
      [criticalFinding],
      false,
      false
    );

    expect(status.tripped).toBe(true);
    expect(status.triggerType).toBe('CRITICAL_VULNERABILITY');
    expect(status.reason).toContain('Critical security risk identified');
  });

  it('trips on execution timeouts', () => {
    const status = circuitBreaker.evaluate(
      ['src/discount.ts'],
      [],
      true, // timeout!
      false
    );

    expect(status.tripped).toBe(true);
    expect(status.triggerType).toBe('TIMEOUT');
  });

  it('remains untripped under safe operating conditions', () => {
    const status = circuitBreaker.evaluate(
      ['src/discount.ts'],
      [],
      false,
      false
    );

    expect(status.tripped).toBe(false);
  });
});
