import React, { useState } from 'react';
import { Star, X, Check, Utensils, AlertCircle } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface OrderLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  defaultRestaurant?: string;
  defaultDish?: string;
  defaultPrice?: number;
  sessionId?: number;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing (Won\'t order again)',
  2: 'Below Average',
  3: 'Good / Decent',
  4: 'Great / Really liked it!',
  5: 'Exceptional! (All-time favorite)',
};

export const OrderLogModal: React.FC<OrderLogModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  defaultRestaurant = '',
  defaultDish = '',
  defaultPrice,
  sessionId,
}) => {
  const [restaurantName, setRestaurantName] = useState(defaultRestaurant);
  const [dishName, setDishName] = useState(defaultDish);
  const [price, setPrice] = useState<string>(defaultPrice ? defaultPrice.toString() : '');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      setError('Please provide the dish name.');
      return;
    }
    if (!restaurantName.trim()) {
      setError('Please specify the restaurant name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ordersApi.createOrder({
        restaurant_name: restaurantName.trim(),
        dish_name: dishName.trim(),
        price: price ? parseFloat(price) : undefined,
        rating,
        note: note.trim() || undefined,
        session_id: sessionId,
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save order log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-display font-bold text-lg text-[#1A1715] dark:text-[#F5F2EB]">
                Log Your Meal
              </h3>
              <p className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
                Helps Menu Whisperer improve your future picks!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-[#F5F2EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="order-restaurant"
            label="Restaurant Name"
            placeholder="e.g. Dum Pukht, Karim's, Peter Cat, Saravana Bhavan"
            required
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                id="order-dish"
                label="Dish Name"
                placeholder="e.g. Dal Makhani, Paneer Butter Masala"
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
              />
            </div>
            <div>
              <Input
                id="order-price"
                label="Price (₹)"
                type="number"
                step="5"
                placeholder="350"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Star Rating Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#635A52] dark:text-[#A89F95]">
              Your Rating (1–5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    title={`${star} Star: ${RATING_LABELS[star]}`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        filled
                          ? 'text-gold-500 fill-gold-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                          : 'text-stone-300 dark:text-stone-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gold-600 dark:text-gold-400 font-medium">
              {RATING_LABELS[hoverRating !== null ? hoverRating : rating]}
            </p>
          </div>

          {/* Notes textarea */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#635A52] dark:text-[#A89F95]">
              Tasting Notes (optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Exceptional slow dum simmer, subtle cardamom & smokiness."
              className="w-full rounded-xl border border-[#E8E2D8] dark:border-[#3D352E] bg-white dark:bg-[#121110] p-2.5 text-xs text-[#1A1715] dark:text-[#F5F2EB] placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border border-gold-300/40 hover:brightness-105 shadow-sm"
              icon={<Check className="w-4 h-4" />}
            >
              Save to Taste History
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
