import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string | null;
  icon?: React.ReactNode;
  isValid?: boolean;
  prefixBadge?: string;
  showPasswordToggle?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  value = '',
  onChange,
  type = 'text',
  error,
  hint,
  icon,
  isValid = false,
  prefixBadge,
  showPasswordToggle = false,
  className = '',
  disabled,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id || `floating-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloating = isFocused || hasValue;
  const actualType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1">
      <div
        className={`relative rounded-xl border transition-all duration-200 bg-white dark:bg-[#171513] shadow-sm ${
          error
            ? 'border-burgundy-500/80 dark:border-rose-700 ring-1 ring-burgundy-500/20'
            : isFocused
            ? 'border-[#C5A880] ring-1 ring-[#C5A880] shadow-[0_0_15px_-3px_rgba(197,168,128,0.25)]'
            : 'border-[#E8E2D8] dark:border-[#3D352E] hover:border-[#C5A880]/60'
        } ${disabled ? 'opacity-60 bg-stone-100 dark:bg-stone-900 cursor-not-allowed' : ''}`}
      >
        {/* Left Icon or Prefix */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gold-600/80 dark:text-gold-400/80">
          {prefixBadge ? (
            <span className="font-semibold text-xs text-gold-700 dark:text-gold-300 pr-1 select-none">
              {prefixBadge}
            </span>
          ) : (
            icon && <span className="w-4 h-4">{icon}</span>
          )}
        </div>

        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className={`absolute pointer-events-none transition-all duration-200 ease-out font-medium ${
            prefixBadge ? 'left-14' : icon ? 'left-10' : 'left-3.5'
          } ${
            isFloating
              ? 'top-1.5 text-[10px] tracking-wider uppercase font-semibold text-gold-700 dark:text-gold-300'
              : 'top-3.5 text-xs text-stone-500 dark:text-stone-400'
          }`}
        >
          {label}
        </label>

        {/* Native Input */}
        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full rounded-xl bg-transparent px-3.5 pb-2 pt-5 text-sm text-[#1A1715] dark:text-[#F5F2EB] placeholder-transparent focus:outline-none transition-colors ${
            prefixBadge ? 'pl-14' : icon ? 'pl-10' : 'pl-3.5'
          } ${
            showPasswordToggle || isValid ? 'pr-11' : 'pr-3.5'
          } ${className}`}
          {...props}
        />

        {/* Trailing Controls: Password Visibility Toggle / Valid Checkmark */}
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
          {isValid && !error && (
            <div
              className="text-emerald-600 dark:text-emerald-400 flex items-center transition-transform animate-in fade-in zoom-in-75 duration-200"
              title="Verified valid"
              aria-label="Valid input"
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="p-1 rounded-lg text-stone-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Error or Hint Message */}
      {error ? (
        <p className="text-[11px] text-burgundy-600 dark:text-rose-400 font-medium px-1 animate-in fade-in duration-150">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[#635A52] dark:text-[#A89F95] px-1">{hint}</p>
      ) : null}
    </div>
  );
};
