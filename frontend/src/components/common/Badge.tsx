import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'rose' | 'stone' | 'outline' | 'gold';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'amber',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantStyles = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-[#E6C387]/10 dark:text-[#E6C387] border border-amber-200 dark:border-[#E6C387]/20',
    gold: 'bg-amber-100 text-amber-900 dark:bg-[#E6C387]/10 dark:text-[#E6C387] border border-amber-200 dark:border-[#E6C387]/20',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50',
    stone: 'bg-stone-100 text-stone-700 dark:bg-[#131620] dark:text-[#A1A1AA] border border-stone-200 dark:border-[#242938]',
    outline: 'border border-amber-300 dark:border-[#E6C387]/30 text-amber-700 dark:text-[#E6C387] bg-transparent',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full tracking-wide shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
