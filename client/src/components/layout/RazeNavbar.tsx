import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Search, 
  FolderGit2, 
  Activity, 
  Settings, 
  Zap, 
  ShieldAlert, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

interface RazeNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const RazeNavbar: React.FC<RazeNavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'HOME', path: '/', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'AGENT', path: '/agent', icon: <Cpu className="w-3.5 h-3.5" /> },
    { label: 'TASKS', path: '/tasks', icon: <Terminal className="w-3.5 h-3.5" /> },
    { label: 'RESEARCH', path: '/research', icon: <Search className="w-3.5 h-3.5" /> },
    { label: 'PROJECTS', path: '/projects', icon: <FolderGit2 className="w-3.5 h-3.5" /> },
    { label: 'ACTIVITY', path: '/activity', icon: <Activity className="w-3.5 h-3.5" /> },
    { label: 'SETTINGS', path: '/settings', icon: <Settings className="w-3.5 h-3.5" /> }
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-raze-void/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 select-none">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-raze-blue to-raze-cyan p-[1px] shadow-glow-primary">
            <div className="w-full h-full bg-raze-void rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-raze-cyan fill-raze-cyan/20 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-raze text-lg font-black tracking-widest text-white text-glow-ice group-hover:text-raze-ice transition-colors">
              RAZE AI
            </span>
            <span className="text-[9px] font-mono tracking-widest text-raze-silverMuted uppercase">
              THINK BEYOND LIMITS
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => {
            const active = currentPath === item.path;
            const displayLabel = item.label === 'AGENT' ? 'CHAT' : item.label;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs tracking-wider transition-all ${
                  active
                    ? 'bg-raze-blue/15 text-raze-ice border border-raze-blue/40 shadow-glow-primary font-bold'
                    : 'text-raze-silverMuted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.icon}
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action: Status Beacon & Quick Start */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-surface/80 border border-white/10 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-raze-cyan animate-pulse shadow-glow-cyan" />
            <span className="text-raze-silverMuted">CORE:</span>
            <span className="text-raze-ice font-semibold">ONLINE</span>
          </div>

          {/* Start Conversation Button */}
          {currentPath === '/' ? (
            <button
              onClick={() => handleNav('/agent')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-raze-blue to-raze-cyan text-raze-void font-raze text-xs font-bold tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-glow-cyan"
            >
              <Zap className="w-3.5 h-3.5 fill-raze-void" />
              <span>START CHAT</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/')}
              className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-raze-blue/40 text-xs font-mono text-raze-silverMuted hover:text-white transition-colors"
            >
              Return Home
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-white/10 text-raze-silverMuted hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-raze-surface border-b border-white/10 p-4 space-y-2 backdrop-blur-2xl">
          {navItems.map(item => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl font-mono text-xs tracking-wider transition-all ${
                  active
                    ? 'bg-raze-blue/20 text-raze-ice border border-raze-blue/40 font-bold'
                    : 'text-raze-silverMuted hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
