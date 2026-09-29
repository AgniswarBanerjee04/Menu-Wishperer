import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DiningModeSwitcher } from '../common/DiningModeSwitcher';
import { GuestProfileManager } from './GuestProfileManager';
import { useDiningMode } from '../../context/DiningModeContext';
import { formatINR } from '../../utils/formatCurrency';
import type { GuestProfile } from '../../types';

interface Step2MoodBudgetProps {
  initialMood?: string;
  initialBudget?: number;
  initialHunger?: string;
  onGetRecommendations: (context: {
    mood: string;
    budget: number;
    hunger_level: string;
    mode: 'personal' | 'custom';
    guests?: GuestProfile[];
  }) => void;
  onBack: () => void;
  isLoading: boolean;
}


const MOODS = [
  {
    id: 'comfort_food',
    label: 'Desi Comfort',
    desc: 'Rich Dal Makhani, warm garlic naan, silky makhani gravy, fragrant noodles',
    icon: '🍲',
  },
  {
    id: 'light',
    label: 'Light & Fresh',
    desc: 'Tandoori skewers, clear shorba, fresh salads, steamed dim sum',
    icon: '🥗',
  },
  {
    id: 'adventurous',
    label: 'Bold & Spicy',
    desc: 'Schezwan delicacies, Brown Garlic flavors, Kolhapuri & Chettinad spices',
    icon: '🌶️',
  },
  {
    id: 'healthy',
    label: 'Clean & Sattvic',
    desc: 'Tandoori roasted veggies/paneer, yellow dal tadka, whole wheat roti',
    icon: '🥑',
  },
  {
    id: 'celebrating',
    label: 'Royal Celebration',
    desc: 'Dum Pukht Awadhi biryani, artisanal sizzlers, saffron korma, chef specials',
    icon: '👑',
  },
];

const HUNGER_LEVELS = [
  { id: 'snack', label: 'Chaat & Bites', desc: 'Just a light nibble', icon: '🥟' },
  { id: 'moderate', label: 'Proper Thali', desc: 'Full satisfying meal', icon: '🍽️' },
  { id: 'starving', label: 'Bhookh Lagi Hai!', desc: 'Starving, bring on the feast', icon: '🦁' },
];

