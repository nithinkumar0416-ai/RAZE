import React, { useEffect, useState } from 'react';
import { Database, Search, Trash2, Tag, CheckCircle2, ShieldCheck, GitCommit, FileCode } from 'lucide-react';
import { api } from '../services/api';
import { VerificationMemoryItem } from '../types';
import { Badge } from '../components/common/Badge';

export const MemoryPage: React.FC = () => {
  const [items, setItems] = useState<VerificationMemoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMemory = async (q?: string) => {
    setLoading(true);
    try {
      const data = q ? await api.searchMemory(q) : await api.getMemory();
      setItems(data);
    } catch (err) {
      console.error('Failed to load memory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemory(searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this historical memory record?')) return;
    try {
      await api.deleteMemory(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Repository Verification Memory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-og-violet/20 text-og-violet border border-og-violet/30 font-mono">
              PERSISTENT AUDIT VAULT
            </span>
          </h2>
          <p className="text-xs text-og-muted mt-1">
            Historical failure patterns, confirmed adversarial counterexamples, and preserved regression suites.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass-panel p-4 rounded-2xl border border-og-border flex items-center gap-3">
        <Search className="w-4 h-4 text-og-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search historical failure patterns, keywords, or bug titles..."
          className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-og-muted focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-1.5 rounded-xl bg-og-primary text-black font-semibold text-xs hover:bg-og-primary/90 transition-colors"
        >
          Search Memory
        </button>
      </form>

      {/* Memory Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-og-muted">Retrieving verification memory records...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-og-muted space-y-2">
            <Database className="w-8 h-8 text-og-muted mx-auto" />
            <p>No verification memory entries found matching your query.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-6 rounded-2xl border border-og-border glass-panel-hover space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white tracking-tight">{item.bug_title}</h3>
                    <Badge variant="success" size="sm">
                      {item.final_decision}
                    </Badge>
                  </div>
                  <p className="text-xs text-og-muted leading-relaxed max-w-3xl">
                    {item.bug_description}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-og-muted hover:text-og-danger hover:bg-og-danger/10 transition-colors"
                  title="Delete memory record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Defect Pattern & Hash */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-og-muted uppercase font-semibold block">Identified Failure Pattern:</span>
                  <span className="text-og-cyan font-mono text-[11px]">{item.defect_pattern}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-og-muted uppercase font-semibold block">Verified Patch SHA-256:</span>
                  <span className="text-og-text font-mono text-[11px] truncate block">
                    {item.patch_hash || 'Historical Baseline'}
                  </span>
                </div>
              </div>

              {/* Confirmed Counterexamples & Reusable Regression Tests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {item.confirmed_counterexamples && item.confirmed_counterexamples.length > 0 && (
                  <div className="p-3 rounded-xl bg-og-danger/5 border border-og-danger/20 space-y-1.5">
                    <span className="text-[10px] text-og-danger uppercase font-bold block">
                      Confirmed Historical Counterexamples ({item.confirmed_counterexamples.length}):
                    </span>
                    <ul className="space-y-1 text-[11px] font-mono text-og-muted">
                      {item.confirmed_counterexamples.map((ce: any, idx: number) => (
                        <li key={idx} className="truncate">
                          • {ce.input || JSON.stringify(ce)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.successful_regression_tests && item.successful_regression_tests.length > 0 && (
                  <div className="p-3 rounded-xl bg-og-success/5 border border-og-success/20 space-y-1.5">
                    <span className="text-[10px] text-og-success uppercase font-bold block">
                      Preserved High-Value Regression Tests:
                    </span>
                    <ul className="space-y-1 text-[11px] font-mono text-og-muted">
                      {item.successful_regression_tests.map((testName: string, idx: number) => (
                        <li key={idx} className="truncate">
                          ✓ {testName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tags & Timestamp */}
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-og-muted" />
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-white/5 text-og-cyan border border-white/10 font-mono text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-og-muted font-mono text-[10px]">
                  Preserved: {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
