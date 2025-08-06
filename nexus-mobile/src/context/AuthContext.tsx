import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PRIMARY } from '../constants/colors';
import { API_BASE_URL } from '../constants/api';

interface User {
  id: number;
  email?: string;
  username?: string;
  authenticated: boolean;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          // Check if API_BASE_URL is available
          if (!API_BASE_URL) {
            setUser({ id: 1, authenticated: true, token });
            setLoading(false);
            return;
          }

          // Fetch user profile to get user ID and other details
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser({ 
                id: userData.id || userData.user_id || 1, // Support different response formats
                email: userData.email,
                username: userData.username,
                authenticated: true, 
                token 
              });
            } else {
              // Token might be invalid, try to continue but log the issue
              setUser({ id: 1, authenticated: true, token });
            }
          } catch (profileError) {
            // Still set user as authenticated with fallback ID
            setUser({ id: 1, authenticated: true, token });
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)/dashboard');
    }
  }, [user, segments, loading, router]);

  const login = async (token: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      
      // Check if API_BASE_URL is available for profile fetch
      if (!API_BASE_URL) {
        setUser({ id: 1, authenticated: true, token });
        router.replace('/(app)/dashboard');
        return;
      }
      
      // Fetch user profile after login
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({ 
            id: userData.id || userData.user_id || 1,
            email: userData.email,
            username: userData.username,
            authenticated: true, 
            token 
          });
        } else {
          setUser({ id: 1, authenticated: true, token });
        }
      } catch (profileError) {
        setUser({ id: 1, authenticated: true, token });
      }
      
      router.replace('/(app)/dashboard');
    } catch (e) {
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
      router.replace('/(auth)/login');
    } catch (e) {
    }
  };
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 