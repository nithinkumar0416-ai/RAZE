import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, Cpu, Sliders, Save, Check, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Engine Configuration & Sandbox Security</span>
        </h2>
        <p className="text-xs text-og-muted mt-1">
          Configure model adapters, execution timeouts, circuit breaker policies, and runtime parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* LLM & Model Engine Adapter */}
        <div className="glass-panel p-6 rounded-3xl border border-og-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-og-cyan" />
              <h3 className="text-sm font-semibold text-white">Model Engine Provider</h3>
            </div>
            <Badge variant="cyan" size="sm">
              AIR-GAPPED READY
            </Badge>
          </div>

          <p className="text-xs text-og-muted leading-relaxed">
            OpenGuard operates with a zero-credential, local deterministic engine that executes real tests, generates real diffs, runs real mutations, and guarantees evidence accountability without relying on paid external APIs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-og-primary bg-og-primary/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Local Deterministic Engine</span>
                <span className="text-[10px] text-og-cyan font-mono font-semibold">ACTIVE</span>
              </div>
              <p className="text-[11px] text-og-muted leading-relaxed">
                Executes native TypeScript, Node test runner TAP parsing, and deterministic AST verification.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-og-panel/30 opacity-60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-og-muted">Cloud LLM Adapter</span>
                <span className="text-[10px] text-og-muted font-mono">OPTIONAL</span>
              </div>
              <p className="text-[11px] text-og-muted leading-relaxed">
                Connect external providers (e.g. OpenAI / Anthropic) if configured via environment variables.
              </p>
            </div>
          </div>
        </div>

        {/* Sandbox & Execution Timeouts */}
        <div className="glass-panel p-6 rounded-3xl border border-og-border space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-og-violet" />
            <h3 className="text-sm font-semibold text-white">Verification Execution Limits</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-og-muted uppercase block mb-1.5 text-[11px]">
                Execution Timeout (Seconds)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={settings.executionTimeoutSeconds || 7}
                onChange={(e) => setSettings({ ...settings, executionTimeoutSeconds: parseInt(e.target.value, 10) })}
                className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary"
              />
              <span className="text-[10px] text-og-muted mt-1 block">
                Trips Security Circuit Breaker if test run exceeds threshold.
              </span>
            </div>

            <div>
              <label className="font-semibold text-og-muted uppercase block mb-1.5 text-[11px]">
                Shadow Isolation Strategy
              </label>
              <select
                value={settings.sandboxIsolationLevel || 'isolated-shadow-process'}
                onChange={(e) => setSettings({ ...settings, sandboxIsolationLevel: e.target.value })}
                className="w-full bg-og-panel border border-og-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-og-primary"
              >
                <option value="isolated-shadow-process">Isolated Shadow Working Copy (Active)</option>
                <option value="ephemeral-temp-mount">Ephemeral In-Memory Temporary Mount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Runtime Environment Telemetry */}
        <div className="glass-panel p-5 rounded-2xl border border-og-border text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-og-muted block mb-1 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-og-cyan" />
            <span>Host Runtime Telemetry</span>
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] text-og-cyan">
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[9px] text-og-muted block">Node Version:</span>
              <span>{settings.nodeVersion || 'v24.22.1'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[9px] text-og-muted block">Platform:</span>
              <span>{settings.platform || 'windows'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[9px] text-og-muted block">SQLite Engine:</span>
              <span>node:sqlite (native)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[9px] text-og-muted block">Patch Binding:</span>
              <span>SHA-256 (Strict)</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs text-og-success flex items-center gap-1 font-medium">
              <Check className="w-4 h-4" /> Settings updated
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-og-primary text-black font-bold text-xs hover:bg-og-primary/90 transition-all shadow-glow-primary"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
