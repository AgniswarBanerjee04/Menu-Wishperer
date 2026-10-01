import { apiRequest } from './client';
import type { AuthResponse, User } from '../types';

export const MOCK_USERS_STORAGE_KEY = 'mock_users';
export const ALT_MOCK_USERS_STORAGE_KEY = 'mw_mock_users';
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_PROFILE_KEY = 'user_profile';
export const MW_ACCESS_TOKEN_KEY = 'mw_access_token';
export const MW_REFRESH_TOKEN_KEY = 'mw_refresh_token';
export const CURRENT_MOCK_USER_KEY = 'mw_current_mock_user';

export interface StoredMockUser {
  id?: number;
  email: string;
  password?: string;
  name?: string;
  full_name?: string | null;
  mobile_number?: string | null;
  is_active?: boolean;
  has_preferences?: boolean;
  created_at?: string;
}

export const DEFAULT_DEMO_USERS = [
  { email: "demo@menuwhisperer.com", password: "Password123!", name: "Epicure Demo" }
];

export function initMockStorage(): void {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(MOCK_USERS_STORAGE_KEY)) {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
  }
}

export const DEMO_USER: User = {
  id: 1,
  email: 'demo@menuwhisperer.com',
  full_name: 'Alex Mercer (Demo)',
  mobile_number: '+91 9876543210',
  is_active: true,
  has_preferences: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

/**
 * Check if the application should use mock / localStorage auth fallback:
 * 1. Explicit VITE_USE_MOCK_AUTH flag
 * 2. Running on Vercel (*.vercel.app)
 * 3. No VITE_API_URL provided, or pointing to localhost when deployed on non-localhost
 */
export const isMissingBackend = (): boolean => {
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname || '';

  // Deployed on Vercel
  if (hostname.includes('vercel.app')) {
    return true;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  // If no backend URL provided at all
  if (!apiUrl) {
    return true;
  }

  // If in production/remote environment but URL points to localhost or fallback relative path
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocalhost) {
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1') || apiUrl === '/api/v1' || apiUrl.startsWith('/')) {
      return true;
    }
  }

  return false;
};

/**
 * Detect network failure or missing API endpoint (e.g. Vercel returning HTML index or 404 on /api routes)
 */
export const isNetworkError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('net::err_') ||
    msg.includes('connection refused') ||
    msg.includes('unexpected token <') ||
    msg.includes('not valid json') ||
    msg.includes('is not valid json') ||
    msg.includes('404') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('an error occurred') ||
    msg.includes('failed to load') ||
    err.name === 'TypeError' ||
    err.name === 'SyntaxError'
  );
};

/**
 * Generate a fake JWT token to allow authenticated route access
 */
export function createMockJwt(payload: Record<string, unknown>): string {
  const base64UrlEncode = (str: string): string => {
    try {
      const b64 = typeof btoa !== 'undefined' ? btoa(str) : '';
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return 'mock_token_segment';
    }
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) }));
  const signature = base64UrlEncode('mw_mock_sig_' + Math.random().toString(36).slice(2));
  return `${header}.${body}.${signature}`;
}

/**
 * Retrieve the existing mock_users array from localStorage.
 * If it doesn't exist, starts with an empty array.
 */
export function getMockUsersList(): StoredMockUser[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY) || localStorage.getItem(ALT_MOCK_USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save mock_users array back to localStorage
 */
export function saveMockUsersList(users: StoredMockUser[]): void {
  if (typeof localStorage === 'undefined') return;
  const json = JSON.stringify(users);
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, json);
  localStorage.setItem(ALT_MOCK_USERS_STORAGE_KEY, json);
}

/**
 * Set the active session (auth_token and user_profile) in localStorage
 */
export function setActiveSession(user: User, token: string): void {
  if (typeof localStorage === 'undefined') return;
  const userJson = JSON.stringify(user);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_PROFILE_KEY, userJson);
  localStorage.setItem(MW_ACCESS_TOKEN_KEY, token);
  localStorage.setItem(MW_REFRESH_TOKEN_KEY, token);
  localStorage.setItem(CURRENT_MOCK_USER_KEY, userJson);
}

