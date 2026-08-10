'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { BYPASS_AUTH, ensureDevSession } from '@/lib/devAuth';
import { OWNER_EMAIL } from '@/lib/authConstants';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  // null while checking, then true/false — whether a PIN has ever been set.
  // Until one is set, the app doesn't gate access at all (see AuthGuard);
  // it's set for the first time from Settings, not at launch.
  pinConfigured: boolean | null;
  login: (email: string, pin: string) => Promise<void>;
  register: (email: string, pin: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshPinStatus: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinConfigured, setPinConfigured] = useState<boolean | null>(null);

  const refreshPinStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/pin-status`, { params: { email: OWNER_EMAIL } });
      setPinConfigured(Boolean(res.data.exists));
    } catch {
      // Can't reach the API — don't lock people out of an app that has
      // never had a PIN set just because of a network hiccup.
      setPinConfigured(false);
    }
  };

  useEffect(() => {
    const restore = async () => {
      await refreshPinStatus();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, pin: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, pin });
      const { user: u, accessToken, refreshToken } = response.data;
      setUser({ id: u.id, email: u.email, fullName: u.fullName });
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pin: string, fullName: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { email, pin, fullName });
      await login(email, pin);
      setPinConfigured(true);
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
    <AuthContext.Provider
      value={{ user, token, loading, pinConfigured, login, register, logout, refreshPinStatus, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
