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
import {
  isDiabeticProfile,
  setDiabeticProfile,
  DIABETIC_RESTRICTION_TAG
} from '../utils/diabetic';
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
  const [isDiabetic, setIsDiabetic] = useState<boolean>(() => isDiabeticProfile());
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
          setIsDiabetic(p.is_diabetic ?? (p.dietary_restrictions?.includes(DIABETIC_RESTRICTION_TAG) || isDiabeticProfile()));
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
      setIsDiabetic(savedPreferences.is_diabetic ?? isDiabeticProfile());
      setSpice(savedPreferences.spice_tolerance || 'medium');
      setLikedCuisines(savedPreferences.cuisines_liked || ['North Indian', 'Mughlai']);
      setDislikedCuisines(savedPreferences.cuisines_disliked || []);
      setBudgetMax(savedPreferences.default_budget_max || 600);
    } else {
      setIsDiabetic(isDiabeticProfile());
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
      setDiabeticProfile(isDiabetic);

      const finalDietary = isDiabetic
        ? Array.from(new Set([...dietary, DIABETIC_RESTRICTION_TAG]))
        : dietary.filter((d) => d !== DIABETIC_RESTRICTION_TAG);

      // 1. Optimistic Update of User state
      const updatedUserPromise = updateProfile({
        full_name: trimmedName,
        email: email.trim().toLowerCase(),
        mobile_number: formattedMobile,
      });

      // 2. Update Palate Preferences
      const updatedPrefPromise = preferencesApi.updatePreferences({
        dietary_restrictions: finalDietary,
        spice_tolerance: spice,
        cuisines_liked: likedCuisines,
        cuisines_disliked: dislikedCuisines,
        default_budget_min: 150,
        default_budget_max: budgetMax,
        currency,
        is_diabetic: isDiabetic,
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
        <Loader2 className="w-8 h-8 text-[#E6C387] animate-spin" />
        <p className="text-xs text-[#635A52] dark:text-[#A1A1AA]">Loading your dining profile...</p>
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
      <div className="relative rounded-3xl bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-luxe-light dark:shadow-luxe-dark p-6 sm:p-8 transition-all overflow-hidden">
        
        {/* Subtle gold accent trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E6C387] via-[#D4AF37] to-[#E6C387] opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Monogram */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#E6C387] to-[#D4AF37] flex items-center justify-center text-[#090A0F] text-2xl sm:text-3xl font-bold font-serif-display shadow-md shadow-[#E6C387]/20 border-2 border-[#E6C387]/40 shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5] truncate">
                  {user?.full_name || 'Desi Gourmet'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#E6C387]/10 text-[#E6C387] text-[10px] font-bold border border-[#E6C387]/30 uppercase tracking-wider">
                  Member
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-[#635A52] dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#E6C387] shrink-0" />
                  {user?.email}
                </span>

                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-[#E6C387] shrink-0" />
                  {user?.mobile_number ? formatIndianMobile(user.mobile_number, true) : 'No mobile linked'}
                </span>
              </div>

              {/* Quick tags display */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {activeQuickDiet ? (
                  <Badge variant="amber" size="sm" className="bg-[#E6C387]/10 text-[#E6C387] border border-[#E6C387]/30 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${activeQuickDiet.dotColor}`} />
                    {activeQuickDiet.label}
                  </Badge>
                ) : (
                  <Badge variant="stone" size="sm" className="bg-[#FBF9F5] dark:bg-[#0E111A] text-[#635A52] dark:text-[#A1A1AA] border border-stone-200 dark:border-[#242938]">
                    Standard Diet
                  </Badge>
                )}

                {isDiabetic && (
                  <Badge variant="emerald" size="sm" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Diabetic Safe
                  </Badge>
                )}

                <Badge variant="stone" size="sm" className="bg-[#FBF9F5] dark:bg-[#0E111A] text-[#635A52] dark:text-[#A1A1AA] border border-stone-200 dark:border-[#242938]">
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E6C387]/40 hover:border-[#E6C387] bg-[#E6C387]/10 hover:bg-[#E6C387]/15 text-[#1A1715] dark:text-[#F4F4F5] font-bold text-xs transition-all shadow-sm shrink-0 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5 text-[#E6C387]" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Dining Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Meals Logged */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6C387]/10 text-[#E6C387] flex items-center justify-center shrink-0 border border-[#E6C387]/20">
            <Utensils className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A1A1AA] uppercase tracking-wider">
              Total Meals Logged
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              {insights?.total_orders ?? 0}
            </p>
          </div>
        </div>

        {/* Average Spend */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/20">
            <IndianRupee className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A1A1AA] uppercase tracking-wider">
              Average Spend
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              {formatINR(insights?.average_spend ?? 0)}
            </p>
          </div>
        </div>

        {/* Average Dish Rating / Palate Health */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#635A52] dark:text-[#A1A1AA] uppercase tracking-wider">
              Palate Satisfaction
            </p>
            <p className="font-heritage text-xl sm:text-2xl font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              {insights?.average_rating ? `${insights.average_rating} / 5.0` : '5.0 / 5.0'}
            </p>
          </div>
        </div>
      </div>

      {/* In-Place Edit Mode Banner or Error Message */}
      {isEditing && (
        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#131620] border border-[#E6C387]/40 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6C387] animate-pulse" />
            <span className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              Editing Account Details & Taste Settings
            </span>
          </div>
          <span className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
            Save changes below to apply updates immediately.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal Details Card (Editable when isEditing is true) */}
        <Card variant="default" className="bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              <UserIcon className="w-4 h-4 text-[#E6C387]" />
              <span>Personal Dining Details</span>
            </div>
            {!isEditing && (
              <span className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
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
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0E111A] border border-stone-200 dark:border-[#242938]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A1A1AA]">
                  Full Name
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5] mt-0.5 truncate">
                  {user?.full_name || 'Desi Gourmet'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0E111A] border border-stone-200 dark:border-[#242938]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A1A1AA]">
                  Email Address
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5] mt-0.5 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0E111A] border border-stone-200 dark:border-[#242938]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#635A52] dark:text-[#A1A1AA]">
                  Mobile Contact
                </p>
                <p className="text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5] mt-0.5 truncate">
                  {user?.mobile_number ? formatIndianMobile(user.mobile_number, true) : 'Not specified'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Dietary Preference Quick-Select Card */}
        <Card variant="default" className="bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              <ShieldCheck className="w-4 h-4 text-[#E6C387]" />
              <span>Dietary Preference Quick-Select</span>
            </div>
            <span className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
              Primary Palate Filter
            </span>
          </div>

          <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] mb-3">
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
                      ? 'bg-[#E6C387] text-[#090A0F] border-[#E6C387] shadow-sm ring-1 ring-[#E6C387]/40'
                      : 'bg-[#FAF7F2] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                  } ${!isEditing ? 'cursor-default opacity-90' : 'cursor-pointer active:scale-95'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${tag.dotColor}`} />
                  <span>{tag.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>

          {/* Dedicated Diabetic Safe / Zero Added Sugar Health Profile Filter */}
          <div className="mt-5 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0E111A] border border-stone-200 dark:border-[#242938] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">
                  Diabetic Safe / Zero Added Sugar
                </span>
                {isDiabetic && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Active Shield
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                Flag dishes with added sugar, jaggery, sweet gravies, or heavy desserts
              </p>
            </div>

            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setIsDiabetic((prev) => !prev)}
              aria-label="Toggle Diabetic Safe / Zero Added Sugar filter"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                isDiabetic
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-[#131620] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/50'
              } ${!isEditing ? 'cursor-default opacity-85' : 'cursor-pointer active:scale-95'}`}
            >
              {isDiabetic ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Diabetic Safe Active</span>
                </>
              ) : (
                <span>Disabled</span>
              )}
            </button>
          </div>

          {/* Additional Observances & Allergies */}
          <div className="mt-5 pt-4 border-t border-stone-200 dark:border-[#242938]">
            <p className="text-xs font-semibold text-[#1A1715] dark:text-[#F4F4F5] mb-2.5">
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
                        ? 'bg-[#E6C387]/15 border-[#E6C387]/60 text-[#E6C387] font-bold'
                        : 'bg-[#FAF7F2] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
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
        <Card variant="default" className="bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5] mb-3">
            <Flame className="w-4 h-4 text-[#E6C387]" />
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
                    ? 'border-[#E6C387] bg-[#E6C387]/15 text-[#E6C387] font-bold ring-2 ring-[#E6C387]/25'
                    : 'border-stone-200 dark:border-[#242938] bg-[#FAF7F2] dark:bg-[#0E111A] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
              >
                {SPICE_LABELS[lvl]}
              </button>
            ))}
          </div>
        </Card>

        {/* Cuisine Preferences */}
        <Card variant="default" className="bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5] mb-3">
            <Heart className="w-4 h-4 text-[#E6C387]" />
            <span>Indian Regional Cuisines Liked & Disliked</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] mb-2">
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
                          ? 'bg-[#E6C387] text-[#090A0F] font-bold border-[#E6C387] shadow-sm'
                          : 'bg-[#FAF7F2] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-[#E6C387]/40'
                      } ${!isEditing ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-[#242938]">
              <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] mb-2">
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
                          : 'bg-[#FAF7F2] dark:bg-[#0E111A] border-stone-200 dark:border-[#242938] text-[#635A52] dark:text-[#A1A1AA] hover:border-rose-500/40'
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
        <Card variant="default" className="bg-white dark:bg-[#131620] border border-stone-200 dark:border-[#242938] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1715] dark:text-[#F4F4F5]">
              <Coins className="w-4 h-4 text-[#E6C387]" />
              <span>Standard Meal Budget Ceiling</span>
            </div>
            <span className="tabular-nums font-heritage text-xl font-bold text-[#E6C387]">
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
            className="w-full h-2 bg-[#E8E2D8] dark:bg-[#242938] rounded-lg appearance-none cursor-pointer accent-[#E6C387] disabled:opacity-75"
          />
          <div className="flex justify-between text-[11px] text-[#635A52] dark:text-[#A1A1AA] mt-1 tabular-nums">
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
              className="w-1/3 border-stone-200 dark:border-[#242938] text-[#1A1715] dark:text-[#F4F4F5]"
              onClick={handleCancel}
              disabled={isSaving}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="lg"
              className="w-2/3 bg-[#E6C387] text-[#090A0F] font-bold hover:bg-[#D4AF37] transition-all duration-200 shadow-lg shadow-[#E6C387]/10"
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
