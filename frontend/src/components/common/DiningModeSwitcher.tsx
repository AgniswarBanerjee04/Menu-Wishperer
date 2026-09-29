import React from 'react';
import { User, Users } from 'lucide-react';
import { useDiningMode } from '../../context/DiningModeContext';


interface DiningModeSwitcherProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onChange?: (mode: 'personal' | 'custom') => void;
  showDescriptions?: boolean;
}

export const DiningModeSwitcher: React.FC<DiningModeSwitcherProps> = ({
  size = 'md',
  className = '',
  onChange,
  showDescriptions = false,
}) => {
  const { activeMode, setActiveMode, guests } = useDiningMode();

  const handleSelect = (mode: 'personal' | 'custom') => {
    setActiveMode(mode);
    if (onChange) onChange(mode);
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      className={`relative inline-flex p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 shadow-inner backdrop-blur-md transition-all duration-300 ${className}`}
      role="tablist"
      aria-label="Dining Mode Switcher"
    >
      {/* Animated Sliding Background Gold Pill */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A880] to-[#B89565] shadow-md shadow-gold-500/25 transition-transform duration-300 ease-out pointer-events-none ${
          activeMode === 'personal' ? 'left-1 translate-x-0' : 'left-1 translate-x-full'
        }`}
      />

      {/* Personal Dining Option */}
      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'personal'}
        onClick={() => handleSelect('personal')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl transition-colors duration-200 text-center font-medium ${
          isSmall
            ? 'px-3 py-1.5 text-xs'
            : isLarge
            ? 'px-5 py-3 text-sm'
            : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          activeMode === 'personal'
            ? 'text-[#1A1715] font-bold drop-shadow-sm'
            : 'text-stone-600 dark:text-stone-400 hover:text-[#1A1715] dark:hover:text-[#F5F2EB]'
        }`}
      >
        <User className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${activeMode === 'personal' ? 'text-[#1A1715]' : 'text-stone-500'}`} />
        <div className="text-left">
          <span className="block leading-tight font-bold">Personal Dining</span>
          {showDescriptions && (
            <span
              className={`block text-[10px] leading-tight ${
                activeMode === 'personal' ? 'text-stone-900/80 font-medium' : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              My taste log & history
            </span>
          )}
        </div>
      </button>

      {/* Custom / Group Dining Option */}
      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'custom'}
        onClick={() => handleSelect('custom')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl transition-colors duration-200 text-center font-medium ${
          isSmall
            ? 'px-3 py-1.5 text-xs'
            : isLarge
            ? 'px-5 py-3 text-sm'
            : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          activeMode === 'custom'
            ? 'text-[#1A1715] font-bold drop-shadow-sm'
            : 'text-stone-600 dark:text-stone-400 hover:text-[#1A1715] dark:hover:text-[#F5F2EB]'
        }`}
      >
        <Users className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${activeMode === 'custom' ? 'text-[#1A1715]' : 'text-stone-500'}`} />
        <div className="text-left flex items-center gap-1.5">
          <div>
            <span className="block leading-tight font-bold">Group & Guests</span>
            {showDescriptions && (
              <span
                className={`block text-[10px] leading-tight ${
                  activeMode === 'custom' ? 'text-stone-900/80 font-medium' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Multi-guest catering
              </span>
            )}
          </div>
          {activeMode === 'custom' && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#1A1715]/15 text-[#1A1715] font-extrabold text-[10px]">
              {guests.length}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};
