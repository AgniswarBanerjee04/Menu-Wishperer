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
    default: 'bg-white dark:bg-[#1B1917] border border-stone-200/80 dark:border-stone-800/80 shadow-luxe-light dark:shadow-luxe-dark',
    glass: 'bg-white/85 dark:bg-[#1B1917]/85 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-luxe-light dark:shadow-luxe-dark',
    interactive: 'bg-white dark:bg-[#1B1917] border border-stone-200/80 dark:border-stone-800/80 shadow-luxe-light dark:shadow-luxe-dark card-hover-lift cursor-pointer',
    outline: 'border border-dashed border-stone-300 dark:border-stone-700 bg-transparent',
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
