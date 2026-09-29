import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Star,
  Utensils,
  Calendar,
  Sparkles,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import type { OrderItem, InsightsData } from '../types';
import { InsightsCard } from '../components/history/InsightsCard';
import { OrderLogModal } from '../components/history/OrderLogModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { DietaryBadge } from '../components/common/DietaryBadge';
import { formatINR } from '../utils/formatCurrency';

// Common non-veg keywords for Indian and global dishes
const NON_VEG_KEYWORDS = [
  'chicken', 'murgh', 'mutton', 'gosht', 'lamb', 'fish', 'machhi', 'prawn',
  'shrimp', 'crab', 'pork', 'bacon', 'beef', 'egg', 'anda', 'keema', 'seekh',
  'tikka kebab', 'duck', 'calamari', 'squid'
];

function inferDishDietary(dishName: string): 'veg' | 'non-veg' {
  const lower = dishName.toLowerCase();
  for (const kw of NON_VEG_KEYWORDS) {
    if (lower.includes(kw)) {
      return 'non-veg';
    }
  }
  return 'veg';
}

export const HistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchHistoryAndInsights = async () => {
    setIsLoading(true);
    try {
      const [ordersData, insightsData] = await Promise.all([
        ordersApi.getOrders({ search: searchTerm, min_rating: minRating }),
        ordersApi.getInsights(),
      ]);
      setOrders(ordersData);
      setInsights(insightsData);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHistoryAndInsights();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, minRating]);

  // Autocomplete suggestions based on past restaurant names and dishes
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    const pool = new Set<string>();

    orders.forEach(o => {
      if (o.dish_name.toLowerCase().includes(term)) pool.add(o.dish_name);
      if (o.restaurant_name.toLowerCase().includes(term)) pool.add(o.restaurant_name);
    });

    insights?.highest_rated_dishes.forEach(d => {
      if (d.name.toLowerCase().includes(term)) pool.add(d.name);
      if (d.restaurant.toLowerCase().includes(term)) pool.add(d.restaurant);
    });

    return Array.from(pool).slice(0, 5);
  }, [searchTerm, orders, insights]);

  // Filter orders by Pure Veg if active
  const filteredOrders = useMemo(() => {
    if (!pureVegOnly) return orders;
    return orders.filter(o => inferDishDietary(o.dish_name) === 'veg');
  }, [orders, pureVegOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-2">
            <History className="w-6 h-6 text-gold-500" />
            Order History & Taste Log
          </h1>
          <p className="text-xs text-[#635A52] dark:text-[#A89F95] mt-1">
            Every dish you rate directly refines Menu Whisperer's AI to tailor authentic culinary recommendations.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border border-gold-300/40 hover:brightness-105 shadow-sm"
        >
          Log a Past Meal
        </Button>
      </div>

      {/* Top Insights Dashboard Card */}
      {insights && <InsightsCard insights={insights} />}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input with Autocomplete */}
        <div className="relative flex-1">
          <Input
            id="history-search"
            placeholder="Search by dish or restaurant (e.g., Karim's, Biryani)..."
            icon={<Search className="w-4 h-4 text-gold-500" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-[#F5F2EB]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => {
                    setSearchTerm(s);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#1A1715] dark:text-[#E8E2D8] hover:bg-gold-500/10 flex items-center justify-between border-b border-[#E8E2D8] dark:border-[#3D352E] last:border-b-0 transition-colors"
                >
                  <span className="truncate">{s}</span>
                  <span className="text-[10px] text-[#635A52] dark:text-[#A89F95] uppercase tracking-wider">Quick Fill</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pure Veg Toggle */}
        <button
          type="button"
          onClick={() => setPureVegOnly(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
            pureVegOnly
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white dark:bg-[#1B1917] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
          }`}
          title="Filter for strictly vegetarian dishes"
        >
          <span className="w-3 h-3 rounded-[2px] border border-emerald-600 dark:border-emerald-500 flex items-center justify-center p-0.5 bg-emerald-50 dark:bg-emerald-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          </span>
          <span className="font-medium">Pure Veg</span>
          {pureVegOnly && <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">ON</span>}
        </button>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All Ratings', val: undefined },
            { label: '3+ ★', val: 3 },
            { label: '4+ ★', val: 4 },
            { label: '5 ★ Only', val: 5 },
          ].map((pill) => {
            const isSelected = minRating === pill.val;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => setMinRating(pill.val)}
                className={`text-xs px-3 py-2 rounded-xl font-semibold border transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border-gold-400/50 shadow-sm'
                    : 'bg-white dark:bg-[#1B1917] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          <p className="text-xs text-[#635A52] dark:text-[#A89F95]">Retrieving past orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const dietary = inferDishDietary(order.dish_name);

            return (
              <Card
                key={order.id}
                variant="default"
                className="hover:border-gold-500/40 transition-all p-4 space-y-2 bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm card-hover-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <DietaryBadge dietary={dietary} size="sm" />
                      <span className="font-bold text-sm text-[#1A1715] dark:text-[#F5F2EB]">
                        {order.dish_name}
                      </span>
                      {order.price !== null && order.price !== undefined && (
                        <span className="tabular-nums font-heritage font-semibold text-xs text-gold-600 dark:text-gold-400">
                          {formatINR(order.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#635A52] dark:text-[#A89F95] mt-0.5">
                      <span className="font-medium text-[#1A1715] dark:text-[#E8E2D8]">
                        {order.restaurant_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#635A52] dark:text-[#A89F95]">
                        <Calendar className="w-3 h-3 text-[#635A52] dark:text-[#A89F95]" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Stars Display */}
                  <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= order.rating ? 'fill-gold-400 text-gold-400' : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {order.note && (
                  <p className="text-xs italic text-[#635A52] dark:text-[#C5A880]/90 bg-[#FBF9F5] dark:bg-[#121110] p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#3D352E]">
                    "{order.note}"
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="glass" className="py-12 text-center space-y-3 bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E]">
          <Utensils className="w-10 h-10 text-[#635A52] dark:text-[#A89F95] mx-auto opacity-40" />
          <h3 className="font-serif-display font-bold text-lg text-[#1A1715] dark:text-[#F5F2EB]">
            {pureVegOnly ? 'No Pure Veg Meals Found' : 'No Past Meals Found'}
          </h3>
          <p className="text-xs text-[#635A52] dark:text-[#A89F95] max-w-sm mx-auto">
            {searchTerm || minRating || pureVegOnly
              ? 'No orders match your filter criteria. Try adjusting your search term or toggling Pure Veg.'
              : 'You haven\'t logged any restaurant meals yet. Whisper your first menu to get started!'}
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                className="bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border border-gold-300/40 hover:brightness-105 shadow-sm"
              >
                Whisper an Indian Menu Now
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Manual Order Modal */}
      <OrderLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchHistoryAndInsights}
      />
    </div>
  );
};

