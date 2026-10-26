import { SecurityFinding } from '../models/types.js';

export interface CircuitBreakerStatus {
  tripped: boolean;
  reason?: string;
  triggerType?: 'CRITICAL_VULNERABILITY' | 'PROHIBITED_FILE_ACCESS' | 'TIMEOUT' | 'PATCH_HASH_TAMPERING' | 'SANDBOX_VIOLATION';
  diagnosticEvidence?: string;
}

export class CircuitBreaker {
  private prohibitedFilePatterns = [
    /\.env(\..+)?$/i,
    /id_rsa/i,
    /credentials\.json/i,
    /\/etc\//i,
    /C:\\Windows\\System32/i,
    /\.aws\/credentials/i
  ];

  /**
   * Evaluates security conditions during verification.
   */
  public evaluate(
    changedFiles: string[],
    securityFindings: SecurityFinding[],
    executionTimedOut: boolean,
    hashMismatchDetected: boolean
  ): CircuitBreakerStatus {
    // 1. Prohibited file access
    for (const file of changedFiles) {
      for (const pattern of this.prohibitedFilePatterns) {
        if (pattern.test(file)) {
          return {
            tripped: true,
            triggerType: 'PROHIBITED_FILE_ACCESS',
            reason: `Attempted modification of protected sensitive configuration file: ${file}`,
            diagnosticEvidence: `Patch manifests target file "${file}" matching prohibited security filter.`
          };
        }
      }
    }

    // 2. Critical security vulnerability
    const critical = securityFindings.find(f => f.severity === 'CRITICAL');
    if (critical) {
      return {
        tripped: true,
        triggerType: 'CRITICAL_VULNERABILITY',
        reason: `Critical security risk identified: ${critical.title} in ${critical.file_path}:${critical.line_number}`,
        diagnosticEvidence: `Rule ${critical.rule_id} triggered on snippet: "${critical.code_snippet}"`
      };
    }

    // 3. Execution timeout
    if (executionTimedOut) {
      return {
        tripped: true,
        triggerType: 'TIMEOUT',
        reason: 'Verification sandbox exceeded maximum execution time threshold (Circuit Breaker Protection)',
        diagnosticEvidence: 'Test runner aborted after exceeding execution limit to prevent runaway loops or ReDoS exhaustion.'
      };
    }

    // 4. Patch hash tampering
    if (hashMismatchDetected) {
      return {
        tripped: true,
        triggerType: 'PATCH_HASH_TAMPERING',
        reason: 'Integrity Violation: Reviewed patch hash diverges from the executed and verified shadow artifact.',
        diagnosticEvidence: 'SHA-256 validation failure between presented code and tested sandbox state.'
      };
    }

    return {
      tripped: false
    };
  }
}

export const circuitBreaker = new CircuitBreaker();
