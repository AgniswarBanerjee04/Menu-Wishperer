import React, { useEffect, useState } from 'react';
import { Trophy, Star, Utensils, Heart, Sparkles } from 'lucide-react';
import type { InsightsData } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface InsightsCardProps {
  insights: InsightsData;
}

/** Smooth counter animation using requestAnimationFrame */
const AnimatedCounter: React.FC<{ value: number; duration?: number; prefix?: string; decimals?: number }> = ({
  value,
  duration = 1000,
  prefix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    if (endValue === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
    </span>
  );
};

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
  return (
    <Card variant="glass" className="border border-[#E8E2D8] dark:border-gold-500/30 bg-white dark:bg-[#1B1917] space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E8E2D8] dark:border-gold-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-gold-500" />
          </div>
          <div>
            <h3 className="font-serif-display font-bold text-base text-[#1A1715] dark:text-[#F5F2EB] tracking-wide">
              Your Dining Insights
            </h3>
            <p className="text-[10px] text-[#635A52] dark:text-[#A89F95]">Personalized taste telemetry</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-700 dark:text-gold-300 border border-gold-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold-500" /> Taste AI
        </span>
      </div>

      {/* Metrics Row with Smooth Counters */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#121110] border border-[#E8E2D8] dark:border-gold-500/20 shadow-inner group hover:border-gold-500/40 transition-colors">
          <p className="text-[10px] uppercase font-bold text-[#635A52] dark:text-[#A89F95] tracking-wider">Total Meals</p>
          <p className="tabular-nums font-heritage text-xl sm:text-2xl font-bold text-gold-600 dark:text-gold-400 mt-1">
            <AnimatedCounter value={insights.total_orders} duration={1200} />
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#121110] border border-[#E8E2D8] dark:border-gold-500/20 shadow-inner group hover:border-gold-500/40 transition-colors">
          <p className="text-[10px] uppercase font-bold text-[#635A52] dark:text-[#A89F95] tracking-wider">Avg Rating</p>
          <p className="tabular-nums font-heritage text-xl sm:text-2xl font-bold text-gold-600 dark:text-gold-400 mt-1 flex items-center justify-center gap-1">
            {insights.average_rating > 0 ? (
              <>
                <AnimatedCounter value={insights.average_rating} duration={1200} decimals={1} />
                <Star className="w-4 h-4 text-gold-500 fill-gold-500 inline" />
              </>
            ) : (
              '–'
            )}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#121110] border border-[#E8E2D8] dark:border-gold-500/20 shadow-inner group hover:border-gold-500/40 transition-colors">
          <p className="text-[10px] uppercase font-bold text-[#635A52] dark:text-[#A89F95] tracking-wider">Avg Spend</p>
          <p className="tabular-nums font-heritage text-xl sm:text-2xl font-bold text-gold-600 dark:text-gold-400 mt-1">
            <AnimatedCounter value={insights.average_spend} duration={1400} prefix="₹" decimals={0} />
          </p>
        </div>
      </div>

      {/* Favorite Cuisines */}
      {insights.favorite_cuisines && insights.favorite_cuisines.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#635A52] dark:text-[#A89F95] flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /> Go-To Cuisines
          </p>
          <div className="flex flex-wrap gap-1.5">
            {insights.favorite_cuisines.map((c) => (
              <Badge key={c} variant="amber" size="sm" className="bg-gold-500/10 text-gold-700 dark:text-gold-300 border border-gold-500/30">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Highest Rated Dishes */}
      {insights.highest_rated_dishes && insights.highest_rated_dishes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E8E2D8] dark:border-gold-500/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#635A52] dark:text-[#A89F95]">
            Top Rated Past Favorites (5★)
          </p>
          <div className="space-y-1.5">
            {insights.highest_rated_dishes.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#FBF9F5] dark:bg-[#121110] border border-[#E8E2D8] dark:border-gold-500/15 text-[#1A1715] dark:text-[#E8E2D8] hover:border-gold-500/35 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Utensils className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                  <span className="font-semibold truncate text-[#1A1715] dark:text-[#F5F2EB]">{item.name}</span>
                  <span className="text-[#635A52] dark:text-[#A89F95] text-[10px] truncate">at {item.restaurant}</span>
                </div>
                <span className="tabular-nums flex items-center gap-1 text-gold-600 dark:text-gold-400 font-bold shrink-0 font-heritage">
                  {item.rating} <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

