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
    // Brushed royal antique gold with deep espresso typography
    primary: 'bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-semibold hover:from-[#B89565] hover:to-[#A37F4F] shadow-sm shadow-[#C5A880]/20 border border-[#E8DBC5]/40 hover:shadow-md transition-all',
    // Dark satin with subtle gold border trim
    secondary: 'bg-[#241E19] text-[#F5F2EB] hover:bg-[#342C24] dark:bg-[#25221F] dark:hover:bg-[#322E2A] border border-[#C5A880]/30 shadow-sm',
    // Crisp elegant outline with champagne gold border
    outline: 'border border-stone-300 dark:border-stone-700 text-[#1A1715] dark:text-[#F5F2EB] hover:border-[#C5A880] hover:bg-[#C5A880]/10',
    // Ghost with slate umber text
    ghost: 'text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60',
    // Regal burgundy
    danger: 'bg-[#6B1724] text-white hover:bg-[#8B2635] shadow-sm',
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
