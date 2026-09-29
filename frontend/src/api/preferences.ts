import { apiRequest } from './client';
import type { UserPreferences } from '../types';

export const preferencesApi = {
  getPreferences: (): Promise<UserPreferences> => {
    return apiRequest<UserPreferences>('/me/preferences');
  },

  updatePreferences: (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiRequest<UserPreferences>('/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
