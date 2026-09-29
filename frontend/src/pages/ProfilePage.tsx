import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Flame,
  Heart,
  Coins,
  Save,
  AlertCircle,
  Loader2,
  Pencil,
  X,
  Mail,
  User as UserIcon,
  Phone,
  Utensils,
  IndianRupee,
  Sparkles,
  Check
} from 'lucide-react';
import { preferencesApi } from '../api/preferences';
import { ordersApi } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { FloatingInput } from '../components/common/FloatingInput';
import { Toast } from '../components/common/Toast';
import { formatINR } from '../utils/formatCurrency';
import {
  cleanIndianPhoneDigits,
  formatIndianMobile,
  isValidIndianMobile,
  capitalizeName
} from '../utils/phoneUtils';
import type { InsightsData, UserPreferences } from '../types';

const QUICK_DIETARY_TAGS = [
  { id: 'pure-veg', label: 'Pure Veg', matchItem: 'Vegetarian (Pure Veg)', dotColor: 'bg-emerald-500' },
  { id: 'non-veg', label: 'Non-Veg', matchItem: 'Non-Veg', dotColor: 'bg-burgundy-600' },
  { id: 'eggetarian', label: 'Eggetarian', matchItem: 'Eggetarian', dotColor: 'bg-amber-500' },
  { id: 'jain', label: 'Jain', matchItem: 'Jain (No Root Veg)', dotColor: 'bg-purple-500' },
  { id: 'vegan', label: 'Vegan', matchItem: 'Vegan', dotColor: 'bg-teal-500' },
];

const ADDITIONAL_DIETARY_OPTIONS = [
  'Halal',
  'Gluten-Free',
  'Dairy-Free (No Ghee/Paneer)',
  'Nut Allergy (No Cashew Paste)',
  'Shellfish / Prawn Allergy',
];

const SPICE_LEVELS: ('none' | 'mild' | 'medium' | 'high' | 'extreme')[] = [
  'none', 'mild', 'medium', 'high', 'extreme'
];

