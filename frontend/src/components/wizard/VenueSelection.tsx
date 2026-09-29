import React from 'react';
import { Coffee, Utensils, Check, Sparkles, Flame, Clock } from 'lucide-react';
import type { VenueType } from '../../types';

interface VenueSelectionProps {
  selectedVenue: VenueType | null;
  onSelectVenue: (venue: VenueType) => void;
}

export const VenueSelection: React.FC<VenueSelectionProps> = ({
  selectedVenue,
  onSelectVenue,
}) => {
  return (
    <section className="w-full text-center space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Editorial Header */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-700 dark:text-gold-300 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-current text-gold-500" />
          Step 1 · Dining Atmosphere
        </div>

        <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1715] dark:text-[#F5F2EB] tracking-tight">
          Select your dining setting.
        </h1>

        <p className="text-xs sm:text-sm text-[#635A52] dark:text-[#A89F95] max-w-md mx-auto leading-relaxed">
          Calibrate our AI concierge to your culinary setting for precision dish matching and menu decoding.
        </p>
      </div>

      {/* Side-by-Side Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left max-w-3xl mx-auto">
        {/* Option 1: ☕ Café Mode */}
        <button
          type="button"
          onClick={() => onSelectVenue('cafe')}
          className={`group relative p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between overflow-hidden border ${
            selectedVenue === 'cafe'
              ? 'bg-gradient-to-br from-amber-500/10 via-gold-500/5 to-white/90 dark:from-amber-950/40 dark:via-stone-900/90 dark:to-[#1B1917] border-gold-500 ring-2 ring-gold-400/50 shadow-luxe-light dark:shadow-luxe-dark scale-[1.01]'
              : 'bg-white/80 dark:bg-[#1B1917]/80 hover:bg-white dark:hover:bg-[#201D1A] border-stone-200/90 dark:border-stone-800 hover:border-gold-400/50 hover:shadow-md'
          }`}
        >
          {/* Top Ambient Light */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:bg-amber-400/20 transition-colors" />

          <div className="space-y-4 relative z-10 w-full">
            {/* Header with Icon and Selected Status */}
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  selectedVenue === 'cafe'
                    ? 'bg-gradient-to-tr from-[#C5A880] to-[#E8DBC5] text-[#1A1715] shadow-sm shadow-gold-500/30 rotate-[-2deg]'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 group-hover:scale-105'
                }`}
              >
                <Coffee className="w-6 h-6 stroke-[2.2]" />
              </div>

              {selectedVenue === 'cafe' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500 text-[#1A1715] text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-in fade-in zoom-in-95">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                  Artisanal & Quick
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-serif-display font-bold text-[#1A1715] dark:text-[#F5F2EB]">
                  ☕ Café Mode
                </span>
              </div>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1 font-medium">
                Artisanal quick-service, roasteries, bistros & espresso bars
              </p>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Specialty espresso, pour-overs & cold brews</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Bakery viennoiserie, toasts & sourdough bites</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Single-portion pacing & barista flavor profiles</span>
              </li>
            </ul>
          </div>

          {/* AI Tuning Prompt Footer Note */}
          <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-[#635A52] dark:text-[#A89F95] relative z-10 w-full">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" /> Fast & Individual Orders
            </span>
            <span className="font-bold text-xs text-[#1A1715] dark:text-[#F5F2EB] group-hover:text-gold-600 transition-colors">
              {selectedVenue === 'cafe' ? 'Active Setting' : 'Select Café →'}
            </span>
          </div>
        </button>

        {/* Option 2: 🍽️ Restaurant Mode */}
        <button
          type="button"
          onClick={() => onSelectVenue('restaurant')}
          className={`group relative p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between overflow-hidden border ${
            selectedVenue === 'restaurant'
              ? 'bg-gradient-to-br from-burgundy-500/10 via-gold-500/5 to-white/90 dark:from-burgundy-950/40 dark:via-stone-900/90 dark:to-[#1B1917] border-gold-500 ring-2 ring-gold-400/50 shadow-luxe-light dark:shadow-luxe-dark scale-[1.01]'
              : 'bg-white/80 dark:bg-[#1B1917]/80 hover:bg-white dark:hover:bg-[#201D1A] border-stone-200/90 dark:border-stone-800 hover:border-gold-400/50 hover:shadow-md'
          }`}
        >
          {/* Top Ambient Light */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-burgundy-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:bg-burgundy-500/20 transition-colors" />

          <div className="space-y-4 relative z-10 w-full">
            {/* Header with Icon and Selected Status */}
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  selectedVenue === 'restaurant'
                    ? 'bg-gradient-to-tr from-[#8B2635] to-[#B89565] text-white shadow-sm shadow-burgundy-500/30 rotate-[2deg]'
                    : 'bg-burgundy-500/10 text-burgundy-700 dark:text-rose-300 border border-burgundy-500/20 group-hover:scale-105'
                }`}
              >
                <Utensils className="w-6 h-6 stroke-[2.2]" />
              </div>

              {selectedVenue === 'restaurant' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500 text-[#1A1715] text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-in fade-in zoom-in-95">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                  Fine Dining & Dawat
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-serif-display font-bold text-[#1A1715] dark:text-[#F5F2EB]">
                  🍽️ Restaurant Mode
                </span>
              </div>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1 font-medium">
                Sit-down dining, royal dawats, tandoor & multi-course feasts
              </p>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 shrink-0" />
                <span>Multi-course curries, royal gravies & tandoor breads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 shrink-0" />
                <span>Portion matrices: Half/Full, sizzlers & starters</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 shrink-0" />
                <span>Center-table sharing platters & banquet dining</span>
              </li>
            </ul>
          </div>

          {/* AI Tuning Prompt Footer Note */}
          <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-[#635A52] dark:text-[#A89F95] relative z-10 w-full">
            <span className="flex items-center gap-1.5 text-burgundy-700 dark:text-rose-400 font-semibold">
              <Flame className="w-3.5 h-3.5" /> Full Course & Sharing
            </span>
            <span className="font-bold text-xs text-[#1A1715] dark:text-[#F5F2EB] group-hover:text-gold-600 transition-colors">
              {selectedVenue === 'restaurant' ? 'Active Setting' : 'Select Restaurant →'}
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
