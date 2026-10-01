import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-[#131620]/80 backdrop-blur-md border border-stone-200/80 dark:border-[#242938] shadow-luxe-light dark:shadow-luxe-dark',
    glass: 'bg-white/85 dark:bg-[#131620]/80 backdrop-blur-md border border-stone-200/80 dark:border-[#242938] shadow-luxe-light dark:shadow-luxe-dark',
    interactive: 'bg-white dark:bg-[#131620]/80 backdrop-blur-md border border-stone-200/80 dark:border-[#242938] hover:border-[#E6C387]/50 dark:hover:border-[#E6C387]/50 shadow-luxe-light dark:shadow-luxe-dark card-hover-lift cursor-pointer',
    outline: 'border border-dashed border-stone-300 dark:border-[#242938] bg-transparent',
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 transition-all duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
