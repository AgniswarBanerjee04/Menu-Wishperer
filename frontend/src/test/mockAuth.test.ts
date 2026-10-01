import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  authApi,
  registerUser,
  loginUser,
  mockLogin,
  mockRegister,
  mockGetMe,
  mockUpdateMe,
  isMissingBackend,
  isNetworkError,
  DEMO_USER,
  MOCK_USERS_STORAGE_KEY,
  AUTH_TOKEN_KEY,
  USER_PROFILE_KEY,
} from '../api/auth';

describe('Local Storage Mock Database Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. registerUser (Signup)', () => {
    it('creates an empty array if mock_users does not exist and appends new user with email, password, name', async () => {
      expect(localStorage.getItem(MOCK_USERS_STORAGE_KEY)).toBeNull();

      const result = await registerUser({
        email: 'priya@delhidining.com',
        password: 'Password123!',
        name: 'Priya Sharma',
      });

      // 1. Returns success
      expect(result.user.email).toBe('priya@delhidining.com');
      expect(result.user.full_name).toBe('Priya Sharma');
      expect(result.access_token).toBeDefined();

      // 2. Saved to mock_users array in localStorage
      const storedRaw = localStorage.getItem('mock_users');
      expect(storedRaw).toBeTruthy();
      const users = JSON.parse(storedRaw!);
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('priya@delhidining.com');
      expect(users[0].password).toBe('Password123!');
      expect(users[0].name).toBe('Priya Sharma');

      // 3. Sets active session (auth_token and user_profile)
      expect(localStorage.getItem('auth_token')).toBe(result.access_token);
      const profileRaw = localStorage.getItem('user_profile');
      expect(profileRaw).toBeTruthy();
      const profile = JSON.parse(profileRaw!);
      expect(profile.email).toBe('priya@delhidining.com');
      expect(profile.full_name).toBe('Priya Sharma');
    });

    it('rejects duplicate email registrations', async () => {
      await registerUser({
        email: 'chef@kitchen.com',
        password: 'Password123!',
        name: 'Chef Gordon',
      });

      await expect(
        registerUser({
          email: 'chef@kitchen.com',
          password: 'DifferentPassword!',
          name: 'Imposter',
        })
      ).rejects.toThrow('A user with this email address already exists.');
    });
  });

  describe('2. loginUser (Sign In)', () => {
    beforeEach(async () => {
      // Pre-register test user in mock_users
      await registerUser({
        email: 'taster@bukhara.com',
        password: 'MySecretPassword99!',
        name: 'Dal Makhani Fan',
      });
    });

    it('successfully logs in when user.email and user.password match submitted credentials', async () => {
      const result = await loginUser({
        email: 'taster@bukhara.com',
        password: 'MySecretPassword99!',
      });

      expect(result.user.email).toBe('taster@bukhara.com');
      expect(result.user.full_name).toBe('Dal Makhani Fan');
      expect(result.access_token).toBeDefined();

      // Sets auth_token and user_profile in localStorage
      expect(localStorage.getItem('auth_token')).toBe(result.access_token);
      expect(localStorage.getItem('user_profile')).toContain('taster@bukhara.com');
    });

    it('throws safe UI error "Invalid email or password." when password does not match', async () => {
      await expect(
        loginUser({
          email: 'taster@bukhara.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow('Invalid email or password.');
    });

    it('throws safe UI error "Invalid email or password." when email does not exist in mock_users', async () => {
      await expect(
        loginUser({
          email: 'nonexistent@bukhara.com',
          password: 'AnyPassword!',
        })
      ).rejects.toThrow('Invalid email or password.');
    });
  });

  describe('3. Instant Demo Access', () => {
    it('bypasses credentials check entirely and logs in immediately for demo@menuwhisperer.com', async () => {
      // Note: mock_users is empty, yet demo login succeeds
      expect(localStorage.getItem(MOCK_USERS_STORAGE_KEY)).toBeNull();

      const result = await loginUser({
        email: 'demo@menuwhisperer.com',
        password: 'AnyOrEmptyPassword',
      });

      expect(result.user.email).toBe('demo@menuwhisperer.com');
      expect(result.user.full_name).toBe(DEMO_USER.full_name);
      expect(localStorage.getItem('auth_token')).toBeDefined();
      expect(localStorage.getItem('user_profile')).toContain('demo@menuwhisperer.com');
    });
  });

  describe('4. Session Persistence and Profile Update', () => {
    it('retrieves active session with mockGetMe', async () => {
      await registerUser({
        email: 'vip@patron.com',
        password: 'VipPassword123!',
        name: 'VIP Guest',
      });

      const me = mockGetMe();
      expect(me.email).toBe('vip@patron.com');
      expect(me.full_name).toBe('VIP Guest');
    });

    it('updates user profile in both active session and mock_users array with mockUpdateMe', async () => {
      await registerUser({
        email: 'patron@cafe.com',
        password: 'Password123!',
        name: 'Initial Name',
      });

      const updated = mockUpdateMe({
        full_name: 'Updated Name',
        mobile_number: '+91 9123456789',
      });

      expect(updated.full_name).toBe('Updated Name');
      expect(updated.mobile_number).toBe('+91 9123456789');

      // Verify active session updated
      const activeRaw = localStorage.getItem('user_profile');
      expect(activeRaw).toContain('Updated Name');

      // Verify mock_users array updated
      const rawUsers = localStorage.getItem('mock_users');
      const users = JSON.parse(rawUsers!);
      expect(users[0].name).toBe('Updated Name');
    });
  });

  describe('5. Error Detection and Fallback', () => {
    it('detects network errors and generic "An error occurred"', () => {
      expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('NetworkError'))).toBe(true);
      expect(isNetworkError(new Error('An error occurred'))).toBe(true);
      expect(isNetworkError(new SyntaxError("Unexpected token '<'"))).toBe(true);
      expect(isNetworkError(new Error('Invalid email or password.'))).toBe(false);
    });

    it('aliases mockLogin and mockRegister to loginUser and registerUser', () => {
      expect(mockLogin).toBe(loginUser);
      expect(mockRegister).toBe(registerUser);
    });
  });

  describe('6. Initialize & Seed Mock Storage', () => {
    it('seeds mock_users with default demo credentials when localStorage is empty', async () => {
      const { initMockStorage, DEFAULT_DEMO_USERS } = await import('../api/auth');
      expect(localStorage.getItem(MOCK_USERS_STORAGE_KEY)).toBeNull();

      initMockStorage();

      const stored = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(DEFAULT_DEMO_USERS);
      expect(parsed[0].email).toBe('demo@menuwhisperer.com');
      expect(parsed[0].password).toBe('Password123!');
      expect(parsed[0].name).toBe('Epicure Demo');
    });

    it('does not overwrite existing mock_users when initMockStorage is called again', async () => {
      const { initMockStorage } = await import('../api/auth');
      const customUsers = [{ email: 'chef@mumbai.com', password: 'SecretPassword99!', name: 'Chef Sanjeev' }];
      localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(customUsers));

      initMockStorage();

      const stored = JSON.parse(localStorage.getItem(MOCK_USERS_STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].email).toBe('chef@mumbai.com');
    });

    it('maintains session on reload via mockGetMe fallback when backend is unavailable', async () => {
      // 1. Sign up user
      const registerRes = await registerUser({
        email: 'diner@delhi.com',
        password: 'Password123!',
        name: 'Delhi Diner',
      });

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(registerRes.access_token);
      expect(localStorage.getItem(USER_PROFILE_KEY)).toBeTruthy();

      // 2. Simulate page reload / call to authApi.getMe()
      const user = await authApi.getMe();
      expect(user.email).toBe('diner@delhi.com');
      expect(user.full_name).toBe('Delhi Diner');
    });
  });
});
