import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
          type === 'success'
            ? 'bg-white/95 dark:bg-[#1B1917]/95 border-emerald-500/40 text-[#1A1715] dark:text-[#F5F2EB] shadow-emerald-500/10'
            : 'bg-white/95 dark:bg-[#1B1917]/95 border-burgundy-500/40 text-burgundy-800 dark:text-rose-300 shadow-burgundy-500/10'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-burgundy-500/15 text-burgundy-600 dark:text-rose-400'
          }`}
        >
          {type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
          ) : (
            <AlertCircle className="w-4 h-4 stroke-[2.2]" />
          )}
        </div>

        <div className="text-xs font-semibold pr-2">{message}</div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
