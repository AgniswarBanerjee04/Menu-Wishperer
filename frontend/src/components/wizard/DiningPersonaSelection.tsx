import React, { useState } from 'react';
import { User, Users, Check, Sparkles, Plus, Trash2, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import type { DiningMode, GuestDietary, GuestSpice } from '../../types';
import { useDiningMode } from '../../context/DiningModeContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatCurrency';

interface DiningPersonaSelectionProps {
  selectedMode: DiningMode | null;
  onSelectMode: (mode: DiningMode) => void;
  onFinalizePersona: (mode: DiningMode) => void;
}

const DIETARY_TAGS: { id: GuestDietary; label: string; icon: string; badge: string }[] = [
  { id: 'veg', label: 'Pure Veg', icon: '🟢', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  { id: 'non-veg', label: 'Non-Veg', icon: '🔴', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  { id: 'egg', label: 'Eggitarian', icon: '🟡', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { id: 'jain', label: 'Jain', icon: '⚪', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30' },
];

const SPICE_TAGS: { id: GuestSpice; label: string; flames: string }[] = [
  { id: 'mild', label: 'Mild', flames: '🌶️' },
  { id: 'medium', label: 'Medium', flames: '🌶️🌶️' },
  { id: 'spicy', label: 'Spicy', flames: '🌶️🌶️🌶️' },
];

const QUICK_GUEST_PRESETS = ['Dad', 'Mom', 'Friend', 'Kid', 'Partner', 'Colleague'];

export const DiningPersonaSelection: React.FC<DiningPersonaSelectionProps> = ({
  selectedMode,
  onSelectMode,
  onFinalizePersona,
}) => {
  const { user } = useAuth();
  const { guests, addGuest, updateGuest, removeGuest, savedPresets, loadPreset } = useDiningMode();
  const [showCustomBuilder, setShowCustomBuilder] = useState(selectedMode === 'custom');

  const handleSelectPersonal = () => {
    onSelectMode('personal');
    setShowCustomBuilder(false);
    onFinalizePersona('personal');
  };

  const handleSelectCustom = () => {
    onSelectMode('custom');
    setShowCustomBuilder(true);
  };

  const handleConfirmCustom = () => {
    onSelectMode('custom');
    onFinalizePersona('custom');
  };

  const totalCustomBudget = guests.reduce((sum, g) => sum + (g.max_budget || 400), 0);

  return (
    <section className="w-full space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Editorial Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-700 dark:text-gold-300 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-current text-gold-500" />
          Step 2 · Dining Persona
        </div>

        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1715] dark:text-[#F5F2EB] tracking-tight">
          Who are we curating for today?
        </h2>

        <p className="text-xs sm:text-sm text-[#635A52] dark:text-[#A89F95] max-w-md mx-auto leading-relaxed">
          Choose whether you are enjoying a private meal or tailoring harmony across a group table.
        </p>
      </div>

      {/* Side-by-Side Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left max-w-3xl mx-auto">
        {/* Option 1: 👤 Personal Dining (For Myself) */}
        <div
          onClick={handleSelectPersonal}
          className={`group relative p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between overflow-hidden border cursor-pointer ${
            selectedMode === 'personal'
              ? 'bg-gradient-to-br from-emerald-500/10 via-gold-500/5 to-white/90 dark:from-emerald-950/30 dark:via-stone-900/90 dark:to-[#1B1917] border-gold-500 ring-2 ring-gold-400/50 shadow-luxe-light dark:shadow-luxe-dark scale-[1.01]'
              : 'bg-white/80 dark:bg-[#1B1917]/80 hover:bg-white dark:hover:bg-[#201D1A] border-stone-200/90 dark:border-stone-800 hover:border-gold-400/50 hover:shadow-md'
          }`}
        >
          <div className="space-y-4 relative z-10 w-full">
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  selectedMode === 'personal'
                    ? 'bg-gradient-to-tr from-emerald-600 to-[#B89565] text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 group-hover:scale-105'
                }`}
              >
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>

              {selectedMode === 'personal' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500 text-[#1A1715] text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-in fade-in">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                  Solo & Direct
                </span>
              )}
            </div>

            <div>
              <span className="text-xl sm:text-2xl font-serif-display font-bold text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-2">
                👤 Personal Dining
              </span>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1 font-medium">
                Bypasses group setup and applies your saved dietary preferences and price history.
              </p>
            </div>

            {/* User Profile Context Hint */}
            <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Active Profile: {user?.full_name || 'Desi Gourmet'}</span>
              </div>
              <p className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
                Applies your saved Veg/Non-veg restrictions, spice threshold, and previous dining ratings.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-[#1A1715] dark:text-[#F5F2EB] w-full">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Instant 1-Click Setup
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPersonal();
              }}
              className="inline-flex items-center gap-1 text-gold-700 dark:text-gold-300 group-hover:translate-x-0.5 transition-transform"
            >
              Curate For Myself <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Option 2: 👥 Custom Dining (For Others/Group) */}
        <div
          onClick={handleSelectCustom}
          className={`group relative p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between overflow-hidden border cursor-pointer ${
            selectedMode === 'custom'
              ? 'bg-gradient-to-br from-gold-500/10 via-amber-500/5 to-white/90 dark:from-stone-900/90 dark:via-stone-900/90 dark:to-[#1B1917] border-gold-500 ring-2 ring-gold-400/50 shadow-luxe-light dark:shadow-luxe-dark scale-[1.01]'
              : 'bg-white/80 dark:bg-[#1B1917]/80 hover:bg-white dark:hover:bg-[#201D1A] border-stone-200/90 dark:border-stone-800 hover:border-gold-400/50 hover:shadow-md'
          }`}
        >
          <div className="space-y-4 relative z-10 w-full">
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  selectedMode === 'custom'
                    ? 'bg-gradient-to-tr from-[#D4AF37] to-[#87653A] text-[#1A1715] shadow-sm shadow-gold-500/20'
                    : 'bg-gold-500/10 text-gold-700 dark:text-gold-300 border border-gold-500/20 group-hover:scale-105'
                }`}
              >
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>

              {selectedMode === 'custom' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500 text-[#1A1715] text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-in fade-in">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                  Multi-Diner
                </span>
              )}
            </div>

            <div>
              <span className="text-xl sm:text-2xl font-serif-display font-bold text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-2">
                👥 Custom Dining
              </span>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1 font-medium">
                Opens an inline builder to add guests (e.g., "Dad - Veg", "Friend - Spicy") for group harmony.
              </p>
            </div>

            {/* Current Guest Stack Preview */}
            <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-gold-500 shrink-0" />
                  Table Setup ({guests.length} Guests)
                </span>
                <span className="text-[11px] font-bold text-gold-700 dark:text-gold-400">
                  ~{formatINR(totalCustomBudget)} Table Budget
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {guests.slice(0, 4).map((g) => (
                  <span
                    key={g.id}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-300"
                  >
                    {g.name} ({g.dietary})
                  </span>
                ))}
                {guests.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-500 font-bold">
                    +{guests.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-[#1A1715] dark:text-[#F5F2EB] w-full">
            <span className="text-[11px] text-gold-700 dark:text-gold-400 font-semibold">
              {showCustomBuilder ? 'Editing Guests Below ↓' : 'Configure Guests'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCustom();
              }}
              className="inline-flex items-center gap-1 text-gold-700 dark:text-gold-300 group-hover:translate-x-0.5 transition-transform"
            >
              {showCustomBuilder ? 'Review Below' : 'Open Guest Builder'} ↓
            </button>
          </div>
        </div>
      </div>

      {/* Elegant Inline Builder (Rendered when Custom Dining is Selected) */}
      {selectedMode === 'custom' && showCustomBuilder && (
        <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#1B1917]/95 border border-gold-400/40 shadow-luxe-light dark:shadow-luxe-dark space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800">
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                Customize Guests & Taste Profiles
              </h3>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-0.5">
                Set individual dietary boundaries, spice tolerances, and spending caps for collective table curation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => addGuest()}
              className="px-3.5 py-1.5 rounded-xl bg-gold-400/20 text-gold-800 dark:text-gold-300 border border-gold-400/40 text-xs font-bold hover:bg-gold-400/30 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Person
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Quick Preset Feasts:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {savedPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-gold-400 hover:bg-gold-500/10 flex items-center gap-1.5"
                >
                  <span>👥 {preset.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-500">
                    {preset.guests.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {guests.map((guest, idx) => (
              <div
                key={guest.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3 relative group"
              >
                {/* Guest Name & Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-gold-400/20 text-gold-800 dark:text-gold-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={guest.name}
                      onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
                      className="font-bold text-xs sm:text-sm text-[#1A1715] dark:text-[#F5F2EB] bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-gold-500 focus:outline-none w-full"
                      placeholder="e.g. Dad, Priya, Friend"
                    />
                  </div>

                  {guests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuest(guest.id)}
                      className="text-stone-400 hover:text-rose-500 p-1 transition-colors shrink-0"
                      title="Remove Person"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Name Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[10px] text-stone-400 font-medium shrink-0">Quick:</span>
                  {QUICK_GUEST_PRESETS.map((pName) => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => updateGuest(guest.id, { name: pName })}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-gold-400 transition-colors shrink-0"
                    >
                      {pName}
                    </button>
                  ))}
                </div>

                {/* Dietary Restriction Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Dietary Rule
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                    {DIETARY_TAGS.map((tag) => {
                      const isSel = guest.dietary === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => updateGuest(guest.id, { dietary: tag.id })}
                          className={`p-1 rounded-xl text-center border text-[10px] flex flex-col items-center justify-center transition-all ${
                            isSel
                              ? `${tag.badge} font-bold ring-1 ring-gold-500/50 scale-[1.02]`
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <span className="text-xs">{tag.icon}</span>
                          <span className="leading-tight truncate w-full">{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Spice & Budget Row */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Spice Level
                    </span>
                    <div className="grid grid-cols-3 gap-0.5">
                      {SPICE_TAGS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateGuest(guest.id, { spice_level: s.id })}
                          className={`p-1 rounded-lg border text-center text-[9px] font-semibold transition-all ${
                            guest.spice_level === s.id
                              ? 'border-gold-500 bg-gold-400/20 text-gold-800 dark:text-gold-300 font-bold'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-500'
                          }`}
                        >
                          <span className="block text-[10px]">{s.flames}</span>
                          <span className="capitalize">{s.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Budget Cap (₹)
                    </span>
                    <input
                      type="number"
                      min="100"
                      max="3000"
                      step="50"
                      value={guest.max_budget || ''}
                      onChange={(e) =>
                        updateGuest(guest.id, {
                          max_budget: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 450"
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Table and Proceed CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200/80 dark:border-stone-800">
            <div className="text-left">
              <span className="text-xs font-bold text-[#1A1715] dark:text-[#F5F2EB] block">
                Total Table Size: {guests.length} Diners
              </span>
              <span className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
                Estimated Combined Table Budget: {formatINR(totalCustomBudget)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmCustom}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89565] text-[#1A1715] text-xs font-bold shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm Guests & Proceed to Menu Capture</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
