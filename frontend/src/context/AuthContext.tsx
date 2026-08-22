'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api';

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

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(res.token);
    setUser(res.user);
  };

  const signup = async (full_name: string, email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    });

    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
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
