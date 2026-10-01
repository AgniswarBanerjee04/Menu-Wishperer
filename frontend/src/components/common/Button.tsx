import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-gold-400/50';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    // Refined Champagne Gold with Deep Obsidian typography
    primary: 'bg-[#E6C387] text-[#090A0F] font-semibold hover:bg-[#D4AF37] transition-all duration-200 shadow-lg shadow-[#E6C387]/10 border border-[#E6C387]/30',
    // Elevated Obsidian surface with fine subtle border
    secondary: 'bg-[#131620] text-[#F4F4F5] hover:bg-[#1A1F2C] border border-[#242938] shadow-sm',
    // Crisp elegant outline with champagne gold hover accent
    outline: 'border border-[#242938] text-[#F4F4F5] hover:border-[#E6C387] hover:bg-[#E6C387]/10 hover:text-[#E6C387]',
    // Ghost with subtle secondary text
    ghost: 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#131620]/60',
    // Subtle wine danger
    danger: 'bg-rose-950/70 text-rose-300 border border-rose-800/50 hover:bg-rose-900/80 shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
