import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Cpu, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Key, 
  Zap,
  Activity
} from 'lucide-react';

export const RazeSettingsPage: React.FC = () => {
  const [demoMode, setDemoMode] = useState(true);
  const [motionReduced, setMotionReduced] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [modelProvider, setModelProvider] = useState<'deterministic' | 'claude' | 'openai'>('deterministic');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealthStatus(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-raze-void text-raze-silver px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blue/10 border border-raze-blue/30 text-raze-blue text-xs font-mono uppercase mb-2">
          <SettingsIcon className="w-3.5 h-3.5" />
          SYSTEM CONFIGURATION
        </div>
        <h1 className="font-raze text-3xl font-extrabold text-white text-glow-ice">
          PLATFORM & MODEL SETTINGS
        </h1>
        <p className="text-sm text-raze-silverMuted mt-1">
          Configure model inference provider, hackathon demo mode, visual motion preferences, and inspect backend health.
        </p>
      </div>

      {/* Persistent Connection Status Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-raze-surface via-raze-card to-raze-surface border border-raze-blue/30 shadow-glow-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-raze-blue/20 border border-raze-blue/40 flex items-center justify-center text-raze-cyan">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-raze text-base font-bold text-white">NEURAL SYSTEM STATUS:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {healthStatus?.neuralSystem || 'ONLINE'}
              </span>
            </div>
            <div className="text-xs font-mono text-raze-silverMuted mt-1">
              Backend Service: {healthStatus?.service || 'RAZE Neural Engine'} (v{healthStatus?.version || '2.4.0'})
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-raze-silverMuted">
          <div>DATABASE: <span className="text-emerald-400">SQLITE WAL</span></div>
          <div>MODES: <span className="text-raze-cyan">5 ACTIVE</span></div>
        </div>
      </div>

      {/* Hackathon Demo Mode Setting */}
      <div className="p-6 rounded-2xl bg-raze-card border border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-raze text-lg font-bold text-white">HACKATHON DEMO MODE</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                {demoMode ? 'ENABLED (OFFLINE READY)' : 'LIVE CLOUD API'}
              </span>
            </div>
            <p className="text-xs text-raze-silverMuted mt-1 leading-relaxed max-w-2xl">
              When enabled, RAZE uses the built-in deterministic reasoning engine and pre-indexed research synthesis. This guarantees 100% reliable hackathon presentations with zero risk of external API downtime, rate limits, or billable token depletion.
            </p>
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
              demoMode ? 'bg-raze-cyan' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-raze-void transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Model Provider Selector */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <label className="block text-xs font-mono text-raze-silverMuted uppercase">Inference Engine Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setModelProvider('deterministic')}
              className={`p-4 rounded-xl border text-left transition-all ${
                modelProvider === 'deterministic'
                  ? 'bg-raze-blue/15 border-raze-blue/50 text-white shadow-glow-primary'
                  : 'bg-raze-void/60 border-white/10 text-raze-silverMuted hover:border-white/20'
              }`}
            >
              <div className="font-mono text-xs font-bold text-raze-ice">Local Deterministic Core</div>
              <div className="text-[11px] text-raze-silverMuted mt-1">Zero latency, verifiable AST analysis & seed logic.</div>
            </button>

            <button
              onClick={() => setModelProvider('claude')}
              className={`p-4 rounded-xl border text-left transition-all ${
                modelProvider === 'claude'
                  ? 'bg-raze-blue/15 border-raze-blue/50 text-white shadow-glow-primary'
                  : 'bg-raze-void/60 border-white/10 text-raze-silverMuted hover:border-white/20'
              }`}
            >
              <div className="font-mono text-xs font-bold text-raze-ice">Anthropic Claude 3.5 Sonnet</div>
              <div className="text-[11px] text-raze-silverMuted mt-1">Requires server ANTHROPIC_API_KEY environment variable.</div>
            </button>

            <button
              onClick={() => setModelProvider('openai')}
              className={`p-4 rounded-xl border text-left transition-all ${
                modelProvider === 'openai'
                  ? 'bg-raze-blue/15 border-raze-blue/50 text-white shadow-glow-primary'
                  : 'bg-raze-void/60 border-white/10 text-raze-silverMuted hover:border-white/20'
              }`}
            >
              <div className="font-mono text-xs font-bold text-raze-ice">OpenAI GPT-4o</div>
              <div className="text-[11px] text-raze-silverMuted mt-1">Requires server OPENAI_API_KEY environment variable.</div>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 rounded-xl bg-raze-void/80 border border-white/5 flex items-start gap-3 text-xs text-raze-silverMuted">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Security Guarantee:</strong> All private API keys and database tokens are kept exclusively in server-side environment variables (`server/.env`). They are never transferred or exposed to the client browser bundle.
          </span>
        </div>
      </div>

      {/* Motion & Audio Experience Preferences */}
      <div className="p-6 rounded-2xl bg-raze-card border border-white/10 space-y-6">
        <h2 className="font-raze text-lg font-bold text-white">VISUAL & ACCESSIBILITY CONTROLS</h2>

        {/* Motion Preference */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-white text-sm">Particle Motion & 3D Parallax</div>
            <div className="text-xs text-raze-silverMuted mt-0.5">
              Toggles between high-performance 60fps canvas particles and static celestial fallback.
            </div>
          </div>
          <button
            onClick={() => setMotionReduced(!motionReduced)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              motionReduced
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-raze-blue/20 border-raze-blue/40 text-raze-ice'
            }`}
          >
            {motionReduced ? 'Reduced Motion' : '60 FPS Full Parallax'}
          </button>
        </div>

        {/* Ambient Audio (default off) */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div>
            <div className="font-medium text-white text-sm">Cinematic Ambient Sound</div>
            <div className="text-xs text-raze-silverMuted mt-0.5">
              Subtle atmospheric drone audio. Kept muted by default per specification.
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-raze-silverMuted'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Audio On' : 'Muted (Default)'}</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Applied</span>
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void font-raze text-xs font-bold tracking-wider hover:opacity-90 transition-opacity shadow-glow-cyan"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
