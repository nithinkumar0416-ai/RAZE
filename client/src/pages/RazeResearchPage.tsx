import React, { useState } from 'react';
import { api } from '../services/api';
import { RazeResearchResult } from '../types';
import { 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  ArrowRight,
  Globe
} from 'lucide-react';

export const RazeResearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [researchData, setResearchData] = useState<RazeResearchResult | null>(null);

  const sampleQueries = [
    'Autonomous AI verification architectures',
    'Self-healing distributed systems',
    'AST mutation testing and formal release gates',
    'LLM agent memory isolation and persistent state',
    'Deterministic execution in multi-agent consensus'
  ];

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setQuery(q);
    try {
      const data = await api.performResearch(q);
      setResearchData(data);
    } catch (err: any) {
      alert(`Research query failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-raze-void text-raze-silver px-4 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-cyan/10 border border-raze-cyan/30 text-raze-cyan text-xs font-mono uppercase mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          SYNTHESIS ENGINE
        </div>
        <h1 className="font-raze text-3xl font-extrabold text-white text-glow-ice">
          LIVE RESEARCH EXPLORER
        </h1>
        <p className="text-sm text-raze-silverMuted mt-1">
          Query indexed technical papers, architectural RFCs, and open-source intelligence with verified citations.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 md:p-6 rounded-2xl bg-raze-card border border-white/10 shadow-glow-primary mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-raze-silverMuted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search research topic, paper title, or architectural paradigm..."
              className="w-full bg-raze-void/80 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-raze-silverMuted/50 outline-none focus:border-raze-cyan transition-colors font-sans"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void font-raze text-xs font-bold tracking-wider disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-glow-cyan"
          >
            {isSearching ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>INDEXING...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>RESEARCH</span>
              </>
            )}
          </button>
        </div>

        {/* Quick query pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <span className="text-[11px] font-mono text-raze-silverMuted">Suggested queries:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(sq)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:border-raze-cyan/40 hover:text-white text-xs text-raze-silverMuted font-sans transition-all"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Research Output View */}
      {researchData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Synthesis Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-raze-surface via-raze-card to-raze-surface border border-raze-cyan/30 shadow-glow-cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-raze-cyan/15 text-raze-cyan border border-raze-cyan/30 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Executive Synthesis
              </span>
              <span className="text-xs font-mono text-raze-silverMuted">
                Indexed: {new Date(researchData.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <h2 className="font-raze text-xl font-bold text-white mb-3">
              Topic: {researchData.query}
            </h2>

            <p className="text-sm text-raze-silver leading-relaxed font-sans mb-6">
              {researchData.summary}
            </p>

            {/* Key Technical Insights */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-raze-cyan mb-3">
                Key Technical Findings:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {researchData.insights.map((ins, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-raze-void/60 border border-white/5 flex items-start gap-2.5 text-xs text-raze-silver">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sourced Reference Cards */}
          <div>
            <h2 className="font-raze text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-raze-blue" />
              SOURCED CITATIONS ({researchData.sources.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {researchData.sources.map((src, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-blue/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-blue/15 text-raze-ice border border-raze-blue/30 uppercase">
                        {src.domain}
                      </span>
                      {src.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-raze-ice transition-colors">
                      {src.title}
                    </h3>
                    <p className="text-xs text-raze-silverMuted mt-2 leading-relaxed">
                      {src.snippet}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-raze-cyan hover:underline"
                    >
                      <span>Inspect Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {!researchData && !isSearching && (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-raze-card/40">
          <BookOpen className="w-12 h-12 text-raze-silverMuted/40 mx-auto mb-3" />
          <h2 className="font-raze text-lg font-bold text-white">Enter a research inquiry above</h2>
          <p className="text-xs text-raze-silverMuted max-w-md mx-auto mt-1">
            RAZE aggregates academic papers, whitepapers, and software engineering benchmarks to produce verified knowledge syntheses.
          </p>
        </div>
      )}
    </div>
  );
};
