import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db/database.js';
import { eventBus } from './event-bus.js';
import { repositoryService } from './repository-service.js';
import { shadowModeService, ShadowWorkspace } from './shadow-mode-service.js';
import { investigationService } from './investigation-service.js';
import { repairService } from './repair-service.js';
import { counterexampleService } from './counterexample-service.js';
import { securityService } from './security-service.js';
import { mutationService } from './mutation-service.js';
import { circuitBreaker } from './circuit-breaker.js';
import { policyEngine } from './policy-engine.js';
import { evidenceService } from './evidence-service.js';
import { memoryService } from './memory-service.js';
import { testRunner } from '../runner/test-runner.js';
import { 
  VerificationRun, 
  AgentId, 
  AgentStatus, 
  RunStage, 
  Counterexample,
  TestResult,
  SecurityFinding,
  MutationResult
} from '../models/types.js';

export class VerificationEngine {
  /**
   * Starts a full automated verification run through the Trust Collapse Engine.
   */
  public async executeRun(runId: string): Promise<void> {
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(runId) as any;
    if (!run) throw new Error(`Run not found: ${runId}`);

    const repo = repositoryService.getById(run.repository_id);
    if (!repo) throw new Error(`Repo not found: ${run.repository_id}`);

    try {
      this.updateRunStatus(runId, 'RUNNING', 'BASELINE');

      // ─────────────────────────────────────────────────────────────
      // STAGE 1: ESTABLISH THE BASELINE
      // ─────────────────────────────────────────────────────────────
      await this.logAgentStart(runId, 'investigator', 'Repository Investigator', 'Inspecting codebase, tracing symbols, and reproducing baseline bug.');
      
      const targetFileContent = repositoryService.getFileContent(repo.id, run.target_file);
      const investigation = await investigationService.investigate(
        repo.id,
        run.defect_title,
        run.defect_description,
        run.target_file,
        targetFileContent
      );

      // Create initial Shadow Workspace for Attempt 1
      let currentAttempt = 1;
      let shadowWorkspace = shadowModeService.createShadowWorkspace(runId, currentAttempt, repo.path);

      // Run baseline test suite in shadow workspace
      const baselineTests = await testRunner.executeTestFile(
        shadowWorkspace.workspacePath,
        'tests/discount.test.ts',
        'BASELINE',
        runId,
        currentAttempt
      );
      this.persistTestResults(baselineTests);

      await this.logAgentComplete(runId, 'investigator', 'Baseline established and root cause hypotheses identified.', investigation);

      let verified = false;
      let latestCounterexamples: Counterexample[] = [];
      let activePatchHash = '';

      // Loop for Bounded Repairs & Challenges (Attempts 1 to max_retries)
      while (currentAttempt <= run.max_retries && !verified) {
        this.updateRunAttempt(runId, currentAttempt);

        // ─────────────────────────────────────────────────────────────
        // STAGE 2: PROPOSE A REPAIR
        // ─────────────────────────────────────────────────────────────
        this.updateRunStage(runId, 'REPAIR');
        await this.logAgentStart(
          runId, 
          'repair', 
          'Autonomous Repair Engineer', 
          `Synthesizing bounded patch for Attempt #${currentAttempt}${latestCounterexamples.length > 0 ? ' incorporating counterexample evidence' : ''}.`
        );

        const repairProposal = repairService.generateRepair(
          currentAttempt,
          targetFileContent,
          run.target_file,
          latestCounterexamples
        );

        // Record patch attempt in SQLite
        this.persistPatchAttempt(runId, currentAttempt, repairProposal);

        // Apply patch to isolated shadow workspace
        const { patchHash } = shadowModeService.applyPatch(
          shadowWorkspace,
          run.target_file,
          repairProposal.newContent
        );
        activePatchHash = patchHash;
        this.updateActivePatchHash(runId, patchHash);

        eventBus.emit({
          type: 'patch.generated',
          run_id: runId,
          timestamp: new Date().toISOString(),
          data: {
            attemptNumber: currentAttempt,
            patchHash,
            unifiedDiff: repairProposal.unifiedDiff,
            expectedBehavior: repairProposal.expectedBehavior
          }
        });

        await this.logAgentComplete(runId, 'repair', `Generated reviewable patch attempt #${currentAttempt}`, {
          patchHash,
          changedFiles: repairProposal.changedFiles,
          explanation: repairProposal.explanation
        });

        // ─────────────────────────────────────────────────────────────
        // STAGE 3: CHALLENGE THE REPAIR (Adversarial Counterexample Hunter)
        // ─────────────────────────────────────────────────────────────
        this.updateRunStage(runId, 'CHALLENGE');
        await this.logAgentStart(
          runId,
          'counterexample',
          'Adversarial Counterexample Hunter',
          `Subjecting patch #${currentAttempt} to adversarial boundary conditions and negative test scenarios.`
        );

        const { testResults: adversarialTests, confirmedCounterexamples } = 
          await counterexampleService.executeAdversarialTests(
            shadowWorkspace.workspacePath,
            runId,
            currentAttempt
          );

        this.persistTestResults(adversarialTests);
        this.persistCounterexamples(confirmedCounterexamples);

        // ─────────────────────────────────────────────────────────────
        // STAGE 4: SEARCH FOR COLLATERAL DAMAGE & RUN SECURITY/MUTATION
        // ─────────────────────────────────────────────────────────────
        this.updateRunStage(runId, 'COLLATERAL_SEARCH');
        
        // 4A: Regression Tests
        const regressionTests = await testRunner.executeTestFile(
          shadowWorkspace.workspacePath,
          'tests/discount.test.ts',
          'REGRESSION',
          runId,
          currentAttempt
        );
        this.persistTestResults(regressionTests);

        // 4B: Security Guardian Analysis
        await this.logAgentStart(runId, 'security', 'Security Guardian', 'Performing static AST & pattern analysis for security vulnerabilities.');
        const securityFindings = securityService.analyzePatch(
          runId,
          currentAttempt,
          run.target_file,
          repairProposal.newContent
        );
        this.persistSecurityFindings(securityFindings);
        await this.logAgentComplete(runId, 'security', `Security scan complete with ${securityFindings.length} findings.`, { findings: securityFindings });

        // 4C: Test Integrity Engineer (Mutation Testing)
        await this.logAgentStart(runId, 'test_integrity', 'Test Integrity Engineer', 'Executing mutation testing against patch to evaluate test suite strength.');
        const mutationReport = await mutationService.runMutationAnalysis(
          shadowWorkspace.workspacePath,
          run.target_file,
          'tests/discount.test.ts',
          runId,
          currentAttempt
        );
        this.persistMutationResults(mutationReport.results);
        await this.logAgentComplete(runId, 'test_integrity', `Mutation analysis finished with score ${mutationReport.mutationScore}%`, mutationReport);

        // 4D: Circuit Breaker Check
        const cbStatus = circuitBreaker.evaluate(
          repairProposal.changedFiles,
          securityFindings,
          false,
          false
        );

        if (cbStatus.tripped) {
          this.tripCircuitBreaker(runId, cbStatus.reason || 'Circuit breaker tripped');
          eventBus.emit({
            type: 'circuit_breaker.activated',
            run_id: runId,
            timestamp: new Date().toISOString(),
            data: cbStatus
          });
          shadowModeService.cleanupWorkspace(shadowWorkspace);
          return;
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 5: COLLAPSE UNSUPPORTED TRUST
        // ─────────────────────────────────────────────────────────────
        if (confirmedCounterexamples.length > 0) {
          this.updateRunStage(runId, 'TRUST_COLLAPSE');
          latestCounterexamples = confirmedCounterexamples;

          // Mark patch attempt as TRUST_COLLAPSED
          db.prepare('UPDATE patch_attempts SET status = ? WHERE run_id = ? AND attempt_number = ?')
            .run('TRUST_COLLAPSED', runId, currentAttempt);

          eventBus.emit({
            type: 'counterexample.discovered',
            run_id: runId,
            timestamp: new Date().toISOString(),
            data: {
              attemptNumber: currentAttempt,
              counterexamples: confirmedCounterexamples
            }
          });

          await this.logAgentComplete(
            runId,
            'counterexample',
            `Trust collapsed! Discovered ${confirmedCounterexamples.length} confirmed counterexample(s) that falsified the patch.`,
            { counterexamples: confirmedCounterexamples }
          );

          if (currentAttempt < run.max_retries) {
            // Stage 6: Repair Retry
            this.updateRunStage(runId, 'REPAIR_RETRY');
            eventBus.emit({
              type: 'repair.retry',
              run_id: runId,
              timestamp: new Date().toISOString(),
              data: {
                fromAttempt: currentAttempt,
                toAttempt: currentAttempt + 1,
                reason: 'Feeding counterexample failure evidence back into Repair Engineer'
              }
            });

            // Clean up previous shadow workspace and advance attempt
            shadowModeService.cleanupWorkspace(shadowWorkspace);
            currentAttempt++;
            shadowWorkspace = shadowModeService.createShadowWorkspace(runId, currentAttempt, repo.path);
          } else {
            // Max retries reached with unresolved counterexamples
            break;
          }
        } else {
          // Counterexamples resisted! All tests passed!
          verified = true;
          db.prepare('UPDATE patch_attempts SET status = ? WHERE run_id = ? AND attempt_number = ?')
            .run('PASSED_VERIFICATION', runId, currentAttempt);
          await this.logAgentComplete(
            runId,
            'counterexample',
            'All adversarial counterexample checks resisted! Patch satisfied boundary conditions.',
            { status: 'PASSED' }
          );
        }
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 7: PRODUCE A RELEASE RECOMMENDATION (Evidence Judge)
      // ─────────────────────────────────────────────────────────────
      this.updateRunStage(runId, 'RELEASE_GATE');
      await this.logAgentStart(runId, 'evidence_judge', 'Evidence Judge & Release Gate', 'Aggregating all tool outputs and evaluating deterministic release policy.');

      const allTests = db.prepare('SELECT * FROM test_results WHERE run_id = ? AND attempt_number = ?').all(runId, currentAttempt) as unknown as TestResult[];
      const allFindings = db.prepare('SELECT * FROM security_findings WHERE run_id = ? AND attempt_number = ?').all(runId, currentAttempt) as unknown as SecurityFinding[];
      const allCounterexamples = db.prepare('SELECT * FROM counterexamples WHERE run_id = ? AND attempt_number = ?').all(runId, currentAttempt) as unknown as Counterexample[];
      const allMutants = db.prepare('SELECT * FROM mutation_results WHERE run_id = ? AND attempt_number = ?').all(runId, currentAttempt) as unknown as MutationResult[];

      const policyDecision = policyEngine.evaluate({
        testResults: allTests,
        securityFindings: allFindings,
        confirmedCounterexamples: allCounterexamples,
        mutationResults: allMutants,
        circuitBreakerTripped: false,
        patchHashMatches: true,
        attemptNumber: currentAttempt,
        maxRetries: run.max_retries
      });

      // Save Evidence Record
      const evidenceSummary = `Release Recommendation: ${policyDecision.recommendation}.\n${policyDecision.explanation}`;
      const insertEvidence = db.prepare(`
        INSERT INTO evidence_records (
          id, run_id, patch_hash, release_decision, summary_markdown, full_json_artifact, verified_checks, failed_checks, remaining_risks, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertEvidence.run(
        `ev-${Date.now()}`,
        runId,
        activePatchHash,
        policyDecision.recommendation,
        evidenceSummary,
        JSON.stringify(policyDecision),
        JSON.stringify(policyDecision.verifiedChecks),
        JSON.stringify(policyDecision.failedChecks),
        JSON.stringify(policyDecision.remainingRisks),
        new Date().toISOString()
      );

      // Record in Verification Memory if verified
      if (policyDecision.recommendation === 'READY_FOR_HUMAN_REVIEW') {
        memoryService.recordMemory({
          repositoryId: repo.id,
          bugTitle: run.defect_title,
          bugDescription: run.defect_description,
          defectPattern: 'Boundary condition bypass and non-finite numeric arithmetic.',
          patchHash: activePatchHash,
          confirmedCounterexamples: allCounterexamples,
          successfulRegressionTests: allTests.filter(t => t.status === 'PASSED').map(t => t.test_name),
          mutationScore: allMutants.length > 0 ? Math.round((allMutants.filter(m => m.status === 'KILLED').length / allMutants.length) * 100) : 100,
          securityFindingsSummary: 'Zero critical vulnerabilities discovered.',
          finalDecision: policyDecision.recommendation,
          tags: ['discount', 'bounds', 'ecommerce', 'trust-collapse']
        });
      }

      // Complete run
      this.completeRun(runId, policyDecision.recommendation);
      await this.logAgentComplete(runId, 'evidence_judge', `Deterministic release evaluation finished: ${policyDecision.recommendation}`, policyDecision);

      eventBus.emit({
        type: 'verification.completed',
        run_id: runId,
        timestamp: new Date().toISOString(),
        data: {
          recommendation: policyDecision.recommendation,
          patchHash: activePatchHash,
          decision: policyDecision
        }
      });

      // Clean up shadow workspace
      shadowModeService.cleanupWorkspace(shadowWorkspace);

    } catch (err: any) {
      console.error('Error during verification run execution:', err);
      this.updateRunStatus(runId, 'BLOCKED', 'DONE');
      db.prepare('UPDATE verification_runs SET release_recommendation = ? WHERE id = ?').run('BLOCKED', runId);
      eventBus.emit({
        type: 'verification.blocked',
        run_id: runId,
        timestamp: new Date().toISOString(),
        data: { error: err.message }
      });
    }
  }

  private updateRunStatus(runId: string, status: string, stage: RunStage) {
    db.prepare('UPDATE verification_runs SET status = ?, stage = ?, updated_at = ? WHERE id = ?')
      .run(status, stage, new Date().toISOString(), runId);
  }

  private updateRunStage(runId: string, stage: RunStage) {
    db.prepare('UPDATE verification_runs SET stage = ?, updated_at = ? WHERE id = ?')
      .run(stage, new Date().toISOString(), runId);
  }

  private updateRunAttempt(runId: string, attempt: number) {
    db.prepare('UPDATE verification_runs SET current_attempt = ?, updated_at = ? WHERE id = ?')
      .run(attempt, new Date().toISOString(), runId);
  }

  private updateActivePatchHash(runId: string, hash: string) {
    db.prepare('UPDATE verification_runs SET active_patch_hash = ?, updated_at = ? WHERE id = ?')
      .run(hash, new Date().toISOString(), runId);
  }

  private completeRun(runId: string, recommendation: string) {
    db.prepare('UPDATE verification_runs SET status = ?, stage = ?, release_recommendation = ?, completed_at = ?, updated_at = ? WHERE id = ?')
      .run('COMPLETED', 'DONE', recommendation, new Date().toISOString(), new Date().toISOString(), runId);
  }

  private tripCircuitBreaker(runId: string, reason: string) {
    db.prepare('UPDATE verification_runs SET status = ?, stage = ?, circuit_breaker_tripped = 1, circuit_breaker_reason = ?, release_recommendation = ?, updated_at = ? WHERE id = ?')
      .run('BLOCKED', 'DONE', reason, 'BLOCKED', new Date().toISOString(), runId);
  }

  private async logAgentStart(runId: string, agentId: AgentId, agentName: string, taskDescription: string) {
    const id = `agent-exec-${runId}-${agentId}-${Date.now()}`;
    const insert = db.prepare(`
      INSERT INTO agent_executions (id, run_id, agent_id, agent_name, status, task_description, duration_ms, created_at)
      VALUES (?, ?, ?, ?, 'RUNNING', ?, 0, ?)
    `);
    insert.run(id, runId, agentId, agentName, taskDescription, new Date().toISOString());

    eventBus.emit({
      type: 'agent.started',
      run_id: runId,
      timestamp: new Date().toISOString(),
      data: { agentId, agentName, taskDescription }
    });
  }

  private async logAgentComplete(runId: string, agentId: AgentId, outputSummary: string, structuredData: any) {
    db.prepare(`
      UPDATE agent_executions 
      SET status = 'COMPLETED', output_summary = ?, structured_data = ?, completed_at = ?
      WHERE run_id = ? AND agent_id = ? AND status = 'RUNNING'
    `).run(outputSummary, JSON.stringify(structuredData), new Date().toISOString(), runId, agentId);

    eventBus.emit({
      type: 'agent.completed',
      run_id: runId,
      timestamp: new Date().toISOString(),
      data: { agentId, outputSummary, structuredData }
    });
  }

  private persistPatchAttempt(runId: string, attempt: number, proposal: any) {
    const insert = db.prepare(`
      INSERT INTO patch_attempts (
        id, run_id, attempt_number, unified_diff, target_file, patch_hash, changed_files, expected_behavior, known_risks, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED', ?)
    `);
    insert.run(
      `patch-${runId}-att-${attempt}`,
      runId,
      attempt,
      proposal.unifiedDiff,
      proposal.changedFiles[0] || 'src/discount.ts',
      proposal.patchHash,
      JSON.stringify(proposal.changedFiles),
      proposal.expectedBehavior,
      proposal.knownRisks,
      new Date().toISOString()
    );
  }

  private persistTestResults(tests: TestResult[]) {
    const insert = db.prepare(`
      INSERT INTO test_results (
        id, run_id, attempt_number, suite_name, test_name, test_type, status, duration_ms, failure_message, reproduction_command, stdout, stderr, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of tests) {
      insert.run(
        t.id,
        t.run_id,
        t.attempt_number,
        t.suite_name,
        t.test_name,
        t.test_type,
        t.status,
        t.duration_ms,
        t.failure_message || null,
        t.reproduction_command || null,
        t.stdout || null,
        t.stderr || null,
        t.created_at
      );
    }
  }

  private persistCounterexamples(ces: Counterexample[]) {
    const insert = db.prepare(`
      INSERT INTO counterexamples (
        id, run_id, attempt_number, title, input_payload, expected_behavior, actual_behavior, code_location, reproduction_command, confirmed, evidence_artifact, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of ces) {
      insert.run(
        c.id,
        c.run_id,
        c.attempt_number,
        c.title,
        c.input_payload,
        c.expected_behavior,
        c.actual_behavior,
        c.code_location || null,
        c.reproduction_command,
        c.confirmed ? 1 : 0,
        c.evidence_artifact || null,
        c.created_at
      );
    }
  }

  private persistSecurityFindings(findings: SecurityFinding[]) {
    const insert = db.prepare(`
      INSERT INTO security_findings (
        id, run_id, attempt_number, rule_id, severity, title, file_path, line_number, code_snippet, detection_method, mitigation, confirmed, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of findings) {
      insert.run(
        s.id,
        s.run_id,
        s.attempt_number,
        s.rule_id,
        s.severity,
        s.title,
        s.file_path,
        s.line_number || null,
        s.code_snippet || null,
        s.detection_method,
        s.mitigation,
        s.confirmed ? 1 : 0,
        s.status,
        s.created_at
      );
    }
  }

  private persistMutationResults(mutants: MutationResult[]) {
    const insert = db.prepare(`
      INSERT INTO mutation_results (
        id, run_id, attempt_number, mutant_id, file_path, line_number, mutator_name, original_code, mutated_code, status, killer_test, explanation, suggested_test, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of mutants) {
      insert.run(
        m.id,
        m.run_id,
        m.attempt_number,
        m.mutant_id,
        m.file_path,
        m.line_number,
        m.mutator_name,
        m.original_code,
        m.mutated_code,
        m.status,
        m.killer_test || null,
        m.explanation || null,
        m.suggested_test || null,
        m.created_at
      );
    }
  }
}

export const verificationEngine = new VerificationEngine();