const SPICE_LABELS: Record<'none' | 'mild' | 'medium' | 'high' | 'extreme', string> = {
  none: 'Cool & Mild',
  mild: 'Mild Warmth',
  medium: 'Desi Medium',
  high: 'Spicy & Fiery',
  extreme: 'Desi Teekha (Extreme)',
};

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

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();

  // Mode: Read-Only vs In-Place Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  // Editable Account Form States
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState('');

  // Palate Preference States
  const [dietary, setDietary] = useState<string[]>([]);
  const [spice, setSpice] = useState<'none' | 'mild' | 'medium' | 'high' | 'extreme'>('medium');
  const [likedCuisines, setLikedCuisines] = useState<string[]>(['North Indian', 'Mughlai']);
  const [dislikedCuisines, setDislikedCuisines] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState<number>(600);
  const [currency] = useState('INR');

  // Backup state for Cancel restoration
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences | null>(null);

  // Dining Stats State
  const [insights, setInsights] = useState<InsightsData | null>(null);

  // Loading & Toast States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate user data and preferences
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      if (user.mobile_number) {
        const digits = cleanIndianPhoneDigits(user.mobile_number);
        setMobileNumber(formatIndianMobile(digits, false));
      }
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pref, stats] = await Promise.allSettled([
          preferencesApi.getPreferences(),
          ordersApi.getInsights(),
        ]);

        if (pref.status === 'fulfilled' && pref.value) {
          const p = pref.value;
          setSavedPreferences(p);
          setDietary(p.dietary_restrictions || []);
          setSpice(p.spice_tolerance || 'medium');
          setLikedCuisines(p.cuisines_liked || ['North Indian', 'Mughlai']);
          setDislikedCuisines(p.cuisines_disliked || []);
          setBudgetMax(p.default_budget_max || 600);
        }

        if (stats.status === 'fulfilled' && stats.value) {
          setInsights(stats.value);
        }
      } catch {
        // Fallbacks are preserved
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Quick Dietary Tag Selector logic
  const handleQuickDietaryToggle = (item: string) => {
    setDietary((prev) => {
      const isAlreadyActive = prev.includes(item);
      if (isAlreadyActive) {
        return prev.filter((d) => d !== item);
      }

      // If choosing a primary diet, replace other mutually exclusive diet tags
      const primaryDietNames = QUICK_DIETARY_TAGS.map((t) => t.matchItem);
      const filtered = prev.filter((d) => !primaryDietNames.includes(d));
      return [...filtered, item];
    });
  };

  const toggleAdditionalDietary = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const toggleLikedCuisine = (c: string) => {
    setLikedCuisines((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
    setDislikedCuisines((prev) => prev.filter((item) => item !== c));
  };

  const toggleDislikedCuisine = (c: string) => {
    setDislikedCuisines((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
    setLikedCuisines((prev) => prev.filter((item) => item !== c));
  };

  // Indian Mobile change handler
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = cleanIndianPhoneDigits(raw);
    setMobileNumber(formatIndianMobile(digits, false));
  };

  // Auto capitalize name on blur
  const handleNameBlur = () => {
    if (fullName) {
      setFullName(capitalizeName(fullName));
    }
  };

  // Discard changes & restore initial values
  const handleCancel = () => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      if (user.mobile_number) {
        const digits = cleanIndianPhoneDigits(user.mobile_number);
        setMobileNumber(formatIndianMobile(digits, false));
      } else {
        setMobileNumber('');
      }
    }

    if (savedPreferences) {
      setDietary(savedPreferences.dietary_restrictions || []);
      setSpice(savedPreferences.spice_tolerance || 'medium');
      setLikedCuisines(savedPreferences.cuisines_liked || ['North Indian', 'Mughlai']);
      setDislikedCuisines(savedPreferences.cuisines_disliked || []);
      setBudgetMax(savedPreferences.default_budget_max || 600);
    }

    setErrorMsg(null);
    setIsEditing(false);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const digits = cleanIndianPhoneDigits(mobileNumber);
    if (mobileNumber && !isValidIndianMobile(mobileNumber)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSaving(true);
    try {
      const formattedMobile = digits ? `+91 ${digits}` : undefined;

      // 1. Optimistic Update of User state
      const updatedUserPromise = updateProfile({
        full_name: trimmedName,
        email: email.trim().toLowerCase(),
        mobile_number: formattedMobile,
      });

      // 2. Update Palate Preferences
      const updatedPrefPromise = preferencesApi.updatePreferences({
        dietary_restrictions: dietary,
        spice_tolerance: spice,
        cuisines_liked: likedCuisines,
        cuisines_disliked: dislikedCuisines,
        default_budget_min: 150,
        default_budget_max: budgetMax,
        currency,
      });

      const [, updatedPref] = await Promise.all([
        updatedUserPromise,
        updatedPrefPromise,
      ]);

      setSavedPreferences(updatedPref);
      await refreshUser();

      // Show toast and exit edit mode
      setToastType('success');
      setToastMessage('Profile updated successfully');
      setTimeout(() => setToastMessage(null), 3500);

      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile changes. Please try again.');
      setToastType('error');
      setToastMessage('Failed to update profile');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        <p className="text-xs text-[#635A52] dark:text-[#A89F95]">Loading your dining profile...</p>
      </div>
    );
  }

  // Active Primary Dietary Label
  const activeQuickDiet = QUICK_DIETARY_TAGS.find((tag) =>
    dietary.includes(tag.matchItem)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 px-4 sm:px-0">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />

      {/* Profile Header & Identity Card */}
      <div className="relative rounded-3xl bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-luxe-light dark:shadow-luxe-dark p-6 sm:p-8 transition-all overflow-hidden">
        
        {/* Subtle gold accent trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Monogram */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#C5A880] to-[#A37F4F] flex items-center justify-center text-[#1A1715] text-2xl sm:text-3xl font-bold font-serif-display shadow-md shadow-gold-500/20 border-2 border-[#E8DBC5]/80 shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F5F2EB] truncate">
                  {user?.full_name || 'Desi Gourmet'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-700 dark:text-gold-300 text-[10px] font-bold border border-gold-400/30 uppercase tracking-wider">
                  Member
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-[#635A52] dark:text-[#A89F95]">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                  {user?.email}
                </span>

                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                  {user?.mobile_number ? formatIndianMobile(user.mobile_number, true) : 'No mobile linked'}
                </span>
              </div>

              {/* Quick tags display */}
              <div className="flex items-center gap-2 mt-3">
                {activeQuickDiet ? (
                  <Badge variant="amber" size="sm" className="bg-gold-500/10 text-gold-800 dark:text-gold-300 border border-gold-500/30 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${activeQuickDiet.dotColor}`} />
                    {activeQuickDiet.label}
                  </Badge>
                ) : (
                  <Badge variant="stone" size="sm" className="bg-[#FBF9F5] dark:bg-[#121110] text-[#635A52] dark:text-[#A89F95] border border-[#E8E2D8] dark:border-[#3D352E]">
                    Standard Diet
                  </Badge>
                )}

                <Badge variant="stone" size="sm" className="bg-[#FBF9F5] dark:bg-[#121110] text-[#635A52] dark:text-[#A89F95] border border-[#E8E2D8] dark:border-[#3D352E]">
                  Spice: {SPICE_LABELS[spice]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Edit Profile Toggle Button */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold-400/50 hover:border-gold-500 bg-gold-500/10 hover:bg-gold-500/15 text-[#1A1715] dark:text-[#F5F2EB] font-bold text-xs transition-all shadow-sm shrink-0 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Dining Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Meals Logged */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 text-gold-700 dark:text-gold-300 flex items-center justify-center shrink-0 border border-gold-400/20">
            <Utensils className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A89F95] uppercase tracking-wider">
              Total Meals Logged
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              {insights?.total_orders ?? 0}
            </p>
          </div>
        </div>

        {/* Average Spend */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/20">
            <IndianRupee className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A89F95] uppercase tracking-wider">
              Average Spend
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              {formatINR(insights?.average_spend ?? 0)}
            </p>
          </div>
        </div>

        {/* Average Dish Rating / Palate Health */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A89F95] uppercase tracking-wider">
              Palate Satisfaction
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              {insights?.average_rating ? `${insights.average_rating} / 5.0` : '5.0 / 5.0'}
            </p>
          </div>
        </div>
      </div>

      {/* In-Place Edit Mode Banner or Error Message */}
      {isEditing && (
        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#171513] border border-[#C5A880]/40 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              Editing Account Details & Taste Settings
            </span>
          </div>
          <span className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
            Save changes below to apply updates immediately.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-burgundy-50 dark:bg-burgundy-950/40 border border-burgundy-200 dark:border-burgundy-900 text-burgundy-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-burgundy-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal Details Card (Editable when isEditing is true) */}
        <Card variant="default" className="bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              <UserIcon className="w-4 h-4 text-gold-500" />
              <span>Personal Dining Details</span>
            </div>
            {!isEditing && (
              <span className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
                Tap 'Edit Profile' above to update
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <FloatingInput
                id="edit-fullname"
                label="Full Name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={handleNameBlur}
                icon={<UserIcon />}
                isValid={fullName.trim().length >= 2}
                hint="Auto-formats with proper title capitalization"
              />

              <FloatingInput
                id="edit-email"
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail />}
                isValid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              />

              <FloatingInput
                id="edit-mobile"
                label="Indian Mobile Number"
                type="tel"
                prefixBadge="+91"
                placeholder="98765 43210"
                maxLength={11}
                value={mobileNumber}
                onChange={handleMobileInputChange}
                isValid={isValidIndianMobile(mobileNumber)}
                hint="Formatted with +91 country code and 10-digit mask"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#121110] border border-[#E8E2D8] dark:border-[#3D352E]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A89F95]">
                  Full Name
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB] mt-0.5 truncate">
                  {user?.full_name || 'Desi Gourmet'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#121110] border border-[#E8E2D8] dark:border-[#3D352E]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A89F95]">
                  Email Address
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB] mt-0.5 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#121110] border border-[#E8E2D8] dark:border-[#3D352E]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A89F95]">
                  Mobile Contact
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB] mt-0.5 truncate">
                  {user?.mobile_number ? formatIndianMobile(user.mobile_number, true) : 'Not specified'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Dietary Preference Quick-Select Card */}
        <Card variant="default" className="bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              <ShieldCheck className="w-4 h-4 text-gold-500" />
              <span>Dietary Preference Quick-Select</span>
            </div>
            <span className="text-[11px] text-[#635A52] dark:text-[#A89F95]">
              Primary Palate Filter
            </span>
          </div>

          <p className="text-xs text-[#635A52] dark:text-[#A89F95] mb-3">
            Choose your core dietary category for instant restaurant menu classification:
          </p>

          {/* Quick-Select Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {QUICK_DIETARY_TAGS.map((tag) => {
              const isActive = dietary.includes(tag.matchItem);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleQuickDietaryToggle(tag.matchItem)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] border-gold-400 shadow-sm ring-1 ring-gold-400/40'
                      : 'bg-[#FAF7F2] dark:bg-[#121110] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
                  } ${!isEditing ? 'cursor-default opacity-90' : 'cursor-pointer active:scale-95'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${tag.dotColor}`} />
                  <span>{tag.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>

          {/* Additional Observances & Allergies */}
          <div className="mt-5 pt-4 border-t border-[#E8E2D8] dark:border-[#3D352E]">
            <p className="text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB] mb-2.5">
              Specific Observances & Allergies:
            </p>
            <div className="flex flex-wrap gap-2">
              {ADDITIONAL_DIETARY_OPTIONS.map((item) => {
                const active = dietary.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => toggleAdditionalDietary(item)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      active
                        ? 'bg-gold-500/15 border-gold-500/60 text-gold-800 dark:text-gold-300 font-bold'
                        : 'bg-[#FAF7F2] dark:bg-[#121110] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
                    } ${!isEditing ? 'cursor-default opacity-85' : 'cursor-pointer active:scale-95'}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Desi Spice Tolerance */}
        <Card variant="default" className="bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB] mb-3">
            <Flame className="w-4 h-4 text-gold-500" />
            <span>Desi Spice Tolerance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SPICE_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                disabled={!isEditing}
                onClick={() => setSpice(lvl)}
                className={`py-2.5 px-2 text-center rounded-xl border text-xs capitalize transition-all ${
                  spice === lvl
                    ? 'border-gold-500 bg-gold-500/15 text-gold-800 dark:text-gold-300 font-bold ring-2 ring-gold-500/25'
                    : 'border-[#E8E2D8] dark:border-[#3D352E] bg-[#FAF7F2] dark:bg-[#121110] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
              >
                {SPICE_LABELS[lvl]}
              </button>
            ))}
          </div>
        </Card>

        {/* Cuisine Preferences */}
        <Card variant="default" className="bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB] mb-3">
            <Heart className="w-4 h-4 text-gold-500" />
            <span>Indian Regional Cuisines Liked & Disliked</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mb-2">
                Liked cuisines {isEditing && '(tap to toggle)'}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map((c) => {
                  const liked = likedCuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleLikedCuisine(c)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        liked
                          ? 'bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border-gold-400/50 shadow-sm'
                          : 'bg-[#FAF7F2] dark:bg-[#121110] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-gold-500/40'
                      } ${!isEditing ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#3D352E]">
              <p className="text-xs text-[#635A52] dark:text-[#A89F95] mb-2">
                Cuisines to avoid:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map((c) => {
                  const disliked = dislikedCuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleDislikedCuisine(c)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        disliked
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/40 font-semibold'
                          : 'bg-[#FAF7F2] dark:bg-[#121110] border-[#E8E2D8] dark:border-[#3D352E] text-[#635A52] dark:text-[#A89F95] hover:border-rose-400/50'
                      } ${!isEditing ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Budget Ceiling */}
        <Card variant="default" className="bg-white dark:bg-[#1B1917] border border-[#E8E2D8] dark:border-[#3D352E] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F5F2EB]">
              <Coins className="w-4 h-4 text-gold-500" />
              <span>Standard Meal Budget Ceiling</span>
            </div>
            <span className="tabular-nums font-heritage text-xl font-bold text-gold-600 dark:text-gold-400">
              {formatINR(budgetMax)}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="2500"
            step="50"
            value={budgetMax}
            disabled={!isEditing}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            className="w-full h-2 bg-[#E8E2D8] dark:bg-[#3D352E] rounded-lg appearance-none cursor-pointer accent-gold-500 disabled:opacity-75"
          />
          <div className="flex justify-between text-[11px] text-[#635A52] dark:text-[#A89F95] mt-1 tabular-nums">
            <span>₹100 (Street / Snacks)</span>
            <span>₹600 (Casual Dining)</span>
            <span>₹2,500 (Fine Dining / Dawat)</span>
          </div>
        </Card>

        {/* Action Buttons: Save & Cancel */}
        {isEditing && (
          <div className="flex items-center gap-3 pt-2 animate-in fade-in duration-200">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-1/3 border-[#E8E2D8] dark:border-[#3D352E] text-[#1A1715] dark:text-[#F5F2EB]"
              onClick={handleCancel}
              disabled={isSaving}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="lg"
              className="w-2/3 bg-gradient-to-r from-[#C5A880] via-[#BA9768] to-[#A37F4F] text-[#1A1715] font-bold border border-[#E8DBC5]/40 hover:brightness-105 shadow-md gold-shimmer-sweep"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
