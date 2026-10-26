import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

export const notesRouter = Router();

const noteSchema = z.object({
  content: z.string().min(1),
  project_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  user_id: z.string().optional()
});

// GET /api/notes
notesRouter.get('/', (req, res) => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : 'user-default-raze';
    const notes = db.prepare('SELECT * FROM memory_notes WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    const formatted = notes.map(n => ({
      ...n,
      tags: n.tags ? JSON.parse(n.tags) : []
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notes
notesRouter.post('/', (req, res) => {
  try {
    const parsed = noteSchema.parse(req.body);
    const id = `note-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const userId = parsed.user_id || 'user-default-raze';

    db.prepare(`
      INSERT INTO memory_notes (id, user_id, project_id, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, parsed.project_id || null, parsed.content, JSON.stringify(parsed.tags || []), now, now);

    res.status(201).json({
      success: true,
      data: {
        id,
        user_id: userId,
        project_id: parsed.project_id,
        content: parsed.content,
        tags: parsed.tags || [],
        created_at: now,
        updated_at: now
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/notes/:id
notesRouter.delete('/:id', (req, res) => {
  try {
    const resDel = db.prepare('DELETE FROM memory_notes WHERE id = ?').run(req.params.id);
    if (resDel.changes === 0) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, message: 'Memory note purged successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
