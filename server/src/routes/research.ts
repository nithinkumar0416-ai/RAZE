import { Router } from 'express';
import { z } from 'zod';
import { researchService } from '../services/research-service.js';

export const researchRouter = Router();

const researchSchema = z.object({
  query: z.string().min(1),
  user_id: z.string().optional()
});

// POST /api/research
researchRouter.post('/', async (req, res) => {
  try {
    const { query, user_id } = researchSchema.parse(req.body);
    const result = await researchService.performResearch(query, user_id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