/**
 * Clear the active session from localStorage
 */
export function clearActiveSession(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(MW_ACCESS_TOKEN_KEY);
  localStorage.removeItem(MW_REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_MOCK_USER_KEY);
}

/**
 * 1. registerUser (Signup):
 * - Retrieve existing array of users from localStorage under key `mock_users`.
 * - Append new user object { email, password, name } to this array and save it back.
 * - Set active session (auth_token and user_profile) and return success.
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
  full_name?: string;
  mobile_number?: string;
}): Promise<AuthResponse> {
  const submittedEmail = (data.email || '').trim();
  const submittedPassword = data.password || '';
  const name = (data.name || data.full_name || submittedEmail.split('@')[0] || 'Guest').trim();

  if (!submittedEmail) {
    throw new Error('Please enter a valid email address.');
  }

  // Instant demo bypass if registering as demo
  if (submittedEmail.toLowerCase() === 'demo@menuwhisperer.com') {
    return loginUser({ email: 'demo@menuwhisperer.com', password: submittedPassword });
  }

  const users = getMockUsersList();

  // Check if user already exists
  const existing = users.find(
    (u) => (u.email || '').trim().toLowerCase() === submittedEmail.toLowerCase()
  );
  if (existing) {
    throw new Error('A user with this email address already exists.');
  }

  const newUserRecord: StoredMockUser = {
    id: Date.now(),
    email: submittedEmail,
    name: name,
    full_name: name,
    password: submittedPassword,
    mobile_number: data.mobile_number?.trim() || null,
    is_active: true,
    has_preferences: false,
    created_at: new Date().toISOString(),
  };

  users.push(newUserRecord);
  saveMockUsersList(users);

  const userProfile: User = {
    id: newUserRecord.id!,
    email: newUserRecord.email,
    full_name: newUserRecord.name || newUserRecord.full_name || null,
    mobile_number: newUserRecord.mobile_number,
    is_active: true,
    has_preferences: false,
    created_at: newUserRecord.created_at!,
  };

  const fakeToken = createMockJwt({ sub: userProfile.email, id: userProfile.id, role: 'user' });
  setActiveSession(userProfile, fakeToken);

  return {
    access_token: fakeToken,
    refresh_token: fakeToken,
    token_type: 'bearer',
    user: userProfile,
  };
}

export const mockRegister = registerUser;

/**
 * 2. loginUser (Sign In):
 * - Retrieve the `mock_users` array from localStorage.
 * - Search the array for a user where user.email === submittedEmail and user.password === submittedPassword.
 * - If a match is found: Set auth_token and user_profile in localStorage and return success.
 * - If no match is found: Throw a safe UI error ("Invalid email or password.") so the form displays a red warning message.
 *
 * 3. Instant Demo Access:
 * - Immediately bypasses check when email is demo@menuwhisperer.com, setting fake token and logging in.
 */
export async function loginUser(data: { email: string; password: string }): Promise<AuthResponse> {
  const submittedEmail = (data.email || '').trim();
  const submittedPassword = data.password || '';

  // 3. Instant Demo Access bypass
  if (submittedEmail.toLowerCase() === 'demo@menuwhisperer.com') {
    const fakeDemoToken = createMockJwt({ sub: DEMO_USER.email, id: DEMO_USER.id, role: 'demo' });
    setActiveSession(DEMO_USER, fakeDemoToken);

    return {
      access_token: fakeDemoToken,
      refresh_token: fakeDemoToken,
      token_type: 'bearer',
      user: DEMO_USER,
    };
  }

  // 1. Retrieve the mock_users array from localStorage
  const users = getMockUsersList();

  // 2. Search for matching credentials
  const foundUser = users.find((user) => {
    const emailMatches = (user.email || '').trim().toLowerCase() === submittedEmail.toLowerCase();
    const passwordMatches = user.password === submittedPassword;
    return emailMatches && passwordMatches;
  });

  // If a match is found: Set auth_token and user_profile in localStorage and return success
  if (foundUser) {
    const userProfile: User = {
      id: foundUser.id || Date.now(),
      email: foundUser.email,
      full_name: foundUser.name || foundUser.full_name || foundUser.email.split('@')[0],
      mobile_number: foundUser.mobile_number || null,
      is_active: foundUser.is_active !== undefined ? foundUser.is_active : true,
      has_preferences: foundUser.has_preferences !== undefined ? foundUser.has_preferences : false,
      created_at: foundUser.created_at || new Date().toISOString(),
    };

    const fakeToken = createMockJwt({ sub: userProfile.email, id: userProfile.id, role: 'user' });
    setActiveSession(userProfile, fakeToken);

    return {
      access_token: fakeToken,
      refresh_token: fakeToken,
      token_type: 'bearer',
      user: userProfile,
    };
  }

  // If no match is found: Throw safe UI error
  throw new Error('Invalid email or password.');
}

