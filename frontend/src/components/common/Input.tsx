import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border border-[#E8E2D8] dark:border-[#3D352E] bg-white dark:bg-[#1B1917] px-4 py-2.5 text-sm text-[#1A1715] dark:text-[#F5F2EB] placeholder-stone-400 dark:placeholder-stone-500 transition-all focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 disabled:bg-stone-50 dark:disabled:bg-stone-900 ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
