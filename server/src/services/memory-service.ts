import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { VerificationMemoryItem, ReleaseRecommendation } from '../models/types.js';

export class MemoryService {
  /**
   * Initializes seed historical memory records for the demo repository.
   */
  public initSeedMemory(repoId: string) {
    const existing = db.prepare('SELECT id FROM verification_memory WHERE repository_id = ?').get(repoId);
    if (!existing) {
      this.recordMemory({
        repositoryId: repoId,
        bugTitle: 'Pricing Inversion via Negative Discount Exploit',
        bugDescription: 'Attackers supplied negative percentages in checkout requests to artificially increase store balances or invert final debit invoices.',
        defectPattern: 'Unbounded arithmetic on user-controlled numerical input without sign check.',
        patchHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        patchDiff: '+ if (discountPercent < 0) throw new Error("Discount percentage cannot be negative");',
        confirmedCounterexamples: [
          {
            input: 'calculateDiscount(100, -20)',
            result: 'Final price 120 (Price inflated without rejection)'
          }
        ],
        successfulRegressionTests: [
          'rejects negative discount percentage (-20%)',
          'rejects negative base price (-50)'
        ],
        mutationScore: 83.3,
        securityFindingsSummary: 'Zero unresolved critical vulnerabilities after bounds validation patch.',
        finalDecision: 'READY_FOR_HUMAN_REVIEW',
        tags: ['pricing', 'boundary-violation', 'arithmetic-overflow', 'security-exploit']
      });

      this.recordMemory({
        repositoryId: repoId,
        bugTitle: 'NaN Propagation in Order Processing Subsystem',
        bugDescription: 'Payment gateways received NaN transaction totals due to unvalidated null and string inputs in price arguments.',
        defectPattern: 'Non-finite numeric coercion returning NaN.',
        patchHash: 'a87b1c345298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7859871',
        patchDiff: '+ if (typeof price !== "number" || Number.isNaN(price)) throw new Error("Price must be a valid finite number");',
        confirmedCounterexamples: [
          {
            input: 'calculateDiscount(NaN, 15)',
            result: 'NaN returned instead of throwing validation exception'
          }
        ],
        successfulRegressionTests: [
          'rejects NaN base price',
          'rejects Infinity numerical state'
        ],
        mutationScore: 100.0,
        securityFindingsSummary: 'Resolved numeric pollution risk.',
        finalDecision: 'READY_FOR_HUMAN_REVIEW',
        tags: ['nan-check', 'type-coercion', 'finance', 'validation']
      });
      console.log('✓ Initialized seed verification memory records');
    }
  }

  public recordMemory(item: {
    repositoryId: string;
    bugTitle: string;
    bugDescription: string;
    defectPattern: string;
    patchHash?: string;
    patchDiff?: string;
    confirmedCounterexamples: any[];
    successfulRegressionTests: any[];
    mutationScore?: number;
    securityFindingsSummary?: string;
    finalDecision: ReleaseRecommendation;
    tags: string[];
  }): VerificationMemoryItem {
    const id = `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO verification_memory (
        id, repository_id, bug_title, bug_description, defect_pattern,
        patch_hash, patch_diff, confirmed_counterexamples, successful_regression_tests,
        mutation_score, security_findings_summary, final_decision, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      item.repositoryId,
      item.bugTitle,
      item.bugDescription,
      item.defectPattern,
      item.patchHash || null,
      item.patchDiff || null,
      JSON.stringify(item.confirmedCounterexamples),
      JSON.stringify(item.successfulRegressionTests),
      item.mutationScore ?? null,
      item.securityFindingsSummary || null,
      item.finalDecision,
      JSON.stringify(item.tags),
      createdAt
    );

    return {
      id,
      repository_id: item.repositoryId,
      bug_title: item.bugTitle,
      bug_description: item.bugDescription,
      defect_pattern: item.defectPattern,
      patch_hash: item.patchHash,
      patch_diff: item.patchDiff,
      confirmed_counterexamples: item.confirmedCounterexamples,
      successful_regression_tests: item.successfulRegressionTests,
      mutation_score: item.mutationScore,
      security_findings_summary: item.securityFindingsSummary,
      final_decision: item.finalDecision,
      tags: item.tags,
      created_at: createdAt
    };
  }

  public getAll(): VerificationMemoryItem[] {
    const rows = db.prepare('SELECT * FROM verification_memory ORDER BY created_at DESC').all() as any[];
    return rows.map(this.mapRow);
  }

  public getById(id: string): VerificationMemoryItem | null {
    const row = db.prepare('SELECT * FROM verification_memory WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public delete(id: string): boolean {
    const res = db.prepare('DELETE FROM verification_memory WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public findSimilar(queryText: string): VerificationMemoryItem[] {
    const all = this.getAll();
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    return all.filter(item => {
      const corpus = `${item.bug_title} ${item.bug_description} ${item.defect_pattern} ${item.tags.join(' ')}`.toLowerCase();
      return queryTokens.some(token => corpus.includes(token));
    });
  }

  private mapRow(row: any): VerificationMemoryItem {
    return {
      id: row.id,
      repository_id: row.repository_id,
      bug_title: row.bug_title,
      bug_description: row.bug_description,
      defect_pattern: row.defect_pattern,
      patch_hash: row.patch_hash || undefined,
      patch_diff: row.patch_diff || undefined,
      confirmed_counterexamples: row.confirmed_counterexamples ? JSON.parse(row.confirmed_counterexamples) : [],
      successful_regression_tests: row.successful_regression_tests ? JSON.parse(row.successful_regression_tests) : [],
      mutation_score: row.mutation_score ? Number(row.mutation_score) : undefined,
      security_findings_summary: row.security_findings_summary || undefined,
      final_decision: row.final_decision as ReleaseRecommendation,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at
    };
  }
}

export const memoryService = new MemoryService();
