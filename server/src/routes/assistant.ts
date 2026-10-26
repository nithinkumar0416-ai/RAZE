import { Router } from 'express';
import { z } from 'zod';
import { assistantService } from '../services/assistant-service.js';

export const assistantRouter = Router();

const chatSchema = z.object({
  run_id: z.string().optional(),
  question: z.string().min(1)
});

assistantRouter.post('/chat', async (req, res) => {
  try {
    const { run_id, question } = chatSchema.parse(req.body);
    const answer = await assistantService.answerQuestion(run_id, question);
    res.json({ success: true, data: answer });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
