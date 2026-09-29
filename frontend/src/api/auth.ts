import { apiRequest } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; mobile_number?: string }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: (data: { email: string; password: string }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },

  updateMe: (data: { full_name?: string; email?: string; mobile_number?: string }): Promise<User> => {
    return apiRequest<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
