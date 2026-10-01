import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Utensils,
  Award,
  Wine,
  Plus,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  Receipt,
  Coffee,
} from 'lucide-react';

import type {
  DishRecommendation,
  ExtractedDish,
  GuestProfile,
  GroupBillEstimate,
  VenueType,
} from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DietaryBadge } from '../common/DietaryBadge';
import { DiningModeSwitcher } from '../common/DiningModeSwitcher';
import { formatINR } from '../../utils/formatCurrency';

interface Step3RecommendationsProps {
  restaurantName: string;
  mood: string;
  recommendations: DishRecommendation[];
  disclaimer: string;
  budget?: number;
  allDishes?: ExtractedDish[];
  mode?: 'personal' | 'custom';
  venueType?: VenueType;
  guests?: GuestProfile[];
  guestRecommendations?: Record<string, DishRecommendation[]>;
  tableShareRecommendations?: DishRecommendation[];
  groupBillEstimate?: GroupBillEstimate;
  onOrderDish: (dish: DishRecommendation) => void;
  onStartOver: () => void;
  onSwitchMode?: (newMode: 'personal' | 'custom') => void;
  isSwitchingMode?: boolean;
}

export const Step3Recommendations: React.FC<Step3RecommendationsProps> = ({
  restaurantName,
  mood,
  recommendations,
  disclaimer,
  budget = 500,
  allDishes = [],
  mode = 'personal',
  venueType = 'restaurant',
  guests = [],
  guestRecommendations = {},
  tableShareRecommendations = [],
  groupBillEstimate,
  onOrderDish,
  onStartOver,
  onSwitchMode,
  isSwitchingMode = false,
}) => {
  // Active budget filter slider / selection (Personal Mode)
  const [selectedBudgetMax, setSelectedBudgetMax] = useState<number>(budget);
  // Active dietary filter tab (Personal Mode)
  const [activeTab, setActiveTab] = useState<'all' | 'veg' | 'non-veg' | 'egg'>('all');
  // Interactive Live Meal Tray / Spend Tally
  const [selectedDishNames, setSelectedDishNames] = useState<string[]>([]);
  // In Group Mode: active selected guest tab filter ('all' or guest.id)
  const [activeGuestTab, setActiveGuestTab] = useState<string>('all');

  const isCustomMode = mode === 'custom';

  // 1. Signature Sommelier Pairing Calculation (Personal Mode)
  const pairing = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return null;

    const starDish = recommendations[0];
    const starName = starDish.dish_name.toLowerCase();

    const breadRiceRegex = /roti|naan|kulcha|paratha|rice|biryani|pulao|jeera|pav|bhature|roomali|bread/i;
    const beverageSideRegex = /lassi|chaas|buttermilk|shake|soup|tikka|kebab|drink|soda|sherbet|gulab jamun|kulfi|dessert|ice cream|papad|raita/i;

    let accompaniment: ExtractedDish | DishRecommendation | null = null;
    let beverageOrSide: ExtractedDish | DishRecommendation | null = null;

    for (const d of allDishes) {
      if (!d.name || d.name.toLowerCase() === starName) continue;
      if (!accompaniment && breadRiceRegex.test(d.name)) {
        accompaniment = d;
      } else if (!beverageOrSide && beverageSideRegex.test(d.name)) {
        beverageOrSide = d;
      }
      if (accompaniment && beverageOrSide) break;
    }

    if (!accompaniment && recommendations.length > 1) {
      accompaniment = recommendations[1];
    }
    if (!beverageOrSide && recommendations.length > 2) {
      beverageOrSide = recommendations[2];
    }

    const price1 = starDish.price || 0;
    const price2 = accompaniment?.price || 0;
    const price3 = beverageOrSide?.price || 0;
    const totalPrice = price1 + price2 + price3;

    return {
      starDish,
      accompaniment,
      beverageOrSide,
      totalPrice,
      isUnderBudget: totalPrice <= selectedBudgetMax,
    };
  }, [recommendations, allDishes, selectedBudgetMax]);

  // 2. Filter recommendations by tab and budget (Personal Mode)
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((dish) => {
      if (activeTab === 'veg' && dish.dietary !== 'veg') return false;
      if (activeTab === 'non-veg' && dish.dietary !== 'non-veg') return false;
      if (activeTab === 'egg' && dish.dietary !== 'egg') return false;
      if (dish.price && dish.price > selectedBudgetMax) return false;
      return true;
    });
  }, [recommendations, activeTab, selectedBudgetMax]);

  // 3. Spend Tally Calculation (Shared across modes)
  const tally = useMemo(() => {
    const allAvailable = [
      ...recommendations,
      ...(tableShareRecommendations || []),
      ...Object.values(guestRecommendations || {}).flat(),
    ];
    // Remove duplicates
    const uniqueMap = new Map<string, DishRecommendation>();
    allAvailable.forEach(d => uniqueMap.set(d.dish_name, d));

    const selectedDishes = Array.from(uniqueMap.values()).filter((r) =>
      selectedDishNames.includes(r.dish_name)
    );
    const totalSpend = selectedDishes.reduce(
      (sum, d) => sum + (d.price || 0),
      0
    );
    const count = selectedDishes.length;
    const targetBudget = isCustomMode && groupBillEstimate ? groupBillEstimate.total_budget : selectedBudgetMax;
    const remaining = Math.max(0, targetBudget - totalSpend);
    const percent = targetBudget > 0 ? Math.min(100, Math.round((totalSpend / targetBudget) * 100)) : 0;
    return {
      items: selectedDishes,
      totalSpend,
      count,
      remaining,
      percent,
      isExceeded: totalSpend > targetBudget,
      targetBudget,
    };
  }, [recommendations, tableShareRecommendations, guestRecommendations, selectedDishNames, selectedBudgetMax, isCustomMode, groupBillEstimate]);

  const toggleDishSelection = (dishName: string) => {
    setSelectedDishNames((prev) =>
      prev.includes(dishName)
        ? prev.filter((name) => name !== dishName)
        : [...prev, dishName]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Mode Switcher Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200/90 dark:border-[#242938] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-[#E6C387] block">
            Dining Mode Architecture
          </span>
          <h3 className="font-bold text-sm text-[#1A1715] dark:text-[#F4F4F5]">
            {isCustomMode
              ? `Group Dining (${guests.length} Guests Configured)`
              : 'Personal Dining (Solo Gourmet)'}
          </h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Switch modes instantly below to re-filter dishes without re-uploading the menu!
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <DiningModeSwitcher
            size="sm"
            onChange={(newMode) => {
              if (onSwitchMode && newMode !== mode) {
                onSwitchMode(newMode);
              }
            }}
          />
        </div>
      </div>

      {/* Switching Mode Loader Banner */}
      {isSwitchingMode && (
        <div className="p-4 rounded-2xl bg-gold-400/15 border border-gold-400/40 text-[#1A1715] dark:text-[#F4F4F5] flex items-center justify-center gap-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-gold-500 animate-spin" />
          <span className="text-xs font-bold">
            Whispering with Gemini AI to re-filter recommendations for your updated dining mode...
          </span>
        </div>
      )}

      {/* Luxury Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-[#E6C387]/30 text-amber-700 dark:text-[#E6C387] text-xs font-semibold">
          {venueType === 'cafe' ? (
            <>
              <Coffee className="w-3.5 h-3.5 text-amber-500" /> Artisanal Café Concierge
            </>
          ) : isCustomMode ? (
            <>
              <Users className="w-3.5 h-3.5 text-gold-500" /> Multi-Guest Feast & Table Share
            </>
          ) : (
            <>
              <Wine className="w-3.5 h-3.5 text-gold-500" /> The Sommelier Experience
            </>
          )}
        </div>
        <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1715] dark:text-[#F4F4F5] tracking-wide">
          {isCustomMode ? 'Grand Table Feast & Member Picks' : 'Curated Epicurean Selections'}
        </h2>
        <p className="text-xs sm:text-sm text-[#635A52] dark:text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
          {isCustomMode ? (
            <>
              Curated for <span className="font-bold text-[#1A1715] dark:text-[#F4F4F5]">{guests.length} diners</span> based on individual dietary rules, spice caps & table sharing at{' '}
              <span className="font-semibold text-[#1A1715] dark:text-[#F4F4F5]">{restaurantName || 'the establishment'}</span>.
            </>
          ) : (
            <>
              Bespoke culinary pairings designed for your <span className="font-semibold text-amber-700 dark:text-[#E6C387] capitalize">{mood.replace('_', ' ')}</span> vibe at{' '}
              <span className="font-semibold text-[#1A1715] dark:text-[#F4F4F5]">{restaurantName || 'the establishment'}</span>.
            </>
          )}
        </p>
      </div>

      {/* Prominent Allergy Legal Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131620] border border-[#E8E2D8] dark:border-[#242938] shadow-sm flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-[#E6C387]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-[#E6C387]">
            Heritage Kitchen, Ghee & Allergen Advisory
          </p>
          <p className="mt-0.5 text-xs text-[#635A52] dark:text-[#A1A1AA] leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GROUP MODE EXPERIENCE                                                     */}
      {/* ========================================================================= */}
      {isCustomMode && (
        <div className="space-y-8">
          {/* SECTION 1: CONSOLIDATED GROUP BILL ESTIMATE CARD */}
          {groupBillEstimate && (
            <Card
              variant="default"
              className="p-5 sm:p-6 bg-gradient-to-br from-white via-white to-gold-400/5 dark:from-[#131620] dark:via-[#131620] dark:to-[#E6C387]/5 border border-[#E6C387]/40 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center text-gold-700 dark:text-gold-300">
                    <Receipt className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-[#E6C387] block">
                      Financial Telemetry
                    </span>
                    <h3 className="font-serif-display text-lg font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                      Consolidated Group Bill Estimate
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Feast Cost</span>
                    <span className="font-serif-display text-2xl font-bold text-amber-700 dark:text-[#E6C387] tabular-nums">
                      {formatINR(groupBillEstimate.total_cost)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-800" />
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Per-Person Avg</span>
                    <span className="font-serif-display text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5] tabular-nums">
                      {formatINR(groupBillEstimate.per_person_average)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200/80 dark:border-[#242938]">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={groupBillEstimate.is_within_budget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {groupBillEstimate.is_within_budget
                      ? `✓ Within Total Group Budget (${formatINR(groupBillEstimate.total_budget)})`
                      : `⚠ Exceeds Group Budget Target (${formatINR(groupBillEstimate.total_budget)})`}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 tabular-nums">
                    {Math.round((groupBillEstimate.total_cost / Math.max(1, groupBillEstimate.total_budget)) * 100)}% of allocation
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      groupBillEstimate.is_within_budget
                        ? 'bg-gradient-to-r from-emerald-500 to-gold-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((groupBillEstimate.total_cost / Math.max(1, groupBillEstimate.total_budget)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Per-Person Cost Breakdown Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Per-Person Allocation Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {groupBillEstimate.breakdown.map((item) => (
                    <div
                      key={item.guest_id}
                      className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-[#242938] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                        <span>{item.guest_name}</span>
                        <span className="text-amber-700 dark:text-[#E6C387] tabular-nums">
                          {formatINR(item.allocated_cost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Cap: {item.budget_cap ? formatINR(item.budget_cap) : 'None'}</span>
                        <span className={item.is_within_budget ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
                          {item.is_within_budget ? '✓ Within Cap' : '⚠ Over Cap'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate pt-0.5">
                        {item.recommended_dishes.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: TABLE SHARE & CENTERPIECE FEAST */}
          {tableShareRecommendations && tableShareRecommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                    🍲 Table Share & Centerpiece Feast
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gold-500/10 text-amber-700 dark:text-[#E6C387] border border-[#E6C387]/30">
                  Shared by all {guests.length} diners
                </span>
              </div>
              <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] -mt-2">
                Large gravies, bread baskets & biryanis that satisfy common dietary rules & accessible spice across the table.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableShareRecommendations.map((shareDish, idx) => {
                  const isSelectedInTally = selectedDishNames.includes(shareDish.dish_name);
                  return (
                    <Card
                      key={`share_${idx}`}
                      variant="default"
                      className="p-5 bg-white dark:bg-[#131620] border border-[#E6C387]/30 hover:border-gold-500 shadow-sm relative space-y-3 card-hover-lift"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-[#E6C387]">
                              Centerpiece {idx + 1}
                            </span>
                            <DietaryBadge dietary={shareDish.dietary} size="sm" />
                          </div>
                          <h4 className="font-serif-display text-base font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                            {shareDish.dish_name}
                          </h4>
                        </div>
                        {shareDish.price && (
                          <span className="tabular-nums font-heritage text-base font-bold text-amber-700 dark:text-[#E6C387] shrink-0">
                            {formatINR(shareDish.price)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] leading-relaxed">
                        {shareDish.description || shareDish.reasoning}
                      </p>

                      <div className="p-2.5 rounded-xl bg-gold-400/10 border border-gold-400/20 text-xs text-stone-700 dark:text-stone-300 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gold-800 dark:text-gold-300">
                          {shareDish.reasoning}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                          {shareDish.match_score}% Match
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100 dark:border-[#242938]">
                        <button
                          type="button"
                          onClick={() => toggleDishSelection(shareDish.dish_name)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                            isSelectedInTally
                              ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300'
                              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-[#242938] text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {isSelectedInTally ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-gold-600" />
                              <span>In Feast Tray</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Tray</span>
                            </>
                          )}
                        </button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onOrderDish(shareDish)}
                          icon={<Utensils className="w-3.5 h-3.5" />}
                        >
                          Order for Table
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: CURATED MATCHES FOR EACH DINER */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                  Curated for Each Diner ({guests.length})
                </h3>
              </div>

              {/* Guest Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveGuestTab('all')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border shrink-0 ${
                    activeGuestTab === 'all'
                      ? 'bg-gold-500 text-[#1A1715] border-gold-500 shadow-sm'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-[#242938] text-stone-600 dark:text-stone-400'
                  }`}
                >
                  All Members
                </button>
                {guests.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGuestTab(g.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border shrink-0 flex items-center gap-1 ${
                      activeGuestTab === g.id
                        ? 'bg-gold-500 text-[#1A1715] border-gold-500 shadow-sm font-bold'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-[#242938] text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <span>{g.name}</span>
                    <span className="text-[10px]">
                      {g.dietary === 'veg' ? '🟢' : g.dietary === 'non-veg' ? '🔴' : g.dietary === 'jain' ? '⚪' : '🟡'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Render Member Recommendations */}
            <div className="space-y-6">
              {guests
                .filter((g) => activeGuestTab === 'all' || activeGuestTab === g.id)
                .map((guest) => {
                  const memberPicks = guestRecommendations[guest.id] || [];
                  return (
                    <div
                      key={guest.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200/90 dark:border-[#242938]/90 shadow-sm space-y-4"
                    >
                      {/* Diner Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#242938]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#E6C387] text-[#090A0F] font-bold text-xs flex items-center justify-center">
                            {guest.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[#1A1715] dark:text-[#F4F4F5]">
                                For {guest.name}
                              </h4>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 capitalize">
                                {guest.dietary} · {guest.spice_level} spice
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400">
                              {guest.max_budget ? `Budget Cap: ${formatINR(guest.max_budget)}` : 'Flexible budget'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-amber-700 dark:text-[#E6C387] font-semibold">
                          {memberPicks.length} Individual {memberPicks.length === 1 ? 'Match' : 'Matches'}
                        </span>
                      </div>

                      {/* Member Dish Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {memberPicks.map((pick, pIdx) => {
                          const isSelectedInTally = selectedDishNames.includes(pick.dish_name);
                          return (
                            <div
                              key={`${guest.id}_${pIdx}`}
                              className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#0E111A] border border-stone-200/70 dark:border-[#242938]/80 space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <DietaryBadge dietary={pick.dietary} size="sm" />
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {pick.match_score}% Match
                                    </span>
                                  </div>
                                  <h5 className="font-serif-display font-bold text-sm text-[#1A1715] dark:text-[#F4F4F5]">
                                    {pick.dish_name}
                                  </h5>
                                </div>
                                {pick.price && (
                                  <span className="tabular-nums font-heritage font-bold text-sm text-amber-700 dark:text-[#E6C387] shrink-0">
                                    {formatINR(pick.price)}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] line-clamp-2">
                                {pick.description || pick.reasoning}
                              </p>

                              <div className="p-2 rounded-lg bg-gold-400/10 text-[11px] text-stone-700 dark:text-stone-300">
                                {pick.reasoning}
                              </div>

                              {pick.warnings && (
                                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{pick.warnings}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-[#242938]/60">
                                <button
                                  type="button"
                                  onClick={() => toggleDishSelection(pick.dish_name)}
                                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                                    isSelectedInTally
                                      ? 'bg-gold-500/20 border-gold-500 text-gold-700'
                                      : 'border-stone-200 text-stone-500'
                                  }`}
                                >
                                  {isSelectedInTally ? <Check className="w-3.5 h-3.5 text-gold-600" /> : <Plus className="w-3.5 h-3.5" />}
                                </button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => onOrderDish(pick)}
                                  icon={<Utensils className="w-3 h-3" />}
                                >
                                  Order for {guest.name}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSONAL MODE EXPERIENCE                                                  */}
      {/* ========================================================================= */}
      {!isCustomMode && (
        <div className="space-y-8">
          {/* SECTION 1: THE SIGNATURE SOMMELIER PAIRING */}
          {pairing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold-500" />
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                    The Signature Pairing
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gold-500/10 text-amber-700 dark:text-[#E6C387] border border-[#E6C387]/30">
                  Balanced Complete Spread
                </span>
              </div>

              <Card
                variant="default"
                className="p-5 sm:p-6 bg-white dark:bg-[#131620] border border-[#E6C387]/40 shadow-sm relative overflow-hidden card-hover-lift"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold-500/5 to-transparent rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-[#242938]">
                  {/* Course 1: Bread / Accompaniment */}
                  <div className="space-y-2 pt-2 md:pt-0 md:pr-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-[#E6C387]">
                      01 • The Accompaniment
                    </span>
                    <h4 className="font-serif-display text-base font-bold text-[#1A1715] dark:text-[#F4F4F5] truncate">
                      {'name' in (pairing.accompaniment || {})
                        ? (pairing.accompaniment as ExtractedDish).name
                        : (pairing.accompaniment as DishRecommendation)?.dish_name || 'Artisanal Naan / Rice'}
                    </h4>
                    <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] line-clamp-2">
                      Warm tandoor-baked bread or fragrant long-grain basmati to anchor the rich gravies.
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="tabular-nums font-heritage font-bold text-sm text-[#1A1715] dark:text-[#F4F4F5]">
                        {formatINR(pairing.accompaniment?.price || 90)}
                      </span>
                      <span className="text-[10px] text-[#635A52] dark:text-[#A1A1AA]">Foundation</span>
                    </div>
                  </div>

                  {/* Course 2: Main Star Gravy */}
                  <div className="space-y-2 pt-3 md:pt-0 md:px-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-[#E6C387]">
                        02 • The Crown Jewel
                      </span>
                      <DietaryBadge dietary={pairing.starDish.dietary} size="sm" />
                    </div>
                    <h4 className="font-serif-display text-base font-bold text-[#1A1715] dark:text-[#F4F4F5] truncate">
                      {pairing.starDish.dish_name}
                    </h4>
                    <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] line-clamp-2">
                      {pairing.starDish.description || pairing.starDish.reasoning}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="tabular-nums font-heritage font-bold text-sm text-amber-700 dark:text-[#E6C387]">
                        {formatINR(pairing.starDish.price || 350)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {pairing.starDish.match_score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Course 3: Complement / Refreshment */}
                  <div className="space-y-2 pt-3 md:pt-0 md:pl-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-[#E6C387]">
                      03 • The Refreshment
                    </span>
                    <h4 className="font-serif-display text-base font-bold text-[#1A1715] dark:text-[#F4F4F5] truncate">
                      {'name' in (pairing.beverageOrSide || {})
                        ? (pairing.beverageOrSide as ExtractedDish).name
                        : (pairing.beverageOrSide as DishRecommendation)?.dish_name || 'Royal Chaas / Sweet Lassi'}
                    </h4>
                    <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] line-clamp-2">
                      A cooling churned yogurt accompaniment or starter to cleanse and reset the palate.
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="tabular-nums font-heritage font-bold text-sm text-[#1A1715] dark:text-[#F4F4F5]">
                        {formatINR(pairing.beverageOrSide?.price || 80)}
                      </span>
                      <span className="text-[10px] text-[#635A52] dark:text-[#A1A1AA]">Complement</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Pairing Summary Bar */}
                <div className="mt-5 pt-4 border-t border-stone-200 dark:border-[#242938] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FBF9F5] dark:bg-[#0E111A] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#635A52] dark:text-[#A1A1AA] tracking-wider block">
                        Combined Trio Price
                      </span>
                      <span className="tabular-nums font-heritage text-lg font-bold text-amber-700 dark:text-[#E6C387]">
                        {formatINR(pairing.totalPrice)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-stone-200 dark:bg-[#242938]" />
                    <span className={`text-xs font-semibold ${pairing.isUnderBudget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-[#E6C387]'}`}>
                      {pairing.isUnderBudget
                        ? `✓ Fits comfortably within your ₹${selectedBudgetMax} budget`
                        : `Spread for ₹${selectedBudgetMax} allocation`}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onOrderDish(pairing.starDish)}
                    className="bg-[#E6C387] hover:bg-[#D4AF37] shadow-lg shadow-[#E6C387]/10 transition-all duration-200 text-[#090A0F] font-bold border border-[#E6C387]/40 shadow-sm whitespace-nowrap"
                    icon={<Utensils className="w-3.5 h-3.5" />}
                  >
                    Order The Star Pairing
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* SECTION 2: INTERACTIVE BUDGET FILTER */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#E6C387]" />
                  <h3 className="font-serif-display text-base font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                    Under ₹{selectedBudgetMax} Interactive Ceiling
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[200, 350, 500, 800, 1500].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBudgetMax(b)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold tabular-nums border transition-all ${
                        selectedBudgetMax === b
                          ? 'bg-[#E6C387] hover:bg-[#D4AF37] shadow-lg shadow-[#E6C387]/10 transition-all duration-200 text-[#090A0F] font-bold border-[#E6C387] shadow-sm'
                          : 'bg-[#FBF9F5] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                      }`}
                    >
                      ≤₹{b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={selectedBudgetMax}
                  onChange={(e) => setSelectedBudgetMax(Number(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 dark:bg-[#242938] rounded-lg appearance-none cursor-pointer accent-[#E6C387]"
                />
                <div className="flex justify-between text-[10px] text-[#635A52] dark:text-[#A1A1AA] tabular-nums">
                  <span>₹100</span>
                  <span>Selected: ₹{selectedBudgetMax}</span>
                  <span>₹2,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: EPICUREAN HIGHLIGHTS (MAIN RECOMMENDATION LIST) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                  Epicurean Highlights ({filteredRecommendations.length})
                </h3>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#FBF9F5] dark:bg-[#0E111A] border border-[#E8E2D8] dark:border-[#242938] rounded-xl self-start sm:self-auto">
                {(
                  [
                    { id: 'all', label: 'All Curations' },
                    { id: 'veg', label: 'Pure Veg' },
                    { id: 'non-veg', label: 'Non-Veg' },
                    { id: 'egg', label: 'Eggetarian' },
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        active
                          ? 'bg-white dark:bg-[#131620] text-[#1A1715] dark:text-[#F4F4F5] font-bold shadow-sm border border-[#E8E2D8] dark:border-[#242938]'
                          : 'text-[#635A52] dark:text-[#A1A1AA] hover:text-[#1A1715] dark:hover:text-[#F4F4F5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredRecommendations.length === 0 ? (
              <Card
                variant="default"
                className="py-10 text-center space-y-2 bg-white dark:bg-[#131620] border border-[#E8E2D8] dark:border-[#242938]"
              >
                <Utensils className="w-8 h-8 text-[#635A52] dark:text-[#A1A1AA] mx-auto opacity-40" />
                <h4 className="font-serif-display font-bold text-base text-[#1A1715] dark:text-[#F4F4F5]">
                  No dishes under ₹{selectedBudgetMax} for the {activeTab} filter
                </h4>
                <p className="text-xs text-[#635A52] dark:text-[#A1A1AA]">
                  Try increasing your budget ceiling slider above or switching dietary tabs.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRecommendations.map((rec, index) => {
                  const isTopPick = index === 0;
                  const isSelectedInTally = selectedDishNames.includes(rec.dish_name);

                  return (
                    <Card
                      key={index}
                      variant="default"
                      className={`p-5 sm:p-6 bg-white dark:bg-[#131620] transition-all duration-300 card-hover-lift ${
                        isTopPick
                          ? 'border-gold-500/80 ring-1 ring-gold-500/30 shadow-luxe-light dark:shadow-luxe-dark'
                          : 'border-[#E8E2D8] dark:border-[#242938]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <DietaryBadge dietary={rec.dietary} size="sm" />
                            {rec.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF9F5] dark:bg-[#0E111A] border border-[#E8E2D8] dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] uppercase tracking-wider">
                                {rec.category}
                              </span>
                            )}
                            {isTopPick && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-[#E6C387]/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 fill-gold-500" /> Crown Recommendation
                              </span>
                            )}
                          </div>

                          <h4 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                            {rec.dish_name}
                          </h4>

                          {rec.description && (
                            <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] leading-relaxed">
                              {rec.description}
                            </p>
                          )}

                          <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/25 text-xs text-[#1A1715] dark:text-[#E8E2D8] flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-700 dark:text-[#E6C387] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gold-700 dark:text-gold-400">
                                Why this fits your craving:{' '}
                              </span>
                              <span>{rec.reasoning}</span>
                            </div>
                          </div>

                          {rec.warnings && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{rec.warnings}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D8] dark:border-[#242938]">
                          <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] uppercase font-bold text-[#635A52] dark:text-[#A1A1AA]">
                                Match
                              </div>
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {rec.match_score}%
                              </div>
                            </div>
                            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300 shadow-inner">
                              {rec.match_score}%
                            </div>
                          </div>

                          {rec.price !== undefined && rec.price !== null && (
                            <span className="tabular-nums font-heritage text-lg font-bold text-amber-700 dark:text-[#E6C387]">
                              {formatINR(rec.price)}
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleDishSelection(rec.dish_name)}
                              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                                isSelectedInTally
                                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300'
                                  : 'bg-[#FBF9F5] dark:bg-[#0E111A] border-[#E8E2D8] dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                              }`}
                              title="Add / Remove from meal tally"
                            >
                              {isSelectedInTally ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-700 dark:text-[#E6C387]" />
                                  <span className="hidden sm:inline">In Tally</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Tally</span>
                                </>
                              )}
                            </button>

                            <Button
                              size="sm"
                              className="whitespace-nowrap bg-[#E6C387] hover:bg-[#D4AF37] shadow-lg shadow-[#E6C387]/10 transition-all duration-200 text-[#1A1715] font-bold border border-gold-300/40 hover:brightness-105 shadow-sm"
                              onClick={() => onOrderDish(rec)}
                              icon={<Utensils className="w-3.5 h-3.5" />}
                            >
                              I Ordered This!
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARED MEAL TRAY TALLY BAR (Visible when dishes are selected) */}
      {tally.count > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131620] border border-[#E6C387]/40 shadow-lg shadow-gold-500/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center text-gold-700 dark:text-gold-300 shrink-0">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                  {isCustomMode ? 'Live Table Tray' : 'Your Selected Meal Tray'} ({tally.count} {tally.count === 1 ? 'item' : 'items'}):
                </span>
                <span className="tabular-nums font-heritage font-bold text-base text-amber-700 dark:text-[#E6C387]">
                  {formatINR(tally.totalSpend)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                <span>
                  {tally.isExceeded
                    ? `Exceeds target by ${formatINR(tally.totalSpend - tally.targetBudget)}`
                    : `${formatINR(tally.remaining)} remaining within budget`}
                </span>
                <span>•</span>
                <span className="tabular-nums font-semibold">{tally.percent}% utilized</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedDishNames([])}
              className="text-xs text-[#635A52] dark:text-[#A1A1AA] hover:text-[#1A1715] dark:hover:text-[#F4F4F5] underline px-2"
            >
              Clear Tray
            </button>
          </div>
        </div>
      )}

      {/* Start Over Action */}
      <div className="flex justify-center pt-6">
        <Button
          variant="outline"
          size="md"
          className="border-[#E8E2D8] dark:border-[#E6C387]/30 text-[#1A1715] dark:text-gold-400 hover:bg-gold-500/10"
          onClick={onStartOver}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Whisper for Another Menu
        </Button>
      </div>
    </div>
  );
};
