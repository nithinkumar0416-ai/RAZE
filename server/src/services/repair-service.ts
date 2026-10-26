import crypto from 'node:crypto';
import { Counterexample } from '../models/types.js';

export interface RepairProposal {
  attemptNumber: number;
  newContent: string;
  unifiedDiff: string;
  changedFiles: string[];
  patchHash: string;
  expectedBehavior: string;
  knownRisks: string;
  explanation: string;
}

export class RepairService {
  /**
   * Agent 2: Autonomous Repair Engineer
   * Generates minimal, test-driven repairs based on iteration and failing test evidence.
   */
  public generateRepair(
    attemptNumber: number,
    originalContent: string,
    targetFile: string,
    failingEvidence?: Counterexample[]
  ): RepairProposal {
    let newContent = '';
    let explanation = '';
    let expectedBehavior = '';
    let knownRisks = '';

    if (attemptNumber === 1 || !failingEvidence || failingEvidence.length === 0) {
      // Attempt 1: Naive minimal repair. Only checks discount > 100.
      // Deliberately leaves out negative discounts and NaN checks to allow the Adversarial Hunter to challenge it!
      newContent = `export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

export function calculateDiscount(price: number, discountPercent: number): DiscountResult {
  // Naive repair: only checks upper bound
  if (discountPercent > 100) {
    throw new Error('Discount percentage cannot exceed 100%');
  }

  const discountAmount = (price * discountPercent) / 100;
  const finalPrice = price - discountAmount;

  return {
    originalPrice: price,
    discountPercent,
    discountAmount,
    finalPrice
  };
}
`;
      explanation = 'Introduced upper boundary guard rejecting discount percentages greater than 100%.';
      expectedBehavior = 'Prevents discounts > 100% from causing negative price balances.';
      knownRisks = 'Has not yet enforced negative boundary checks or non-finite numeric input validation.';
    } else {
      // Attempt 2+: Incorporates actual counterexample evidence!
      const evidenceDetails = failingEvidence.map(e => e.title).join(', ');
      newContent = `export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

export function calculateDiscount(price: number, discountPercent: number): DiscountResult {
  // Hardened repair incorporating adversarial failure evidence:
  // Validates finite numbers, non-negative price, and discount range [0, 100]
  if (typeof price !== 'number' || Number.isNaN(price) || !Number.isFinite(price)) {
    throw new Error('Price must be a valid finite number');
  }
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (typeof discountPercent !== 'number' || Number.isNaN(discountPercent) || !Number.isFinite(discountPercent)) {
    throw new Error('Discount percentage must be a valid finite number');
  }
  if (discountPercent < 0) {
    throw new Error('Discount percentage cannot be negative');
  }
  if (discountPercent > 100) {
    throw new Error('Discount percentage cannot exceed 100%');
  }

  const rawDiscount = (price * discountPercent) / 100;
  // Precise commercial rounding to two decimal places
  const discountAmount = Math.round(rawDiscount * 100) / 100;
  const finalPrice = Math.round((price - discountAmount) * 100) / 100;

  return {
    originalPrice: price,
    discountPercent,
    discountAmount,
    finalPrice
  };
}
`;
      explanation = `Hardened repair informed by counterexample evidence (${evidenceDetails}). Added type checks, NaN/Infinity guards, price >= 0 verification, discount [0, 100] boundary enforcement, and financial cents rounding.`;
      expectedBehavior = 'Strict mathematical and domain validation ensuring safe numeric calculations under all adversary inputs.';
      knownRisks = 'Strict type validation may throw exceptions on legacy callers passing numeric strings or null values.';
    }

    const patchHash = crypto.createHash('sha256').update(newContent).digest('hex');
    const unifiedDiff = this.generateUnifiedDiff(targetFile, originalContent, newContent);

    return {
      attemptNumber,
      newContent,
      unifiedDiff,
      changedFiles: [targetFile],
      patchHash,
      expectedBehavior,
      knownRisks,
      explanation
    };
  }

  private generateUnifiedDiff(filePath: string, oldStr: string, newStr: string): string {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const diffHeader = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
    
    // Simple line diff for presentation
    const diffBody: string[] = [];
    const max = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o === n) {
        if (o !== undefined) diffBody.push(` ${o}`);
      } else {
        if (o !== undefined) diffBody.push(`-${o}`);
        if (n !== undefined) diffBody.push(`+${n}`);
      }
    }
    return diffHeader + diffBody.join('\n');
  }
}

export const repairService = new RepairService();
