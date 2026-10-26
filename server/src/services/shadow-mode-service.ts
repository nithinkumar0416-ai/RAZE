import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface ShadowWorkspace {
  id: string;
  runId: string;
  attemptNumber: number;
  workspacePath: string;
  originalRepoPath: string;
  appliedPatchHash?: string;
  createdAt: string;
}

export class ShadowModeService {
  private baseShadowDir: string;

  constructor() {
    this.baseShadowDir = path.resolve(process.cwd(), 'data', 'shadow-workspaces');
    if (!fs.existsSync(this.baseShadowDir)) {
      fs.mkdirSync(this.baseShadowDir, { recursive: true });
    }
  }

  /**
   * Creates an isolated working copy for a verification run and attempt number.
   */
  public createShadowWorkspace(runId: string, attemptNumber: number, originalRepoPath: string): ShadowWorkspace {
    const workspaceId = `shadow-${runId}-attempt-${attemptNumber}-${Date.now()}`;
    const workspacePath = path.join(this.baseShadowDir, workspaceId);

    // Copy repo recursively, excluding .git, node_modules, etc.
    this.copyDirectory(originalRepoPath, workspacePath);

    return {
      id: workspaceId,
      runId,
      attemptNumber,
      workspacePath,
      originalRepoPath,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Applies a patch or modified content to the shadow workspace and calculates its exact SHA-256 hash.
   */
  public applyPatch(
    workspace: ShadowWorkspace,
    relativeFilePath: string,
    newFileContent: string
  ): { patchHash: string; appliedPath: string } {
    const targetPath = path.resolve(workspace.workspacePath, relativeFilePath);
    
    // Safeguard: Ensure path is strictly within workspace
    if (!targetPath.startsWith(workspace.workspacePath)) {
      throw new Error(`Security Violation: Attempted escape from shadow workspace: ${relativeFilePath}`);
    }

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(targetPath, newFileContent, 'utf8');

    // Calculate strict SHA-256 of the change
    const patchHash = crypto.createHash('sha256').update(newFileContent).digest('hex');
    workspace.appliedPatchHash = patchHash;

    return {
      patchHash,
      appliedPath: targetPath
    };
  }

  /**
   * Validates whether a patch presented for human review matches the exact hash tested in the shadow workspace.
   */
  public verifyPatchIdentity(testedPatchHash: string, presentedPatchContent: string): boolean {
    const presentedHash = crypto.createHash('sha256').update(presentedPatchContent).digest('hex');
    return testedPatchHash.toLowerCase() === presentedHash.toLowerCase();
  }

  /**
   * Clean up workspace when verification run completes or is aborted.
   */
  public cleanupWorkspace(workspace: ShadowWorkspace) {
    try {
      if (fs.existsSync(workspace.workspacePath)) {
        fs.rmSync(workspace.workspacePath, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`Could not completely clean shadow workspace ${workspace.workspacePath}:`, err);
    }
  }

  private copyDirectory(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

export const shadowModeService = new ShadowModeService();
