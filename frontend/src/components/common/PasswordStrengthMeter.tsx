import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export interface PasswordScore {
  score: number; // 0 to 4
  label: string;
  toneClass: string;
  barColor: string;
}

export function computePasswordScore(pwd: string): PasswordScore {
  if (!pwd) {
    return { score: 0, label: '', toneClass: '', barColor: 'bg-stone-300 dark:bg-stone-700' };
  }

  let points = 0;
  if (pwd.length >= 6) points += 1;
  if (pwd.length >= 8) points += 1;
  if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) points += 1;
  if (/[^A-Za-z0-9]/.test(pwd) || (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd))) points += 1;

  if (points <= 1) {
    return {
      score: 1,
      label: 'Delicate / Soft',
      toneClass: 'text-amber-700 dark:text-amber-400',
      barColor: 'bg-amber-400',
    };
  }
  if (points === 2) {
    return {
      score: 2,
      label: 'Fair Security',
      toneClass: 'text-amber-600 dark:text-[#E6C387]/80',
      barColor: 'bg-[#E6C387]/70',
    };
  }
  if (points === 3) {
    return {
      score: 3,
      label: 'Strong & Curated',
      toneClass: 'text-amber-700 dark:text-[#E6C387]',
      barColor: 'bg-[#E6C387]',
    };
  }
  return {
    score: 4,
    label: 'Impeccable Vault Strength',
    toneClass: 'text-emerald-700 dark:text-emerald-400 font-semibold',
    barColor: 'bg-emerald-600 dark:bg-emerald-500',
  };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const { score, label, toneClass, barColor } = computePasswordScore(password);

  return (
    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-[#635A52] dark:text-[#A1A1AA]">
          <Shield className="w-3 h-3 text-[#E6C387]" />
          Passcode Strength:
        </span>
        <span className={`transition-colors duration-200 flex items-center gap-1 ${toneClass}`}>
          {score === 4 && <Sparkles className="w-3 h-3 text-emerald-500" />}
          {label}
        </span>
      </div>

      {/* 4-Step Animated Pill Track */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              className={`rounded-full transition-all duration-300 ease-out ${
                isActive ? barColor : 'bg-stone-200 dark:bg-[#242938]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
