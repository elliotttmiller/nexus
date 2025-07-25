import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext'; // Import the provider

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the splash screen once the layout is mounted.
    // The AuthProvider will handle showing a loading spinner.
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Define your screen layouts here */}
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index" />
      </Stack>
    </AuthProvider>
  );
} 