import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { repositoryService } from './services/repository-service.js';
import { memoryService } from './services/memory-service.js';
import { repositoriesRouter } from './routes/repositories.js';
import { runsRouter } from './routes/runs.js';
import { memoryRouter } from './routes/memory.js';
import { assistantRouter } from './routes/assistant.js';
import { settingsRouter } from './routes/settings.js';
import { agentRouter } from './routes/agent.js';
import { tasksRouter } from './routes/tasks.js';
import { researchRouter } from './routes/research.js';
import { activityRouter } from './routes/activity.js';
import { projectsRouter } from './routes/projects.js';
import { notesRouter } from './routes/notes.js';
import { copilotRouter } from './routes/copilot.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB, default demo repo, and seed verification memories
initDatabase();
repositoryService.initDefaultRepositories();
memoryService.initSeedMemory('repo-demo-pricing');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RAZE — Futuristic AI Agent Platform',
    neuralSystem: 'ONLINE',
    version: '2.4.0',
    modes: ['think', 'research', 'build', 'create', 'analyze']
  });
});

// Mount Routes
app.use('/api/agent', agentRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/research', researchRouter);
app.use('/api/activity', activityRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/repositories', repositoriesRouter);
app.use('/api/runs', runsRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/copilot', copilotRouter);
app.use('/api/settings', settingsRouter);

// Serve Static Frontend Assets (Complete Overall Website from Backend)
import path from 'node:path';
import fs from 'node:fs';

const candidatePaths = [
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(process.cwd(), '..', 'client', 'dist'),
  path.resolve(process.cwd(), 'dist')
];

const clientDistPath = candidatePaths.find(p => fs.existsSync(p));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('✓ Successfully serving complete RAZE AI frontend UI from backend at:', clientDistPath);
} else {
  console.warn('⚠️ Client build directory not found in candidate paths. Run npm run build in client/ to generate.');
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`⚡ RAZE AI Server running on http://localhost:${PORT}`);
  });
}

export default app;
