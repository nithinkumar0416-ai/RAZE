import React from 'react';
import { Bot, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { Badge } from '../common/Badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleAssistant: () => void;
  assistantOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onToggleAssistant,
  assistantOpen
}) => {
  return (
    <header className="h-16 px-8 border-b border-og-border bg-og-surface/50 backdrop-blur-md flex items-center justify-between z-30 sticky top-0">
      <div>
        <h1 className="text-lg font-semibold text-og-text tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-og-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Sandbox Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-og-border bg-og-panel/60 text-xs text-og-muted font-mono">
          <Terminal className="w-3.5 h-3.5 text-og-cyan" />
          <span>Shadow Sandbox:</span>
          <span className="text-og-cyan font-semibold">Active</span>
        </div>

        {/* Operating Mode Indicator */}
        <Badge variant="cyan" size="sm">
          <Cpu className="w-3 h-3" />
          Local Deterministic Engine
        </Badge>

        {/* Circuit Breaker Health */}
        <Badge variant="success" size="sm">
          <ShieldAlert className="w-3 h-3" />
          Circuit Breaker: Armed
        </Badge>

        {/* Assistant Drawer Toggle */}
        <button
          onClick={onToggleAssistant}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
            assistantOpen
              ? 'bg-og-violet text-white border-og-violet shadow-glow-violet'
              : 'bg-og-panel text-og-text border-og-border hover:border-og-violet/50 hover:text-og-violet'
          }`}
        >
          <Bot className="w-4 h-4 text-og-violet" />
          <span>Dev Assistant</span>
        </button>
      </div>
    </header>
  );
};
