import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PRIMARY } from '../constants/colors';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // This is the ONLY place we will check the token on app start.
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          // In a real app, you'd verify the token with your backend here.
          // For now, we'll assume the token is valid.
          setUser({ authenticated: true, token });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);
  
  // This effect will protect routes and handle redirects.
  useEffect(() => {
    if (loading) return; // Don't do anything until auth check is done.

    const inAuthGroup = segments[0] === '(auth)';

    if (user && !user.token && !inAuthGroup) {
      // If the user is not signed in and is not in the auth group,
      // redirect them to the sign-in page.
      router.replace('/login');
    } else if (user && user.token && inAuthGroup) {
      // If the user is signed in and is in the auth group,
      // redirect them to the main app.
      router.replace('/accounts');
    }
  }, [user, segments, loading, router]);


  const login = async (token, refreshToken) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      setUser({ authenticated: true, token });
      router.replace('/accounts'); // Redirect on successful login
    } catch (e) {
      console.error("Failed to save tokens:", e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
      router.replace('/login'); // Redirect on logout
    } catch (e) {
      console.error("Failed to delete tokens:", e);
    }
  };
  
  if (loading) {
    // Show a global loading spinner while we check for the token.
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 