import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Bug, 
  Box, 
  Code2, 
  Crosshair, 
  AlertOctagon, 
  RotateCcw, 
  Dna, 
  KeyRound, 
  UserCheck, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { CopilotPipelineStageInfo, CopilotOverview } from '../../types';

interface CopilotStageModalProps {
  stageId: string | null;
  onClose: () => void;
  overview: CopilotOverview | null;
  onSignDecision?: (decision: 'APPROVED' | 'REJECTED', notes?: string) => void;
}

export const CopilotStageModal: React.FC<CopilotStageModalProps> = ({
  stageId,
  onClose,
  overview,
  onSignDecision
}) => {
  const [copied, setCopied] = useState(false);
  const [signerNotes, setSignerNotes] = useState('');
  const [signing, setSigning] = useState(false);

  if (!stageId) return null;

  const currentStage = overview?.stages.find(s => s.id === stageId);
  const title = currentStage?.name || stageId.toUpperCase();
  const stageNum = currentStage?.stageNumber || 'STAGE';
  const bullets = currentStage?.bullets || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStageContent = () => {
    switch (stageId) {
      case 'stage-1':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
              <div className="text-raze-cyan font-bold mb-1">Defect Scope & Invariant Reproduction</div>
              <div className="text-raze-silver mb-2">Defect #104: Discount calculation allows discounts &gt; 100%, negative discount percentages, and NaN/Infinity values.</div>
              <div className="text-rose-400">Exit Code: 1 (Defect reproduced in shadow runtime)</div>
            </div>

            <div className="text-xs text-raze-silverMuted font-mono">
              <span className="text-white font-bold">Reproduction Command:</span>
              <div className="mt-1 p-2.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between text-raze-ice">
                <code>node --test tests/discount.test.ts</code>
                <button onClick={() => handleCopy('node --test tests/discount.test.ts')} className="text-raze-silverMuted hover:text-white">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-1.5">
              <div className="text-white font-semibold">Reproduction Trace:</div>
              <div className="text-rose-400">✖ test: calculateDiscount rejects values &gt; 100% (failed: returned -$50 balance)</div>
              <div className="text-rose-400">✖ test: calculateDiscount rejects negative percentage (failed: inflated price from $100 to $120)</div>
              <div className="text-rose-400">✖ test: calculateDiscount rejects NaN base price (failed: returned NaN without exception)</div>
            </div>
          </div>
        );

      case 'shadow-workspace':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-raze-cyan font-bold mb-1">Sandbox Isolation Contract</div>
              <div className="text-raze-silver space-y-1 text-[11px]">
                <div>• Workspace: <span className="text-raze-ice">Ephemeral temp clone (Isolated from host disk)</span></div>
                <div>• Host Protection: <span className="text-emerald-400">Read-Only Host Repository</span></div>
                <div>• Patch Integrity: <span className="text-raze-cyan">Cryptographically SHA-256 hashed</span></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white font-bold mb-2">Active Sandbox State:</div>
              <div className="p-2.5 rounded bg-black/60 border border-white/5 text-[11px] text-raze-silverMuted break-all">
                SHA-256: <span className="text-raze-ice">{overview?.activePatchHash || 'd87a4c9b3e1f0a2e4c87b9821d3f9b20894a7e93012a64c892b1e704b281f62c'}</span>
              </div>
            </div>
          </div>
        );

      case 'stage-2':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-raze-blue font-bold mb-1">Agent 2 Minimal Repair Proposal (Attempt #1)</div>
              <div className="text-raze-silver text-[11px]">
                Autonomous Repair Engineer proposed an initial bounded upper-limit guard:
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#050811] border border-white/10 text-[11px] overflow-x-auto">
              <pre className="text-emerald-400">
{`@@ -15,7 +15,11 @@ export function calculateDiscount(price, discountPercent) {
+  // Naive repair: only checks upper bound
+  if (discountPercent > 100) {
+    throw new Error('Discount percentage cannot exceed 100%');
+  }
   const discountAmount = (price * discountPercent) / 100;
   const finalPrice = price - discountAmount;`}
              </pre>
            </div>
            <div className="text-amber-400/90 text-[11px] bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              ⚠️ <strong>Vulnerability:</strong> Leaves negative discount percentages, negative base prices, and NaN non-finite numbers unhandled!
            </div>
          </div>
        );

      case 'stage-3':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-raze-cyan font-bold mb-1">Agent 3 Adversarial Counterexample Hunter</div>
              <div className="text-raze-silver text-[11px]">
                Submits candidate patch to aggressive boundary stress testing:
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="text-rose-400 font-bold">1. Negative Discount Exploit: <code>calculateDiscount(100, -20)</code></div>
                <div className="text-raze-silverMuted">Expected: Error. Actual: Returns $120. (Price inflation exploit)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="text-rose-400 font-bold">2. Negative Base Price: <code>calculateDiscount(-50, 10)</code></div>
                <div className="text-raze-silverMuted">Expected: Error. Actual: Returns -$45. (Balance drain exploit)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="text-rose-400 font-bold">3. Float Non-Finite State: <code>calculateDiscount(NaN, 15)</code></div>
                <div className="text-raze-silverMuted">Expected: Error. Actual: Returns NaN without exception.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-emerald-400 font-bold">4. Upper Bound Test: <code>calculateDiscount(100, 150)</code></div>
                <div className="text-raze-silverMuted">Expected: Error. Actual: Throws Exception. (PASSED)</div>
              </div>
            </div>
          </div>
        );

      case 'stage-5':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-400">
                <AlertOctagon className="w-4 h-4" />
                <span>TRUST COLLAPSED — APPROVAL BLOCKED</span>
              </div>
              <div className="text-[11px] leading-relaxed">
                Because 3 confirmed adversarial counterexamples broke Attempt #1, the engine collapsed trust and blocked deployment.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-2">
              <div className="text-white font-bold">Feedback Loop Action:</div>
              <div className="text-raze-silver">
                The exact failing counterexample payloads are serialized and injected into the Autonomous Repair Engineer prompt for <strong>Attempt #2</strong>.
              </div>
              <div className="text-raze-cyan">➔ Triggering Stage 6: Repair Challenge Again</div>
            </div>
          </div>
        );

      case 'stage-6-retry':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-raze-blue font-bold mb-1">Attempt #2 Hardened Fix Synthesis</div>
              <div className="text-raze-silver text-[11px]">
                Autonomous Repair Engineer incorporated counterexample feedback:
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#050811] border border-white/10 text-[11px] overflow-x-auto">
              <pre className="text-emerald-400">
{`+  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
+    throw new Error('Price must be a valid non-negative finite number');
+  }
+  if (typeof discountPercent !== 'number' || !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
+    throw new Error('Discount percentage must be in range [0, 100]');
+  }
+  const rawDiscount = (price * discountPercent) / 100;
+  const discountAmount = Math.round(rawDiscount * 100) / 100;
+  const finalPrice = Math.round((price - discountAmount) * 100) / 100;`}
              </pre>
            </div>
            <div className="text-emerald-400 text-[11px] bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
              ✅ All 4 adversarial boundary conditions successfully resisted!
            </div>
          </div>
        );

      case 'stage-5-5':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-emerald-400 font-bold mb-1">Agent 5: AST Mutation Testing</div>
              <div className="text-raze-silver text-[11px]">
                Synthesizes AST mutations in the patch code to verify the test suite will detect future regressions.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-raze-silverMuted">Mutation Score:</span>
                <span className="font-bold text-emerald-400 text-sm">88% (7 / 8 Killed)</span>
              </div>
              <div className="flex justify-between items-center text-raze-silverMuted">
                <span>Threshold Required:</span>
                <span className="text-white">≥ 85%</span>
              </div>
              <div className="flex justify-between items-center text-raze-silverMuted">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">PASSED</span>
              </div>
            </div>

            <div className="text-[11px] text-raze-silverMuted space-y-1">
              <div>• Mutant 1 (Invert price &lt; 0): <span className="text-emerald-400">KILLED</span></div>
              <div>• Mutant 2 (Flip &gt; 100 to &gt;= 100): <span className="text-emerald-400">KILLED</span></div>
              <div>• Mutant 3 (Remove isFinite check): <span className="text-emerald-400">KILLED</span></div>
              <div>• Mutant 4 (Alter cents round factor): <span className="text-rose-400">SURVIVED</span></div>
            </div>
          </div>
        );

      case 'stage-6-gate':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-amber-400 font-bold mb-1">Deterministic Policy Evaluation Matrix</div>
              <div className="text-raze-silver text-[11px]">
                Strict release criteria evaluated against SHA-256 hash before human sign-off:
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>1. Baseline & Regression Tests</span>
                <span className="text-emerald-400 font-bold">PASSED (10/10)</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>2. Adversarial Counterexamples</span>
                <span className="text-emerald-400 font-bold">0 OPEN (Resisted)</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>3. Security Guardian Scan</span>
                <span className="text-emerald-400 font-bold">0 VULNERABILITIES</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>4. Mutation Testing Score</span>
                <span className="text-emerald-400 font-bold">88% (≥ 85%)</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>5. Security Circuit Breaker</span>
                <span className="text-emerald-400 font-bold">UNTRIPPED</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span>6. Patch SHA-256 Verification</span>
                <span className="text-emerald-400 font-bold">MATCHED</span>
              </div>
            </div>
          </div>
        );

      case 'stage-7':
        return (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
                <UserCheck className="w-4 h-4" />
                <span>READY FOR HUMAN REVIEW</span>
              </div>
              <div className="text-[11px]">
                All automated checks have passed. A lead engineer can now sign off to seal this patch in Verification Memory.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-3">
              <div>
                <label className="text-raze-silverMuted block mb-1">Reviewed Patch Hash (SHA-256):</label>
                <div className="p-2 rounded bg-black/70 border border-white/10 text-raze-cyan break-all">
                  {overview?.activePatchHash || 'd87a4c9b3e1f0a2e4c87b9821d3f9b20894a7e93012a64c892b1e704b281f62c'}
                </div>
              </div>

              <div>
                <label className="text-raze-silverMuted block mb-1">Signer Notes:</label>
                <input
                  type="text"
                  value={signerNotes}
                  onChange={(e) => setSignerNotes(e.target.value)}
                  placeholder="e.g. Verified pricing engine boundaries & cents rounding"
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {onSignDecision && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSigning(true);
                      onSignDecision('APPROVED', signerNotes);
                    }}
                    disabled={signing}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
                  >
                    {signing ? 'SEALING...' : 'APPROVE & SEAL TO MEMORY'}
                  </button>
                  <button
                    onClick={() => onSignDecision('REJECTED', signerNotes)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    REJECT
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-xs font-mono text-raze-silverMuted">
            Stage inspection details for {stageId}.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#090D18] border border-white/15 p-6 shadow-2xl shadow-cyan-950/40 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-raze-cyan uppercase">{stageNum}</span>
            <h2 className="font-raze text-base font-bold text-white tracking-wide">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-raze-silverMuted hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bullets Sub-Header */}
        {bullets.length > 0 && (
          <div className="py-3 border-b border-white/5">
            <ul className="text-xs font-mono text-raze-silverMuted space-y-1 list-disc pl-4 marker:text-raze-cyan">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {renderStageContent()}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 text-white font-mono text-xs hover:bg-white/15 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
