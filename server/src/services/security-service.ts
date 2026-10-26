import { SecurityFinding, FindingSeverity } from '../models/types.js';

interface SecurityRule {
  id: string;
  severity: FindingSeverity;
  title: string;
  pattern: RegExp;
  mitigation: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: 'SEC-001',
    severity: 'CRITICAL',
    title: 'Arbitrary Code Execution via eval() or new Function()',
    pattern: /\b(eval\s*\(|new\s+Function\s*\()/i,
    mitigation: 'Refactor to safe deterministic logic. Never evaluate dynamic string expressions.'
  },
  {
    id: 'SEC-002',
    severity: 'CRITICAL',
    title: 'Command Injection via Unsanitized Child Process Execution',
    pattern: /\b(child_process|exec\s*\(|execSync\s*\(|spawn\s*\([^,]+,\s*\{[^}]*shell:\s*true)/i,
    mitigation: 'Avoid shell execution or pass arguments as discrete parameterized arrays with shell: false.'
  },
  {
    id: 'SEC-003',
    severity: 'HIGH',
    title: 'Path Traversal Vulnerability',
    pattern: /\.\.[\/\\]|path\.resolve\([^)]*req\.|\breadFile(Sync)?\s*\([^)]*\.\./i,
    mitigation: 'Sanitize relative file paths using path.resolve and verify they remain within the base directory root.'
  },
  {
    id: 'SEC-004',
    severity: 'HIGH',
    title: 'Prototype Pollution Vector',
    pattern: /(__proto__|constructor\.prototype|Object\.assign\s*\([^,]*,\s*req\.)/i,
    mitigation: 'Prevent direct assignment to prototype keys and use Object.create(null) or Map.'
  },
  {
    id: 'SEC-005',
    severity: 'CRITICAL',
    title: 'Exposed Hardcoded Secret or API Key',
    pattern: /(sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|bearer\s+[a-zA-Z0-9_\-\.]{25,})/i,
    mitigation: 'Remove hardcoded credentials immediately and load sensitive tokens via environment variables.'
  },
  {
    id: 'SEC-006',
    severity: 'MEDIUM',
    title: 'Unbounded Regular Expression (ReDoS risk)',
    pattern: /\/([a-zA-Z0-9_+*.-]+)\+\/\+/i,
    mitigation: 'Avoid nested quantifiers in regular expressions to prevent catastrophic backtracking.'
  }
];

export class SecurityService {
  /**
   * Agent 4: Security Guardian
   * Scans patch diffs and source code files for known vulnerability signatures and security anti-patterns.
   */
  public analyzePatch(
    runId: string,
    attemptNumber: number,
    filePath: string,
    fileContent: string
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = fileContent.split('\n');

    for (const rule of SECURITY_RULES) {
      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          findings.push({
            id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            run_id: runId,
            attempt_number: attemptNumber,
            rule_id: rule.id,
            severity: rule.severity,
            title: rule.title,
            file_path: filePath,
            line_number: index + 1,
            code_snippet: line.trim(),
            detection_method: 'Static AST/Regex Rule Engine',
            mitigation: rule.mitigation,
            confirmed: true,
            status: 'OPEN',
            created_at: new Date().toISOString()
          });
        }
      });
    }

    return findings;
  }
}

export const securityService = new SecurityService();
