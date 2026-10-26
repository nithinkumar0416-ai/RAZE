import { db } from '../db/database.js';
import { 
  VerificationRun, 
  PatchAttempt, 
  TestResult, 
  Counterexample, 
  MutationResult, 
  SecurityFinding,
  EvidenceRecord,
  ReleaseRecommendation
} from '../models/types.js';

export interface ComprehensiveEvidenceReport {
  run: VerificationRun;
  patchAttempts: PatchAttempt[];
  testResults: TestResult[];
  counterexamples: Counterexample[];
  mutationResults: MutationResult[];
  securityFindings: SecurityFinding[];
  decision: {
    recommendation: ReleaseRecommendation;
    verifiedChecks: string[];
    failedChecks: string[];
    remainingRisks: string[];
    explanation: string;
  };
  generatedAt: string;
}

export class EvidenceService {
  /**
   * Compiles the comprehensive evidence payload from SQLite.
   */
  public compileEvidence(runId: string): ComprehensiveEvidenceReport {
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(runId) as any;
    if (!run) throw new Error(`Run not found: ${runId}`);

    const patchAttempts = db.prepare('SELECT * FROM patch_attempts WHERE run_id = ? ORDER BY attempt_number ASC').all(runId) as any[];
    const testResults = db.prepare('SELECT * FROM test_results WHERE run_id = ? ORDER BY attempt_number ASC, created_at ASC').all(runId) as any[];
    const counterexamples = db.prepare('SELECT * FROM counterexamples WHERE run_id = ? ORDER BY attempt_number ASC').all(runId) as any[];
    const mutationResults = db.prepare('SELECT * FROM mutation_results WHERE run_id = ? ORDER BY attempt_number ASC').all(runId) as any[];
    const securityFindings = db.prepare('SELECT * FROM security_findings WHERE run_id = ? ORDER BY attempt_number ASC').all(runId) as any[];
    const evidenceRecord = db.prepare('SELECT * FROM evidence_records WHERE run_id = ?').get(runId) as any;

    const mappedPatches = patchAttempts.map(p => ({
      ...p,
      changed_files: JSON.parse(p.changed_files)
    }));

    const mappedCounterexamples = counterexamples.map(c => ({
      ...c,
      confirmed: Boolean(c.confirmed)
    }));

    const verifiedChecks: string[] = evidenceRecord?.verified_checks ? JSON.parse(evidenceRecord.verified_checks) : [];
    const failedChecks: string[] = evidenceRecord?.failed_checks ? JSON.parse(evidenceRecord.failed_checks) : [];
    const remainingRisks: string[] = evidenceRecord?.remaining_risks ? JSON.parse(evidenceRecord.remaining_risks) : [];

    return {
      run: {
        ...run,
        circuit_breaker_tripped: Boolean(run.circuit_breaker_tripped)
      },
      patchAttempts: mappedPatches,
      testResults,
      counterexamples: mappedCounterexamples,
      mutationResults,
      securityFindings: securityFindings.map(s => ({ ...s, confirmed: Boolean(s.confirmed) })),
      decision: {
        recommendation: run.release_recommendation,
        verifiedChecks,
        failedChecks,
        remainingRisks,
        explanation: evidenceRecord?.summary_markdown || 'No summary compiled yet.'
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Formats a downloadable GitHub-flavored Markdown evidence report.
   */
  public generateMarkdownReport(report: ComprehensiveEvidenceReport): string {
    const { run, patchAttempts, testResults, counterexamples, mutationResults, securityFindings, decision } = report;

    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = testResults.filter(t => t.status === 'FAILED').length;
    const killedMutants = mutationResults.filter(m => m.status === 'KILLED').length;
    const mutationScore = mutationResults.length > 0 ? Math.round((killedMutants / mutationResults.length) * 100) : 'N/A';

    return `# 🛡️ OpenGuard AI — Verification & Release Evidence Dossier

**Run ID:** \`${run.id}\`  
**Target Defect:** ${run.defect_title}  
**Target File:** \`${run.target_file}\`  
**Final Release Recommendation:** **\`${decision.recommendation}\`**  
**Generated At:** ${report.generatedAt}  
**Active Patch SHA-256:** \`${run.active_patch_hash || 'None'}\`

---

## 1. Executive Summary & Policy Verdict

> **Recommendation: ${decision.recommendation}**  
> ${decision.explanation}

### Verification Matrix
- **Total Test Checks Executed:** ${totalTests} (${passedTests} passed, ${failedTests} failed)
- **Confirmed Counterexamples:** ${counterexamples.filter(c => c.confirmed).length}
- **Mutation Resistance Score:** ${mutationScore}% (${killedMutants}/${mutationResults.length} mutants killed)
- **Security Vulnerability Findings:** ${securityFindings.length} (${securityFindings.filter(s => s.severity === 'CRITICAL').length} critical)
- **Circuit Breaker Status:** ${run.circuit_breaker_tripped ? '🚨 TRIPPED: ' + run.circuit_breaker_reason : '✅ Untripped / Safe'}

---

## 2. Verified Claims & Evidence Checklist

### ✅ Checks Verified
${decision.verifiedChecks.length > 0 ? decision.verifiedChecks.map(c => `- [x] ${c}`).join('\n') : '_None_'}

### ❌ Mandatory Checks Failed
${decision.failedChecks.length > 0 ? decision.failedChecks.map(c => `- [ ] **${c}**`).join('\n') : '_None_'}

### ⚠️ Remaining Documented Risks & Limitations
${decision.remainingRisks.map(r => `- ${r}`).join('\n')}

---

## 3. Repair Iterations & Patch Integrity

${patchAttempts.map(p => `
### Attempt #${p.attempt_number} — Status: \`${p.status}\`
- **Patch SHA-256:** \`${p.patch_hash}\`
- **Expected Behavior:** ${p.expected_behavior}
- **Known Risks:** ${p.known_risks}
- **Explanation:** ${p.explanation || 'N/A'}

\`\`\`diff
${p.unified_diff}
\`\`\`
`).join('\n')}

---

## 4. Adversarial Counterexamples & Falsification Records

${counterexamples.length === 0 ? '_No counterexamples recorded._' : counterexamples.map(c => `
- **Title:** ${c.title}
  - **Input Payload:** \`${c.input_payload}\`
  - **Expected:** ${c.expected_behavior}
  - **Actual:** ${c.actual_behavior}
  - **Reproduction Command:** \`${c.reproduction_command}\`
  - **Confirmed by Executable Run:** ${c.confirmed ? 'YES' : 'NO'}
`).join('\n')}

---

## 5. Security Guardian Analysis

${securityFindings.length === 0 ? '_Zero security vulnerabilities detected._' : securityFindings.map(s => `
- **[${s.severity}] ${s.title}** (\`${s.rule_id}\`)
  - **Location:** \`${s.file_path}:${s.line_number}\`
  - **Code:** \`${s.code_snippet}\`
  - **Mitigation:** ${s.mitigation}
  - **Status:** \`${s.status}\`
`).join('\n')}

---

## 6. Mutation Testing Trust Analysis

- **Mutants Evaluated:** ${mutationResults.length}
- **Mutants Killed:** ${killedMutants}
- **Mutants Survived:** ${mutationResults.filter(m => m.status === 'SURVIVED').length}
- **Mutation Score:** ${mutationScore}%

${mutationResults.map(m => `
- **${m.mutant_id}** (\`${m.mutator_name}\` at line ${m.line_number}) — **\`${m.status}\`**
  - Original: \`${m.original_code}\`
  - Mutated: \`${m.mutated_code}\`
  ${m.killer_test ? `- Killer Test: \`${m.killer_test}\`` : ''}
  ${m.suggested_test ? `- Suggested Stronger Test: ${m.suggested_test}` : ''}
`).join('\n')}

---

## 7. Execution Logs & Reproduction Artifacts

\`\`\`bash
# Reproduction Command for Active Snapshot
node --test tests/discount.test.js
node --test tests/adversarial.test.js
\`\`\`

> **Legal & Architectural Disclaimer:**  
> OpenGuard AI strictly reports what was tested, what passed, and what was resisted. No computational tool can mathematically guarantee zero risk in unconstrained runtime environments. Final release requires human sign-off bound to Patch SHA-256 \`${run.active_patch_hash || 'N/A'}\`.
`;
  }
}

export const evidenceService = new EvidenceService();
