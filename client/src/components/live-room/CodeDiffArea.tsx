import React, { useState } from 'react';
import { Copy, Check, FileCode, GitCommit, Layers, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { PatchAttempt } from '../../types';
import { Badge } from '../common/Badge';

interface CodeDiffAreaProps {
  patches: PatchAttempt[];
  currentAttemptNumber: number;
  activePatchHash?: string;
  targetFile: string;
}

export const CodeDiffArea: React.FC<CodeDiffAreaProps> = ({
  patches,
  currentAttemptNumber,
  activePatchHash,
  targetFile
}) => {
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Default to latest patch attempt
  const currentPatch = patches[selectedAttemptIdx] || patches[patches.length - 1];

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDiffLines = (diffText: string) => {
    const lines = diffText.split('\n');
    return lines.map((line, idx) => {
      let bg = 'hover:bg-white/[0.02]';
      let textColor = 'text-og-muted';
      let prefixColor = 'text-og-muted';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        bg = 'bg-og-success/10 hover:bg-og-success/15';
        textColor = 'text-og-success';
        prefixColor = 'text-og-success font-bold';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        bg = 'bg-og-danger/10 hover:bg-og-danger/15';
        textColor = 'text-og-danger line-through';
        prefixColor = 'text-og-danger font-bold';
      } else if (line.startsWith('@')) {
        bg = 'bg-og-violet/10';
        textColor = 'text-og-cyan font-mono';
      }

      return (
        <div key={idx} className={`flex items-start text-xs font-mono py-0.5 px-3 ${bg}`}>
          <span className="w-10 text-right pr-3 select-none text-[10px] text-og-muted/50">
            {idx + 1}
          </span>
          <span className={`w-4 select-none ${prefixColor}`}>
            {line.length > 0 ? line[0] : ' '}
          </span>
          <span className={`flex-1 whitespace-pre-wrap break-all ${textColor}`}>
            {line.substring(1) || ' '}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-og-border flex flex-col h-full">
      {/* Header with Attempts Selector & Target File */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-og-border mb-4">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-og-cyan" />
          <span className="text-xs font-mono font-semibold text-og-text">
            {targetFile}
          </span>
          {currentPatch && (
            <Badge
              variant={
                currentPatch.status === 'PASSED_VERIFICATION'
                  ? 'success'
                  : currentPatch.status === 'TRUST_COLLAPSED'
                  ? 'danger'
                  : 'primary'
              }
              size="sm"
            >
              {currentPatch.status === 'PASSED_VERIFICATION' && <CheckCircle2 className="w-3 h-3 text-og-success" />}
              {currentPatch.status === 'TRUST_COLLAPSED' && <AlertOctagon className="w-3 h-3 text-og-danger" />}
              {currentPatch.status}
            </Badge>
          )}
        </div>

        {/* Attempt Tabs */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <Layers className="w-3.5 h-3.5 text-og-muted ml-1 mr-0.5" />
          {patches.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedAttemptIdx(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                (selectedAttemptIdx === idx || (!patches[selectedAttemptIdx] && idx === patches.length - 1))
                  ? 'bg-og-primary text-white shadow-glow-primary'
                  : 'text-og-muted hover:text-white hover:bg-white/5'
              }`}
            >
              Attempt #{p.attempt_number}
            </button>
          ))}
        </div>
      </div>

      {/* Patch Identity SHA-256 Box */}
      {currentPatch && (
        <div className="mb-3 p-3 rounded-xl bg-black/50 border border-og-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <GitCommit className="w-4 h-4 text-og-cyan flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-og-muted block">
                Bound Patch SHA-256 (Byte-for-Byte Identity):
              </span>
              <span className="text-xs font-mono text-og-cyan font-bold truncate block">
                {currentPatch.patch_hash}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleCopyHash(currentPatch.patch_hash)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:border-og-cyan/40 text-og-text hover:text-white transition-all flex-shrink-0"
            title="Copy exact patch SHA-256 hash"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-og-success" />
                <span className="text-og-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-og-muted" />
                <span>Copy SHA</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Unified Diff View */}
      <div className="flex-1 border border-og-border rounded-xl bg-[#070A11] overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-white/5 bg-black/60 flex items-center justify-between text-[11px] text-og-muted">
          <span>Unified Diff Preview</span>
          {currentPatch && (
            <span className="italic truncate max-w-md text-right text-og-muted/80">
              {currentPatch.expected_behavior}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-auto py-2 font-mono">
          {currentPatch ? (
            renderDiffLines(currentPatch.unified_diff)
          ) : (
            <div className="p-8 text-center text-og-muted text-xs">
              No patch diff generated yet. Awaiting Autonomous Repair Engineer execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
