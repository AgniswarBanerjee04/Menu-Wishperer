import { apiRequest } from './client';
import { isMissingBackend, isNetworkError } from './auth';
import { isDiabeticProfile, checkDishSugar } from '../utils/diabetic';
import type {
  MenuSession,
  ExtractedDish,
  DishRecommendation,
  RecommendResponse,
  VenueType,
  DiningMode,
  GuestProfile,
  GroupBillEstimate,
} from '../types';

export const DEFAULT_RESTAURANT_DISHES: ExtractedDish[] = [
  {
    id: '1',
    name: 'Murgh Malai Tikka',
    description: 'Creamy char-grilled chicken infused with cardamom, mace, and royal cheese',
    price: 420,
    dietary: 'non-veg',
    spice_level: 'mild',
    category: 'Appetizers',
  },
  {
    id: '2',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese cubes simmered in a velvet tomato, butter, and cashew gravy',
    price: 340,
    dietary: 'veg',
    spice_level: 'medium',
    category: 'Mains',
  },
  {
    id: '3',
    name: 'Dal Makhani (Full)',
    description: 'Slow-simmered black lentils enriched with churned butter and dairy cream',
    price: 280,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Mains',
  },
  {
    id: '4',
    name: 'Butter Garlic Naan',
    description: 'Leavened clay-oven flatbread topped with toasted garlic and melted butter',
    price: 85,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Breads',
  },
  {
    id: '5',
    name: 'Subz Dum Biryani',
    description: 'Fragrant basmati rice layered with seasonal vegetables, saffron, and mint',
    price: 320,
    dietary: 'veg',
    spice_level: 'medium',
    category: 'Rice',
  },
  {
    id: '6',
    name: 'Brown Garlic Hakka Noodles',
    description: 'Wok-tossed noodles with caramelized brown garlic, scallions, and peppers',
    price: 160,
    dietary: 'veg',
    spice_level: 'medium',
    category: 'Chinese',
  },
  {
    id: '7',
    name: 'Egg Fried Rice',
    description: 'Classic wok-tossed aromatic rice with fluffy eggs and spring greens',
    price: 145,
    dietary: 'egg',
    spice_level: 'mild',
    category: 'Rice',
  },
  {
    id: '8',
    name: 'Gulab Jamun with Rabri',
    description: 'Warm golden milk dumplings soaked in cardamom syrup with condensed milk',
    price: 140,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Dessert',
  },
];

export const DEFAULT_CAFE_DISHES: ExtractedDish[] = [
  {
    id: 'c1',
    name: 'Artisanal Pour-Over Coffee',
    description: 'Single-origin washed Arabica with bright floral and citrus notes',
    price: 220,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Brew Bar',
  },
  {
    id: 'c2',
    name: 'Spanish Iced Latte',
    description: 'Double espresso pulled over chilled milk and artisanal condensed cream',
    price: 240,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Iced Coffee',
  },
  {
    id: 'c3',
    name: 'Flat White with Oat Milk',
    description: 'Velvety micro-foam poured over a rich double ristretto shot',
    price: 230,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Hot Coffee',
  },
  {
    id: 'c4',
    name: 'Sourdough Avocado & Poached Egg Toast',
    description: 'Toasted artisanal country sourdough with crushed Hass avocado and organic poached egg',
    price: 320,
    dietary: 'egg',
    spice_level: 'mild',
    category: 'All-Day Breakfast',
  },
  {
    id: 'c5',
    name: 'Truffle Mushroom Melt Panini',
    description: 'Sautéed wild forest mushrooms with melted smoked provolone on ciabatta',
    price: 340,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Paninis & Toasts',
  },
  {
    id: 'c6',
    name: 'Smoked Chicken & Pesto Croissant',
    description: 'Butter flaky croissant stuffed with tender smoked chicken breast and basil pesto',
    price: 360,
    dietary: 'non-veg',
    spice_level: 'mild',
    category: 'Viennoiserie & Savory',
  },
  {
    id: 'c7',
    name: 'Almond Butter & Pain Au Chocolat',
    description: 'Twice-baked French chocolate croissant crowned with sliced toasted almonds',
    price: 180,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Pastry',
  },
  {
    id: 'c8',
    name: 'Acai Berry Granola Bowl',
    description: 'Organic acai puree topped with honey-toasted granola, chia, and fresh berries',
    price: 310,
    dietary: 'veg',
    spice_level: 'mild',
    category: 'Bowls',
  },
];

