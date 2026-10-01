import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name?: string; mobile_number?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  updateProfile: (data: { full_name?: string; email?: string; mobile_number?: string }) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize user state from localStorage immediately to eliminate logged-out flash on reload
  const [user, setUser] = useState<User | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem('user_profile') || localStorage.getItem('mw_current_mock_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return true;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('mw_access_token');
    const profile = localStorage.getItem('user_profile') || localStorage.getItem('mw_current_mock_user');
    return !(!token && !profile);
  });

  // 2. Initialize & Seed Mock Storage on initial load
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const defaultUsers = [
        { email: "demo@menuwhisperer.com", password: "Password123!", name: "Epicure Demo" }
      ];
      if (!localStorage.getItem("mock_users")) {
        localStorage.setItem("mock_users", JSON.stringify(defaultUsers));
      }
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('mw_access_token');
    const localProfile = localStorage.getItem('user_profile') || localStorage.getItem('mw_current_mock_user');

    if (!token && !localProfile) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      localStorage.setItem('user_profile', JSON.stringify(currentUser));
    } catch {
      // If we have a valid saved profile in localStorage, maintain session instead of wiping it
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          setUser(parsed);
          return;
        } catch {
          // ignore
        }
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('mw_access_token');
      localStorage.removeItem('mw_refresh_token');
      localStorage.removeItem('mw_current_mock_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    localStorage.setItem('mw_access_token', data.access_token);
    localStorage.setItem('mw_refresh_token', data.refresh_token);
    setUser(data.user);
    setIsLoading(false);
  };

  const login = async (data: { email: string; password: string }) => {
    const res = await authApi.login(data);
    handleAuthSuccess(res);
  };

  const register = async (data: { email: string; password: string; full_name?: string; mobile_number?: string }) => {
    const res = await authApi.register(data);
    handleAuthSuccess(res);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('mw_access_token');
    localStorage.removeItem('mw_refresh_token');
    localStorage.removeItem('mw_current_mock_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updated = await authApi.getMe();
      setUser(updated);
    } catch {
      // ignore
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const updateProfile = async (data: { full_name?: string; email?: string; mobile_number?: string }): Promise<User> => {
    const updated = await authApi.updateMe(data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
