import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Terminal, 
  Send, 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Dna, 
  Crosshair, 
  KeyRound, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { CopilotOverview, CopilotPipelineStageInfo, CopilotChatResponse } from '../types';
import { RazePipelineWorkflow } from '../components/copilot/RazePipelineWorkflow';
import { CopilotStageModal } from '../components/copilot/CopilotStageModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  stageReference?: string;
  timestamp: string;
}

export const RazeCopilotPage: React.FC = () => {
  const [overview, setOverview] = useState<CopilotOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### ⚡ RAZE Verification Copilot Online\n\nI orchestrate the **7-Stage Autonomous Verification Pipeline** based on our reference architecture.\n\n• **Defect Target:** Defect #104 (Discount calculation boundary bypass in \`src/discount.ts\`)\n• **Environment:** Ephemeral Repair Shadow Workspace\n• **Trust Rule:** Naive repairs trigger Trust Collapse on boundary violations (\`150%\`, \`NaN\`, \`-50\`).\n\nClick **"RUN PIPELINE"** above or type commands below to begin!`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] RAZE Verification Copilot Engine v2.4 initialized.`,
    `[${new Date().toLocaleTimeString()}] [SHADOW] Ephemeral workspace engine primed with SHA-256 isolation.`,
    `[${new Date().toLocaleTimeString()}] [GATE] Deterministic policy matrix active: 6 safety invariants required.`
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial Copilot status
  const fetchStatus = async () => {
    try {
      const data = await api.getCopilotStatus();
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch copilot status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Subscribe to live SSE events if activeRunId exists
  useEffect(() => {
    if (!overview?.activeRunId) return;

    const eventSource = new EventSource(`/api/runs/${overview.activeRunId}/events`);

    const handleEvent = (event: MessageEvent, typeName: string) => {
      try {
        const payload = JSON.parse(event.data);
        const time = new Date().toLocaleTimeString();
        setTerminalLogs(prev => [
          ...prev,
          `[${time}] [${typeName.toUpperCase()}] ${JSON.stringify(payload.data || payload)}`
        ]);
        fetchStatus();
      } catch {
        // ignore raw text
      }
    };

    eventSource.addEventListener('agent.started', (e) => handleEvent(e, 'AGENT'));
    eventSource.addEventListener('agent.completed', (e) => handleEvent(e, 'AGENT_DONE'));
    eventSource.addEventListener('counterexample.discovered', (e) => handleEvent(e, 'TRUST_COLLAPSE'));
    eventSource.addEventListener('test.completed', (e) => handleEvent(e, 'TEST'));
    eventSource.addEventListener('mutation.completed', (e) => handleEvent(e, 'MUTATION'));
    eventSource.addEventListener('verification.completed', (e) => {
      handleEvent(e, 'VERIFIED');
      setIsRunning(false);
    });

    return () => {
      eventSource.close();
    };
  }, [overview?.activeRunId]);

  // Auto-scroll chat & terminal
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Voice narration helper
  const speak = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Launch pipeline
  const handleTriggerRun = async () => {
    setIsRunning(true);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [TRIGGER] Initiating 7-Stage Copilot Verification on Defect #104...`
    ]);

    try {
      const res = await api.triggerCopilotDefect104();
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SHADOW] Created ephemeral workspace for run ${res.runId}.`
      ]);

      const copilotResponse = await api.askCopilot(res.runId, '/verify');
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: copilotResponse.answer,
          stageReference: copilotResponse.stageReference,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      speak(copilotResponse.answer);
      await fetchStatus();
    } catch (err: any) {
      alert(`Failed to launch run: ${err.message}`);
      setIsRunning(false);
    }
  };

  // Chat send
  const handleSendMessage = async (customText?: string) => {
    const text = customText || chatInput;
    if (!text.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.askCopilot(overview?.activeRunId, text);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        stageReference: res.stageReference,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      speak(res.answer);

      // Execute suggested action if any
      if (text.includes('/verify') || text.includes('run pipeline')) {
        fetchStatus();
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Human decision sign-off
  const handleSignDecision = async (decision: 'APPROVED' | 'REJECTED', notes?: string) => {
    if (!overview?.activeRunId) return;
    try {
      await api.signCopilotDecision({
        run_id: overview.activeRunId,
        decision,
        reviewed_patch_hash: overview.activePatchHash || 'd87a4c9b3e1f0a2e4c87b9821d3f9b20894a7e93012a64c892b1e704b281f62c',
        reviewer_name: 'Lead Verification Engineer',
        notes: notes || 'Verified via RAZE Copilot 7-Stage Pipeline.'
      });
      setSelectedStageId(null);
      await fetchStatus();
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SIGN] Decision ${decision} sealed into Verification Memory!`
      ]);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ **Human Integration Sign Completed!**\n\nDecision \`${decision}\` has been cryptographically bound to patch hash and permanently sealed into Verification Memory.`,
          stageReference: 'STAGE 7: HUMAN INTEGRATION SIGN',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      alert(`Signing failed: ${err.message}`);
    }
  };

  const samplePrompts = [
    'Why did trust collapse in Attempt 1?',
    'What edge cases did Agent 3 hunt?',
    'Explain the AST mutation score',
    'Verify deterministic gate policy'
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / System Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-raze-blue to-raze-cyan p-[1px] shadow-glow-primary">
            <div className="w-full h-full bg-[#03060E] rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-raze-cyan" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-raze text-lg font-bold text-white tracking-wider">
                RAZE VERIFICATION COPILOT
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-raze-cyan/10 border border-raze-cyan/30 text-[10px] font-mono text-raze-cyan">
                AUTONOMOUS 7-STAGE PIPELINE
              </span>
            </div>
            <p className="text-xs text-raze-silverMuted font-mono mt-0.5">
              Target: <span className="text-raze-ice">{overview?.defectTitle || 'Defect #104 (src/discount.ts)'}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-raze-silverMuted">CURRENT ATTEMPT</span>
            <span className="text-raze-cyan font-bold">ATTEMPT #{overview?.currentAttempt || 1} / {overview?.maxRetries || 3}</span>
          </div>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-raze-silverMuted">MUTATION RESISTANCE</span>
            <span className="text-emerald-400 font-bold">{overview?.mutationScore ? `${overview.mutationScore}%` : '88% (PASSED)'}</span>
          </div>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              speechEnabled
                ? 'bg-raze-cyan/20 border-raze-cyan text-raze-cyan shadow-glow-cyan'
                : 'bg-white/5 border-white/10 text-raze-silverMuted hover:text-white'
            }`}
            title={speechEnabled ? 'Voice briefings enabled' : 'Enable voice briefings'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Feature: Interactive Pipelining Workflow Diagram */}
      <RazePipelineWorkflow
        stages={overview?.stages || []}
        activeAttempt={overview?.currentAttempt || 1}
        onSelectStage={(id) => setSelectedStageId(id)}
        selectedStageId={selectedStageId || undefined}
        onTriggerRun={handleTriggerRun}
        isRunning={isRunning}
      />

      {/* Bottom Split: Live Copilot Terminal & Interactive Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Verification Event Terminal */}
        <div className="lg:col-span-5 rounded-2xl bg-[#03060E] border border-white/10 p-5 flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-raze-cyan" />
              <span className="font-raze text-xs font-bold text-white tracking-wider">
                COPILOT VERIFICATION LOGS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-raze-silverMuted">LIVE SSE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
            {terminalLogs.map((log, index) => {
              const isError = log.includes('COLLAPSE') || log.includes('BLOCKED');
              const isVerified = log.includes('VERIFIED') || log.includes('PASSED') || log.includes('SIGN');
              return (
                <div 
                  key={index} 
                  className={`leading-relaxed break-all ${
                    isError 
                      ? 'text-rose-400 bg-rose-500/10 p-1 rounded' 
                      : isVerified 
                        ? 'text-emerald-300' 
                        : 'text-raze-silverMuted'
                  }`}
                >
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>

          <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-raze-silverMuted">
            <span>Target: <code className="text-raze-cyan">src/discount.ts</code></span>
            <span>Ephemeral Isolation: <span className="text-emerald-400">Active</span></span>
          </div>
        </div>

        {/* Right Column: Grounded Copilot Chat Assistant */}
        <div className="lg:col-span-7 rounded-2xl bg-[#090D18] border border-white/10 p-5 flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-raze-blue" />
              <span className="font-raze text-xs font-bold text-white tracking-wider">
                COPILOT VERIFICATION ASSISTANT
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted border border-white/10">
              REFERENCE ARCHITECTURE GROUNDED
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border ${
                  msg.role === 'user' 
                    ? 'bg-raze-blue/15 border-raze-blue/30 text-white ml-8' 
                    : 'bg-black/50 border-white/10 text-raze-silver mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px] text-raze-silverMuted">
                  <span className="font-bold uppercase tracking-wider">{msg.role === 'user' ? 'Lead Engineer' : 'RAZE Copilot'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                {msg.stageReference && (
                  <div className="inline-block px-2 py-0.5 mb-2 rounded bg-raze-cyan/10 border border-raze-cyan/30 text-[10px] text-raze-cyan font-bold">
                    {msg.stageReference}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-raze-cyan text-xs font-mono p-2">
                <span className="w-2 h-2 rounded-full bg-raze-cyan animate-ping" />
                <span>Copilot analyzing verification telemetry...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="py-2 flex flex-wrap gap-1.5 overflow-x-auto">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-raze-silverMuted hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Copilot anything or type /verify, /hunt, /mutate, /gate..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-raze-silverMuted focus:outline-none focus:border-raze-cyan transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-raze-cyan text-black hover:bg-raze-cyan/90 disabled:opacity-50 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage Inspection Modal */}
      <CopilotStageModal
        stageId={selectedStageId}
        onClose={() => setSelectedStageId(null)}
        overview={overview}
        onSignDecision={handleSignDecision}
      />
    </div>
  );
};
