import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { Repository } from '../models/types.js';

export class RepositoryService {
  private demoRepoPath: string;

  constructor() {
    this.demoRepoPath = path.resolve(process.cwd(), 'src', 'demo-repo');
  }

  public initDefaultRepositories() {
    const existing = db.prepare('SELECT id FROM repositories WHERE is_demo = 1').get() as { id: string } | undefined;
    if (!existing) {
      const demoId = 'repo-demo-pricing';
      const snapshotHash = this.computeRepoHash(this.demoRepoPath);
      const insert = db.prepare(`
        INSERT INTO repositories (id, name, path, description, is_demo, branch, snapshot_hash, created_at)
        VALUES (?, ?, ?, ?, 1, 'main', ?, ?)
      `);
      insert.run(
        demoId,
        'demo-pricing-service',
        this.demoRepoPath,
        'Demonstration TypeScript repository with e-commerce pricing & discount engine',
        snapshotHash,
        new Date().toISOString()
      );
      console.log('✓ Registered bundled demonstration repository:', demoId);
    }
  }

  public getAll(): Repository[] {
    const rows = db.prepare('SELECT * FROM repositories ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({
      ...r,
      is_demo: Boolean(r.is_demo)
    }));
  }

  public getById(id: string): Repository | null {
    const row = db.prepare('SELECT * FROM repositories WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_demo: Boolean(row.is_demo)
    };
  }

  public getFiles(repoId: string, subPath: string = ''): Array<{ name: string; path: string; isDir: boolean; size: number }> {
    const repo = this.getById(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    const targetDir = path.resolve(repo.path, subPath);
    // Security safeguard: Path traversal check
    if (!targetDir.startsWith(repo.path)) {
      throw new Error('Access denied: Path traversal detected');
    }

    if (!fs.existsSync(targetDir)) return [];

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    return entries
      .filter(e => !['node_modules', '.git', 'dist'].includes(e.name))
      .map(e => {
        const fullPath = path.join(targetDir, e.name);
        const stats = fs.statSync(fullPath);
        return {
          name: e.name,
          path: path.relative(repo.path, fullPath).replace(/\\/g, '/'),
          isDir: e.isDirectory(),
          size: stats.size
        };
      });
  }

  public getFileContent(repoId: string, relativeFilePath: string): string {
    const repo = this.getById(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    const safePath = path.resolve(repo.path, relativeFilePath);
    if (!safePath.startsWith(repo.path)) {
      throw new Error('Access denied: Path traversal detected');
    }

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${relativeFilePath}`);
    }

    return fs.readFileSync(safePath, 'utf8');
  }

  public computeRepoHash(repoPath: string): string {
    const hash = crypto.createHash('sha256');
    this.hashDirectory(repoPath, repoPath, hash);
    return hash.digest('hex');
  }

  private hashDirectory(baseDir: string, currentDir: string, hash: crypto.Hash) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        this.hashDirectory(baseDir, fullPath, hash);
      } else if (entry.isFile()) {
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const content = fs.readFileSync(fullPath);
        hash.update(relPath);
        hash.update(content);
      }
    }
  }
}

export const repositoryService = new RepositoryService();
