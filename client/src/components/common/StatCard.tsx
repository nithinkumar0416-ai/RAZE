import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'cyan' | 'violet' | 'danger' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary'
}) => {
  const colorMap = {
    primary: {
      text: 'text-og-primary',
      bg: 'bg-og-primary/10',
      border: 'hover:border-og-primary/40',
      glow: 'hover:shadow-glow-primary'
    },
    cyan: {
      text: 'text-og-cyan',
      bg: 'bg-og-cyan/10',
      border: 'hover:border-og-cyan/40',
      glow: 'hover:shadow-glow-cyan'
    },
    violet: {
      text: 'text-og-violet',
      bg: 'bg-og-violet/10',
      border: 'hover:border-og-violet/40',
      glow: 'hover:shadow-glow-violet'
    },
    danger: {
      text: 'text-og-danger',
      bg: 'bg-og-danger/10',
      border: 'hover:border-og-danger/40',
      glow: 'hover:shadow-glow-danger'
    },
    success: {
      text: 'text-og-success',
      bg: 'bg-og-success/10',
      border: 'hover:border-og-success/40',
      glow: 'hover:shadow-glow-primary'
    }
  };

  const style = colorMap[variant];

  return (
    <div
      className={`glass-panel p-5 rounded-xl border border-og-border glass-panel-hover transition-all duration-300 ${style.border} ${style.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-og-muted">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-mono text-og-text tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-og-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