export const mockLogin = loginUser;

/**
 * Mock getMe implementation reading active session from localStorage
 */
export function mockGetMe(): User {
  if (typeof localStorage !== 'undefined') {
    const rawProfile = localStorage.getItem(USER_PROFILE_KEY) || localStorage.getItem(CURRENT_MOCK_USER_KEY);
    if (rawProfile) {
      try {
        return JSON.parse(rawProfile) as User;
      } catch {
        // ignore
      }
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(MW_ACCESS_TOKEN_KEY);
    if (token) {
      return DEMO_USER;
    }
  }
  throw new Error('Not authenticated.');
}

/**
 * Mock updateMe implementation saving to localStorage
 */
export function mockUpdateMe(data: { full_name?: string; email?: string; mobile_number?: string }): User {
  const current = mockGetMe();
  const updatedUser: User = {
    ...current,
    full_name: data.full_name !== undefined ? data.full_name : current.full_name,
    email: data.email !== undefined ? data.email : current.email,
    mobile_number: data.mobile_number !== undefined ? data.mobile_number : current.mobile_number,
  };

  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(MW_ACCESS_TOKEN_KEY) || 'mock_token';
    setActiveSession(updatedUser, token);

    const users = getMockUsersList();
    const idx = users.findIndex(
      (u) => u.id === updatedUser.id || (u.email || '').toLowerCase() === updatedUser.email.toLowerCase()
    );
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...updatedUser,
        name: updatedUser.full_name || users[idx].name,
      };
      saveMockUsersList(users);
    }
  }

  return updatedUser;
}

export const authApi = {
  register: async (data: { email: string; password: string; full_name?: string; mobile_number?: string; name?: string }): Promise<AuthResponse> => {
    if (isMissingBackend()) {
      return registerUser(data);
    }
    try {
      return await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('[Auth] Backend unavailable, using local mock database register fallback:', err.message);
        return registerUser(data);
      }
      throw err;
    }
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    // Instant Demo Access bypass
    if (normalizedEmail === 'demo@menuwhisperer.com') {
      return loginUser(data);
    }
    if (isMissingBackend()) {
      return loginUser(data);
    }
    try {
      return await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('[Auth] Backend unavailable, using local mock database login fallback:', err.message);
        return loginUser(data);
      }
      throw err;
    }
  },

  getMe: async (): Promise<User> => {
    if (isMissingBackend()) {
      return mockGetMe();
    }
    try {
      return await apiRequest<User>('/auth/me');
    } catch (err: any) {
      try {
        return mockGetMe();
      } catch {
        throw err;
      }
    }
  },

  updateMe: async (data: { full_name?: string; email?: string; mobile_number?: string }): Promise<User> => {
    if (isMissingBackend()) {
      return mockUpdateMe(data);
    }
    try {
      return await apiRequest<User>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        return mockUpdateMe(data);
      }
      throw err;
    }
  },

  demoLogin: async (): Promise<AuthResponse> => {
    return loginUser({ email: 'demo@menuwhisperer.com', password: 'Password123!' });
  },
};