function createFallbackMenuSession(
  rawInputType: 'image' | 'text' | 'qr',
  restaurantName?: string,
  venueType: VenueType = 'restaurant',
  diningMode: DiningMode = 'personal'
): MenuSession {
  const isCafe = venueType === 'cafe';
  const dishes = isCafe ? [...DEFAULT_CAFE_DISHES] : [...DEFAULT_RESTAURANT_DISHES];
  const name =
    restaurantName && restaurantName.trim()
      ? restaurantName.trim()
      : isCafe
      ? 'Artisanal Roast & Baker Café'
      : 'Royal Dawat Heritage Kitchen';

  return {
    id: Date.now(),
    restaurant_name: name,
    raw_input_type: rawInputType,
    venue_type: venueType,
    dining_mode: diningMode,
    dishes,
  };
}

function generateMockRecommendations(payload: {
  restaurant_name?: string;
  dishes: ExtractedDish[];
  mood: string;
  budget: number;
  hunger_level: string;
  mode?: 'personal' | 'custom';
  venue_type?: VenueType;
  guests?: GuestProfile[];
}): RecommendResponse {
  const {
    restaurant_name = 'Table Recommendation',
    dishes = [],
    mood = 'comfort_food',
    budget = 600,
    hunger_level = 'moderate',
    mode = 'personal',
    venue_type = 'restaurant',
    guests = [],
  } = payload;

  const dishList = dishes.length > 0 ? dishes : venue_type === 'cafe' ? DEFAULT_CAFE_DISHES : DEFAULT_RESTAURANT_DISHES;
  const isDiabetic = isDiabeticProfile();

  // Score dishes based on budget, mood, and diabetic health profile
  const scoredDishes: DishRecommendation[] = dishList.map((dish, index) => {
    const price = dish.price || 250;
    const isUnderBudget = price <= budget;
    let baseScore = isUnderBudget ? 94 - index * 3 : 75 - index * 4;

    const sugarCheck = checkDishSugar(dish.name, dish.description, dish.category);
    let warnings: string | undefined = undefined;
    const is_diabetic_safe = !sugarCheck.isSugarHeavy;
    const has_sugar_alert = sugarCheck.isSugarHeavy;

    if (isDiabetic) {
      if (sugarCheck.isSugarHeavy) {
        baseScore -= 45;
        warnings = sugarCheck.warningText || '⚠️ High Sugar Alert: Contains added sugar or sweetened syrup. Not recommended for strict diabetic management.';
      } else {
        baseScore += 10;
      }
    }

    const matchScore = Math.max(40, Math.min(99, baseScore));

    return {
      dish_name: dish.name,
      description: dish.description || `${dish.name} prepared with curated seasonal ingredients`,
      price: dish.price,
      currency: 'INR',
      category: dish.category || 'Specialty',
      dietary: dish.dietary || 'veg',
      spice_level: dish.spice_level || 'medium',
      match_score: matchScore,
      reasoning: isDiabetic && is_diabetic_safe
        ? `Diabetic Safe Pick: Low-glycemic, savory dish honoring your ${mood.replace('_', ' ')} craving and ₹${budget} budget.`
        : `Selected for your ${mood.replace('_', ' ')} mood and ₹${budget} budget cap.`,
      warnings,
      is_diabetic_safe,
      has_sugar_alert,
    };
  });

  scoredDishes.sort((a, b) => b.match_score - a.match_score);
  const topRecommendations = scoredDishes.slice(0, 4);

  // Group calculations if custom mode
  let guestRecs: Record<string, DishRecommendation[]> | undefined;
  let tableShareRecs: DishRecommendation[] | undefined;
  let groupBill: GroupBillEstimate | undefined;

  if (mode === 'custom' && guests.length > 0) {
    guestRecs = {};
    guests.forEach((guest, i) => {
      const isGuestDiabetic = guest.dietary === 'diabetic_safe' || guest.is_diabetic;
      const eligibleDishes = isGuestDiabetic
        ? scoredDishes.filter(d => d.is_diabetic_safe)
        : scoredDishes;
      const pool = eligibleDishes.length > 0 ? eligibleDishes : scoredDishes;

      guestRecs![guest.id] = [
        pool[(i * 2) % pool.length] || pool[0],
        pool[(i * 2 + 1) % pool.length] || pool[1] || pool[0],
      ];
    });

    tableShareRecs = scoredDishes.filter(d => !isDiabetic || d.is_diabetic_safe).slice(0, 2);

    const breakdown = guests.map((guest) => {
      const recs = guestRecs![guest.id] || [];
      const cost = recs.reduce((sum, d) => sum + (d.price || 200), 0);
      return {
        guest_id: guest.id,
        guest_name: guest.name,
        allocated_cost: cost,
        budget_cap: guest.max_budget,
        is_within_budget: guest.max_budget ? cost <= guest.max_budget : true,
        recommended_dishes: recs.map((r) => r.dish_name),
      };
    });

    const totalCost = breakdown.reduce((sum, b) => sum + b.allocated_cost, 0);
    const totalBudget = guests.reduce((sum, g) => sum + (g.max_budget || 500), 0);

    groupBill = {
      total_cost: totalCost,
      total_budget: totalBudget,
      per_person_average: Math.round(totalCost / guests.length),
      breakdown,
      is_within_budget: totalCost <= totalBudget,
    };
  }

  return {
    restaurant_name,
    mood,
    budget,
    hunger_level,
    disclaimer:
      'Recommendations curated using Menu Whisperer taste intelligence. Prices and availability subject to venue confirmation.',
    recommendations: topRecommendations,
    mode,
    venue_type,
    guest_recommendations: guestRecs,
    table_share_recommendations: tableShareRecs,
    group_bill_estimate: groupBill,
  };
}

