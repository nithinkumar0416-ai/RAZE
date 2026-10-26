import React, { useState } from 'react';
import { 
  Search, 
  Wrench, 
  Crosshair, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit,
  Scale
} from 'lucide-react';
import { AgentExecution, AgentId } from '../../types';
import { Badge } from '../common/Badge';

interface AgentWorkflowAreaProps {
  agents: AgentExecution[];
  currentStage: string;
}

interface AgentMetadata {
  id: AgentId;
  name: string;
  role: string;
  icon: React.ElementType;
}

const AGENTS_METADATA: AgentMetadata[] = [
  {
    id: 'investigator',
    name: 'Repository Investigator',
    role: 'Root Cause & Baseline Reproduction',
    icon: Search
  },
  {
    id: 'repair',
    name: 'Autonomous Repair Engineer',
    role: 'Minimal Bounded Diff Synthesis',
    icon: Wrench
  },
  {
    id: 'counterexample',
    name: 'Adversarial Counterexample Hunter',
    role: 'Falsification & Negative Boundary Probing',
    icon: Crosshair
  },
  {
    id: 'security',
    name: 'Security Guardian',
    role: 'Static AST & Vulnerability Interception',
    icon: ShieldCheck
  },
  {
    id: 'test_integrity',
    name: 'Test Integrity Engineer',
    role: 'Mutation Testing & Test Strength Verification',
    icon: BrainCircuit
  },
  {
    id: 'evidence_judge',
    name: 'Evidence Judge & Release Gate',
    role: 'Deterministic Release Rule Enforcement',
    icon: Scale
  }
];

export const AgentWorkflowArea: React.FC<AgentWorkflowAreaProps> = ({
  agents,
  currentStage
}) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleExpand = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-og-border flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-og-border">
        <div>
          <h2 className="text-sm font-semibold text-og-text flex items-center gap-2">
            <span>Specialized Verification Agents</span>
            <span className="text-[10px] font-mono text-og-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              6 AGENTS ACTIVE
            </span>
          </h2>
          <p className="text-xs text-og-muted mt-0.5">
            Stage: <span className="text-og-cyan font-mono font-medium">{currentStage}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {AGENTS_METADATA.map((meta) => {
          const exec = agents.find((a) => a.agent_id === meta.id);
          const Icon = meta.icon;

          let status = exec?.status || 'WAITING';
          const isRunning = status === 'RUNNING';
          const isCompleted = status === 'COMPLETED';
          const isFailed = status === 'FAILED';
          const isBlocked = status === 'BLOCKED';

          return (
            <div
              key={meta.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isRunning
                  ? 'border-og-cyan/60 bg-og-cyan/5 shadow-glow-cyan'
                  : isCompleted
                  ? 'border-og-border bg-og-panel/40 hover:border-og-primary/30'
                  : isFailed || isBlocked
                  ? 'border-og-danger/50 bg-og-danger/5'
                  : 'border-white/5 bg-og-panel/20 opacity-60'
              }`}
            >
              <div
                onClick={() => toggleExpand(meta.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      isRunning
                        ? 'bg-og-cyan/20 text-og-cyan agent-active-pulse'
                        : isCompleted
                        ? 'bg-og-primary/15 text-og-primary'
                        : isFailed || isBlocked
                        ? 'bg-og-danger/20 text-og-danger'
                        : 'bg-white/5 text-og-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-og-text truncate">
                        {meta.name}
                      </h4>
                    </div>
                    <p className="text-[10px] text-og-muted truncate">{meta.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  {isRunning && (
                    <Badge variant="cyan" size="sm" pulse>
                      RUNNING
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 text-og-success" />
                      COMPLETED
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="danger" size="sm">
                      <AlertTriangle className="w-3 h-3 text-og-danger" />
                      FAILED
                    </Badge>
                  )}
                  {isBlocked && (
                    <Badge variant="danger" size="sm">
                      BLOCKED
                    </Badge>
                  )}
                  {status === 'WAITING' && (
                    <Badge variant="neutral" size="sm">
                      <Clock className="w-3 h-3" />
                      WAITING
                    </Badge>
                  )}

                  {expandedAgent === meta.id ? (
                    <ChevronUp className="w-4 h-4 text-og-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-og-muted" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {expandedAgent === meta.id && (
                <div className="px-4 pb-4 pt-1 border-t border-og-border/40 text-xs bg-black/20">
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-semibold text-og-muted">Active Assignment:</span>
                    <p className="text-og-text mt-0.5 font-mono text-[11px] leading-relaxed">
                      {exec?.task_description || 'Awaiting stage trigger.'}
                    </p>
                  </div>

                  {exec?.output_summary && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] uppercase font-semibold text-og-cyan block mb-1">Agent Findings & Verdict:</span>
                      <p className="text-og-text text-[11px] leading-relaxed">
                        {exec.output_summary}
                      </p>
                    </div>
                  )}

                  {exec?.structured_data && (
                    <div className="mt-2.5">
                      <span className="text-[10px] uppercase font-semibold text-og-muted block mb-1">Telemetry Artifact:</span>
                      <pre className="text-[10px] font-mono bg-black/60 p-2.5 rounded-lg border border-white/5 overflow-x-auto text-og-cyan/90 max-h-40">
                        {JSON.stringify(exec.structured_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
