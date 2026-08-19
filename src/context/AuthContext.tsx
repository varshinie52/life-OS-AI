'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  isEmailVerified?: boolean;
  role?: string;
  createdAt?: string;
  avatar?: { url?: string; publicId?: string };
  preferences?: {
    theme: string;
    language: string;
    timezone: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; needsVerification?: boolean }>;
  register: (data: { name: string; email: string; password: string; username?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  fetchUser: () => Promise<boolean>;
  updateUserLocally: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const router = useRouter();

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

  const saveTokenLocally = (token: string | null) => {
    accessTokenRef.current = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('lifeos_access_token', token);
      } else {
        localStorage.removeItem('lifeos_access_token');
      }
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      if (data.data?.accessToken) {
        saveTokenLocally(data.data.accessToken);
        return true;
      }
    } catch (error) {
      console.warn('Could not refresh access token:', error);
    }
    return false;
  };

  const fetchUser = async (): Promise<boolean> => {
    if (!accessTokenRef.current && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('lifeos_access_token');
      if (storedToken) {
        accessTokenRef.current = storedToken;
      }
    }

    if (!accessTokenRef.current) return false;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.user) {
          setUser(data.data.user);
          return true;
        }
      } else if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed && accessTokenRef.current) {
          const retryResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessTokenRef.current}`,
            },
            credentials: 'include',
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            if (data.data?.user) {
              setUser(data.data.user);
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    }

    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      let restored = false;

      // 1. Attempt session refresh via HttpOnly cookie
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        restored = await fetchUser();
      }

      // 2. Fallback to stored token if cookie refresh did not yield active session
      if (!restored && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('lifeos_access_token');
        if (storedToken) {
          accessTokenRef.current = storedToken;
          restored = await fetchUser();
        }
      }

      if (!restored) {
        saveTokenLocally(null);
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();

    const interval = setInterval(() => {
      refreshAccessToken();
    }, 13 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (!accessTokenRef.current && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('lifeos_access_token');
      if (storedToken) {
        accessTokenRef.current = storedToken;
      }
    }

    if (!accessTokenRef.current) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error('Not authenticated');
      }
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${accessTokenRef.current}`);

    let response = await fetch(url, { ...options, headers, credentials: 'include' });

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed && accessTokenRef.current) {
        headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
        response = await fetch(url, { ...options, headers, credentials: 'include' });
      } else {
        await logout();
      }
    }
    return response;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok && data.data?.accessToken) {
        saveTokenLocally(data.data.accessToken);
        setUser(data.data?.user || null);
        return { success: true, message: data.message };
      } else if (response.status === 403) {
        return { success: false, message: data.message, needsVerification: true };
      } else {
        return { success: false, message: data.message || 'Invalid email or password.' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (data: { name: string; email: string; password: string; username?: string }) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, email: data.email.trim() }),
        credentials: 'include',
      });
      const resData = await response.json();
      
      if (response.ok) {
        return { success: true, message: resData.message };
      } else {
        return { success: false, message: resData.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      if (accessTokenRef.current) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
      saveTokenLocally(null);
      router.replace('/login');
    }
  };

  const updateUserLocally = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, authLoading: loading, isAuthenticated: !!user, login, register, logout, authFetch, fetchUser, updateUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

