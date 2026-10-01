export interface User {
  id: number;
  email: string;
  full_name: string | null;
  mobile_number?: string | null;
  is_active: boolean;
  has_preferences: boolean;
  is_diabetic?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface UserPreferences {
  id?: number;
  user_id?: number;
  dietary_restrictions: string[];
  spice_tolerance: 'none' | 'mild' | 'medium' | 'high' | 'extreme';
  cuisines_liked: string[];
  cuisines_disliked: string[];
  default_budget_min: number;
  default_budget_max: number;
  currency: string;
  is_diabetic?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExtractedDish {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  dietary?: 'veg' | 'non-veg' | 'egg' | 'unknown';
  spice_level?: 'mild' | 'medium' | 'spicy';
}

export type VenueType = 'cafe' | 'restaurant';
export type DiningMode = 'personal' | 'custom';

export interface MenuSession {
  id: number;
  restaurant_name?: string;
  raw_input_type: 'image' | 'text' | 'qr';
  venue_type?: VenueType;
  dining_mode?: DiningMode;
  dishes: ExtractedDish[];
}

export interface DishRecommendation {
  dish_name: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  dietary?: 'veg' | 'non-veg' | 'egg' | 'unknown';
  spice_level?: 'mild' | 'medium' | 'spicy';
  match_score: number;
  reasoning: string;
  warnings?: string;
  is_diabetic_safe?: boolean;
  has_sugar_alert?: boolean;
}

export type GuestDietary = 'veg' | 'non-veg' | 'egg' | 'jain' | 'gluten-free' | 'diabetic_safe';
export type GuestSpice = 'mild' | 'medium' | 'spicy';

export interface GuestProfile {
  id: string;
  name: string;
  dietary: GuestDietary;
  spice_level: GuestSpice;
  max_budget?: number;
  is_diabetic?: boolean;
}

export interface GuestBillBreakdown {
  guest_id: string;
  guest_name: string;
  allocated_cost: number;
  budget_cap?: number;
  is_within_budget: boolean;
  recommended_dishes: string[];
}

export interface GroupBillEstimate {
  total_cost: number;
  total_budget: number;
  per_person_average: number;
  breakdown: GuestBillBreakdown[];
  is_within_budget: boolean;
}

export interface GroupPreset {
  id: string;
  name: string;
  description?: string;
  guests: GuestProfile[];
}

export interface RecommendResponse {
  session_id?: number;
  restaurant_name?: string;
  mood: string;
  budget: number;
  hunger_level: string;
  mode?: 'personal' | 'custom';
  venue_type?: VenueType;
  recommendations: DishRecommendation[];
  guests?: GuestProfile[];
  guest_recommendations?: Record<string, DishRecommendation[]>;
  table_share_recommendations?: DishRecommendation[];
  group_bill_estimate?: GroupBillEstimate;
  disclaimer: string;
}


export interface OrderItem {
  id: number;
  user_id: number;
  restaurant_name: string;
  dish_name: string;
  price?: number;
  rating: number;
  note?: string;
  session_id?: number;
  created_at: string;
}

export interface InsightsData {
  total_orders: number;
  average_rating: number;
  average_spend: number;
  favorite_cuisines: string[];
  highest_rated_dishes: { name: string; restaurant: string; rating: number }[];
  rating_distribution: Record<number, number>;
}
