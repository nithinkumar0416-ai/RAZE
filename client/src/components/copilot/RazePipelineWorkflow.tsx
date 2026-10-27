import React, { useState } from 'react';
import { 
  Bug, 
  Box, 
  Code2, 
  Crosshair, 
  AlertOctagon, 
  RotateCcw, 
  Dna, 
  KeyRound, 
  UserCheck, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { CopilotPipelineStageInfo } from '../../types';

interface RazePipelineWorkflowProps {
  stages: CopilotPipelineStageInfo[];
  activeAttempt: number;
  onSelectStage: (stageId: string) => void;
  selectedStageId?: string;
  onTriggerRun?: () => void;
  isRunning?: boolean;
}

export const RazePipelineWorkflow: React.FC<RazePipelineWorkflowProps> = ({
  stages,
  activeAttempt,
  onSelectStage,
  selectedStageId,
  onTriggerRun,
  isRunning
}) => {
  const [viewAttempt, setViewAttempt] = useState<number>(activeAttempt || 1);

  // Sync with prop when prop updates
  React.useEffect(() => {
    if (activeAttempt) {
      setViewAttempt(activeAttempt);
    }
  }, [activeAttempt]);

  const getStage = (id: string): CopilotPipelineStageInfo | undefined => {
    return stages.find((s) => s.id === id);
  };

  const stage1 = getStage('stage-1');
  const shadowWs = getStage('shadow-workspace');
  const stage2 = getStage('stage-2');
  const stage3 = getStage('stage-3');
  const stage5 = getStage('stage-5');
  const stage6Retry = getStage('stage-6-retry');
  const stage55 = getStage('stage-5-5');
  const stage6Gate = getStage('stage-6-gate');
  const stage7 = getStage('stage-7');

  const getNodeStyles = (stageId: string, status?: string) => {
    const isSelected = selectedStageId === stageId;
    let base = "relative p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ";

    if (isSelected) {
      base += "ring-2 ring-raze-cyan shadow-glow-cyan ";
    }

    if (status === 'ACTIVE') {
      base += "bg-raze-blue/15 border-raze-cyan shadow-glow-cyan animate-pulse ";
    } else if (status === 'PASSED') {
      base += "bg-[#061814]/90 border-emerald-500/50 hover:border-emerald-400 ";
    } else if (status === 'FAILED' || status === 'BLOCKED') {
      base += "bg-[#1f090d]/90 border-rose-500/60 hover:border-rose-400 shadow-glow-danger ";
    } else {
      base += "bg-[#090D17]/85 border-white/10 hover:border-white/20 ";
    }

    return base;
  };

  const getBadgeStyle = (status?: string) => {
    if (status === 'ACTIVE') return 'bg-raze-cyan/20 text-raze-cyan border-raze-cyan/40 animate-pulse';
    if (status === 'PASSED') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (status === 'FAILED') return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    if (status === 'BLOCKED') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-white/5 text-raze-silverMuted border-white/10';
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#03060E] border border-white/10 p-5 md:p-7 shadow-2xl overflow-hidden select-none">
      {/* Background Blueprint Grid */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#38BDF8 1px, transparent 1px), linear-gradient(90deg, #38BDF8 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Workflow Header with Exact Reference Styling */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-raze text-lg md:text-xl font-bold tracking-wider text-white">
              SYSTEM ARCHITECTURE: <span className="text-raze-blue font-light">Pipelining Workflow</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-raze-blue/10 border border-raze-blue/30 text-[10px] font-mono text-raze-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-raze-cyan animate-ping" />
              LIVE ENGINE
            </span>
          </div>
          <p className="text-xs text-raze-silverMuted font-mono mt-1">
            Reference Verification Pipeline • Automated Trust Collapse & Bounded Repair
          </p>
        </div>

        {/* View Switcher: Attempt #1 vs Attempt #2 & Quick Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-raze-surface/80 rounded-lg p-1 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewAttempt(1)}
              className={`px-3 py-1 rounded-md transition-all ${
                viewAttempt === 1
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-raze-silverMuted hover:text-white'
              }`}
            >
              ATTEMPT #1 (TRUST COLLAPSE)
            </button>
            <button
              onClick={() => setViewAttempt(2)}
              className={`px-3 py-1 rounded-md transition-all ${
                viewAttempt === 2
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-raze-silverMuted hover:text-white'
              }`}
            >
              ATTEMPT #2 (VERIFIED)
            </button>
          </div>

          {onTriggerRun && (
            <button
              onClick={onTriggerRun}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void font-raze text-xs font-bold tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-glow-cyan"
            >
              <Zap className="w-3.5 h-3.5 fill-raze-void" />
              <span>{isRunning ? 'RUNNING...' : 'RUN PIPELINE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Root Anchor Badge: RAZE VERIFICATION */}
      <div className="relative z-10 flex justify-center mb-8">
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-xl bg-raze-surface/90 border border-raze-cyan/40 shadow-glow-cyan backdrop-blur-xl">
          <ShieldCheck className="w-5 h-5 text-raze-cyan" />
          <span className="font-raze font-bold text-sm tracking-widest text-white text-glow-cyan">
            RAZE VERIFICATION
          </span>
        </div>
      </div>

      {/* SVG Connecting Flow Lines (SVG Canvas overlay for crisp high-tech connectors) */}
      <div className="relative z-10">
        {/* ROW 1: STAGE 1 & REPAIR SHADOW WORKSPACE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-6">
          {/* Left Column: STAGE 1: BASELINE AUDIT */}
          <div className="md:col-span-6 space-y-6">
            <div
              onClick={() => onSelectStage('stage-1')}
              className={getNodeStyles('stage-1', stage1?.status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-raze-cyan">
                    <Bug className="w-4 h-4" />
                  </div>
                  <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                    STAGE 1: BASELINE AUDIT
                  </h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage1?.status)}`}>
                  {stage1?.status || 'READY'}
                </span>
              </div>
              <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-raze-cyan">
                <li>Reproduce defect #104</li>
                <li>Record exit code & logs</li>
              </ul>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-raze-silverMuted font-mono">
                <span>Exit Code: 1 (Failing Baseline)</span>
                <span className="text-raze-cyan hover:underline flex items-center gap-1">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* STAGE 2: MINIMAL REPAIR (Agent 2) */}
            <div
              onClick={() => onSelectStage('stage-2')}
              className={getNodeStyles('stage-2', stage2?.status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-raze-blue">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                    STAGE 2: MINIMAL REPAIR
                  </h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage2?.status)}`}>
                  {stage2?.status || 'READY'}
                </span>
              </div>
              <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-raze-blue">
                <li>Agent 2 proposes patch</li>
                <li>SHA-256 Hash calculated</li>
              </ul>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-raze-silverMuted font-mono">
                <span className="truncate max-w-[200px]">SHA: {stage2?.data?.patchHash || 'd87a4c9b3e1f0a2...'}</span>
                <span className="text-raze-blue hover:underline flex items-center gap-1">
                  View Diff <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: REPAIR SHADOW WORKSPACE */}
          <div className="md:col-span-6">
            <div
              onClick={() => onSelectStage('shadow-workspace')}
              className={`${getNodeStyles('shadow-workspace', shadowWs?.status)} min-h-[180px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-raze-blue/10 border border-raze-blue/30 text-raze-cyan">
                      <Box className="w-4 h-4" />
                    </div>
                    <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                      REPAIR SHADOW WORKSPACE
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(shadowWs?.status)}`}>
                    {shadowWs?.status || 'ISOLATED'}
                  </span>
                </div>
                <ul className="text-xs text-raze-silver font-mono space-y-1.5 pl-4 list-disc marker:text-raze-cyan">
                  <li>Ephemeral clone of repo</li>
                  <li>Isolated from host disk</li>
                  <li>Patch applied & hashed</li>
                </ul>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-raze-silverMuted flex items-center justify-between">
                <span>Sandbox: <span className="text-emerald-400">ISOLATED TMP</span></span>
                <span className="text-raze-cyan flex items-center gap-1">
                  Inspect Sandbox <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: STAGE 3: ADVERSARIAL HUNT (Central Decision Node) */}
        <div className="mb-6">
          <div
            onClick={() => onSelectStage('stage-3')}
            className={`${getNodeStyles('stage-3', stage3?.status)} max-w-2xl mx-auto`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-raze-cyan">
                  <Crosshair className="w-4 h-4" />
                </div>
                <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                  STAGE 3: ADVERSARIAL HUNT
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage3?.status)}`}>
                {stage3?.status || 'TESTING BOUNDS'}
              </span>
            </div>
            <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-raze-cyan">
              <li>Agent 3 hunts edge cases & boundary inputs (e.g., 150%, NaN, -50)</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted">150%</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted">NaN</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted">-50</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted">Infinity</span>
              </div>
              <span className="text-raze-cyan hover:underline flex items-center gap-1">
                View Attack Payloads <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ROW 3: BIFURCATION / BRANCHING */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-6">
          {/* LEFT BRANCH: [Failure Found] ➔ STAGE 5 COLLAPSE TRUST ➔ STAGE 6 RETRY */}
          <div className={`md:col-span-6 space-y-5 rounded-2xl p-4 border transition-all ${
            viewAttempt === 1 
              ? 'bg-rose-950/20 border-rose-500/40 shadow-glow-danger' 
              : 'opacity-60 border-white/5 bg-black/20'
          }`}>
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold px-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>[Failure Found]</span>
              <span className="text-[10px] text-raze-silverMuted font-normal">— Boundary violations confirmed</span>
            </div>

            {/* STAGE 5: COLLAPSE UNSUPPORTED TRUST */}
            <div
              onClick={() => onSelectStage('stage-5')}
              className={getNodeStyles('stage-5', stage5?.status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <h3 className="font-raze text-xs font-bold text-rose-200 tracking-wider">
                    STAGE 5: COLLAPSE UNSUPPORTED TRUST
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-300 border-rose-500/40">
                  BLOCKED
                </span>
              </div>
              <ul className="text-xs text-rose-200/90 font-mono space-y-1 pl-4 list-disc marker:text-rose-400">
                <li className="font-bold text-rose-300">Approval BLOCKED</li>
                <li>Failure evidence fed to Attempt 2</li>
              </ul>
              <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px] text-rose-300/80 font-mono">
                <span>3 Counterexamples Captured</span>
                <span className="text-rose-400 hover:underline flex items-center gap-1">
                  Evidence Logs <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* STAGE 6: REPAIR CHALLENGE AGAIN */}
            <div
              onClick={() => onSelectStage('stage-6-retry')}
              className={getNodeStyles('stage-6-retry', stage6Retry?.status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-raze-blue">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                    STAGE 6: REPAIR CHALLENGE AGAIN
                  </h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage6Retry?.status)}`}>
                  {stage6Retry?.status || 'ATTEMPT #2'}
                </span>
              </div>
              <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-raze-blue">
                <li>(Attempt #2 fix)</li>
                <li>Harden type checks, negatives, & rounding</li>
              </ul>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-raze-silverMuted font-mono">
                <span>Incorporates Counterexample Evidence</span>
                <span className="text-raze-blue hover:underline flex items-center gap-1">
                  Inspect Attempt #2 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT BRANCH: [All Passed] ➔ STAGE 5.5 MUTATION TEST TRUST */}
          <div className={`md:col-span-6 space-y-5 rounded-2xl p-4 border transition-all ${
            viewAttempt === 2 
              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-glow-primary' 
              : 'opacity-60 border-white/5 bg-black/20'
          }`}>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>[All Passed]</span>
              <span className="text-[10px] text-raze-silverMuted font-normal">— Boundary defenses hold</span>
            </div>

            {/* STAGE 5.5: MUTATION TEST TRUST */}
            <div
              onClick={() => onSelectStage('stage-5-5')}
              className={`${getNodeStyles('stage-5-5', stage55?.status)} min-h-[148px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Dna className="w-4 h-4" />
                    </div>
                    <h3 className="font-raze text-xs font-bold text-white tracking-wider">
                      STAGE 5.5: MUTATION TEST TRUST
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage55?.status)}`}>
                    {stage55?.status || 'SCORE: 88%'}
                  </span>
                </div>
                <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-emerald-400">
                  <li>Agent 5 synthesizes AST mutants</li>
                  <li>Tests mutants (Killed vs Surv)</li>
                  <li>Mutation score calculated</li>
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-raze-silverMuted font-mono">
                <span>Killed: 7 / 8 (Score 88%)</span>
                <span className="text-emerald-400 hover:underline flex items-center gap-1">
                  Mutants Table <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: STAGE 6: DETERMINISTIC GATE */}
        <div className="mb-6">
          <div
            onClick={() => onSelectStage('stage-6-gate')}
            className={`${getNodeStyles('stage-6-gate', stage6Gate?.status)} max-w-2xl mx-auto`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-raze text-xs font-bold text-amber-300 tracking-wider">
                  STAGE 6: DETERMINISTIC GATE
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage6Gate?.status)}`}>
                {stage6Gate?.status || 'EVALUATING'}
              </span>
            </div>
            <ul className="text-xs text-raze-silver font-mono space-y-1 pl-4 list-disc marker:text-amber-400">
              <li>Strict policy rule matrix</li>
              <li>Blocks if tests/security fail</li>
              <li>Verifies exact SHA-256 hash</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-raze-silverMuted font-mono">
              <span>Policy Evaluation: 6/6 Checks Passed</span>
              <span className="text-amber-400 hover:underline flex items-center gap-1">
                Policy Matrix <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ROW 5: STAGE 7: HUMAN INTEGRATION SIGN */}
        <div className="max-w-xl mx-auto">
          <div
            onClick={() => onSelectStage('stage-7')}
            className={`${getNodeStyles('stage-7', stage7?.status)} border-emerald-500/50 bg-[#061A14]/90`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-raze text-xs font-bold text-emerald-200 tracking-wider">
                  STAGE 7: HUMAN INTEGRATION SIGN
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeStyle(stage7?.status)}`}>
                {stage7?.status || 'READY'}
              </span>
            </div>
            <ul className="text-xs text-emerald-100/90 font-mono space-y-1 pl-4 list-disc marker:text-emerald-400">
              <li className="font-bold">"Ready for Human Review"</li>
              <li>Sealed in Verification Memory</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
              <span>Cryptographic Human Approval</span>
              <span className="text-emerald-400 hover:underline flex items-center gap-1">
                Sign Decision <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
