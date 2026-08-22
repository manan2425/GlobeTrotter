'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  apiRequest,
  setAuthToken,
  removeAuthToken,
  getAuthToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser
} from '../lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_photo: string;
  role: string;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore cached user from localStorage immediately on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    refreshUser();
  }, []);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      removeStoredUser();
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      if (res && res.user) {
        setUser(res.user);
        setStoredUser(res.user);
      }
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      // Only clear credentials if backend explicitly returns 401/403 or token invalid error
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.message?.includes('token') ||
        err?.message?.includes('User not found')
      ) {
        removeAuthToken();
        removeStoredUser();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
  };

  const signup = async (full_name: string, email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    });

    setAuthToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    removeStoredUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
