import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Volume2, 
  VolumeX, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldCheck, 
  Crosshair, 
  Dna, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { CopilotOverview } from '../../types';

interface RazeCopilotDrawerProps {
  onNavigate: (path: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  stageReference?: string;
  timestamp: string;
}

export const RazeCopilotDrawer: React.FC<RazeCopilotDrawerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [overview, setOverview] = useState<CopilotOverview | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your RAZE Verification Copilot. Ask me about the 7-stage verification pipeline, why trust collapsed in Attempt #1, or trigger an autonomous repair on Defect #104.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getCopilotStatus().then(setOverview).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askCopilot(overview?.activeRunId, q);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        stageReference: res.stageReference,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, assistantMsg]);
      speak(res.answer);
      if (q.includes('/verify')) {
        api.getCopilotStatus().then(setOverview).catch(console.error);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    try {
      await api.triggerCopilotDefect104();
      onNavigate('/copilot');
      setIsOpen(false);
    } catch (err: any) {
      alert(`Trigger failed: ${err.message}`);
    }
  };

  return (
    <>
      {/* Floating Copilot Launcher Beacon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#090D18]/90 border border-raze-cyan/40 shadow-glow-cyan hover:scale-105 hover:border-raze-cyan transition-all text-xs font-mono text-white backdrop-blur-xl group"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-raze-cyan group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-raze-cyan animate-ping" />
          </div>
          <span className="font-raze font-bold tracking-wider">COPILOT</span>
          <span className="text-[10px] bg-raze-cyan/20 text-raze-cyan px-1.5 py-0.5 rounded border border-raze-cyan/30">
            7-STAGE
          </span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#050811]/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-raze-blue/10 border border-raze-blue/30 text-raze-cyan">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-raze text-sm font-bold text-white tracking-wider">
                  RAZE COPILOT
                </h3>
                <span className="text-[10px] font-mono text-raze-silverMuted">
                  Verification & Autonomous Repair
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  speechEnabled
                    ? 'bg-raze-cyan/20 border-raze-cyan text-raze-cyan'
                    : 'bg-white/5 border-white/10 text-raze-silverMuted hover:text-white'
                }`}
                title="Toggle Voice Briefings"
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-raze-silverMuted hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mini 7-Stage Pipeline Tracker */}
          <div className="p-4 bg-[#090D18] border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-raze-cyan" />
                <span>Reference Architecture</span>
              </span>
              <button
                onClick={() => {
                  onNavigate('/copilot');
                  setIsOpen(false);
                }}
                className="text-raze-cyan hover:underline flex items-center gap-1 text-[10px]"
              >
                Full Workspace <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-7 gap-1 py-1">
              {['1.Audit', '2.Repair', '3.Hunt', '5.Trust', '5.5 Mut', '6.Gate', '7.Sign'].map((step, idx) => (
                <div 
                  key={idx} 
                  className="text-center py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-raze-silverMuted truncate"
                >
                  {step}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
              <span className="text-raze-silverMuted">Target: Defect #104</span>
              <button
                onClick={handleRunPipeline}
                className="px-2.5 py-1 rounded bg-gradient-to-r from-raze-blue to-raze-cyan text-black font-bold text-[10px] flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Run Pipeline
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  m.role === 'user'
                    ? 'bg-raze-blue/15 border-raze-blue/30 text-white ml-6'
                    : 'bg-black/60 border-white/10 text-raze-silver mr-2'
                }`}
              >
                <div className="text-[10px] text-raze-silverMuted mb-1 flex items-center justify-between">
                  <span className="font-bold">{m.role === 'user' ? 'You' : 'Copilot'}</span>
                  <span>{m.timestamp}</span>
                </div>
                {m.stageReference && (
                  <span className="inline-block px-1.5 py-0.5 mb-1.5 rounded bg-raze-cyan/10 border border-raze-cyan/30 text-[9px] text-raze-cyan font-bold">
                    {m.stageReference}
                  </span>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-raze-cyan text-xs font-mono p-2">
                <span className="w-2 h-2 rounded-full bg-raze-cyan animate-ping" />
                <span>Evaluating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-black/40 border-t border-white/5 flex gap-1.5 overflow-x-auto text-[10px] font-mono">
            {['Why trust collapsed?', 'What were the edge cases?', 'Mutation test score'].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-raze-silverMuted hover:text-white shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot or type /verify..."
              className="flex-1 bg-black/70 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-raze-silverMuted focus:outline-none focus:border-raze-cyan"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-raze-cyan text-black hover:bg-raze-cyan/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
