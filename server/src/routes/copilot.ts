import { Router } from 'express';
import { z } from 'zod';
import { copilotService } from '../services/copilot-service.js';
import { db } from '../db/database.js';

export const copilotRouter = Router();

// GET /api/copilot/status — Current pipeline status mapped to 7 reference stages
copilotRouter.get('/status', (req, res) => {
  try {
    const runId = req.query.run_id as string | undefined;
    const status = copilotService.getPipelineStatus(runId);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/copilot/trigger-defect-104 — Instant kickoff of Defect #104 verification
copilotRouter.post('/trigger-defect-104', async (req, res) => {
  try {
    const result = await copilotService.triggerDefect104Run();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/copilot/chat — Interactive conversational Copilot with stage explainability & commands
const chatSchema = z.object({
  run_id: z.string().optional(),
  message: z.string().min(1)
});

copilotRouter.post('/chat', async (req, res) => {
  try {
    const { run_id, message } = chatSchema.parse(req.body);
    const result = await copilotService.handleCopilotChat(run_id, message);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/copilot/sign-decision — Human integration sign-off bound to SHA-256
const signSchema = z.object({
  run_id: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED', 'REQUEST_REPAIR']),
  reviewed_patch_hash: z.string().min(1),
  reviewer_name: z.string().default('Lead Engineer'),
  notes: z.string().optional()
});

copilotRouter.post('/sign-decision', (req, res) => {
  try {
    const parsed = signSchema.parse(req.body);
    const run = db.prepare('SELECT * FROM verification_runs WHERE id = ?').get(parsed.run_id) as any;
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }

    const hashMatched = run.active_patch_hash?.toLowerCase() === parsed.reviewed_patch_hash.toLowerCase();
    if (!hashMatched && parsed.decision === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Cryptographic Hash Mismatch: Patch in shadow workspace has been altered.'
      });
    }

    const decisionId = `dec-copilot-${Date.now()}`;
    db.prepare(`
      INSERT INTO human_decisions (
        id, run_id, decision, reviewed_patch_hash, verified_hash_matched, reviewer_name, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      decisionId,
      parsed.run_id,
      parsed.decision,
      parsed.reviewed_patch_hash,
      hashMatched ? 1 : 0,
      parsed.reviewer_name,
      parsed.notes || 'Human verification approval sealed via RAZE Copilot.',
      new Date().toISOString()
    );

    res.json({
      success: true,
      data: {
        decisionId,
        decision: parsed.decision,
        verified_hash_matched: hashMatched,
        message: `Decision "${parsed.decision}" sealed into Verification Memory against hash ${parsed.reviewed_patch_hash}.`
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
