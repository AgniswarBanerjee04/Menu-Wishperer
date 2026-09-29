import { apiRequest } from './client';
import type { AuthResponse, User } from '../types';

export const MOCK_USERS_STORAGE_KEY = 'mw_mock_users';
export const CURRENT_MOCK_USER_KEY = 'mw_current_mock_user';

export interface StoredMockUser extends User {
  passwordHash: string;
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
 * Detect network failure or missing API endpoint (e.g. Vercel returning HTML index on /api routes)
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
    err.name === 'TypeError' ||
    err.name === 'SyntaxError'
  );
};

/**
 * SHA-256 password hashing using Web Crypto API with fallback
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  // Safe deterministic hash fallback
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  return 'mw_mock_hash_' + (hash >>> 0).toString(16);
}

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

export function getStoredMockUsers(): StoredMockUser[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredMockUsers(users: StoredMockUser[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Mock Register implementation using localStorage
 */
export async function mockRegister(data: {
  email: string;
  password: string;
  full_name?: string;
  mobile_number?: string;
}): Promise<AuthResponse> {
  const normalizedEmail = (data.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Please enter a valid email address.');
  }

  // If registering as demo email, route immediately to demo login
  if (normalizedEmail === 'demo@menuwhisperer.com') {
    return mockLogin({ email: 'demo@menuwhisperer.com', password: data.password });
  }

  const users = getStoredMockUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('A user with this email address already exists.');
  }

  const passwordHash = await hashPassword(data.password);
  const newUser: User = {
    id: Date.now(),
    email: normalizedEmail,
    full_name: data.full_name?.trim() || normalizedEmail.split('@')[0],
    mobile_number: data.mobile_number?.trim() || null,
    is_active: true,
    has_preferences: false,
    created_at: new Date().toISOString(),
  };

  users.push({ ...newUser, passwordHash });
  saveStoredMockUsers(users);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(newUser));
  }

  const access_token = createMockJwt({ sub: newUser.email, id: newUser.id, role: 'user' });
  const refresh_token = createMockJwt({ sub: newUser.email, id: newUser.id, type: 'refresh' });

  return {
    access_token,
    refresh_token,
    token_type: 'bearer',
    user: newUser,
  };
}

/**
 * Mock Login implementation using localStorage
 */
export async function mockLogin(data: { email: string; password: string }): Promise<AuthResponse> {
  const normalizedEmail = (data.email || '').trim().toLowerCase();

  // Instant Demo Access bypass (demo@menuwhisperer.com)
  if (normalizedEmail === 'demo@menuwhisperer.com') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(DEMO_USER));
    }
    const access_token = createMockJwt({ sub: DEMO_USER.email, id: DEMO_USER.id, role: 'demo' });
    const refresh_token = createMockJwt({ sub: DEMO_USER.email, id: DEMO_USER.id, type: 'refresh' });

    return {
      access_token,
      refresh_token,
      token_type: 'bearer',
      user: DEMO_USER,
    };
  }

  const users = getStoredMockUsers();
  const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!foundUser) {
    throw new Error('Invalid email or password.');
  }

  const inputHash = await hashPassword(data.password);
  if (foundUser.passwordHash !== inputHash) {
    throw new Error('Invalid email or password.');
  }

  const { passwordHash: _, ...cleanUser } = foundUser;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(cleanUser));
  }

  const access_token = createMockJwt({ sub: cleanUser.email, id: cleanUser.id });
  const refresh_token = createMockJwt({ sub: cleanUser.email, id: cleanUser.id, type: 'refresh' });

  return {
    access_token,
    refresh_token,
    token_type: 'bearer',
    user: cleanUser,
  };
}

/**
 * Mock getMe implementation reading from localStorage
 */
export function mockGetMe(): User {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(CURRENT_MOCK_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        // ignore
      }
    }
    // Fallback: if token exists in localStorage, return demo user
    const token = localStorage.getItem('mw_access_token');
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
    localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(updatedUser));
    const users = getStoredMockUsers();
    const idx = users.findIndex(
      (u) => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase()
    );
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      saveStoredMockUsers(users);
    }
  }

  return updatedUser;
}

export const authApi = {
  register: async (data: { email: string; password: string; full_name?: string; mobile_number?: string }): Promise<AuthResponse> => {
    if (isMissingBackend()) {
      return mockRegister(data);
    }
    try {
      return await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('[Auth] Backend unavailable, using local mock register fallback:', err.message);
        return mockRegister(data);
      }
      throw err;
    }
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    // Instant Demo Access bypass or missing backend
    if (normalizedEmail === 'demo@menuwhisperer.com' || isMissingBackend()) {
      return mockLogin(data);
    }
    try {
      return await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('[Auth] Backend unavailable, using local mock login fallback:', err.message);
        return mockLogin(data);
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
      if (isNetworkError(err)) {
        return mockGetMe();
      }
      throw err;
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
    return mockLogin({ email: 'demo@menuwhisperer.com', password: 'Password123!' });
  },
};
