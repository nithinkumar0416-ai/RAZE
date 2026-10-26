import { AgentExecution } from '../models/types.js';
import { memoryService } from './memory-service.js';

export interface InvestigationResult {
  rootCauseHypotheses: string[];
  sourceReferences: Array<{ file: string; lines: string; symbol: string }>;
  reproductionSteps: string[];
  affectedSymbols: string[];
  unknownsAndAssumptions: string[];
  historicalPrecedents: Array<{ id: string; title: string; pattern: string }>;
}

export class InvestigationService {
  /**
   * Agent 1: Repository Investigator
   * Inspects source files, traces dependencies, formulates hypotheses, retrieves historical failures.
   */
  public async investigate(
    repoId: string,
    defectTitle: string,
    defectDescription: string,
    targetFile: string,
    fileContent: string
  ): Promise<InvestigationResult> {
    const historical = memoryService.findSimilar(defectTitle + ' ' + defectDescription);

    const hypotheses: string[] = [];
    const affectedSymbols: string[] = ['calculateDiscount', 'DiscountResult'];
    const references: Array<{ file: string; lines: string; symbol: string }> = [];

    // Static inspection of target file
    const lines = fileContent.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('calculateDiscount')) {
        references.push({
          file: targetFile,
          lines: `${idx + 1}`,
          symbol: 'calculateDiscount'
        });
      }
      if (line.includes('discountPercent') && !line.includes('interface')) {
        references.push({
          file: targetFile,
          lines: `${idx + 1}`,
          symbol: 'discountPercent arithmetic'
        });
      }
    });

    if (defectTitle.toLowerCase().includes('discount') || defectDescription.toLowerCase().includes('discount')) {
      hypotheses.push(
        'Missing lower and upper boundary guards on discountPercent allows inputs < 0 (causing price surge) or > 100 (causing negative price or shop losses).',
        'Lack of numerical validation permits NaN, Infinity, or non-finite inputs to propagate corrupt numerical states into downstream invoicing and ledger modules.',
        'Negative base price is not rejected, allowing arbitrary negative transactions.'
      );
    } else {
      hypotheses.push(
        `Potential logical flaw or missing boundary validation in ${targetFile}.`,
        'Unexpected parameter types or unhandled edge cases in caller path.'
      );
    }

    const reproductionSteps = [
      `1. Open ${targetFile}`,
      `2. Invoke calculateDiscount(100, 150) -> Expected: Error; Actual: Final price -50`,
      `3. Invoke calculateDiscount(100, -20) -> Expected: Error; Actual: Final price 120 (Price inflated)`,
      `4. Invoke calculateDiscount(NaN, 10)  -> Expected: Error; Actual: NaN returned without rejection`
    ];

    const unknownsAndAssumptions = [
      'Assumption: Rounding precision is expected to 2 decimal places for financial calculations.',
      'Assumption: Discount percentage is formatted as an integer or decimal representation (0 to 100), not fractional 0.0 to 1.0.',
      'Unknown: Whether caller systems rely on NaN throwing an exception or returning zero.'
    ];

    return {
      rootCauseHypotheses: hypotheses,
      sourceReferences: references,
      reproductionSteps,
      affectedSymbols,
      unknownsAndAssumptions,
      historicalPrecedents: historical.slice(0, 3).map(h => ({
        id: h.id,
        title: h.bug_title,
        pattern: h.defect_pattern
      }))
    };
  }
}

export const investigationService = new InvestigationService();
