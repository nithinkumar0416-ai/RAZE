import React from 'react';
import { ShieldAlert, AlertOctagon, Terminal, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface CircuitBreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const CircuitBreakerModal: React.FC<CircuitBreakerModalProps> = ({
  isOpen,
  onClose,
  reason
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SECURITY CIRCUIT BREAKER ACTIVATED"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-og-danger/15 border border-og-danger/40 flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-og-danger flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-og-danger uppercase tracking-wide">
              Automated Verification Aborted
            </h4>
            <p className="text-xs text-og-text mt-1 leading-relaxed">
              OpenGuard's safety controls halted sandbox execution to protect system integrity and prevent unsafe code propagation.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-xs font-mono">
          <span className="text-[10px] text-og-muted uppercase font-bold block">
            Trip Trigger Rationale:
          </span>
          <p className="text-og-cyan break-words">
            {reason || 'Safety control triggered due to security policy or execution anomaly.'}
          </p>
        </div>

        <div className="space-y-2 text-xs text-og-muted leading-relaxed">
          <p>
            • All temporary shadow workspace processes have been safely terminated.
          </p>
          <p>
            • No changes were committed to the primary branch.
          </p>
          <p>
            • Diagnostic logs have been sealed in the run evidence dossier.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-og-danger text-white text-xs font-semibold hover:bg-og-danger/90 transition-colors"
          >
            Acknowledge & Inspect Dossier
          </button>
        </div>
      </div>
    </Modal>
  );
};
