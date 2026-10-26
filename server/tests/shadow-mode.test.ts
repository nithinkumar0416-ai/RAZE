import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { shadowModeService } from '../src/services/shadow-mode-service.js';

describe('Repair Shadow Mode Service', () => {
  const repoPath = path.resolve(process.cwd(), 'src', 'demo-repo');
  let workspace: any;

  it('creates an isolated shadow workspace copying clean repository files', () => {
    workspace = shadowModeService.createShadowWorkspace('test-run-123', 1, repoPath);

    expect(fs.existsSync(workspace.workspacePath)).toBe(true);
    expect(fs.existsSync(path.join(workspace.workspacePath, 'src', 'discount.ts'))).toBe(true);
  });

  it('applies patch to shadow workspace and generates strict SHA-256 hash', () => {
    const patchedContent = '// patched content for test\nexport const x = 1;\n';
    const result = shadowModeService.applyPatch(workspace, 'src/discount.ts', patchedContent);

    expect(result.patchHash).toBeDefined();
    expect(result.patchHash.length).toBe(64); // SHA-256 length

    const written = fs.readFileSync(result.appliedPath, 'utf8');
    expect(written).toBe(patchedContent);
  });

  it('validates byte-for-byte patch identity and catches altered patches', () => {
    const contentA = 'export const val = 42;';
    const contentB = 'export const val = 43;';

    const { patchHash } = shadowModeService.applyPatch(workspace, 'src/discount.ts', contentA);

    expect(shadowModeService.verifyPatchIdentity(patchHash, contentA)).toBe(true);
    expect(shadowModeService.verifyPatchIdentity(patchHash, contentB)).toBe(false);
  });

  afterAll(() => {
    if (workspace) {
      shadowModeService.cleanupWorkspace(workspace);
    }
  });
});
