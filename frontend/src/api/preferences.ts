import { apiRequest } from './client';
import type { UserPreferences } from '../types';
import { isMissingBackend, isNetworkError } from './auth';

const MOCK_PREFERENCES_KEY = 'mw_mock_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  dietary_restrictions: [],
  spice_tolerance: 'medium',
  cuisines_liked: ['North Indian', 'Biryani / Awadhi', 'Tandoor & Kebab'],
  cuisines_disliked: [],
  default_budget_min: 300,
  default_budget_max: 1200,
  currency: 'INR',
};

function getLocalPreferences(): UserPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(MOCK_PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function saveLocalPreferences(data: Partial<UserPreferences>): UserPreferences {
  const current = getLocalPreferences();
  const updated: UserPreferences = {
    ...current,
    ...data,
    updated_at: new Date().toISOString(),
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MOCK_PREFERENCES_KEY, JSON.stringify(updated));
  }
  return updated;
}

export const preferencesApi = {
  getPreferences: async (): Promise<UserPreferences> => {
    if (isMissingBackend()) {
      return getLocalPreferences();
    }
    try {
      return await apiRequest<UserPreferences>('/me/preferences');
    } catch (err: any) {
      if (isNetworkError(err)) {
        return getLocalPreferences();
      }
      throw err;
    }
  },

  updatePreferences: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    if (isMissingBackend()) {
      return saveLocalPreferences(data);
    }
    try {
      return await apiRequest<UserPreferences>('/me/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        return saveLocalPreferences(data);
      }
      throw err;
    }
  },
};
