import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

export const projectsRouter = Router();

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  user_id: z.string().optional()
});

// GET /api/projects
projectsRouter.get('/', (req, res) => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : 'user-default-raze';
    const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    // Include task counts per project
    const withCounts = projects.map(p => {
      const taskStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
        FROM tasks WHERE project_id = ?
      `).get(p.id) as any;

      return {
        ...p,
        taskStats: {
          total: Number(taskStats?.total || 0),
          completed: Number(taskStats?.completed || 0),
          running: Number(taskStats?.running || 0)
        }
      };
    });

    res.json({ success: true, data: withCounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects
projectsRouter.post('/', (req, res) => {
  try {
    const parsed = projectSchema.parse(req.body);
    const id = `proj-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const userId = parsed.user_id || 'user-default-raze';

    db.prepare('INSERT INTO projects (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, userId, parsed.name, parsed.description || null, now, now);

    res.status(201).json({
      success: true,
      data: {
        id,
        user_id: userId,
        name: parsed.name,
        description: parsed.description,
        created_at: now,
        updated_at: now
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
