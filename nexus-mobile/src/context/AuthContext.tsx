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
            console.warn('API_BASE_URL not configured, using fallback user data');
            setUser({ 
              id: 1, 
              email: 'user@example.com', // Provide fallback email
              authenticated: true, 
              token 
            });
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
              console.log('User profile fetched successfully:', userData);
              setUser({ 
                id: userData.id || userData.user_id || 1, // Support different response formats
                email: userData.email || 'user@example.com', // Ensure email is always present
                username: userData.username,
                authenticated: true, 
                token 
              });
            } else {
              console.warn('Failed to fetch user profile, status:', response.status);
              // Token might be invalid, clear it and force re-login
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('refreshToken');
              setUser(null);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Network error or other issue, provide fallback user data
            setUser({ 
              id: 1, 
              email: 'user@example.com', // Provide fallback email
              authenticated: true, 
              token 
            });
          }
        }
      } catch (error) {
        console.error('Auth status check error:', error);
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
        console.warn('API_BASE_URL not configured, using fallback user data');
        setUser({ 
          id: 1, 
          email: 'user@example.com', // Provide fallback email
          authenticated: true, 
          token 
        });
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
          console.log('User profile fetched on login:', userData);
          setUser({ 
            id: userData.id || userData.user_id || 1,
            email: userData.email || 'user@example.com', // Ensure email is always present
            username: userData.username,
            authenticated: true, 
            token 
          });
        } else {
          console.warn('Failed to fetch user profile on login, status:', response.status);
          setUser({ 
            id: 1, 
            email: 'user@example.com', // Provide fallback email
            authenticated: true, 
            token 
          });
        }
      } catch (profileError) {
        console.error('Error fetching user profile on login:', profileError);
        setUser({ 
          id: 1, 
          email: 'user@example.com', // Provide fallback email
          authenticated: true, 
          token 
        });
      }
      
      router.replace('/(app)/dashboard');
    } catch (e) {
      console.error('Login error:', e);
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