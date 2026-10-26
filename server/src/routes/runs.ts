import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { verificationEngine } from '../services/verification-engine.js';
import { eventBus } from '../services/event-bus.js';
import { evidenceService } from '../services/evidence-service.js';
import { shadowModeService } from '../services/shadow-mode-service.js';

export const runsRouter = Router();

const createRunSchema = z.object({
  repository_id: z.string().min(1),
  defect_title: z.string().min(3),
  defect_description: z.string().min(5),
  target_file: z.string().default('src/discount.ts'),
  max_retries: z.number().int().min(1).max(5).default(3)
});

// GET all verification runs
runsRouter.get('/', (req, res) => {
  try {
    const runs = db.prepare('SELECT * FROM verification_runs ORDER BY created_at DESC').all();
    res.json({ success: true, data: runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create and start a new verification run
runsRouter.post('/', async (req, res) => {
  try {
    const parsed = createRunSchema.parse(req.body);
    const runId = `run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO verification_runs (
        id, repository_id, status, defect_title, defect_description, target_file,
        stage, current_attempt, max_retries, release_recommendation, created_at, updated_at
      ) VALUES (?, ?, 'PENDING', ?, ?, ?, 'BASELINE', 1, ?, 'PENDING', ?, ?)
    `);

    insert.run(
      runId,
      parsed.repository_id,
      parsed.defect_title,
      parsed.defect_description,
      parsed.target_file,
      parsed.max_retries,
      now,
      now
    );

    // Asynchronously kick off the Trust Collapse Engine workflow
    verificationEngine.executeRun(runId).catch(err => {
      console.error(`Verification execution failed for ${runId}:`, err);
    });

    res.status(201).json({
      success: true,
      data: {
        run_id: runId,
        status: 'PENDING',
        message: 'Verification run queued and initialized.'
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET single run details with all related sub-entities
runsRouter.get('/:id', (req, res) => {
  try {
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(req.params.id) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }

    const agents = db.prepare('SELECT * FROM agent_executions WHERE run_id = ? ORDER BY created_at ASC').all(run.id) as any[];
    const patches = db.prepare('SELECT * FROM patch_attempts WHERE run_id = ? ORDER BY attempt_number ASC').all(run.id) as any[];
    const tests = db.prepare('SELECT * FROM test_results WHERE run_id = ? ORDER BY attempt_number ASC, created_at ASC').all(run.id) as any[];
    const counterexamples = db.prepare('SELECT * FROM counterexamples WHERE run_id = ? ORDER BY attempt_number ASC').all(run.id) as any[];
    const mutations = db.prepare('SELECT * FROM mutation_results WHERE run_id = ? ORDER BY attempt_number ASC').all(run.id) as any[];
    const security = db.prepare('SELECT * FROM security_findings WHERE run_id = ? ORDER BY attempt_number ASC').all(run.id) as any[];
    const decisions = db.prepare('SELECT * FROM human_decisions WHERE run_id = ? ORDER BY created_at DESC').all(run.id) as any[];

    res.json({
      success: true,
      data: {
        ...run,
        circuit_breaker_tripped: Boolean(run.circuit_breaker_tripped),
        agents: agents.map(a => ({
          ...a,
          structured_data: a.structured_data ? JSON.parse(a.structured_data) : null
        })),
        patches: patches.map(p => ({
          ...p,
          changed_files: JSON.parse(p.changed_files)
        })),
        tests,
        counterexamples: counterexamples.map(c => ({
          ...c,
          confirmed: Boolean(c.confirmed)
        })),
        mutations,
        security: security.map(s => ({
          ...s,
          confirmed: Boolean(s.confirmed)
        })),
        decisions: decisions.map(d => ({
          ...d,
          verified_hash_matched: Boolean(d.verified_hash_matched)
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/runs/:id/events — Server-Sent Events (SSE) live connection
runsRouter.get('/:id/events', (req, res) => {
  const runId = req.params.id;
  const run = db.prepare('SELECT id FROM verification_runs WHERE id = ?').get(runId);
  if (!run) {
    return res.status(404).json({ success: false, error: 'Run not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ runId, time: new Date().toISOString() })}\n\n`);

  eventBus.subscribe(runId, res);
});

// GET /api/runs/:id/evidence — Evidence Dossier in JSON or Markdown format
runsRouter.get('/:id/evidence', (req, res) => {
  try {
    const format = req.query.format === 'markdown' ? 'markdown' : 'json';
    const report = evidenceService.compileEvidence(req.params.id);

    if (format === 'markdown') {
      const markdown = evidenceService.generateMarkdownReport(report);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="evidence-dossier-${req.params.id}.md"`);
      return res.send(markdown);
    }

    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/decision — Record a human release gate decision
const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REQUEST_REPAIR']),
  reviewed_patch_hash: z.string().min(1),
  reviewer_name: z.string().default('Lead Engineer'),
  notes: z.string().optional()
});

runsRouter.post('/:id/decision', (req, res) => {
  try {
    const runId = req.params.id;
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(runId) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }

    const parsed = decisionSchema.parse(req.body);

    // Section 15 Requirement: Human approval must reference the exact patch hash!
    // If the patch changes or doesn't match the tested patch, invalidate approval!
    const hashMatched = run.active_patch_hash?.toLowerCase() === parsed.reviewed_patch_hash.toLowerCase();

    if (!hashMatched && parsed.decision === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Integrity Violation: The reviewed patch hash does not match the active verified sandbox hash. Approval cannot proceed.'
      });
    }

    const decisionId = `dec-${Date.now()}`;
    const insert = db.prepare(`
      INSERT INTO human_decisions (
        id, run_id, decision, reviewed_patch_hash, verified_hash_matched, reviewer_name, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      decisionId,
      runId,
      parsed.decision,
      parsed.reviewed_patch_hash,
      hashMatched ? 1 : 0,
      parsed.reviewer_name,
      parsed.notes || null,
      new Date().toISOString()
    );

    res.json({
      success: true,
      data: {
        decisionId,
        decision: parsed.decision,
        verified_hash_matched: hashMatched,
        message: `Decision "${parsed.decision}" recorded against patch hash ${parsed.reviewed_patch_hash}.`
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/retry — Explicitly trigger a new repair attempt
runsRouter.post('/:id/retry', (req, res) => {
  try {
    const runId = req.params.id;
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(runId) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }

    // Reset status and restart execution
    db.prepare('UPDATE verification_runs SET status = ?, current_attempt = 1, release_recommendation = ? WHERE id = ?')
      .run('PENDING', 'PENDING', runId);

    verificationEngine.executeRun(runId).catch(console.error);

    res.json({ success: true, message: 'Verification retry launched.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
