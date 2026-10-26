import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  ArrowLeft, 
  ShieldAlert, 
  AlertOctagon, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { FullRunDetails } from '../types';
import { AgentWorkflowArea } from '../components/live-room/AgentWorkflowArea';
import { CodeDiffArea } from '../components/live-room/CodeDiffArea';
import { ChallengeResultsArea } from '../components/live-room/ChallengeResultsArea';
import { ReleaseGateArea } from '../components/live-room/ReleaseGateArea';
import { CircuitBreakerModal } from '../components/live-room/CircuitBreakerModal';
import { Badge } from '../components/common/Badge';

interface LiveVerificationRoomPageProps {
  runId: string;
  onNavigate: (path: string) => void;
}

export const LiveVerificationRoomPage: React.FC<LiveVerificationRoomPageProps> = ({
  runId,
  onNavigate
}) => {
  const [runDetails, setRunDetails] = useState<FullRunDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const [liveEventCount, setLiveEventCount] = useState(0);

  const fetchDetails = async () => {
    try {
      const data = await api.getRun(runId);
      setRunDetails(data);
      if (data.circuit_breaker_tripped) {
        setCircuitBreakerOpen(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Setup Live Server-Sent Events (SSE) Stream
    const eventSource = new EventSource(`/api/runs/${runId}/events`);

    eventSource.onmessage = (e) => {
      // General message
    };

    const handleEventUpdate = () => {
      setLiveEventCount((prev) => prev + 1);
      fetchDetails();
    };

    eventSource.addEventListener('agent.started', handleEventUpdate);
    eventSource.addEventListener('agent.completed', handleEventUpdate);
    eventSource.addEventListener('patch.generated', handleEventUpdate);
    eventSource.addEventListener('counterexample.discovered', handleEventUpdate);
    eventSource.addEventListener('test.completed', handleEventUpdate);
    eventSource.addEventListener('mutation.completed', handleEventUpdate);
    eventSource.addEventListener('security.finding', handleEventUpdate);
    eventSource.addEventListener('repair.retry', handleEventUpdate);
    eventSource.addEventListener('verification.completed', handleEventUpdate);
    eventSource.addEventListener('circuit_breaker.activated', (e: any) => {
      setCircuitBreakerOpen(true);
      fetchDetails();
    });

    eventSource.onerror = () => {
      // SSE connection error/closed
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  const handleRetry = async () => {
    try {
      await api.retryRun(runId);
      fetchDetails();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-2 border-og-cyan/30 border-t-og-cyan animate-spin" />
          <Radio className="w-5 h-5 text-og-cyan absolute inset-0 m-auto" />
        </div>
        <p className="text-xs text-og-muted font-mono">Synchronizing with Shadow Verification Sandbox...</p>
      </div>
    );
  }

  if (error || !runDetails) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertOctagon className="w-10 h-10 text-og-danger mx-auto" />
        <h3 className="text-lg font-semibold text-white">Verification Room Error</h3>
        <p className="text-xs text-og-muted">{error || 'Run details unavailable'}</p>
        <button
          onClick={() => onNavigate('/runs')}
          className="px-4 py-2 rounded-xl bg-og-primary text-black text-xs font-semibold"
        >
          Return to Verification Runs
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Banner with Run Identity & Live Pulse */}
      <div className="glass-panel p-4 rounded-2xl border border-og-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/runs')}
            className="p-2 rounded-xl text-og-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Back to runs list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-og-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-og-cyan"></span>
              </span>
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">
                LIVE ROOM: {runDetails.id}
              </h2>
              <Badge variant="cyan" size="sm">
                STAGE: {runDetails.stage}
              </Badge>
              {runDetails.circuit_breaker_tripped && (
                <Badge variant="danger" size="sm" pulse>
                  CIRCUIT BREAKER ACTIVATED
                </Badge>
              )}
            </div>
            <p className="text-xs text-og-muted mt-0.5 truncate max-w-2xl">
              Target Defect: <span className="text-og-text font-medium">{runDetails.defect_title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono text-og-muted">
            <div>Attempt: <span className="text-white font-semibold">#{runDetails.current_attempt}</span> / {runDetails.max_retries}</div>
            <div className="text-[10px] text-og-cyan">Live SSE Events: {liveEventCount}</div>
          </div>
          <button
            onClick={fetchDetails}
            className="p-2 rounded-xl border border-og-border bg-og-panel text-og-muted hover:text-white transition-colors"
            title="Force refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The 4 Synchronized Areas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[720px]">
        {/* Area A: Specialized Agents Workflow (Left Column, 3.5 cols) */}
        <div className="lg:col-span-4 h-full">
          <AgentWorkflowArea
            agents={runDetails.agents}
            currentStage={runDetails.stage}
          />
        </div>

        {/* Center & Right Columns (8.5 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Row: Area B (Code Diff) & Area D (Release Gate) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Area B: Code Diff (7 cols) */}
            <div className="xl:col-span-7 h-[390px]">
              <CodeDiffArea
                patches={runDetails.patches}
                currentAttemptNumber={runDetails.current_attempt}
                activePatchHash={runDetails.active_patch_hash}
                targetFile={runDetails.target_file}
              />
            </div>

            {/* Area D: Deterministic Release Gate (5 cols) */}
            <div className="xl:col-span-5 h-[390px]">
              <ReleaseGateArea
                runId={runDetails.id}
                recommendation={runDetails.release_recommendation}
                activePatchHash={runDetails.active_patch_hash}
                onRetry={handleRetry}
                onDecisionSubmitted={fetchDetails}
                decisions={runDetails.decisions}
              />
            </div>
          </div>

          {/* Bottom Row: Area C (Challenge Results, Executable Tests, Mutation & Security) */}
          <div className="h-[360px]">
            <ChallengeResultsArea
              tests={runDetails.tests}
              counterexamples={runDetails.counterexamples}
              mutations={runDetails.mutations}
              security={runDetails.security}
            />
          </div>
        </div>
      </div>

      {/* Circuit Breaker Popup Modal */}
      <CircuitBreakerModal
        isOpen={circuitBreakerOpen}
        onClose={() => setCircuitBreakerOpen(false)}
        reason={runDetails.circuit_breaker_reason}
      />
    </div>
  );
};
