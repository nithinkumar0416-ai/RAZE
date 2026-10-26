import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RazeActivityLog } from '../types';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const RazeActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<RazeActivityLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getActivityLogs(50);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    }
  };

  const getEventBadge = (type: string) => {
    if (type.startsWith('agent_')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-raze-blue/15 text-raze-cyan border border-raze-blue/30 uppercase">
          <Cpu className="w-3 h-3" />
          {type}
        </span>
      );
    }
    if (type.startsWith('task_')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
          <Terminal className="w-3 h-3" />
          {type}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
        <Sparkles className="w-3 h-3" />
        {type}
      </span>
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-raze-void text-raze-silver px-4 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blue/10 border border-raze-blue/30 text-raze-blue text-xs font-mono uppercase mb-2">
            <Activity className="w-3.5 h-3.5" />
            TELEMETRY & AUDIT TRAIL
          </div>
          <h1 className="font-raze text-3xl font-extrabold text-white text-glow-ice">
            LIVE SYSTEM ACTIVITY LOGS
          </h1>
          <p className="text-sm text-raze-silverMuted mt-1">
            Chronological, immutable audit record of autonomous model calls, task state transitions, and background worker completions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-white/10 text-raze-silverMuted hover:text-white hover:bg-white/5 transition-colors"
          title="Refresh Log Stream"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Log Feed */}
      <div className="rounded-2xl bg-raze-card border border-white/10 overflow-hidden divide-y divide-white/5">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-xs font-mono text-raze-silverMuted">
            No activity records recorded yet.
          </div>
        ) : (
          logs.map(log => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {getEventBadge(log.event_type)}
                    <span className="text-xs font-sans font-medium text-white group-hover:text-raze-ice transition-colors">
                      {log.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-raze-silverMuted/60">
                    {log.task_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5">
                        {log.task_id}
                      </span>
                    )}
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded JSON Metadata Viewer */}
                {isExpanded && log.metadata && (
                  <div className="mt-3 p-3 rounded-xl bg-raze-void/80 border border-white/10 text-[11px] font-mono text-raze-cyan overflow-x-auto">
                    <pre>{JSON.stringify(JSON.parse(log.metadata), null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
