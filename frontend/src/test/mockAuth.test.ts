import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  authApi,
  mockLogin,
  mockRegister,
  mockGetMe,
  mockUpdateMe,
  hashPassword,
  createMockJwt,
  isMissingBackend,
  isNetworkError,
  DEMO_USER,
  MOCK_USERS_STORAGE_KEY,
  CURRENT_MOCK_USER_KEY,
} from '../api/auth';

describe('Mock / LocalStorage Auth Fallback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isMissingBackend', () => {
    it('detects Vercel deployment hostname', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { hostname: 'menu-whisperer-app.vercel.app' };

      expect(isMissingBackend()).toBe(true);

      (window as any).location = originalLocation;
    });

    it('detects remote production hostname with missing or localhost API URL', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { hostname: 'menuwhisperer.com' };

      expect(isMissingBackend()).toBe(true);

      (window as any).location = originalLocation;
    });
  });

  describe('isNetworkError', () => {
    it('identifies browser fetch network failures', () => {
      expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(true);
      expect(isNetworkError(new SyntaxError("Unexpected token '<', \"<!doctype \"... is not valid JSON"))).toBe(true);
      expect(isNetworkError(new Error('Server returned 404'))).toBe(true);
      expect(isNetworkError(new Error('Invalid password'))).toBe(false);
    });
  });

  describe('hashPassword and createMockJwt', () => {
    it('hashes passwords deterministically', async () => {
      const hash1 = await hashPassword('Secret123!');
      const hash2 = await hashPassword('Secret123!');
      const hashOther = await hashPassword('DifferentPassword');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOther);
      expect(hash1.length).toBeGreaterThan(10);
    });

    it('generates well-formed 3-part mock JWT tokens', () => {
      const token = createMockJwt({ sub: 'user@example.com', id: 42 });
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('Instant Demo Access Bypass', () => {
    it('logs in immediately for demo@menuwhisperer.com without server call', async () => {
      const res = await authApi.login({
        email: 'demo@menuwhisperer.com',
        password: 'Password123!',
      });

      expect(res.user.email).toBe(DEMO_USER.email);
      expect(res.user.full_name).toBe(DEMO_USER.full_name);
      expect(res.access_token).toBeDefined();
      expect(res.refresh_token).toBeDefined();
      expect(localStorage.getItem(CURRENT_MOCK_USER_KEY)).toContain('demo@menuwhisperer.com');
    });

    it('accepts demo login via demoLogin helper directly', async () => {
      const res = await authApi.demoLogin();
      expect(res.user.email).toBe('demo@menuwhisperer.com');
      expect(res.token_type).toBe('bearer');
    });
  });

  describe('Mock User Registration & Login in localStorage', () => {
    it('registers a new user and saves hashed password in localStorage', async () => {
      const res = await mockRegister({
        email: 'foodie@delhi.com',
        password: 'SpicyFood99!',
        full_name: 'Priya Sharma',
        mobile_number: '+91 9876543210',
      });

      expect(res.user.email).toBe('foodie@delhi.com');
      expect(res.user.full_name).toBe('Priya Sharma');
      expect(res.user.mobile_number).toBe('+91 9876543210');

      // Verify localStorage storage
      const rawStored = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
      expect(rawStored).toBeTruthy();
      const stored = JSON.parse(rawStored!);
      expect(stored).toHaveLength(1);
      expect(stored[0].email).toBe('foodie@delhi.com');
      expect(stored[0].passwordHash).toBeDefined();
      expect(stored[0].passwordHash).not.toBe('SpicyFood99!'); // Password must be hashed
    });

    it('rejects registration with duplicate email', async () => {
      await mockRegister({
        email: 'chef@kitchen.com',
        password: 'Password123!',
        full_name: 'Chef Gordon',
      });

      await expect(
        mockRegister({
          email: 'chef@kitchen.com',
          password: 'AnotherPassword!',
          full_name: 'Imposter',
        })
      ).rejects.toThrow('A user with this email address already exists.');
    });

    it('validates credentials on login against stored hashed password', async () => {
      await mockRegister({
        email: 'taster@test.com',
        password: 'SecretPass123!',
        full_name: 'Taste Tester',
      });

      // Successful login
      const loginRes = await mockLogin({
        email: 'taster@test.com',
        password: 'SecretPass123!',
      });
      expect(loginRes.user.email).toBe('taster@test.com');
      expect(loginRes.access_token).toBeDefined();

      // Wrong password
      await expect(
        mockLogin({
          email: 'taster@test.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password.');

      // Non-existent email
      await expect(
        mockLogin({
          email: 'unknown@user.com',
          password: 'AnyPassword',
        })
      ).rejects.toThrow('Invalid email or password.');
    });

    it('allows mock getMe and updateMe', async () => {
      await mockRegister({
        email: 'me@test.com',
        password: 'Password123!',
        full_name: 'Original Name',
      });

      const me = mockGetMe();
      expect(me.email).toBe('me@test.com');
      expect(me.full_name).toBe('Original Name');

      const updated = mockUpdateMe({
        full_name: 'Updated Name',
        mobile_number: '+91 9999999999',
      });

      expect(updated.full_name).toBe('Updated Name');
      expect(updated.mobile_number).toBe('+91 9999999999');

      const reFetched = mockGetMe();
      expect(reFetched.full_name).toBe('Updated Name');
    });
  });
});
