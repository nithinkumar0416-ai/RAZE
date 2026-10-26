import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  FileText, 
  Radio, 
  ChevronDown 
} from 'lucide-react';
import { api } from '../../services/api';
import { VerificationRun } from '../../types';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  runId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  references?: string[];
  mode?: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  runId: propRunId
}) => {
  const [runs, setRuns] = useState<VerificationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(propRunId);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your OpenGuard Developer Assistant. Ask me anything about verification runs, why trust collapsed, counterexamples discovered, mutation testing scores, security findings, or how the platform proves code is safe to ship.',
      timestamp: new Date().toLocaleTimeString(),
      mode: 'LOCAL_DETERMINISTIC_ENGINE'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  // Load runs to allow context selection
  useEffect(() => {
    async function loadRuns() {
      try {
        const data = await api.getRuns();
        setRuns(data);
        if (!selectedRunId && data.length > 0) {
          setSelectedRunId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load runs for assistant context:', err);
      }
    }
    loadRuns();
  }, []);

  // Update selectedRunId if propRunId changes (e.g. user navigated to /runs/:id)
  useEffect(() => {
    if (propRunId) {
      setSelectedRunId(propRunId);
    }
  }, [propRunId]);

  const sampleQuestions = [
    'Why did this patch fail?',
    'Which test discovered the counterexample?',
    'What does the mutation testing score mean?',
    'What changed between repair attempts?',
    'How does the Trust Collapse Engine work?',
    'What are the 6 specialized agents?'
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant(selectedRunId, q);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        references: res.evidenceReferences,
        mode: res.operatingMode,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Web Speech API synthesis if enabled
      if (speechEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Clean markdown stars from spoken speech
        const cleanSpeech = res.answer.replace(/[*#`_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpeech);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to retrieve grounded evidence.'}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-96 z-50 bg-og-panel border-l border-og-border shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-og-border bg-og-surface/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-og-violet/15 text-og-violet border border-og-violet/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-og-text">Grounded Dev Assistant</h3>
            <span className="text-[10px] text-og-cyan font-mono">Local Evidence Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-1.5 rounded-lg border transition-colors ${
              speechEnabled
                ? 'bg-og-cyan/20 text-og-cyan border-og-cyan/40'
                : 'text-og-muted border-transparent hover:bg-white/5'
            }`}
            title={speechEnabled ? 'Voice output enabled' : 'Enable voice output'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-og-muted hover:text-og-text hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Run Context Selector */}
      <div className="px-4 py-2.5 border-b border-og-border/60 bg-black/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-og-muted flex-shrink-0">
          <Radio className="w-3 h-3 text-og-cyan" />
          <span className="text-[11px] font-medium">Context:</span>
        </div>
        <select
          value={selectedRunId || ''}
          onChange={(e) => setSelectedRunId(e.target.value || undefined)}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-og-cyan font-mono focus:outline-none focus:border-og-primary truncate"
        >
          {runs.map((r, idx) => (
            <option key={r.id} value={r.id}>
              {idx === 0 ? '★ Latest: ' : ''}{r.id.substring(0, 16)}... ({r.release_recommendation})
            </option>
          ))}
          {runs.length === 0 && <option value="">No verification runs yet</option>}
        </select>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="px-4 py-2 border-b border-og-border/60">
        <p className="text-[11px] font-medium text-og-muted mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-og-violet" />
          Suggested Questions:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sampleQuestions.slice(0, 4).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-og-primary/40 hover:text-white transition-all text-left text-og-muted truncate max-w-full"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-og-primary text-white rounded-tr-none'
                  : 'bg-og-surface border border-og-border text-og-text rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* Evidence References */}
              {m.references && m.references.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                  <span className="text-[10px] font-semibold text-og-cyan uppercase tracking-wider block">
                    Referenced Evidence Artifacts:
                  </span>
                  {m.references.map((ref, rIdx) => (
                    <div
                      key={rIdx}
                      className="text-[10px] font-mono text-og-muted flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded"
                    >
                      <FileText className="w-3 h-3 text-og-primary flex-shrink-0" />
                      <span className="truncate">{ref}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[9px] text-og-muted">{m.timestamp}</span>
              {m.mode && (
                <span className="text-[9px] font-mono text-og-cyan/70">
                  [{m.mode}]
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-og-muted p-2">
            <span className="w-2 h-2 rounded-full bg-og-violet animate-ping" />
            <span>Consulting verification records & test logs...</span>
          </div>
        )}
      </div>

      {/* Input Box - Always Enabled */}
      <div className="p-3 border-t border-og-border bg-og-surface/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about tests, diffs, mutations, or agents..."
            disabled={loading}
            className="flex-1 bg-og-panel border border-og-border rounded-xl px-3.5 py-2 text-xs text-og-text placeholder:text-og-muted focus:outline-none focus:border-og-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-og-primary text-white hover:bg-og-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
