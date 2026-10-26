import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'cyan' | 'violet' | 'success' | 'danger' | 'warning' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  pulse = false
}) => {
  const variantStyles = {
    primary: 'bg-og-primary/15 text-og-primary border-og-primary/30',
    cyan: 'bg-og-cyan/15 text-og-cyan border-og-cyan/30',
    violet: 'bg-og-violet/15 text-og-violet border-og-violet/30',
    success: 'bg-og-success/15 text-og-success border-og-success/30',
    danger: 'bg-og-danger/15 text-og-danger border-og-danger/30',
    warning: 'bg-og-warning/15 text-og-warning border-og-warning/30',
    neutral: 'bg-white/5 text-og-muted border-white/10'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${pulse ? 'animate-pulse' : ''}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      )}
      {children}
    </span>
  );
};
