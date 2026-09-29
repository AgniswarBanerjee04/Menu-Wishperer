import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { VenueSelection } from '../components/wizard/VenueSelection';
import { DiningPersonaSelection } from '../components/wizard/DiningPersonaSelection';
import { ConciergeContextBar } from '../components/wizard/ConciergeContextBar';
import { Step1MenuInput } from '../components/wizard/Step1MenuInput';
import { Step1DishEditor } from '../components/wizard/Step1DishEditor';
import { Step2MoodBudget } from '../components/wizard/Step2MoodBudget';
import { Step3Recommendations } from '../components/wizard/Step3Recommendations';
import { OrderLogModal } from '../components/history/OrderLogModal';
import { useDiningMode } from '../context/DiningModeContext';
import { menusApi } from '../api/menus';
import type {
  MenuSession,
  ExtractedDish,
  DishRecommendation,
  RecommendResponse,
  GuestProfile,
  VenueType,
} from '../types';

export const WizardPage: React.FC = () => {
  // Wizard steps: 'input' -> 'edit' -> 'mood' -> 'results'
  const [currentStep, setCurrentStep] = useState<'input' | 'edit' | 'mood' | 'results'>('input');

  // Concierge sequential steps state (Step 1: Venue -> Step 2: Dining Persona -> Step 3: Menu Ingestion)
  const [venueType, setVenueType] = useState<VenueType | null>(() => {
    return (localStorage.getItem('mw_venue_type') as VenueType) || null;
  });
  const [isConciergeCompleted, setIsConciergeCompleted] = useState<boolean>(false);

  const { activeMode, setActiveMode, guests } = useDiningMode();

  // Session data
  const [session, setSession] = useState<MenuSession | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [dishes, setDishes] = useState<ExtractedDish[]>([]);
  const [recommendationsData, setRecommendationsData] = useState<RecommendResponse | null>(null);

  // Recommendation loading & error
  const [isRecommending, setIsRecommending] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order log modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedDishToOrder, setSelectedDishToOrder] = useState<DishRecommendation | null>(null);
  const [orderLoggedSuccess, setOrderLoggedSuccess] = useState(false);

  const navigate = useNavigate();

  // Handler: When user extracts menu in Step 1 / Concierge Step 3
  const handleMenuExtracted = (extractedSession: MenuSession) => {
    setSession(extractedSession);
    setRestaurantName(extractedSession.restaurant_name || '');
    setDishes(extractedSession.dishes || []);
    if (extractedSession.venue_type) {
      setVenueType(extractedSession.venue_type);
    }
    if (extractedSession.dining_mode) {
      setActiveMode(extractedSession.dining_mode);
    }
    setCurrentStep('edit');
  };

  // Handler: When user confirms dishes in Step 1 Dish Editor
  const handleConfirmDishes = (updatedDishes: ExtractedDish[]) => {
    setDishes(updatedDishes);
    setCurrentStep('mood');
  };

  // Handler: When user selects mood & budget in Step 2
  const handleGetRecommendations = async (context: {
    mood: string;
    budget: number;
    hunger_level: string;
    mode?: 'personal' | 'custom';
    guests?: GuestProfile[];
  }) => {
    setIsRecommending(true);
    setError(null);

    const modeToUse = context.mode || activeMode;
    const guestsToUse = modeToUse === 'custom' ? (context.guests || guests) : undefined;
    const venueToUse = venueType || session?.venue_type || 'restaurant';

    try {
      const response = await menusApi.getRecommendations({
        session_id: session?.id,
        restaurant_name: restaurantName || session?.restaurant_name,
        dishes: dishes,
        mood: context.mood,
        budget: context.budget,
        hunger_level: context.hunger_level,
        mode: modeToUse,
        guests: guestsToUse,
        venue_type: venueToUse,
      });

      setRecommendationsData(response);
      setCurrentStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsRecommending(false);
    }
  };

  // Instant re-filter when switching modes on Results page without re-scanning
  const handleSwitchModeOnResults = async (newMode: 'personal' | 'custom') => {
    setActiveMode(newMode);
    if (!recommendationsData || dishes.length === 0) return;

    setIsSwitchingMode(true);
    setError(null);

    try {
      const groupBudget = newMode === 'custom'
        ? Math.max(800, guests.reduce((sum, g) => sum + (g.max_budget || 400), 0))
        : (recommendationsData.budget > 2500 ? 500 : recommendationsData.budget);
      const venueToUse = venueType || session?.venue_type || recommendationsData.venue_type || 'restaurant';

      const response = await menusApi.getRecommendations({
        session_id: session?.id,
        restaurant_name: restaurantName || session?.restaurant_name,
        dishes: dishes,
        mood: recommendationsData.mood || 'comfort_food',
        budget: groupBudget,
        hunger_level: recommendationsData.hunger_level || 'moderate',
        mode: newMode,
        guests: newMode === 'custom' ? guests : undefined,
        venue_type: venueToUse,
      });

      setRecommendationsData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to switch dining modes. Please try again.');
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleOpenOrderModal = (dish: DishRecommendation) => {
    setSelectedDishToOrder(dish);
    setOrderModalOpen(true);
  };

  const handleStartOver = () => {
    setSession(null);
    setRestaurantName('');
    setDishes([]);
    setRecommendationsData(null);
    setVenueType(null);
    localStorage.removeItem('mw_venue_type');
    setIsConciergeCompleted(false);
    setCurrentStep('input');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for Order Logged */}
      {orderLoggedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Meal logged! Your future recommendations will now take this into account.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="underline text-[11px] font-bold shrink-0 ml-3"
          >
            View History →
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Step Router */}
      {currentStep === 'input' && (
        <>
          {!isConciergeCompleted ? (
            /* Sequential Concierge Flow: Step 1 & Step 2 rendered strictly in the main page canvas */
            <div className="max-w-4xl mx-auto space-y-10 py-2 sm:py-4">
              {/* Step 1: Venue Selection Component (Cafe vs. Restaurant) */}
              <VenueSelection
                selectedVenue={venueType}
                onSelectVenue={(venue) => {
                  setVenueType(venue);
                  localStorage.setItem('mw_venue_type', venue);
                }}
              />

              {/* Step 2: Dining Persona Selection (Personal vs. Custom) */}
              {/* Smoothly revealed directly below Step 1 with a staggered fade-in animation */}
              {venueType && (
                <div className="pt-8 border-t border-stone-200/60 dark:border-stone-800/80 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <DiningPersonaSelection
                    selectedMode={activeMode}
                    onSelectMode={(mode) => setActiveMode(mode)}
                    onFinalizePersona={(mode) => {
                      setActiveMode(mode);
                      setIsConciergeCompleted(true);
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Step 3: Context-Aware Menu Ingestion smoothly slides into view */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ConciergeContextBar
                venueType={venueType || 'restaurant'}
                diningMode={activeMode}
                onEditContext={() => setIsConciergeCompleted(false)}
              />

              <Step1MenuInput
                venueType={venueType || 'restaurant'}
                diningMode={activeMode}
                onMenuExtracted={handleMenuExtracted}
              />
            </div>
          )}
        </>
      )}

      {currentStep === 'edit' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <ConciergeContextBar
            venueType={venueType || 'restaurant'}
            diningMode={activeMode}
            onEditContext={() => {
              setIsConciergeCompleted(false);
              setCurrentStep('input');
            }}
          />
          <Step1DishEditor
            restaurantName={restaurantName}
            dishes={dishes}
            onConfirmDishes={handleConfirmDishes}
            onBack={() => setCurrentStep('input')}
          />
        </div>
      )}

      {currentStep === 'mood' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <ConciergeContextBar
            venueType={venueType || 'restaurant'}
            diningMode={activeMode}
            onEditContext={() => {
              setIsConciergeCompleted(false);
              setCurrentStep('input');
            }}
          />
          <Step2MoodBudget
            onGetRecommendations={handleGetRecommendations}
            onBack={() => setCurrentStep('edit')}
            isLoading={isRecommending}
          />
        </div>
      )}

      {currentStep === 'results' && recommendationsData && (
        <Step3Recommendations
          restaurantName={restaurantName || recommendationsData.restaurant_name || 'Restaurant'}
          mood={recommendationsData.mood}
          budget={recommendationsData.budget}
          allDishes={dishes}
          recommendations={recommendationsData.recommendations}
          disclaimer={recommendationsData.disclaimer}
          mode={recommendationsData.mode || activeMode}
          venueType={venueType || recommendationsData.venue_type || 'restaurant'}
          guests={recommendationsData.guests || (activeMode === 'custom' ? guests : undefined)}
          guestRecommendations={recommendationsData.guest_recommendations}
          tableShareRecommendations={recommendationsData.table_share_recommendations}
          groupBillEstimate={recommendationsData.group_bill_estimate}
          onOrderDish={handleOpenOrderModal}
          onStartOver={handleStartOver}
          onSwitchMode={handleSwitchModeOnResults}
          isSwitchingMode={isSwitchingMode}
        />
      )}

      {/* Order Modal */}
      <OrderLogModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSaved={() => {
          setOrderLoggedSuccess(true);
          setTimeout(() => setOrderLoggedSuccess(false), 6000);
        }}
        defaultRestaurant={restaurantName || session?.restaurant_name || ''}
        defaultDish={selectedDishToOrder?.dish_name || ''}
        defaultPrice={selectedDishToOrder?.price || undefined}
        sessionId={session?.id}
      />
    </div>
  );
};
