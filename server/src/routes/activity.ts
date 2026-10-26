import { Router } from 'express';
import { db } from '../db/database.js';

export const activityRouter = Router();

// GET /api/activity
activityRouter.get('/', (req, res) => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : 'user-default-raze';
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;

    const logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(userId, limit) as any[];

    const formatted = logs.map(l => ({
      ...l,
      metadata: l.metadata ? JSON.parse(l.metadata) : null
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
