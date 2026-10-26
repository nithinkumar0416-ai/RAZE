import { Router } from 'express';
import { z } from 'zod';
import { taskService } from '../services/task-service.js';

export const tasksRouter = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  project_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  user_id: z.string().optional()
});

const updateTaskSchema = z.object({
  status: z.enum(['planned', 'running', 'completed', 'failed', 'cancelled']).optional(),
  result: z.string().optional(),
  error_message: z.string().optional()
});

// GET /api/tasks
tasksRouter.get('/', (req, res) => {
  try {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const tasks = taskService.getAll(userId, status);
    res.json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks
tasksRouter.post('/', (req, res) => {
  try {
    const parsed = createTaskSchema.parse(req.body);
    const task = taskService.create(parsed);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/tasks/:id
tasksRouter.get('/:id', (req, res) => {
  try {
    const task = taskService.getById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', (req, res) => {
  try {
    const parsed = updateTaskSchema.parse(req.body);
    const task = taskService.update(req.params.id, parsed);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/:id/cancel
tasksRouter.post('/:id/cancel', (req, res) => {
  try {
    const task = taskService.cancel(req.params.id);
    res.json({ success: true, data: task, message: 'Task cancelled successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/:id/execute
tasksRouter.post('/:id/execute', (req, res) => {
  try {
    taskService.executeTaskAsync(req.params.id);
    res.json({ success: true, message: 'Task execution started' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
