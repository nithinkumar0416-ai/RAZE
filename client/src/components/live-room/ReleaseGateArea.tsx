import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  FileText, 
  RefreshCw, 
  UserCheck, 
  ThumbsUp, 
  ThumbsDown,
  Lock
} from 'lucide-react';
import { ReleaseRecommendation, HumanDecision } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

interface ReleaseGateAreaProps {
  runId: string;
  recommendation: ReleaseRecommendation;
  activePatchHash?: string;
  onRetry: () => void;
  onDecisionSubmitted: () => void;
  decisions: HumanDecision[];
}

export const ReleaseGateArea: React.FC<ReleaseGateAreaProps> = ({
  runId,
  recommendation,
  activePatchHash,
  onRetry,
  onDecisionSubmitted,
  decisions
}) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isReady = recommendation === 'READY_FOR_HUMAN_REVIEW';
  const isBlocked = recommendation === 'BLOCKED';
  const isNeedsReview = recommendation === 'NEEDS_REVIEW';

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED' | 'REQUEST_REPAIR') => {
    if (!activePatchHash) return;
    setLoading(true);
    setActionMessage(null);
    try {
      await api.submitDecision(runId, decision, activePatchHash, notes);
      setActionMessage(`Decision "${decision}" bound to patch hash successfully.`);
      onDecisionSubmitted();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-og-border flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-og-border mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-og-cyan" />
            <h3 className="text-sm font-semibold text-og-text">Deterministic Release Gate</h3>
          </div>
          <Badge
            variant={isReady ? 'success' : isBlocked ? 'danger' : 'warning'}
            size="md"
            pulse={recommendation === 'PENDING'}
          >
            {recommendation}
          </Badge>
        </div>

        {/* Verdict Banner */}
        <div
          className={`p-4 rounded-xl border mb-4 text-xs space-y-1.5 ${
            isReady
              ? 'bg-og-success/10 border-og-success/30 text-og-success'
              : isBlocked
              ? 'bg-og-danger/10 border-og-danger/30 text-og-danger'
              : 'bg-og-warning/10 border-og-warning/30 text-og-warning'
          }`}
        >
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
            {isReady && <CheckCircle2 className="w-4 h-4" />}
            {isBlocked && <XCircle className="w-4 h-4" />}
            {isNeedsReview && <AlertTriangle className="w-4 h-4" />}
            <span>Gate Outcome: {recommendation}</span>
          </div>
          <p className="text-og-text leading-relaxed">
            {isReady && 'All mandatory boundary and regression checks completed successfully. No critical vulnerabilities detected. Ready for human authorization.'}
            {isBlocked && 'Automated approval strictly prohibited. Active counterexamples or mandatory failed tests detected. Patch must undergo bounded repair.'}
            {isNeedsReview && 'Required checks passed baseline, but unresolved risks or surviving mutants require engineer manual inspection.'}
          </p>
        </div>

        {/* Bound Patch Hash Indicator */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 mb-4 text-xs">
          <span className="text-[10px] text-og-muted uppercase font-semibold block mb-1">
            Authorizing Patch SHA-256 Signature:
          </span>
          <code className="text-[11px] font-mono text-og-cyan break-all">
            {activePatchHash || 'Awaiting patch synthesis...'}
          </code>
        </div>

        {/* Prior Decisions History */}
        {decisions.length > 0 && (
          <div className="mb-4 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-og-muted block">
              Recorded Human Signatures ({decisions.length}):
            </span>
            {decisions.map((d) => (
              <div
                key={d.id}
                className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-white mr-2">[{d.decision}]</span>
                  <span className="text-og-muted text-[11px]">{d.reviewer_name}</span>
                </div>
                <span className="text-[10px] font-mono text-og-cyan">
                  Matched: {d.verified_hash_matched ? '✓ Validated' : '✗ Invalidated'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Message */}
        {actionMessage && (
          <div className="p-2.5 rounded-lg bg-og-primary/10 border border-og-primary/30 text-xs text-og-cyan mb-3">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="pt-3 border-t border-og-border space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional reviewer rationale or notes..."
          rows={2}
          className="w-full bg-black/40 border border-og-border rounded-xl p-2.5 text-xs text-og-text placeholder:text-og-muted focus:outline-none focus:border-og-primary resize-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={!isReady || loading || !activePatchHash}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-og-success text-black font-semibold text-xs hover:bg-og-success/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-glow-primary"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Approve Exact Patch</span>
          </button>

          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={loading || !activePatchHash}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-og-danger/20 text-og-danger border border-og-danger/30 hover:bg-og-danger/30 text-xs font-semibold transition-all disabled:opacity-30"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Reject Patch</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={onRetry}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-og-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Request Repair Retry</span>
          </button>

          <div className="flex items-center gap-1.5">
            <a
              href={api.getEvidenceMarkdownUrl(runId)}
              download
              className="p-1.5 rounded-lg text-og-muted hover:text-og-cyan hover:bg-white/5 transition-colors"
              title="Download Markdown Dossier"
            >
              <FileText className="w-4 h-4" />
            </a>
            <a
              href={api.getEvidenceJsonUrl(runId)}
              download
              className="p-1.5 rounded-lg text-og-muted hover:text-og-cyan hover:bg-white/5 transition-colors"
              title="Download JSON Report"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
