import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════════');
console.log('\x1b[1m\x1b[35m%s\x1b[0m', '   🛡️  OPEN GUARD AI / RAZE - STARTING DUAL ENVIRONMENT...');
console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════════');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const serverProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3001' }
});

const clientProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(root, 'client'),
  stdio: 'inherit',
  shell: true
});

const shutdown = () => {
  console.log('\nShutting down OpenGuard processes...');
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
