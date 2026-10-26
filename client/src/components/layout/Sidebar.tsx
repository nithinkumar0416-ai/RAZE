import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  GitBranch, 
  PlayCircle, 
  Activity, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Radio
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRunId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  activeRunId
}) => {
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/repositories', label: 'Repositories', icon: GitBranch },
    { path: '/verify/new', label: 'New Verification', icon: PlayCircle, highlight: true },
    { path: '/runs', label: 'Verification Runs', icon: Activity },
    ...(activeRunId ? [{ path: `/runs/${activeRunId}`, label: 'Live Room', icon: Radio, live: true }] : []),
    { path: '/memory', label: 'Verification Memory', icon: Database },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-og-border bg-og-surface/80 backdrop-blur-xl transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-og-border">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-og-primary to-og-cyan shadow-glow-primary">
          <ShieldCheck className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-og-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-og-cyan"></span>
          </span>
        </div>
        {!collapsed && (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-mono">OPEN GUARD</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-og-violet/30 text-og-violet border border-og-violet/40">RAZE</span>
            </div>
            <p className="text-[10px] text-og-muted font-medium tracking-wide uppercase">Trust Collapse Engine</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-og-primary/15 text-og-cyan border border-og-primary/30 shadow-glow-primary'
                  : item.highlight
                  ? 'text-og-text hover:bg-og-primary/10 hover:text-white border border-transparent'
                  : 'text-og-muted hover:text-og-text hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-og-cyan' : item.live ? 'text-og-danger animate-pulse' : 'text-og-muted group-hover:text-og-text'
                }`}
              />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {item.live && !collapsed && (
                <span className="flex h-2 w-2 rounded-full bg-og-danger animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Trust Philosophy Quote in footer */}
      {!collapsed && (
        <div className="p-4 mx-3 mb-4 rounded-xl border border-og-border/60 bg-og-panel/40">
          <div className="flex items-center gap-2 text-og-cyan text-xs font-semibold mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Product Philosophy</span>
          </div>
          <p className="text-[11px] text-og-muted leading-relaxed italic">
            "Every fix must face a challenge. Every security claim must have evidence."
          </p>
        </div>
      )}

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-og-border flex justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-og-muted hover:text-og-text hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
