import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ArrowRight, ArrowLeft, Utensils, Sparkles, AlertTriangle, X } from 'lucide-react';
import type { ExtractedDish } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DietaryBadge } from '../common/DietaryBadge';
import { formatINR } from '../../utils/formatCurrency';

interface Step1DishEditorProps {
  restaurantName: string;
  dishes: ExtractedDish[];
  onConfirmDishes: (updatedDishes: ExtractedDish[]) => void;
  onBack: () => void;
}

const INDIAN_CATEGORIES = [
  'Main Course',
  'Starters & Tandoor',
  'Noodles & Chowmein',
  'Rice & Biryani',
  'Breads',
  'Chaat & Street Food',
  'Desserts',
  'Beverages',
  'Other',
];

export const Step1DishEditor: React.FC<Step1DishEditorProps> = ({
  restaurantName,
  dishes: initialDishes,
  onConfirmDishes,
  onBack,
}) => {
  const [dishes, setDishes] = useState<ExtractedDish[]>(initialDishes);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'veg' | 'non-veg' | 'egg'>('all');

  // "Add Missing Dish" Modal / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newCategory, setNewCategory] = useState('Main Course');
  const [newDietary, setNewDietary] = useState<'veg' | 'non-veg' | 'egg' | 'unknown'>('veg');
  const [newSpice, setNewSpice] = useState<'mild' | 'medium' | 'spicy'>('medium');

  const handleDelete = (index: number) => {
    setDishes(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleUpdateDish = (index: number, updated: Partial<ExtractedDish>) => {
    setDishes(prev =>
      prev.map((d, i) => (i === index ? { ...d, ...updated } : d))
    );
  };

  const toggleDietary = (index: number) => {
    setDishes(prev =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const current = d.dietary || 'unknown';
        const nextDietary: 'veg' | 'non-veg' | 'egg' | 'unknown' =
          current === 'veg' ? 'non-veg' : current === 'non-veg' ? 'egg' : 'veg';
        return { ...d, dietary: nextDietary };
      })
    );
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const dish: ExtractedDish = {
      id: `dish_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      price: newPrice ? parseFloat(newPrice) : 250.0,
      currency: 'INR',
      category: newCategory || 'Main Course',
      dietary: newDietary,
      spice_level: newSpice,
    };
    setDishes(prev => [dish, ...prev]);
    setNewName('');
    setNewDesc('');
    setNewPrice('');
    setNewDietary('veg');
    setNewSpice('medium');
    setIsDrawerOpen(false);
  };

  const filteredDishes = dishes.filter(d => {
    if (filterMode === 'veg') return d.dietary === 'veg';
    if (filterMode === 'non-veg') return d.dietary === 'non-veg';
    if (filterMode === 'egg') return d.dietary === 'egg';
    return true;
  });

  const vegCount = dishes.filter(d => d.dietary === 'veg').length;
  const nonVegCount = dishes.filter(d => d.dietary === 'non-veg').length;
  const eggCount = dishes.filter(d => d.dietary === 'egg').length;
  const needsReviewCount = dishes.filter(d => !d.price || d.price <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header section with high-fashion typography & contrast */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif-display text-2xl font-bold text-[#1A1715] dark:text-[#F5F2EB] tracking-tight">
              {restaurantName || 'Restaurant Menu'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gold-400/15 text-gold-700 dark:text-gold-300 border border-gold-400/30">
              {dishes.length} Items Captured
            </span>
            {needsReviewCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {needsReviewCount} Needs quick review
              </span>
            )}
          </div>
          <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1">
            Review parsed dishes below. Tap any price to adjust or toggle Veg / Non-Veg / Egg status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Missing Dish
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirmDishes(dishes)}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Confirm & Select Vibe
          </Button>
        </div>
      </div>

      {/* Luxury Filter Slider Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            filterMode === 'all'
              ? 'bg-[#1A1715] text-[#F5F2EB] dark:bg-[#C5A880] dark:text-[#1A1715] border-transparent shadow-sm'
              : 'border-stone-300/80 dark:border-stone-700 text-[#635A52] dark:text-[#A89F95] hover:border-gold-400'
          }`}
        >
          All Items ({dishes.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('veg')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            filterMode === 'veg'
              ? 'bg-regal-700 text-white border-transparent shadow-sm'
              : 'border-stone-300/80 dark:border-stone-700 text-regal-700 dark:text-emerald-400 hover:border-emerald-500/40'
          }`}
        >
          <DietaryBadge dietary="veg" size="sm" /> Pure Veg ({vegCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('non-veg')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            filterMode === 'non-veg'
              ? 'bg-burgundy-700 text-white border-transparent shadow-sm'
              : 'border-stone-300/80 dark:border-stone-700 text-burgundy-700 dark:text-rose-400 hover:border-rose-500/40'
          }`}
        >
          <DietaryBadge dietary="non-veg" size="sm" /> Non-Veg ({nonVegCount})
        </button>
        {eggCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterMode('egg')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterMode === 'egg'
                ? 'bg-amber-600 text-white border-transparent shadow-sm'
                : 'border-stone-300/80 dark:border-stone-700 text-amber-700 dark:text-amber-400 hover:border-amber-500/40'
            }`}
          >
            <DietaryBadge dietary="egg" size="sm" /> Egg ({eggCount})
          </button>
        )}
      </div>

      {/* Dish List with Card Lift & Review Safeguards */}
      <div className="space-y-3">
        {filteredDishes.length === 0 ? (
          <Card variant="outline" className="text-center py-10">
            <Utensils className="w-8 h-8 mx-auto text-stone-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#1A1715] dark:text-[#F5F2EB]">
              No dishes found in this filter category
            </p>
            <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1">
              Switch filter to 'All Items' or click 'Add Missing Dish' to insert an item manually.
            </p>
          </Card>
        ) : (
          filteredDishes.map((dish) => {
            const originalIndex = dishes.findIndex(d => d.id === dish.id || (d.name === dish.name && d.price === dish.price));
            const isEditing = editingIndex === originalIndex;
            const needsReview = !dish.price || dish.price <= 0;

            return (
              <div
                key={dish.id || originalIndex}
                className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-200 card-hover-lift bg-white dark:bg-[#1B1917] border shadow-luxe-light dark:shadow-luxe-dark group ${
                  needsReview
                    ? 'border-amber-400/80 ring-1 ring-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-stone-200/80 dark:border-stone-800'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2.5 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDietary(originalIndex)}
                          title="Click to toggle Veg / Non-Veg / Egg"
                          className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:scale-105 transition-transform"
                        >
                          <DietaryBadge dietary={dish.dietary} size="md" />
                        </button>
                        <input
                          type="text"
                          value={dish.name}
                          onChange={(e) => handleUpdateDish(originalIndex, { name: e.target.value })}
                          className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-2.5 py-1.5 text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-1 focus:ring-gold-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="relative w-28">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-gold-600 font-bold">₹</span>
                          <input
                            type="number"
                            step="5"
                            placeholder="Price"
                            value={dish.price !== undefined && dish.price !== null ? dish.price : ''}
                            onChange={(e) => handleUpdateDish(originalIndex, { price: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full pl-6 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-2 py-1.5 text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB] tabular-nums focus:outline-none focus:ring-1 focus:ring-gold-400"
                          />
                        </div>
                        <select
                          value={dish.category || 'Main Course'}
                          onChange={(e) => handleUpdateDish(originalIndex, { category: e.target.value })}
                          className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-2 py-1.5 text-xs text-[#1A1715] dark:text-stone-300"
                        >
                          {INDIAN_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Portion or ingredient notes"
                      value={dish.description || ''}
                      onChange={(e) => handleUpdateDish(originalIndex, { description: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-2.5 py-1.5 text-xs text-[#635A52] dark:text-stone-300"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="primary" onClick={() => setEditingIndex(null)} icon={<Check className="w-3.5 h-3.5" />}>
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleDietary(originalIndex)}
                        className="mt-0.5 p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Tap to toggle Veg / Non-Veg / Egg"
                      >
                        <DietaryBadge dietary={dish.dietary} size="md" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#1A1715] dark:text-[#F5F2EB] group-hover:text-gold-700 dark:group-hover:text-gold-300 transition-colors">
                            {dish.name}
                          </span>
                          {dish.category && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[#635A52] dark:text-[#A89F95] border border-stone-200/80 dark:border-stone-700">
                              {dish.category}
                            </span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            dish.dietary === 'veg'
                              ? 'text-regal-700 bg-regal-100 dark:text-emerald-400 dark:bg-emerald-950/40'
                              : dish.dietary === 'egg'
                              ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40'
                              : 'text-burgundy-700 bg-burgundy-100 dark:text-rose-400 dark:bg-rose-950/40'
                          }`}>
                            {dish.dietary === 'veg' ? 'Veg' : dish.dietary === 'egg' ? 'Egg' : 'Non-Veg'}
                          </span>
                          {dish.spice_level && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              dish.spice_level === 'spicy'
                                ? 'text-burgundy-700 bg-burgundy-50 border-burgundy-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-800/40'
                                : dish.spice_level === 'mild'
                                ? 'text-regal-700 bg-regal-50 border-regal-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/40'
                                : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/40'
                            }`}>
                              {dish.spice_level === 'spicy' ? '🌶️ Spicy' : dish.spice_level === 'mild' ? '🌿 Mild' : '🌶️ Medium'}
                            </span>
                          )}
                          {needsReview && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                              <AlertTriangle className="w-2.5 h-2.5" /> Needs quick review
                            </span>
                          )}
                        </div>
                        {dish.description && (
                          <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1 line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-sm text-[#1A1715] dark:text-[#F5F2EB] tabular-nums">
                          {dish.price ? formatINR(dish.price) : '₹ --'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(originalIndex)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Edit dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(originalIndex)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-burgundy-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200/80 dark:border-stone-800">
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Menu Input
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => onConfirmDishes(dishes)}
          icon={<ArrowRight className="w-4 h-4" />}
          disabled={dishes.length === 0}
        >
          Confirm ({dishes.length}) & Set Vibe
        </Button>
      </div>

      {/* Elegant "Add Missing Dish" Modal / Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1B1917] border border-stone-200/80 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <h3 className="font-serif-display font-bold text-lg text-[#1A1715] dark:text-[#F5F2EB]">
                  Add Missing Dish to Menu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garlic Chicken Noodles, Paneer Pasanda"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-3.5 py-2.5 text-xs text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                    Price in INR (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-gold-600 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="180"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full pl-7 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-3 py-2 text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB] tabular-nums focus:outline-none focus:ring-2 focus:ring-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-3 py-2 text-xs text-[#1A1715] dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    {INDIAN_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                    Dietary
                  </label>
                  <div className="flex rounded-lg border border-stone-300 dark:border-stone-700 p-0.5 bg-stone-100 dark:bg-stone-900">
                    <button
                      type="button"
                      onClick={() => setNewDietary('veg')}
                      className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                        newDietary === 'veg' ? 'bg-regal-700 text-white' : 'text-[#635A52] dark:text-stone-400'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDietary('non-veg')}
                      className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                        newDietary === 'non-veg' ? 'bg-burgundy-700 text-white' : 'text-[#635A52] dark:text-stone-400'
                      }`}
                    >
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDietary('egg')}
                      className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                        newDietary === 'egg' ? 'bg-amber-600 text-white' : 'text-[#635A52] dark:text-stone-400'
                      }`}
                    >
                      Egg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={newSpice}
                    onChange={(e) => setNewSpice(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-3 py-2 text-xs text-[#1A1715] dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="mild">🌿 Mild</option>
                    <option value="medium">🌶️ Medium</option>
                    <option value="spicy">🌶️🌶️ Spicy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1715] dark:text-stone-300 mb-1">
                  Description / Portion (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wok tossed with garlic, half portion"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121110] px-3.5 py-2 text-xs text-[#1A1715] dark:text-[#F5F2EB] focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
                  Add to Menu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
