import { Router } from 'express';
import { repositoryService } from '../services/repository-service.js';

export const repositoriesRouter = Router();

repositoriesRouter.get('/', (req, res) => {
  try {
    const repos = repositoryService.getAll();
    res.json({ success: true, data: repos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

repositoriesRouter.get('/:id', (req, res) => {
  try {
    const repo = repositoryService.getById(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }
    res.json({ success: true, data: repo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

repositoriesRouter.get('/:id/files', (req, res) => {
  try {
    const subPath = typeof req.query.path === 'string' ? req.query.path : '';
    const files = repositoryService.getFiles(req.params.id, subPath);
    res.json({ success: true, data: files });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

repositoriesRouter.get('/:id/file-content', (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Query parameter "path" is required' });
    }
    const content = repositoryService.getFileContent(req.params.id, filePath);
    res.json({ success: true, data: { path: filePath, content } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
