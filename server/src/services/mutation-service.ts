import fs from 'node:fs';
import path from 'node:path';
import { MutationResult, MutantStatus } from '../models/types.js';
import { testRunner } from '../runner/test-runner.js';

interface CodeMutator {
  name: string;
  pattern: RegExp;
  replace: (match: string) => string;
  explanation: string;
  suggestedTest: string;
}

const MUTATORS: CodeMutator[] = [
  {
    name: 'BoundaryMutation_GreaterThan',
    pattern: />/g,
    replace: () => '>=',
    explanation: 'Mutated boundary operator from strictly greater (>) to greater-or-equal (>=).',
    suggestedTest: 'Add explicit edge-case boundary check for exact threshold value (e.g., test 100% discount exactly).'
  },
  {
    name: 'BoundaryMutation_LessThan',
    pattern: /</g,
    replace: () => '<=',
    explanation: 'Mutated boundary operator from strictly less (<) to less-or-equal (<=).',
    suggestedTest: 'Add explicit test verifying zero values (e.g., price = 0 or discount = 0) are allowed.'
  },
  {
    name: 'ArithmeticMutation_Subtraction',
    pattern: /price\s*-\s*discountAmount/g,
    replace: () => 'price + discountAmount',
    explanation: 'Inverted arithmetic operator from subtraction to addition in final price calculation.',
    suggestedTest: 'Add assertion verifying final price is less than original price when positive discount is applied.'
  },
  {
    name: 'ArithmeticMutation_DiscountFormula',
    pattern: /\(price\s*\*\s*discountPercent\)\s*\/\s*100/g,
    replace: () => '(price * discountPercent) / 50',
    explanation: 'Altered discount divisor percentage formula from 100 to 50.',
    suggestedTest: 'Add assertion verifying percentage calculation accuracy against known benchmark values.'
  },
  {
    name: 'EqualityMutation_StrictInequality',
    pattern: /!==/g,
    replace: () => '===',
    explanation: 'Inverted strict inequality check on numeric type validation.',
    suggestedTest: 'Add test checking that non-number types (e.g. string "100") are rejected.'
  }
];

export interface MutationAnalysisReport {
  totalMutants: number;
  killedCount: number;
  survivedCount: number;
  timedOutCount: number;
  mutationScore: number;
  results: MutationResult[];
}

export class MutationService {
  /**
   * Agent 5: Test Integrity Engineer
   * Executes real mutation testing by synthesizing syntactic mutations, running the test runner against them,
   * and measuring whether the test suite detects and kills each mutant.
   */
  public async runMutationAnalysis(
    workspacePath: string,
    targetRelativeFile: string,
    testRelativeFile: string,
    runId: string,
    attemptNumber: number
  ): Promise<MutationAnalysisReport> {
    const fullSourcePath = path.resolve(workspacePath, targetRelativeFile);
    if (!fs.existsSync(fullSourcePath)) {
      throw new Error(`Target source file not found for mutation: ${targetRelativeFile}`);
    }

    const originalCode = fs.readFileSync(fullSourcePath, 'utf8');
    const lines = originalCode.split('\n');
    const mutationResults: MutationResult[] = [];

    let mutantIndex = 1;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // Skip empty lines or pure comments
      if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      for (const mutator of MUTATORS) {
        if (mutator.pattern.test(line)) {
          mutator.pattern.lastIndex = 0;
          const mutatedLine = line.replace(mutator.pattern, mutator.replace);
          if (mutatedLine === line) continue;

          const mutatedLines = [...lines];
          mutatedLines[lineIdx] = mutatedLine;
          const mutatedCode = mutatedLines.join('\n');

          const mutantId = `MUT-${String(mutantIndex++).padStart(3, '0')}`;

          // Write mutated code into workspace
          fs.writeFileSync(fullSourcePath, mutatedCode, 'utf8');

          // Run tests against mutant
          const startTime = Date.now();
          const testResults = await testRunner.executeTestFile(
            workspacePath,
            testRelativeFile,
            'REGRESSION',
            runId,
            attemptNumber,
            { timeoutMs: 3000 }
          );
          const duration = Date.now() - startTime;

          // If ANY test failed or timed out, the mutant is KILLED (tests caught the bug!)
          // If all tests passed, the mutant SURVIVED (tests failed to catch the bug!)
          const anyFailed = testResults.some(t => t.status === 'FAILED');
          const anyTimeout = testResults.some(t => t.status === 'TIMED_OUT');

          let status: MutantStatus = 'SURVIVED';
          let killerTest: string | undefined = undefined;

          if (anyTimeout) {
            status = 'TIMED_OUT';
          } else if (anyFailed) {
            status = 'KILLED';
            killerTest = testResults.find(t => t.status === 'FAILED')?.test_name;
          }

          mutationResults.push({
            id: `mut-${Date.now()}-${mutantIndex}`,
            run_id: runId,
            attempt_number: attemptNumber,
            mutant_id: mutantId,
            file_path: targetRelativeFile,
            line_number: lineIdx + 1,
            mutator_name: mutator.name,
            original_code: line.trim(),
            mutated_code: mutatedLine.trim(),
            status,
            killer_test: killerTest,
            explanation: mutator.explanation,
            suggested_test: status === 'SURVIVED' ? mutator.suggestedTest : undefined,
            created_at: new Date().toISOString()
          });

          // Reset to original code for next mutant
          fs.writeFileSync(fullSourcePath, originalCode, 'utf8');

          // Cap at 6 mutants per run for responsiveness and safety
          if (mutationResults.length >= 6) break;
        }
      }
      if (mutationResults.length >= 6) break;
    }

    // Always restore original code
    fs.writeFileSync(fullSourcePath, originalCode, 'utf8');

    const totalMutants = mutationResults.length;
    const killedCount = mutationResults.filter(m => m.status === 'KILLED').length;
    const survivedCount = mutationResults.filter(m => m.status === 'SURVIVED').length;
    const timedOutCount = mutationResults.filter(m => m.status === 'TIMED_OUT').length;
    const mutationScore = totalMutants > 0 ? Math.round((killedCount / totalMutants) * 100) : 100;

    return {
      totalMutants,
      killedCount,
      survivedCount,
      timedOutCount,
      mutationScore,
      results: mutationResults
    };
  }
}

export const mutationService = new MutationService();
