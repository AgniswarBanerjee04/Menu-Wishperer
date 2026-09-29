import { apiRequest } from './client';
import type { MenuSession, ExtractedDish, RecommendResponse, VenueType, DiningMode } from '../types';

export const menusApi = {
  extractFromImage: async (
    file: File,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
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
    return apiRequest<MenuSession>('/menus/extract', {
      method: 'POST',
      body: formData,
    });
  },

  extractFromText: async (
    text: string,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
    return apiRequest<MenuSession>('/menus/extract-text', {
      method: 'POST',
      body: JSON.stringify({
        text,
        restaurant_name: restaurantName || undefined,
        venue_type: venueType || 'restaurant',
        dining_mode: diningMode || 'personal',
      }),
    });
  },

  extractFromQR: async (
    url: string,
    restaurantName?: string,
    venueType?: VenueType,
    diningMode?: DiningMode
  ): Promise<MenuSession> => {
    return apiRequest<MenuSession>('/menus/qr-ingest', {
      method: 'POST',
      body: JSON.stringify({
        url,
        restaurant_name: restaurantName || undefined,
        venue_type: venueType || 'restaurant',
        dining_mode: diningMode || 'personal',
      }),
    });
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
    guests?: import('../types').GuestProfile[];
  }): Promise<RecommendResponse> => {
    return apiRequest<RecommendResponse>('/menus/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};


