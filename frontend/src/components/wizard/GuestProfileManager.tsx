import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  BookmarkPlus,
  X,
} from 'lucide-react';
import { useDiningMode } from '../../context/DiningModeContext';
import type { GuestDietary, GuestSpice } from '../../types';
import { formatINR } from '../../utils/formatCurrency';


const DIETARY_OPTIONS: { id: GuestDietary; label: string; icon: string; color: string; badgeBg: string }[] = [
  { id: 'veg', label: 'Pure Veg', icon: '🟢', color: 'text-emerald-700 dark:text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'non-veg', label: 'Non-Veg', icon: '🔴', color: 'text-rose-700 dark:text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/30' },
  { id: 'egg', label: 'Eggetarian', icon: '🟡', color: 'text-amber-700 dark:text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'jain', label: 'Jain', icon: '⚪', color: 'text-purple-700 dark:text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', color: 'text-sky-700 dark:text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/30' },
];

const SPICE_OPTIONS: { id: GuestSpice; label: string; flames: number }[] = [
  { id: 'mild', label: 'Mild / No Spice', flames: 1 },
  { id: 'medium', label: 'Medium', flames: 2 },
  { id: 'spicy', label: 'Spicy', flames: 3 },
];

const QUICK_GUEST_NAMES = ['Dad', 'Mom', 'Friend', 'Kid', 'Partner', 'Colleague', 'Aunt', 'Uncle'];

export const GuestProfileManager: React.FC = () => {
  const {
    guests,
    addGuest,
    updateGuest,
    removeGuest,
    savedPresets,
    loadPreset,
    saveCurrentAsPreset,
  } = useDiningMode();

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    saveCurrentAsPreset(newPresetName.trim(), `${guests.length} members · Custom Group`);
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const handleApplyPreset = (presetId: string) => {
    setActivePresetId(presetId);
    loadPreset(presetId);
  };

  return (
    <div className="space-y-4">
      {/* Top Presets Bar */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1B1917]/70 border border-stone-200/80 dark:border-stone-800 shadow-sm backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-gold-600 dark:text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB]">
              Saved Group Presets
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            className="text-xs font-semibold text-gold-700 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            {isSavingPreset ? 'Cancel' : '+ Save Current Table as Preset'}
          </button>
        </div>

        {/* Save Preset Inline Form */}
        {isSavingPreset && (
          <div className="flex items-center gap-2 pt-2 animate-in fade-in">
            <input
              type="text"
              placeholder="e.g. Sunday Family Brunch, Goa Trip Gang"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSavePresetSubmit(e);
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSavePresetSubmit}
              disabled={!newPresetName.trim()}
              className="px-3 py-1.5 rounded-xl bg-gold-500 text-[#1A1715] text-xs font-bold disabled:opacity-50 hover:bg-gold-400 transition-colors"
            >
              Save Preset
            </button>
          </div>
        )}

        {/* Preset Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {savedPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-gold-500 bg-gold-400/15 text-gold-800 dark:text-gold-300 shadow-sm ring-1 ring-gold-500/30 font-bold'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-gold-400/50'
                }`}
              >
                <span>👥 {preset.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {preset.guests.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-display text-lg font-bold text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" />
            Who is dining today? ({guests.length})
          </h3>
          <p className="text-xs text-[#635A52] dark:text-[#A89F95]">
            Set individual dietary rules, spice thresholds, and INR spending caps per person.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addGuest()}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89565] text-[#1A1715] text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Person
        </button>
      </div>

      {/* Guest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {guests.map((guest, index) => {
          return (
            <div
              key={guest.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#1B1917] border border-stone-200/90 dark:border-stone-800/90 shadow-sm relative group hover:border-gold-400/50 transition-all duration-200 space-y-3"
            >
              {/* Header: Name and Delete button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gold-400/20 text-gold-800 dark:text-gold-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
                    className="font-bold text-sm text-[#1A1715] dark:text-[#F5F2EB] bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-gold-500 focus:outline-none w-full"
                    placeholder="Guest Name / Role"
                  />
                </div>

                {guests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuest(guest.id)}
                    aria-label={`Remove ${guest.name}`}
                    className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition-colors shrink-0"
                    title="Remove Person"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Name Suggestions */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[10px] text-stone-400 font-medium shrink-0">Quick:</span>
                {QUICK_GUEST_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => updateGuest(guest.id, { name })}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-gold-400/20 hover:text-gold-700 transition-colors shrink-0"
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Dietary Filter Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Dietary Rule
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {DIETARY_OPTIONS.map((diet) => {
                    const isSelected = guest.dietary === diet.id;
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => updateGuest(guest.id, { dietary: diet.id })}
                        className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? `${diet.badgeBg} ring-1 ring-gold-500/50 font-bold scale-[1.02] shadow-sm`
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-xs">{diet.icon}</span>
                        <span className={`text-[10px] leading-tight ${isSelected ? diet.color : ''}`}>
                          {diet.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spice Tolerance & Individual Budget Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Spice Tolerance */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Spice Level
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {SPICE_OPTIONS.map((spice) => {
                      const isSelected = guest.spice_level === spice.id;
                      return (
                        <button
                          key={spice.id}
                          type="button"
                          onClick={() => updateGuest(guest.id, { spice_level: spice.id })}
                          className={`p-1.5 rounded-lg border text-center text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'border-gold-500 bg-gold-400/15 text-gold-800 dark:text-gold-300 ring-1 ring-gold-500/40 font-bold'
                              : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <div className="flex justify-center text-xs">
                            {'🌶️'.repeat(spice.flames)}
                          </div>
                          <span className="capitalize">{spice.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Budget Cap (Optional) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Budget Cap (₹)
                    </label>
                    <span className="text-[11px] font-bold text-gold-700 dark:text-gold-300 tabular-nums">
                      {guest.max_budget ? formatINR(guest.max_budget) : 'No Cap'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                    {guest.max_budget && (
                      <button
                        type="button"
                        onClick={() => updateGuest(guest.id, { max_budget: undefined })}
                        className="text-stone-400 hover:text-stone-600 text-xs px-1"
                        title="Remove cap"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
