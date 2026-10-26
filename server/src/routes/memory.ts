import { Router } from 'express';
import { memoryService } from '../services/memory-service.js';

export const memoryRouter = Router();

memoryRouter.get('/', (req, res) => {
  try {
    const memory = memoryService.getAll();
    res.json({ success: true, data: memory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

memoryRouter.get('/search', (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = memoryService.findSimilar(query);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

memoryRouter.delete('/:id', (req, res) => {
  try {
    const deleted = memoryService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Memory item not found' });
    }
    res.json({ success: true, message: 'Memory item deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
