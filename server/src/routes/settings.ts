import { Router } from 'express';

export const settingsRouter = Router();

let currentSettings = {
  provider: 'local-deterministic', // or 'openai' / 'anthropic'
  apiKeyConfigured: false,
  modelName: 'OpenGuard-Deterministic-Engine-v2',
  executionTimeoutSeconds: 7,
  sandboxIsolationLevel: 'isolated-shadow-process',
  circuitBreakerEnabled: true,
  mutationTestingEnabled: true,
  strictPatchHashCheck: true
};

settingsRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      ...currentSettings,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      sqliteDriver: 'node:sqlite (native)'
    }
  });
});

settingsRouter.post('/', (req, res) => {
  try {
    currentSettings = {
      ...currentSettings,
      ...req.body
    };
    res.json({ success: true, data: currentSettings });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
