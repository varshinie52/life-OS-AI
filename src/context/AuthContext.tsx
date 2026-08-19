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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; needsVerification?: boolean }>;
  register: (data: { name: string; email: string; password: string; username?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  fetchUser: () => Promise<void>;
  updateUserLocally: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const router = useRouter();

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

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
        accessTokenRef.current = data.data.accessToken;
        return true;
      }
    } catch (error) {
      console.warn('Could not refresh access token:', error);
    }
    return false;
  };

  const fetchUser = async () => {
    if (!accessTokenRef.current) return;
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data?.user || null);
      } else if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const retryResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessTokenRef.current}`,
            },
            credentials: 'include',
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setUser(data.data?.user || null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        await fetchUser();
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
      if (refreshed) {
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
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        accessTokenRef.current = data.data?.accessToken;
        setUser(data.data?.user || null);
        return { success: true, message: data.message };
      } else if (response.status === 403) {
        return { success: false, message: data.message, needsVerification: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
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
        body: JSON.stringify(data),
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
      accessTokenRef.current = null;
      router.push('/login');
    }
  };

  const updateUserLocally = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, authFetch, fetchUser, updateUserLocally }}>
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