export const Step2MoodBudget: React.FC<Step2MoodBudgetProps> = ({
  initialMood = 'comfort_food',
  initialBudget = 500,
  initialHunger = 'moderate',
  onGetRecommendations,
  onBack,
  isLoading,
}) => {
  const { activeMode, guests } = useDiningMode();


  const [mood, setMood] = useState<string>(initialMood);
  const [budget, setBudget] = useState<number>(() => {
    if (activeMode === 'custom') {
      const sum = guests.reduce((acc, g) => acc + (g.max_budget || 400), 0);
      return Math.max(800, sum);
    }
    return initialBudget;
  });
  const [hungerLevel, setHungerLevel] = useState<string>(initialHunger);

  // Sync budget when switching modes or when guests change in custom mode
  useEffect(() => {
    if (activeMode === 'custom') {
      const sum = guests.reduce((acc, g) => acc + (g.max_budget || 400), 0);
      setBudget((prev) => (prev <= 500 ? Math.max(800, sum) : prev));
    } else {
      setBudget((prev) => (prev > 2500 ? 500 : prev));
    }
  }, [activeMode, guests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGetRecommendations({
      mood,
      budget,
      hunger_level: hungerLevel,
      mode: activeMode,
      guests: activeMode === 'custom' ? guests : undefined,
    });
  };

  const isCustom = activeMode === 'custom';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Segmented Mode Switcher */}
      <div className="flex flex-col items-center gap-2">
        <DiningModeSwitcher size="lg" showDescriptions className="w-full max-w-lg" />
        <p className="text-xs text-[#635A52] dark:text-[#A89F95] text-center">
          {isCustom
            ? '👥 Custom Group Dining: Matches individual diets per person + curates Table Share feast'
            : '👤 Personal Dining: Tailored strictly to your profile, saved taste history & past favorites'}
        </p>
      </div>

      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-700 dark:text-gold-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 fill-current text-gold-500" />
          {isCustom ? 'Step 2: Table Setup & Group Vibe' : 'Step 2: Set Vibe & Budget'}
        </div>
        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1715] dark:text-[#F5F2EB] tracking-tight">
          {isCustom ? 'Who is dining & what is the vibe?' : 'How are you feeling today?'}
        </h2>
        <p className="text-sm text-[#635A52] dark:text-[#A89F95] mt-1">
          {isCustom
            ? `Catering to ${guests.length} members with individual dietary restrictions & shared feast dishes.`
            : 'Menu Whisperer matches your craving, spice tolerance, and INR ceiling with the top picks on this menu.'}
        </p>
      </div>

      {/* In Custom Mode: Render Guest Profile Manager */}
      {isCustom && <GuestProfileManager />}

      {/* Mood Selector Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB]">
          {isCustom ? 'Group Dining Vibe' : "Today's Dining Vibe"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MOODS.map(m => {
            const isSelected = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 card-hover-lift flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-gold-500 bg-gold-400/10 dark:bg-gold-400/15 ring-2 ring-gold-400/30 shadow-md'
                    : 'border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1B1917] hover:border-gold-400/50 shadow-luxe-light dark:shadow-luxe-dark'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#1A1715] dark:text-[#F5F2EB] flex items-center justify-between">
                    <span>{m.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-gold-600 dark:text-gold-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-0.5 leading-relaxed">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hunger Level Pill Grid */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB]">
          {isCustom ? 'Table Appetite & Feast Size' : 'Appetite & Hunger Level'}
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {HUNGER_LEVELS.map(h => {
            const isSelected = hungerLevel === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setHungerLevel(h.id)}
                className={`p-3.5 rounded-xl border text-center transition-all duration-200 card-hover-lift ${
                  isSelected
                    ? 'border-gold-500 bg-gold-400/10 dark:bg-gold-400/15 font-bold text-gold-800 dark:text-gold-300 ring-2 ring-gold-400/30 shadow-sm'
                    : 'border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1B1917] text-[#635A52] dark:text-[#A89F95] hover:border-gold-400/40 shadow-luxe-light dark:shadow-luxe-dark'
                }`}
              >
                <div className="text-xl mb-1">{h.icon}</div>
                <div className="text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB]">{h.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Slider in INR */}
      <Card variant="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold text-xs">
              ₹
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1715] dark:text-[#F5F2EB]">
              {isCustom
                ? `Total Table Budget Target (${guests.length} Diners)`
                : 'Meal Budget Target (per dish)'}
            </span>
          </div>
          <span className="font-serif-display text-2xl font-bold text-gold-700 dark:text-gold-300 tabular-nums">
            {formatINR(budget)}
          </span>
        </div>
        <input
          type="range"
          min={isCustom ? 400 : 100}
          max={isCustom ? 8000 : 2500}
          step={isCustom ? 100 : 50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
        />
        <div className="flex justify-between text-[11px] text-[#635A52] dark:text-[#A89F95] font-medium">
          {isCustom ? (
            <>
              <span>₹400 (Light Nibbles)</span>
              <span>₹1,500 (Table Curries & Breads)</span>
              <span>₹8,000+ (Grand Banquet)</span>
            </>
          ) : (
            <>
              <span>₹100 (Street / Chaat)</span>
              <span>₹500 (Dawat / Curries)</span>
              <span>₹2,500+ (Royal Feast)</span>
            </>
          )}
        </div>
      </Card>

      {/* Action Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200/80 dark:border-stone-800">
        <Button variant="outline" type="button" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Edit Dishes
        </Button>

        <Button
          size="lg"
          type="submit"
          variant="primary"
          isLoading={isLoading}
          icon={<Sparkles className="w-4 h-4" />}
        >
          {isLoading
            ? 'Whispering with Gemini AI...'
            : isCustom
            ? `Whisper Group Feast (${guests.length} Diners)`
            : 'Whisper My Picks (₹)'}
        </Button>
      </div>
    </form>
  );
};

