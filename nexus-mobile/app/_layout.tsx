import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simulate loading (replace with your real loading logic if needed)
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(async () => {
        await SplashScreen.hideAsync();
      });
    }, 1200); // Show splash for at least 1.2s
  }, []);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#fff',
          opacity: fadeAnim,
          zIndex: 9999,
        }}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
} 