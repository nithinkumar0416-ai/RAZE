import React, { useRef } from 'react';
import { RazeCinematicCanvas } from '../components/canvas/RazeCinematicCanvas';
import { 
  Cpu, 
  Search, 
  Hammer, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Terminal, 
  Layers, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface RazeHeroPageProps {
  onAwaken: () => void;
  onNavigate: (tab: string) => void;
}

export const RazeHeroPage: React.FC<RazeHeroPageProps> = ({ onAwaken, onNavigate }) => {
  const capabilitiesRef = useRef<HTMLDivElement | null>(null);

  const scrollToCapabilities = () => {
    capabilitiesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen bg-raze-void text-raze-silver overflow-hidden">
      {/* ============================================================
          HERO SECTION (CINEMATIC FULLSCREEN)
      ============================================================ */}
      <section className="relative w-full h-screen min-h-[700px] flex flex-col justify-between items-center px-4 py-8 z-10">
        {/* Real-time 60fps Canvas Background */}
        <div className="absolute inset-0 z-0">
          <RazeCinematicCanvas onHandClick={onAwaken} />
        </div>

        {/* Top Status Bar */}
        <div className="relative z-10 w-full max-w-7xl flex items-center justify-between pointer-events-auto">
          {/* Neural System Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-raze-void/70 border border-white/10 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-raze-blue opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-raze-cyan" />
            </span>
            <span className="font-mono text-xs tracking-wider text-raze-ice font-semibold">
              NEURAL SYSTEM ONLINE
            </span>
            <span className="text-white/30 text-xs">|</span>
            <span className="font-mono text-[10px] text-raze-silverMuted">v2.4.0</span>
          </div>

          {/* Quick Nav Shortcut */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('tasks')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-raze-silverMuted hover:text-white transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-raze-blue" />
              <span>TASK RUNNER</span>
            </button>
            <button
              onClick={onAwaken}
              className="px-4 py-1.5 text-xs font-mono tracking-wider font-semibold text-raze-ice border border-raze-blue/40 rounded-full bg-raze-blue/10 hover:bg-raze-blue/20 transition-all shadow-glow-primary"
            >
              INITIALIZE
            </button>
          </div>
        </div>

        {/* Center Prompt & Atmospheric Spacing */}
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-none text-center max-w-2xl mt-12">
          {/* Subtle cosmic focus tag */}
          <div className="inline-block mb-3 px-3 py-1 rounded border border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <span className="font-mono text-[11px] tracking-cinematic text-raze-blue uppercase">
              Autonomous Intelligence Architecture
            </span>
          </div>
        </div>

        {/* Bottom Hero Anchor: Wordmark, Tagline, & CTAs */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center pb-6 pointer-events-auto">
          {/* Distinctive Uppercase Wordmark: RAZE AI */}
          <div className="group relative cursor-default select-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blue/10 border border-raze-blue/25 text-raze-cyan text-[11px] font-mono tracking-widest uppercase mb-3 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-raze-cyan animate-pulse" />
              <span>Next-Generation AI Assistant</span>
            </div>
            <h1 className="font-raze text-6xl sm:text-7xl md:text-8xl font-black tracking-ultra text-white text-glow-ice transition-transform duration-300 hover:scale-[1.02]">
              RAZE AI
            </h1>
            <div className="h-0.5 w-36 mx-auto mt-2 bg-gradient-to-r from-transparent via-raze-blue to-transparent opacity-70" />
          </div>

          {/* Tagline */}
          <p className="font-raze text-sm sm:text-base md:text-lg tracking-cinematic text-raze-cyan font-semibold mt-4">
            THINK BEYOND LIMITS.
          </p>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mt-3 font-sans">
            Intelligence that moves with you.
          </h2>

          {/* Subtitle & Product Description */}
          <p className="text-xs sm:text-sm text-raze-silverMuted max-w-xl mt-2 font-sans font-light tracking-wide leading-relaxed">
            Your personal intelligence for thinking, creating, researching, and getting things done. Ask anything. Explore ideas. Create something extraordinary.
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
            {/* Primary Action: Start a conversation */}
            <button
              id="btn-start-conversation"
              onClick={onAwaken}
              className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-raze-blue via-raze-cyan to-raze-blue bg-[length:200%_auto] hover:bg-right transition-all duration-500 font-raze text-xs sm:text-sm font-bold tracking-wider text-raze-void shadow-glow-cyan flex items-center justify-center gap-2.5 w-full sm:w-auto"
            >
              <Zap className="w-4 h-4 fill-raze-void" />
              <span>START A CONVERSATION</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary Action: Explore RAZE */}
            <button
              onClick={scrollToCapabilities}
              className="px-7 py-3.5 rounded-xl bg-raze-card border border-white/10 hover:border-raze-blue/40 hover:bg-white/[0.04] transition-all font-mono text-xs sm:text-sm text-raze-ice tracking-wide flex items-center justify-center gap-2 w-full sm:w-auto backdrop-blur-md"
            >
              <span>EXPLORE RAZE</span>
              <ChevronDown className="w-4 h-4 text-raze-blue" />
            </button>
          </div>

          {/* Hand click hint */}
          <p className="text-[11px] font-mono text-raze-silverMuted/60 mt-5">
            Tip: Hover over and click the glowing palm in the central silhouette to release energy
          </p>
        </div>
      </section>

      {/* ============================================================
          CAPABILITIES SECTION (DOWN BELOW THE HERO)
      ============================================================ */}
      <section ref={capabilitiesRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 py-24 border-t border-white/5">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blue/10 border border-raze-blue/20 text-raze-blue text-xs font-mono tracking-widest uppercase mb-4">
            <Cpu className="w-3.5 h-3.5" />
            Core Architecture
          </div>
          <h2 className="font-raze text-3xl sm:text-4xl font-bold tracking-wide text-white text-glow-ice">
            THE 5 SPECIALIZED AGENT MODES
          </h2>
          <p className="text-raze-silverMuted text-sm sm:text-base mt-3 leading-relaxed">
            Unlike shallow chat wrappers, RAZE provides distinct cognitive execution loops engineered for autonomous problem-solving and verifiable software engineering.
          </p>
        </div>

        {/* 5 Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. THINK */}
          <div 
            onClick={() => { onAwaken(); onNavigate('agent'); }}
            className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-blue/50 transition-all cursor-pointer group hover:shadow-glow-primary backdrop-blur-xl relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-raze-blue/10 border border-raze-blue/20 flex items-center justify-center text-raze-blue mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-raze text-lg font-bold text-white tracking-wider">THINK</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-blue/15 text-raze-ice border border-raze-blue/30">
                REASONING
              </span>
            </div>
            <p className="text-sm text-raze-silverMuted leading-relaxed">
              Synthesizes multi-step algorithmic proofs, root-cause analyses, and architectural trade-offs with explicit verification criteria.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-raze-blue group-hover:text-raze-ice">
              <span>Launch Think Mode</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 2. RESEARCH */}
          <div 
            onClick={() => onNavigate('research')}
            className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-cyan/50 transition-all cursor-pointer group hover:shadow-glow-cyan backdrop-blur-xl relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-raze-cyan/10 border border-raze-cyan/20 flex items-center justify-center text-raze-cyan mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-raze text-lg font-bold text-white tracking-wider">RESEARCH</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-cyan/15 text-raze-cyan border border-raze-cyan/30">
                LIVE SOURCES
              </span>
            </div>
            <p className="text-sm text-raze-silverMuted leading-relaxed">
              Gathers peer-reviewed papers, system RFCs, and documentation from academic repositories with real cited links and instant summarization.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-raze-cyan group-hover:text-raze-ice">
              <span>Launch Research Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 3. BUILD */}
          <div 
            onClick={() => onNavigate('tasks')}
            className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-blueGlow/50 transition-all cursor-pointer group hover:shadow-glow-primary backdrop-blur-xl relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-raze-blueGlow/10 border border-raze-blueGlow/20 flex items-center justify-center text-raze-blueGlow mb-4 group-hover:scale-110 transition-transform">
              <Hammer className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-raze text-lg font-bold text-white tracking-wider">BUILD</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-blueGlow/15 text-raze-blueGlow border border-raze-blueGlow/30">
                TASK RUNNER
              </span>
            </div>
            <p className="text-sm text-raze-silverMuted leading-relaxed">
              Transforms high-level intents into executable dependency graphs, prioritized task batches, and verified code implementations.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-raze-blueGlow group-hover:text-raze-ice">
              <span>Launch Build Execution</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 4. CREATE */}
          <div 
            onClick={() => { onAwaken(); onNavigate('agent'); }}
            className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-orange/50 transition-all cursor-pointer group hover:shadow-glow-orange backdrop-blur-xl relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-raze-orange/10 border border-raze-orange/20 flex items-center justify-center text-raze-orange mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-raze text-lg font-bold text-white tracking-wider">CREATE</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-orange/15 text-raze-orange border border-raze-orange/30">
                SYNTHESIS
              </span>
            </div>
            <p className="text-sm text-raze-silverMuted leading-relaxed">
              Drafts system specifications, API design contracts, prompt scaffolds, and technical documentation with clean Markdown structures.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-raze-orange group-hover:text-raze-ice">
              <span>Launch Create Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 5. ANALYZE */}
          <div 
            onClick={() => { onAwaken(); onNavigate('agent'); }}
            className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-emerald-400/50 transition-all cursor-pointer group hover:shadow-glow-primary backdrop-blur-xl relative overflow-hidden md:col-span-2 lg:col-span-2"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-raze text-lg font-bold text-white tracking-wider">ANALYZE</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                VERIFICATION & AUDIT
              </span>
            </div>
            <p className="text-sm text-raze-silverMuted leading-relaxed">
              Performs exhaustive adversarial audits: AST boundary inspections, numeric overflow probes, mutation testing resilience, and OWASP security vulnerability scans.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-emerald-400 group-hover:text-raze-ice">
              <span>Launch Adversarial Audit</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-raze-surface via-raze-card to-raze-surface border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-raze text-3xl font-extrabold text-white text-glow-ice">60 FPS</div>
            <div className="font-mono text-xs text-raze-silverMuted mt-1">Real-time Particle Parallax</div>
          </div>
          <div>
            <div className="font-raze text-3xl font-extrabold text-raze-cyan text-glow-cyan">5 MODES</div>
            <div className="font-mono text-xs text-raze-silverMuted mt-1">Specialized Cognitive Engines</div>
          </div>
          <div>
            <div className="font-raze text-3xl font-extrabold text-raze-blue">100%</div>
            <div className="font-mono text-xs text-raze-silverMuted mt-1">Deterministic Verification</div>
          </div>
          <div>
            <div className="font-raze text-3xl font-extrabold text-raze-orange text-glow-orange">&lt; 120ms</div>
            <div className="font-mono text-xs text-raze-silverMuted mt-1">Execution Stream Latency</div>
          </div>
        </div>
      </section>
    </div>
  );
};
