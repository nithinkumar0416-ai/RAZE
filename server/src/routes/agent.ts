import { Router } from 'express';
import { z } from 'zod';
import { razeAgentService, AgentMode } from '../services/raze-agent-service.js';

export const agentRouter = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  conversation_id: z.string().optional(),
  mode: z.enum(['think', 'research', 'build', 'create', 'analyze']).optional(),
  user_id: z.string().optional()
});

const planSchema = z.object({
  intent: z.string().min(1),
  project_id: z.string().optional(),
  user_id: z.string().optional()
});

// POST /api/agent/chat
agentRouter.post('/chat', async (req, res) => {
  try {
    const parsed = chatSchema.parse(req.body);
    const result = await razeAgentService.handleChat({
      message: parsed.message,
      conversation_id: parsed.conversation_id,
      mode: parsed.mode as AgentMode,
      user_id: parsed.user_id
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/agent/plan
agentRouter.post('/plan', async (req, res) => {
  try {
    const parsed = planSchema.parse(req.body);
    const result = await razeAgentService.generatePlan(parsed.intent, parsed.project_id, parsed.user_id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/agent/conversations
agentRouter.get('/conversations', (req, res) => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const convs = razeAgentService.getConversations(userId);
    res.json({ success: true, data: convs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agent/conversations/:id/messages
agentRouter.get('/conversations/:id/messages', (req, res) => {
  try {
    const msgs = razeAgentService.getMessages(req.params.id);
    res.json({ success: true, data: msgs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
