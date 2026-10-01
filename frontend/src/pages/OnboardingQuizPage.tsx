import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Flame,
  Heart,
  Ban,
  Coins,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { preferencesApi } from '../api/preferences';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { formatINR } from '../utils/formatCurrency';

const DIETARY_OPTIONS = [
  { id: 'Vegetarian', label: 'Vegetarian (Pure Veg)', icon: '🥗' },
  { id: 'Jain', label: 'Jain (No Onion/Garlic/Root)', icon: '🌿' },
  { id: 'Vegan', label: 'Vegan', icon: '🌱' },
  { id: 'Eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'Halal', label: 'Halal', icon: '🌙' },
  { id: 'Gluten-Free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'Dairy-Free', label: 'Dairy-Free (No Ghee/Paneer)', icon: '🥛' },
  { id: 'Nut Allergy', label: 'Nut Allergy (No Cashew Paste)', icon: '🥜' },
  { id: 'Shellfish Allergy', label: 'Shellfish / Prawn Allergy', icon: '🦐' },
  { id: 'None', label: 'No Restrictions (Omnivore)', icon: '✨' },
];

const SPICE_LEVELS: { id: 'none' | 'mild' | 'medium' | 'high' | 'extreme'; label: string; desc: string; icon: string }[] = [
  { id: 'none', label: 'Cool & Mild', desc: 'No chili heat, soothing creamy textures', icon: '🧊' },
  { id: 'mild', label: 'Mild Warmth', desc: 'A subtle fragrant touch of whole spices', icon: '🌱' },
  { id: 'medium', label: 'Desi Medium', desc: 'Balanced green chili and garam masala punch', icon: '🌶️' },
  { id: 'high', label: 'Spicy & Fiery', desc: 'Authentic Indian restaurant heat lover', icon: '🔥' },
  { id: 'extreme', label: 'Desi Teekha (Extreme)', desc: 'Kolhapuri / Andhra level sweat-inducing heat', icon: '💥' },
];

const CUISINES = [
  'North Indian',
  'South Indian',
  'Mughlai',
  'Street Food & Chaat',
  'Tandoor & Kebab',
  'Biryani / Awadhi',
  'Coastal & Seafood',
  'Bengali',
  'Gujarati & Rajasthani',
  'Indo-Chinese',
  'Kerala & Malabar',
  'Chettinad',
  'Continental',
];

export const OnboardingQuizPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [dietary, setDietary] = useState<string[]>([]);
  const [spice, setSpice] = useState<'none' | 'mild' | 'medium' | 'high' | 'extreme'>('medium');
  const [likedCuisines, setLikedCuisines] = useState<string[]>([
    'North Indian',
    'Mughlai',
    'Street Food & Chaat',
  ]);
  const [dislikedCuisines, setDislikedCuisines] = useState<string[]>([]);
  const [budgetMin] = useState<number>(150);
  const [budgetMax, setBudgetMax] = useState<number>(600);
  const [currency] = useState('INR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const toggleDietary = (item: string) => {
    if (item === 'None') {
      setDietary(['None']);
      return;
    }
    setDietary(prev => {
      const filtered = prev.filter(d => d !== 'None');
      return filtered.includes(item) ? filtered.filter(d => d !== item) : [...filtered, item];
    });
  };

  const toggleLikedCuisine = (c: string) => {
    setLikedCuisines(prev =>
      prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
    );
    // Remove from disliked if toggled to liked
    setDislikedCuisines(prev => prev.filter(item => item !== c));
  };

  const toggleDislikedCuisine = (c: string) => {
    setDislikedCuisines(prev =>
      prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
    );
    // Remove from liked if toggled to disliked
    setLikedCuisines(prev => prev.filter(item => item !== c));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await preferencesApi.updatePreferences({
        dietary_restrictions: dietary.filter(d => d !== 'None'),
        spice_tolerance: spice,
        cuisines_liked: likedCuisines,
        cuisines_disliked: dislikedCuisines,
        default_budget_min: budgetMin,
        default_budget_max: budgetMax,
        currency,
      });
      await refreshUser();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-[#635A52] dark:text-[#A1A1AA] mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span className="text-[#E6C387] font-serif-display font-bold">
            {step === 1 && 'Dietary Preferences & Allergies'}
            {step === 2 && 'Desi Spice Tolerance'}
            {step === 3 && 'Indian Cuisine Affinities'}
            {step === 4 && 'Standard Dining Budget'}
          </span>
        </div>
        <div className="w-full bg-[#E8E2D8] dark:bg-[#242938] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#E6C387] h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card variant="glass" className="border border-stone-200 dark:border-[#242938] bg-white dark:bg-[#131620]/80 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden rounded-2xl shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6C387]/5 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* STEP 1: Dietary Restrictions */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C387]/10 border border-[#E6C387]/30 text-[#E6C387] text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E6C387]" /> Dietary Observance & Allergies
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                Any dietary needs or food sensitivities?
              </h2>
              <p className="text-sm text-[#635A52] dark:text-[#A1A1AA] mt-1">
                Menu Whisperer ensures your recommendations strictly respect pure veg, Jain, or allergen constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DIETARY_OPTIONS.map(opt => {
                const isSelected = dietary.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleDietary(opt.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#E6C387] bg-[#E6C387]/10 text-[#E6C387] font-semibold ring-2 ring-[#E6C387]/30'
                        : 'border-stone-200 dark:border-[#242938] bg-[#FBF9F5] dark:bg-[#0E111A] hover:border-[#E6C387]/50 text-[#1A1715] dark:text-[#F4F4F5]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#E6C387]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Spice Tolerance */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C387]/10 border border-[#E6C387]/30 text-[#E6C387] text-xs font-semibold mb-2">
                <Flame className="w-3.5 h-3.5 text-[#E6C387]" /> Desi Spice Meter
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                What's your spice tolerance level?
              </h2>
              <p className="text-sm text-[#635A52] dark:text-[#A1A1AA] mt-1">
                We will match dishes from mild Shahi gravies to fiery Kolhapuri rassa.
              </p>
            </div>

            <div className="space-y-3">
              {SPICE_LEVELS.map(lvl => {
                const isSelected = spice === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSpice(lvl.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#E6C387] bg-[#E6C387]/10 text-[#1A1715] dark:text-[#F4F4F5] ring-2 ring-[#E6C387]/30 font-semibold'
                        : 'border-stone-200 dark:border-[#242938] bg-[#FBF9F5] dark:bg-[#0E111A] hover:border-[#E6C387]/50 text-[#1A1715] dark:text-[#F4F4F5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lvl.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-[#1A1715] dark:text-[#F4F4F5]">{lvl.label}</div>
                        <div className="text-xs text-[#635A52] dark:text-[#A1A1AA]">{lvl.desc}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#E6C387] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Cuisines Liked & Disliked */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C387]/10 border border-[#E6C387]/30 text-[#E6C387] text-xs font-semibold mb-2">
                <Heart className="w-3.5 h-3.5 text-[#E6C387]" /> Regional Cuisines
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                Which Indian & regional styles do you love?
              </h2>
              <p className="text-sm text-[#635A52] dark:text-[#A1A1AA] mt-1">
                Select your favorite styles, and mark any regional cuisines you avoid.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#E6C387] flex items-center gap-1.5 mb-2.5">
                <Heart className="w-3.5 h-3.5 fill-[#E6C387] text-[#E6C387]" /> Liked Cuisines (tap to select)
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map(c => {
                  const isLiked = likedCuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleLikedCuisine(c)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                        isLiked
                          ? 'bg-[#E6C387] text-[#090A0F] font-bold border-[#E6C387] shadow-sm'
                          : 'bg-[#FBF9F5] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#635A52] dark:text-[#A1A1AA] flex items-center gap-1.5 mb-2.5">
                <Ban className="w-3.5 h-3.5 text-rose-500" /> Cuisines to Avoid (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map(c => {
                  const isDisliked = dislikedCuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleDislikedCuisine(c)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                        isDisliked
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/40 font-semibold shadow-sm'
                          : 'bg-[#FBF9F5] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-rose-400/50'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Default Budget Range */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C387]/10 border border-[#E6C387]/30 text-[#E6C387] text-xs font-semibold mb-2">
                <Coins className="w-3.5 h-3.5 text-[#E6C387]" /> Typical Budget (INR)
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                What's your typical meal budget per dish?
              </h2>
              <p className="text-sm text-[#635A52] dark:text-[#A1A1AA] mt-1">
                You can adjust this per dining session, but we'll use this as your baseline.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold uppercase text-[#635A52] dark:text-[#A1A1AA]">Maximum Price per Dish</span>
                  <span className="tabular-nums font-heritage text-2xl font-bold text-[#E6C387]">
                    {formatINR(budgetMax)}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="50"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full h-2 bg-[#E8E2D8] dark:bg-[#242938] rounded-lg appearance-none cursor-pointer accent-[#E6C387]"
                />
                <div className="flex justify-between text-[11px] text-[#635A52] dark:text-[#A1A1AA] mt-1 tabular-nums">
                  <span>₹150 (Casual Dhaba / Street)</span>
                  <span>₹600 (Standard Dining)</span>
                  <span>₹1,800+ (Regal Dawat / Fine Dining)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#E6C387]/10 border border-[#E6C387]/25 text-xs text-[#1A1715] dark:text-[#F4F4F5] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E6C387] shrink-0 mt-0.5" />
                <span>
                  All set! You can always update these preferences in your Taste Profile or tweak them on the fly for any dining session.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-8 border-t border-stone-200 dark:border-[#242938] mt-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(prev => prev - 1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              type="button"
              size="md"
              onClick={() => setStep(prev => prev + 1)}
              icon={<ArrowRight className="w-4 h-4" />}
              className="bg-[#E6C387] text-[#090A0F] font-semibold hover:bg-[#D4AF37] transition-all duration-200 shadow-lg shadow-[#E6C387]/10"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleFinish}
              icon={<Sparkles className="w-4 h-4" />}
              className="bg-[#E6C387] text-[#090A0F] font-bold hover:bg-[#D4AF37] transition-all duration-200 shadow-xl shadow-[#E6C387]/15"
            >
              Save Profile & Start
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