export const menusApi = {
  extractFromImage: async (
    file: File,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
    if (isMissingBackend()) {
      return createFallbackMenuSession('image', restaurantName, venueType, diningMode);
    }
    const formData = new FormData();
    formData.append('file', file);
    if (restaurantName) {
      formData.append('restaurant_name', restaurantName);
    }
    if (venueType) {
      formData.append('venue_type', venueType);
    }
    if (diningMode) {
      formData.append('dining_mode', diningMode);
    }
    try {
      return await apiRequest<MenuSession>('/menus/extract', {
        method: 'POST',
        body: formData,
      });
    } catch (err: any) {
      if (isNetworkError(err) || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.warn('[Menus] Backend unavailable for image extraction, using fallback menu session:', err.message);
        return createFallbackMenuSession('image', restaurantName, venueType, diningMode);
      }
      throw err;
    }
  },

  extractFromText: async (
    text: string,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
    if (isMissingBackend()) {
      return createFallbackMenuSession('text', restaurantName, venueType, diningMode);
    }
    try {
      return await apiRequest<MenuSession>('/menus/extract-text', {
        method: 'POST',
        body: JSON.stringify({
          text,
          restaurant_name: restaurantName || undefined,
          venue_type: venueType || 'restaurant',
          dining_mode: diningMode || 'personal',
        }),
      });
    } catch (err: any) {
      if (isNetworkError(err) || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.warn('[Menus] Backend unavailable for text extraction, using fallback menu session:', err.message);
        return createFallbackMenuSession('text', restaurantName, venueType, diningMode);
      }
      throw err;
    }
  },

  extractFromQR: async (
    url: string,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
    if (isMissingBackend()) {
      return createFallbackMenuSession('qr', restaurantName, venueType, diningMode);
    }
    try {
      return await apiRequest<MenuSession>('/menus/qr-ingest', {
        method: 'POST',
        body: JSON.stringify({
          url,
          restaurant_name: restaurantName || undefined,
          venue_type: venueType || 'restaurant',
          dining_mode: diningMode || 'personal',
        }),
      });
    } catch (err: any) {
      if (isNetworkError(err) || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.warn('[Menus] Backend unavailable for QR extraction, using fallback menu session:', err.message);
        return createFallbackMenuSession('qr', restaurantName, venueType, diningMode);
      }
      throw err;
    }
  },

  getRecommendations: async (payload: {
    session_id?: number;
    restaurant_name?: string;
    dishes: ExtractedDish[];
    mood: string;
    budget: number;
    hunger_level: string;
    mode?: 'personal' | 'custom';
    venue_type?: VenueType;
    guests?: GuestProfile[];
  }): Promise<RecommendResponse> => {
    if (isMissingBackend()) {
      return generateMockRecommendations(payload);
    }
    try {
      return await apiRequest<RecommendResponse>('/menus/recommend', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          is_diabetic: isDiabeticProfile(),
        }),
      });
    } catch (err: any) {
      if (isNetworkError(err) || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.warn('[Menus] Backend unavailable for recommendations, using fallback recommendations:', err.message);
        return generateMockRecommendations(payload);
      }
      throw err;
    }
  },
};
