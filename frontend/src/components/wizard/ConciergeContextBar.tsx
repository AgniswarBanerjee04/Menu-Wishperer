import React from 'react';
import { Coffee, Utensils, User, Users, Edit3, Sparkles } from 'lucide-react';
import type { VenueType, DiningMode } from '../../types';
import { useDiningMode } from '../../context/DiningModeContext';

interface ConciergeContextBarProps {
  venueType: VenueType;
  diningMode: DiningMode;
  onEditContext: () => void;
}

export const ConciergeContextBar: React.FC<ConciergeContextBarProps> = ({
  venueType,
  diningMode,
  onEditContext,
}) => {
  const { guests } = useDiningMode();

  return (
    <div className="w-full p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#1B1917]/80 border border-stone-200/90 dark:border-stone-800 shadow-sm backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
      {/* Context Chips Stack */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs justify-center sm:justify-start">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 fill-current text-gold-500" />
          Active Context:
        </span>

        {/* Venue Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-[#1A1715] dark:text-[#F5F2EB] font-bold text-xs shadow-xs">
          {venueType === 'cafe' ? (
            <>
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>☕ Café Mode (Quick Bites & Coffee)</span>
            </>
          ) : (
            <>
              <Utensils className="w-3.5 h-3.5 text-burgundy-600 dark:text-rose-400" />
              <span>🍽️ Restaurant Mode (Sit-Down Feasts)</span>
            </>
          )}
        </div>

        {/* Persona Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[#1A1715] dark:text-[#F5F2EB] font-bold text-xs">
          {diningMode === 'personal' ? (
            <>
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>👤 Personal Dining (Saved Profile)</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              <span>👥 Custom Dining ({guests.length} Diners)</span>
            </>
          )}
        </div>
      </div>

      {/* Edit CTA */}
      <button
        type="button"
        onClick={onEditContext}
        className="text-xs font-bold text-gold-700 dark:text-gold-400 hover:text-gold-800 dark:hover:text-gold-300 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gold-500/10 transition-colors shrink-0"
      >
        <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>Change Setting / Diners</span>
      </button>
    </div>
  );
};
