import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Crosshair, 
  ShieldAlert, 
  Dna, 
  Terminal, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { TestResult, Counterexample, MutationResult, SecurityFinding } from '../../types';
import { Badge } from '../common/Badge';

interface ChallengeResultsAreaProps {
  tests: TestResult[];
  counterexamples: Counterexample[];
  mutations: MutationResult[];
  security: SecurityFinding[];
}

export const ChallengeResultsArea: React.FC<ChallengeResultsAreaProps> = ({
  tests,
  counterexamples,
  mutations,
  security
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'counterexamples' | 'mutations' | 'security'>('counterexamples');

  const confirmedCEs = counterexamples.filter((c) => c.confirmed);
  const passedTests = tests.filter((t) => t.status === 'PASSED');
  const failedTests = tests.filter((t) => t.status === 'FAILED');
  const killedMutants = mutations.filter((m) => m.status === 'KILLED');
  const survivedMutants = mutations.filter((m) => m.status === 'SURVIVED');
  const mutationScore = mutations.length > 0 ? Math.round((killedMutants.length / mutations.length) * 100) : 100;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-og-border flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-og-border mb-4">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('counterexamples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'counterexamples'
                ? 'bg-og-danger/20 text-og-danger border border-og-danger/30 shadow-glow-danger'
                : 'text-og-muted hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Counterexamples ({counterexamples.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-og-primary text-white shadow-glow-primary'
                : 'text-og-muted hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Executable Tests ({tests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mutations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'mutations'
                ? 'bg-og-violet text-white shadow-glow-violet'
                : 'text-og-muted hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Mutation Trust ({mutationScore}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-og-cyan text-black font-semibold'
                : 'text-og-muted hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security ({security.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* TAB 1: COUNTEREXAMPLES */}
        {activeTab === 'counterexamples' && (
          <div className="space-y-3">
            {counterexamples.length === 0 ? (
              <div className="p-8 text-center text-og-muted text-xs">
                No active counterexamples detected for current patch state.
              </div>
            ) : (
              counterexamples.map((ce) => (
                <div
                  key={ce.id}
                  className="p-4 rounded-xl border border-og-danger/30 bg-og-danger/5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-og-danger" />
                      <h4 className="text-xs font-semibold text-og-danger">{ce.title}</h4>
                    </div>
                    <Badge variant="danger" size="sm">
                      CONFIRMED BY TEST
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] text-og-muted uppercase block mb-1">Adversary Input Payload:</span>
                      <code className="text-og-cyan">{ce.input_payload}</code>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] text-og-muted uppercase block mb-1">Expected Secure Behavior:</span>
                      <span className="text-og-success">{ce.expected_behavior}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-og-danger/20 text-xs">
                    <span className="text-[10px] text-og-danger uppercase font-bold block mb-0.5">Actual Falsifying Behavior:</span>
                    <span className="text-og-text font-mono text-[11px]">{ce.actual_behavior}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-og-muted bg-black/30 p-2 rounded-lg">
                    <Terminal className="w-3 h-3 text-og-cyan" />
                    <span className="truncate">Reproduction: {ce.reproduction_command}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: EXECUTABLE TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs font-mono px-2 py-1 text-og-muted border-b border-white/5 mb-2">
              <span>Total: {tests.length}</span>
              <span className="text-og-success">Passed: {passedTests.length}</span>
              <span className="text-og-danger">Failed: {failedTests.length}</span>
            </div>
            {tests.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-og-border bg-og-panel/40 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {t.status === 'PASSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-og-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-og-danger flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-medium text-og-text block truncate">{t.test_name}</span>
                    <span className="text-[10px] text-og-muted font-mono">{t.suite_name} • {t.test_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-og-muted font-mono">{t.duration_ms}ms</span>
                  <Badge variant={t.status === 'PASSED' ? 'success' : 'danger'} size="sm">
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MUTATION TESTING */}
        {activeTab === 'mutations' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-og-violet/10 border border-og-violet/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-og-violet block">Mutation Resistance Score</span>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">{mutationScore}%</div>
              </div>
              <div className="text-right text-xs font-mono text-og-muted">
                <div>Killed: <span className="text-og-success font-semibold">{killedMutants.length}</span></div>
                <div>Survived: <span className="text-og-warning font-semibold">{survivedMutants.length}</span></div>
              </div>
            </div>

            {mutations.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  m.status === 'KILLED'
                    ? 'border-og-border bg-og-panel/30'
                    : 'border-og-warning/40 bg-og-warning/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-og-cyan">{m.mutant_id}</span>
                    <span className="text-og-muted">• {m.mutator_name} at line {m.line_number}</span>
                  </div>
                  <Badge variant={m.status === 'KILLED' ? 'success' : 'warning'} size="sm">
                    {m.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2 rounded-lg">
                  <div>
                    <span className="text-[9px] text-og-muted block">Original Code:</span>
                    <span className="text-og-text">{m.original_code}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-og-muted block">Mutated Code:</span>
                    <span className="text-og-warning">{m.mutated_code}</span>
                  </div>
                </div>

                {m.killer_test && (
                  <p className="text-[10px] text-og-success font-mono">
                    ✓ Killed by test: {m.killer_test}
                  </p>
                )}

                {m.suggested_test && (
                  <div className="p-2 rounded-lg bg-og-warning/10 border border-og-warning/20 text-[11px] text-og-warning">
                    <span className="font-semibold block mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Test Integrity Suggestion:
                    </span>
                    {m.suggested_test}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: SECURITY FINDINGS */}
        {activeTab === 'security' && (
          <div className="space-y-3">
            {security.length === 0 ? (
              <div className="p-8 text-center text-og-success text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-og-success" />
                <span>Zero static security vulnerabilities detected in proposed patch.</span>
              </div>
            ) : (
              security.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-og-danger/30 bg-og-danger/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-og-danger">{s.title}</span>
                    <Badge variant={s.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                      {s.severity}
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] text-og-muted">
                    {s.file_path}:{s.line_number}
                  </div>
                  {s.code_snippet && (
                    <pre className="p-2 rounded bg-black/50 font-mono text-[10px] text-og-cyan">
                      {s.code_snippet}
                    </pre>
                  )}
                  <p className="text-og-muted text-[11px]">
                    <strong className="text-white">Mitigation:</strong> {s.mitigation}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
