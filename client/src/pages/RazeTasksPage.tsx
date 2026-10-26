import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RazeTask } from '../types';
import { 
  Terminal, 
  Play, 
  XCircle, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Zap, 
  Filter, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface RazeTasksPageProps {
  initialIntent?: string;
}

export const RazeTasksPage: React.FC<RazeTasksPageProps> = ({ initialIntent }) => {
  const [tasks, setTasks] = useState<RazeTask[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [intentInput, setIntentInput] = useState(initialIntent || '');
  const [isPlanning, setIsPlanning] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<{
    plan_title: string;
    summary: string;
    tasks: Array<{ id: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; estimated_duration: string }>;
  } | null>(null);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000); // Polling for background task status updates
    return () => clearInterval(interval);
  }, [filter]);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks(filter);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleSynthesizePlan = async () => {
    if (!intentInput.trim() || isPlanning) return;
    setIsPlanning(true);
    try {
      const result = await api.generatePlan({ intent: intentInput });
      setPlanPreview(result);
    } catch (err: any) {
      alert(`Plan generation failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!planPreview) return;
    try {
      for (const t of planPreview.tasks) {
        await api.createTask({
          title: t.title,
          description: t.description,
          priority: t.priority
        });
      }
      setPlanPreview(null);
      setIntentInput('');
      loadTasks();
    } catch (err: any) {
      alert(`Failed to save plan tasks: ${err.message}`);
    }
  };

  const handleExecute = async (taskId: string) => {
    setExecutingTaskId(taskId);
    try {
      await api.executeTask(taskId);
      loadTasks();
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleCancel = async (taskId: string) => {
    try {
      await api.cancelTask(taskId);
      loadTasks();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: RazeTask['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-raze-blue/20 text-raze-cyan border border-raze-blue/40 animate-pulse">
            <Clock className="w-3 h-3 animate-spin" />
            RUNNING
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/10 text-raze-silverMuted border border-white/10">
            <XCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            PLANNED
          </span>
        );
    }
  };

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-raze-void text-raze-silver px-4 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blue/10 border border-raze-blue/30 text-raze-blue text-xs font-mono uppercase mb-2">
            <Terminal className="w-3.5 h-3.5" />
            AUTONOMOUS TASK RUNNER
          </div>
          <h1 className="font-raze text-3xl font-extrabold text-white text-glow-ice">
            TASK EXECUTION CENTER
          </h1>
          <p className="text-sm text-raze-silverMuted mt-1">
            Convert natural language goals into decomposed execution graphs with asynchronous background verification.
          </p>
        </div>

        {/* Progress Gauge */}
        <div className="p-4 rounded-2xl bg-raze-card border border-white/10 flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-mono text-raze-silverMuted">OVERALL PROGRESS</div>
            <div className="font-raze text-xl font-bold text-raze-cyan">{progressPct}%</div>
            <div className="text-[10px] font-mono text-raze-silverMuted">{completedCount} of {totalTasks} finished</div>
          </div>
          <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center relative">
            <div 
              className="absolute inset-0 rounded-full border-2 border-raze-cyan transition-all duration-500"
              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progressPct}%, 0 ${progressPct}%)` }}
            />
            <Zap className="w-6 h-6 text-raze-blue" />
          </div>
        </div>
      </div>

      {/* Natural Language Intent Planner Input */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-raze-surface via-raze-card to-raze-surface border border-raze-blue/30 shadow-glow-primary mb-8">
        <h2 className="font-raze text-sm font-bold tracking-wider text-raze-ice uppercase mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-raze-cyan" />
          SYNTHESIZE NEW EXECUTION PLAN
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={intentInput}
            onChange={e => setIntentInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSynthesizePlan()}
            placeholder="e.g. Implement self-healing websocket reconnect with exponential backoff and auth refresh"
            className="flex-1 bg-raze-void/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-raze-silverMuted/50 outline-none focus:border-raze-blue transition-colors font-sans"
          />
          <button
            onClick={handleSynthesizePlan}
            disabled={!intentInput.trim() || isPlanning}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void font-raze text-xs font-bold tracking-wider disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-glow-cyan"
          >
            {isPlanning ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>PLANNING...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-raze-void" />
                <span>DECOMPOSE PLAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Plan Approval Preview Modal / Card */}
      {planPreview && (
        <div className="p-6 rounded-2xl bg-raze-card border border-raze-cyan/40 shadow-glow-cyan mb-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-cyan/15 text-raze-cyan border border-raze-cyan/30 uppercase">
                Generated Plan
              </span>
              <h3 className="font-raze text-lg font-bold text-white mt-1">{planPreview.plan_title}</h3>
              <p className="text-xs text-raze-silverMuted mt-1">{planPreview.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlanPreview(null)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-raze-silverMuted hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={handleApprovePlan}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-raze-void font-raze text-xs font-bold tracking-wider hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve & Schedule
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {planPreview.tasks.map((pt, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-raze-void/60 border border-white/10">
                <div className="flex items-center justify-between text-xs font-mono text-raze-silverMuted mb-1">
                  <span>Step {idx + 1}</span>
                  <span className="text-raze-cyan font-bold">{pt.priority.toUpperCase()}</span>
                </div>
                <div className="text-sm font-semibold text-white">{pt.title}</div>
                <div className="text-xs text-raze-silverMuted mt-1">{pt.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          {['all', 'planned', 'running', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors ${
                filter === f
                  ? 'bg-raze-blue/20 text-raze-ice border border-raze-blue/40 font-bold'
                  : 'text-raze-silverMuted hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono text-raze-silverMuted">
          Showing {tasks.length} tasks
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-raze-card/40">
            <Terminal className="w-8 h-8 text-raze-silverMuted mx-auto mb-2" />
            <h3 className="font-raze text-base font-bold text-white">No tasks match filter</h3>
            <p className="text-xs text-raze-silverMuted mt-1">Use the synthesizer above to decompose your vision.</p>
          </div>
        ) : (
          tasks.map(t => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-raze-card/80 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  {getStatusBadge(t.status)}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted uppercase">
                    Priority: {t.priority || 'medium'}
                  </span>
                  <span className="text-[10px] font-mono text-raze-silverMuted/50">
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-raze text-base font-bold text-white tracking-wide">{t.title}</h3>
                <p className="text-xs text-raze-silverMuted mt-1 leading-relaxed">{t.description}</p>

                {/* Execution Result Box */}
                {t.result && (
                  <div className="mt-3 p-3 rounded-xl bg-raze-void/80 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                    <strong>Result:</strong> {t.result}
                  </div>
                )}
                {t.error_message && (
                  <div className="mt-3 p-3 rounded-xl bg-raze-void/80 border border-rose-500/20 text-xs font-mono text-rose-300">
                    <strong>Error:</strong> {t.error_message}
                  </div>
                )}
              </div>

              {/* Task Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {t.status === 'planned' && (
                  <button
                    onClick={() => handleExecute(t.id)}
                    disabled={executingTaskId === t.id}
                    className="px-4 py-2 rounded-xl bg-raze-blue/20 border border-raze-blue/40 text-raze-ice text-xs font-mono hover:bg-raze-blue/30 transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute</span>
                  </button>
                )}
                {t.status === 'running' && (
                  <button
                    onClick={() => handleCancel(t.id)}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
                {(t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') && (
                  <button
                    onClick={() => handleExecute(t.id)}
                    className="px-3 py-2 rounded-xl border border-white/10 text-raze-silverMuted text-xs font-mono hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-run</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
