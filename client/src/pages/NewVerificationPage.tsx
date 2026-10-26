import React, { useEffect, useState } from 'react';
import { PlayCircle, ShieldCheck, Bug, Sliders, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Repository } from '../types';

interface NewVerificationPageProps {
  onNavigate: (path: string) => void;
}

export const NewVerificationPage: React.FC<NewVerificationPageProps> = ({ onNavigate }) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [defectTitle, setDefectTitle] = useState('Pricing Inversion via Negative Discount & Out-of-Bounds Exploit');
  const [defectDesc, setDefectDesc] = useState('Function calculateDiscount fails to reject negative discount percentages (which surge prices), discounts exceeding 100% (causing negative invoices), and NaN inputs without throwing validation errors.');
  const [targetFile, setTargetFile] = useState('src/discount.ts');
  const [maxRetries, setMaxRetries] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await api.getRepositories();
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepoId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load repositories:', err);
      }
    }
    loadRepos();
  }, []);

  const presets = [
    {
      title: 'Pricing Inversion via Negative Discount Exploit',
      desc: 'Function calculateDiscount permits negative discount percentages (causes price surge), percentages > 100% (negative balance), and NaN inputs without rejection.',
      file: 'src/discount.ts'
    },
    {
      title: 'Unchecked Non-Finite Numeric State (NaN / Infinity)',
      desc: 'Corrupt numerical states propagate through checkout calculation pipelines when inputs bypass typeof and Number.isFinite validation.',
      file: 'src/discount.ts'
    },
    {
      title: 'Negative Base Price Ledger Inversion',
      desc: 'Pricing function does not enforce non-negative base price constraint, allowing negative transactions in payment gateway.',
      file: 'src/discount.ts'
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setDefectTitle(p.title);
    setDefectDesc(p.desc);
    setTargetFile(p.file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !defectTitle.trim() || !defectDesc.trim()) return;

    setLoading(true);
    try {
      const res = await api.createRun({
        repository_id: selectedRepoId,
        defect_title: defectTitle,
        defect_description: defectDesc,
        target_file: targetFile,
        max_retries: maxRetries
      });
      onNavigate(`/runs/${res.run_id}`);
    } catch (err: any) {
      alert(`Error initializing verification run: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Configure New Verification Run</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-og-primary/20 text-og-cyan border border-og-primary/30 font-mono">
            TRUST COLLAPSE ENGINE
          </span>
        </h2>
        <p className="text-xs text-og-muted mt-1">
          Define the target defect, specify sandbox boundaries, and trigger the 6-agent verification workflow.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="glass-panel p-5 rounded-2xl border border-og-border space-y-3">
        <span className="text-xs uppercase font-semibold text-og-cyan flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Defect Scenarios (Bundled Demo Repository)</span>
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((p, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="p-3.5 rounded-xl border border-white/5 bg-og-panel/40 hover:border-og-primary/40 hover:bg-og-primary/5 cursor-pointer transition-all space-y-1"
            >
              <h4 className="text-xs font-semibold text-og-text">{p.title}</h4>
              <p className="text-[11px] text-og-muted line-clamp-2 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-og-border space-y-5">
        <div className="space-y-4">
          {/* Repository Selector */}
          <div>
            <label className="text-xs font-semibold text-og-muted uppercase block mb-1.5">
              Target Repository
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary transition-colors"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.branch}) {r.is_demo ? '— [Bundled Demo Repository]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Defect Title */}
          <div>
            <label className="text-xs font-semibold text-og-muted uppercase block mb-1.5">
              Defect Title / Bug Description
            </label>
            <input
              type="text"
              value={defectTitle}
              onChange={(e) => setDefectTitle(e.target.value)}
              placeholder="e.g. Unchecked discount calculation boundary"
              className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary transition-colors"
              required
            />
          </div>

          {/* Defect Details */}
          <div>
            <label className="text-xs font-semibold text-og-muted uppercase block mb-1.5">
              Defect Reproduction Details & Root Cause Context
            </label>
            <textarea
              value={defectDesc}
              onChange={(e) => setDefectDesc(e.target.value)}
              rows={3}
              placeholder="Provide exact failure cases or unexpected behavior..."
              className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary transition-colors resize-none"
              required
            />
          </div>

          {/* Target File & Max Retries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-og-muted uppercase block mb-1.5">
                Target Source File
              </label>
              <input
                type="text"
                value={targetFile}
                onChange={(e) => setTargetFile(e.target.value)}
                className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-og-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-og-muted uppercase block mb-1.5">
                Max Repair & Challenge Retries
              </label>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary transition-colors"
              >
                <option value={1}>1 Attempt (No Retries)</option>
                <option value={2}>2 Bounded Attempts</option>
                <option value={3}>3 Bounded Attempts (Recommended)</option>
                <option value={5}>5 Bounded Attempts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verification Safeguards Checklist */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs text-og-muted">
          <span className="text-[10px] uppercase font-bold text-og-cyan block mb-1">
            Enforced Verification Protocols:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-[11px] text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-og-success" />
              <span>Isolated Repair Shadow Workspace</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-og-success" />
              <span>Adversarial Counterexample Falsification</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-og-success" />
              <span>Mutation-Based Test Trust Score</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-og-success" />
              <span>Security Circuit Breaker & Byte SHA-256 Binding</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-og-primary to-og-cyan text-black font-bold text-sm hover:opacity-95 shadow-glow-primary transition-all duration-200 disabled:opacity-40"
          >
            <PlayCircle className="w-4 h-4 fill-current" />
            <span>{loading ? 'Initializing Sandbox...' : 'Initialize Verification Run'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
