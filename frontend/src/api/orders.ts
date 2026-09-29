import { apiRequest } from './client';
import type { OrderItem, InsightsData } from '../types';

export const ordersApi = {
  createOrder: async (data: {
    restaurant_name: string;
    dish_name: string;
    price?: number;
    rating: number;
    note?: string;
    session_id?: number;
  }): Promise<OrderItem> => {
    return apiRequest<OrderItem>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getOrders: async (params?: { search?: string; min_rating?: number }): Promise<OrderItem[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.min_rating) query.set('min_rating', params.min_rating.toString());
    const qs = query.toString();
    return apiRequest<OrderItem[]>(`/orders${qs ? `?${qs}` : ''}`);
  },

  getInsights: async (): Promise<InsightsData> => {
    return apiRequest<InsightsData>('/insights');
  },
};
