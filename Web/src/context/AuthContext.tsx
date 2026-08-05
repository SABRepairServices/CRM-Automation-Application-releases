'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { BYPASS_AUTH, ensureDevSession } from '@/lib/devAuth';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      if (BYPASS_AUTH) {
        await ensureDevSession();
      }
      const stored = localStorage.getItem('token');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        const u = response.data.user;
        setToken(stored);
        setUser({ id: u.id, email: u.email, fullName: u.full_name });
      } catch {
        // stored token is expired/invalid — clear it out
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user: u, accessToken, refreshToken } = response.data;
      setUser({ id: u.id, email: u.email, fullName: u.fullName });
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password, fullName });
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('selectedClientId');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
