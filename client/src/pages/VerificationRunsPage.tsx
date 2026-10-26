import React, { useEffect, useState } from 'react';
import { Search, Activity, Filter, ArrowRight, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { VerificationRun } from '../types';
import { Badge } from '../components/common/Badge';

interface VerificationRunsPageProps {
  onNavigate: (path: string) => void;
}

export const VerificationRunsPage: React.FC<VerificationRunsPageProps> = ({ onNavigate }) => {
  const [runs, setRuns] = useState<VerificationRun[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await api.getRuns();
      setRuns(data);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch = 
      r.defect_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.target_file.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' ||
      r.release_recommendation === statusFilter ||
      r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verification Run History</h2>
          <p className="text-xs text-og-muted mt-1">
            Searchable historical audit trails, shadow runs, and deterministic gate verdicts.
          </p>
        </div>

        <button
          onClick={fetchRuns}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-og-border bg-og-panel text-xs text-og-muted hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-og-border flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-og-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by defect title, target file, or run ID..."
            className="w-full bg-black/40 border border-og-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-og-muted focus:outline-none focus:border-og-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-og-muted" />
          <span className="text-xs text-og-muted">Filter:</span>
          {['ALL', 'READY_FOR_HUMAN_REVIEW', 'BLOCKED', 'NEEDS_REVIEW'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-og-primary text-white shadow-glow-primary'
                  : 'bg-white/5 text-og-muted hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table */}
      <div className="glass-panel rounded-2xl border border-og-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-og-muted">Loading verification records...</div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-xs text-og-muted space-y-2">
            <Activity className="w-8 h-8 text-og-muted mx-auto" />
            <p>No verification runs match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-og-border bg-black/40 text-[11px] text-og-muted font-mono uppercase">
                  <th className="py-3.5 px-5">Run ID & Snapshot</th>
                  <th className="py-3.5 px-4">Defect Scope</th>
                  <th className="py-3.5 px-4">Target File</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Current Attempt</th>
                  <th className="py-3.5 px-4">Release Verdict</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRuns.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onNavigate(`/runs/${r.id}`)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-og-cyan font-semibold">
                      {r.id.substring(0, 18)}...
                    </td>
                    <td className="py-3.5 px-4 text-og-text font-medium truncate max-w-sm">
                      {r.defect_title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-og-muted">
                      {r.target_file}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 text-og-cyan border border-white/10">
                        {r.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-og-muted">
                      Attempt #{r.current_attempt} / {r.max_retries}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.release_recommendation === 'READY_FOR_HUMAN_REVIEW'
                            ? 'success'
                            : r.release_recommendation === 'BLOCKED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {r.release_recommendation === 'READY_FOR_HUMAN_REVIEW' && <CheckCircle2 className="w-3 h-3 text-og-success" />}
                        {r.release_recommendation === 'BLOCKED' && <XCircle className="w-3 h-3 text-og-danger" />}
                        {r.release_recommendation === 'NEEDS_REVIEW' && <AlertTriangle className="w-3 h-3 text-og-warning" />}
                        {r.release_recommendation}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-og-cyan hover:underline font-mono text-[11px] font-medium">
                        Open Room →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
