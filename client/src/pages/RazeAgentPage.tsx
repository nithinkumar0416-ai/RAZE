import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { RazeAgentMode, RazeMessage, RazeConversation } from '../types';
import { MarkdownContent } from '../components/chat/MarkdownContent';
import { 
  Send, 
  Sparkles, 
  Cpu, 
  Search, 
  Hammer, 
  ShieldCheck, 
  Copy, 
  Check, 
  RotateCcw, 
  Trash2, 
  Zap, 
  Layers, 
  Terminal, 
  Info,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Search as SearchIcon
} from 'lucide-react';

interface RazeAgentPageProps {
  onNavigateToTasks?: (planIntent?: string) => void;
}

export const RazeAgentPage: React.FC<RazeAgentPageProps> = ({ onNavigateToTasks }) => {
  const [mode, setMode] = useState<RazeAgentMode>('think');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<RazeMessage[]>([]);
  const [conversations, setConversations] = useState<RazeConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for intent');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [id: string]: 'up' | 'down' }>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Modern Suggested Prompts
  const modernPrompts = [
    {
      category: 'Think',
      title: 'Analyze Architecture Trade-offs',
      prompt: 'Analyze trade-offs between monolithic and event-driven microservice architectures for high-concurrency systems.',
      mode: 'think' as RazeAgentMode,
      icon: <Cpu className="w-4 h-4 text-raze-blue" />
    },
    {
      category: 'Research',
      title: 'Investigate AI Verification Gates',
      prompt: 'Research the latest academic papers and methodologies on formal verification gates for autonomous AI agents.',
      mode: 'research' as RazeAgentMode,
      icon: <Search className="w-4 h-4 text-raze-cyan" />
    },
    {
      category: 'Build',
      title: 'Create Execution Plan',
      prompt: 'Create a step-by-step project execution plan to build and deploy an autonomous AI agent platform.',
      mode: 'build' as RazeAgentMode,
      icon: <Hammer className="w-4 h-4 text-raze-blueGlow" />
    },
    {
      category: 'Copilot',
      title: '7-Stage Copilot Verification',
      prompt: 'Execute the 7-stage autonomous verification pipeline on Defect #104: baseline audit, repair shadow workspace, adversarial hunt (150%, NaN, -50), trust collapse, and deterministic gate.',
      mode: 'analyze' as RazeAgentMode,
      icon: <ShieldCheck className="w-4 h-4 text-raze-cyan" />
    },
    {
      category: 'Create',
      title: 'Draft System Specification',
      prompt: 'Draft an architectural technical specification for a self-healing distributed system with telemetry logging.',
      mode: 'create' as RazeAgentMode,
      icon: <Sparkles className="w-4 h-4 text-raze-orange" />
    }
  ];

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
        loadMessages(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await api.getConversationMessages(convId);
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    loadMessages(convId);
  };

  const handleNewConversation = () => {
    setActiveConvId(undefined);
    setMessages([]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputMessage).trim();
    if (!promptToSend || isLoading) return;

    // Optimistic user message
    const tempUserMsg: RazeMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || 'pending',
      role: 'user',
      content: promptToSend,
      mode,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsLoading(true);
    scrollToBottom();

    // Actual Backend Execution Pipeline Statuses
    setStatusMessage('Understanding request...');
    const t1 = setTimeout(() => setStatusMessage('Synthesizing neural model reasoning...'), 350);
    const t2 = setTimeout(() => setStatusMessage(`Engaging ${mode.toUpperCase()} core engine...`), 700);

    try {
      const response = await api.chatAgent({
        message: promptToSend,
        conversation_id: activeConvId,
        mode
      });

      clearTimeout(t1);
      clearTimeout(t2);
      setStatusMessage('Task completed');

      setActiveConvId(response.conversation_id);
      loadConversations();

      const assistantMsg: RazeMessage = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        role: 'assistant',
        content: response.content,
        mode: response.mode,
        metadata: response.metadata,
        created_at: response.created_at
      };

      setMessages(prev => [...prev, assistantMsg]);
      scrollToBottom();
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStatusMessage('Execution halted');
      const errorMsg: RazeMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || 'error',
        role: 'assistant',
        content: `⚠️ RAZE Engine Notice: ${err.message || 'Failed to process request.'}`,
        mode,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage('Ready for intent'), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    const md = messages.map(m => {
      const role = m.role === 'assistant' ? '### RAZE AI' : '### User';
      return `${role}\n\n${m.content}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raze-conversation-${Date.now()}.md`;
    a.click();
  };

  const getModeIcon = (m: RazeAgentMode) => {
    switch (m) {
      case 'think': return <Cpu className="w-3.5 h-3.5" />;
      case 'research': return <Search className="w-3.5 h-3.5" />;
      case 'build': return <Hammer className="w-3.5 h-3.5" />;
      case 'create': return <Sparkles className="w-3.5 h-3.5" />;
      case 'analyze': return <ShieldCheck className="w-3.5 h-3.5" />;
    }
  };

  const getModeColor = (m: RazeAgentMode) => {
    switch (m) {
      case 'think': return 'text-raze-blue border-raze-blue/40 bg-raze-blue/10';
      case 'research': return 'text-raze-cyan border-raze-cyan/40 bg-raze-cyan/10';
      case 'build': return 'text-raze-blueGlow border-raze-blueGlow/40 bg-raze-blueGlow/10';
      case 'create': return 'text-raze-orange border-raze-orange/40 bg-raze-orange/10';
      case 'analyze': return 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10';
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex bg-raze-void text-raze-silver overflow-hidden font-sans">
      {/* ============================================================
          SIDEBAR: CONVERSATION HISTORY & THREADS
      ============================================================ */}
      <aside 
        className={`border-r border-white/10 bg-[#06080F] transition-all duration-300 flex flex-col z-20 shrink-0 ${
          sidebarOpen ? 'w-72' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={handleNewConversation}
            className="flex-1 mr-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-raze-blue/20 to-raze-cyan/15 border border-raze-blue/40 text-raze-ice font-mono text-xs font-semibold hover:border-raze-cyan transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-raze-cyan" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-raze-silverMuted hover:text-white hover:bg-white/5 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search Threads */}
        <div className="px-4 py-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-raze-silverMuted/60" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-raze-void/80 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-raze-silverMuted/40 outline-none focus:border-raze-blue/40 font-sans"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scroll">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-raze-silverMuted/60">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(c => {
              const active = activeConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-sans transition-all truncate border flex items-center justify-between group ${
                    active
                      ? 'bg-raze-blue/15 border-raze-blue/50 text-white shadow-sm font-medium'
                      : 'bg-transparent border-transparent text-raze-silverMuted hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1">{c.title || 'Untitled Conversation'}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-raze-void/60 text-[11px] font-mono text-raze-silverMuted space-y-1">
          <div className="flex items-center justify-between">
            <span>RAZE CORE:</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span>PERSISTENCE:</span>
            <span className="text-raze-cyan">SQLITE WAL</span>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN CHAT WORKSPACE (DISTRACTION-FREE GPT STYLE)
      ============================================================ */}
      <main className="flex-1 flex flex-col h-full bg-[#030407] relative overflow-hidden">
        {/* Top Header: Sidebar Toggle, Mode Pills, Actions */}
        <header className="px-4 md:px-6 py-3 border-b border-white/10 bg-[#06080F]/90 backdrop-blur-md flex items-center justify-between gap-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-white/10 hover:border-raze-blue/40 text-raze-silverMuted hover:text-white transition-colors"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* 5 Modes Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll py-0.5">
              {(['think', 'research', 'build', 'create', 'analyze'] as RazeAgentMode[]).map(m => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                      active
                        ? getModeColor(m) + ' shadow-glow-primary font-bold'
                        : 'bg-white/[0.03] text-raze-silverMuted border border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {getModeIcon(m)}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleExportMarkdown}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-xs font-mono text-raze-silverMuted hover:text-white transition-colors flex items-center gap-1"
                title="Export Chat as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-xs font-mono text-raze-silverMuted hover:text-white transition-colors flex items-center gap-1"
              title="Clear / New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Conversation Stream / Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scroll">
          {messages.length === 0 ? (
            /* Empty State: Modern GPT-style Greeting & Categorized Prompts */
            <div className="max-w-3xl mx-auto py-12 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-raze-blue/20 to-raze-cyan/10 border border-raze-blue/30 flex items-center justify-center text-raze-cyan shadow-glow-primary mb-5">
                <Zap className="w-8 h-8 fill-raze-cyan/20" />
              </div>

              <h2 className="font-raze text-3xl font-bold text-white tracking-wide text-glow-ice mb-2">
                RAZE AI
              </h2>
              <p className="font-mono text-xs tracking-cinematic text-raze-cyan uppercase mb-3">
                THINK BEYOND LIMITS.
              </p>
              <p className="text-sm text-raze-silverMuted max-w-lg mx-auto mb-10 font-sans font-light leading-relaxed">
                Your personal intelligence for thinking, creating, researching, and getting things done. Choose a mode or click a prompt to start.
              </p>

              {/* 4 Prompt Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                {modernPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMode(p.mode);
                      handleSendMessage(p.prompt);
                    }}
                    className="p-4 rounded-xl bg-raze-card border border-white/10 hover:border-raze-blue/50 hover:bg-white/[0.04] transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {p.icon}
                        <span className="text-xs font-mono font-semibold uppercase text-raze-ice">
                          {p.category} Mode
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white group-hover:text-raze-ice transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-raze-silverMuted/70 mt-1 line-clamp-2">
                        {p.prompt}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-raze-blue group-hover:text-raze-cyan">
                      <span>Execute</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Conversation Messages */
            messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  {/* Sender Label & Mode */}
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-raze-silverMuted">
                      {isAssistant ? 'RAZE AI' : 'YOU'}
                    </span>
                    {msg.mode && isAssistant && (
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded border uppercase ${getModeColor(msg.mode)}`}>
                        {msg.mode}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/30">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-3xl rounded-2xl p-4 md:p-5 text-sm leading-relaxed border relative group ${
                      isAssistant
                        ? 'bg-raze-card/90 border-white/10 text-raze-silver backdrop-blur-md shadow-md'
                        : 'bg-raze-blue/15 border-raze-blue/40 text-white'
                    }`}
                  >
                    {/* Render with Markdown syntax highlighting & code copy blocks */}
                    <MarkdownContent content={msg.content} />

                    {/* Assistant Message Action Bar */}
                    {isAssistant && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="inline-flex items-center gap-1 text-raze-silverMuted hover:text-white transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Feedback Thumbs */}
                          <div className="flex items-center gap-1 text-raze-silverMuted">
                            <button
                              onClick={() => setFeedbackGiven({ ...feedbackGiven, [msg.id]: 'up' })}
                              className={`p-1 rounded hover:text-white hover:bg-white/5 ${feedbackGiven[msg.id] === 'up' ? 'text-emerald-400' : ''}`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setFeedbackGiven({ ...feedbackGiven, [msg.id]: 'down' })}
                              className={`p-1 rounded hover:text-white hover:bg-white/5 ${feedbackGiven[msg.id] === 'down' ? 'text-rose-400' : ''}`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Direct Bridge to Task Runner */}
                        {onNavigateToTasks && (
                          <button
                            onClick={() => onNavigateToTasks(msg.content.substring(0, 100))}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-raze-blue/10 border border-raze-blue/30 text-raze-ice hover:bg-raze-blue/20 transition-all text-xs"
                          >
                            <Terminal className="w-3.5 h-3.5 text-raze-cyan" />
                            <span>Bridge to Task Runner</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading / Thinking State */}
          {isLoading && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[11px] font-mono tracking-wider uppercase text-raze-cyan">
                  RAZE AI (THINKING)
                </span>
              </div>
              <div className="max-w-md rounded-2xl p-4 bg-raze-card border border-raze-blue/30 flex items-center gap-3 shadow-glow-primary">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-raze-blue opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-raze-cyan" />
                </div>
                <div className="text-xs font-mono text-raze-ice">
                  {statusMessage}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================
            BOTTOM FLOATING INPUT CAPSULE (GPT STYLE)
        ============================================================ */}
        <footer className="p-4 md:p-6 bg-gradient-to-t from-[#030407] via-[#030407] to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl bg-[#090C16] border border-white/15 focus-within:border-raze-blue/70 focus-within:shadow-glow-primary transition-all shadow-xl">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask RAZE AI in [${mode.toUpperCase()}] mode... (Shift+Enter for newline)`}
                rows={2}
                disabled={isLoading}
                className="w-full bg-transparent p-4 pr-28 text-sm text-white placeholder-raze-silverMuted/40 outline-none resize-none font-sans"
              />

              {/* Action Buttons inside input */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleRetryLast}
                    disabled={isLoading}
                    title="Retry Last Message"
                    className="p-2 rounded-xl text-raze-silverMuted hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="btn-send-message"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-glow-cyan"
                >
                  <Send className="w-4 h-4 fill-raze-void" />
                </button>
              </div>
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[11px] font-mono text-raze-silverMuted/50 mt-2 px-1">
              <span>Press <strong className="text-raze-silver">Enter</strong> to send; <strong className="text-raze-silver">Shift+Enter</strong> for newline</span>
              <span className="text-raze-cyan uppercase font-semibold">Active Mode: {mode}</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
