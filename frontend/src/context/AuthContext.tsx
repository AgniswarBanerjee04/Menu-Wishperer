import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('mw_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      localStorage.removeItem('mw_access_token');
      localStorage.removeItem('mw_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem('mw_access_token', data.access_token);
    localStorage.setItem('mw_refresh_token', data.refresh_token);
    setUser(data.user);
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
    localStorage.removeItem('mw_access_token');
    localStorage.removeItem('mw_refresh_token');
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
