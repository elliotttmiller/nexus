import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Image, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [splashDone, setSplashDone] = React.useState(false);

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(async () => {
        await SplashScreen.hideAsync();
        setSplashDone(true);
      });
    }, 1200);
  }, []);

  return (
    <>
      {!splashDone && (
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#fff',
            opacity: fadeAnim,
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={require('../assets/nexus-icon.png')}
            style={{ width: 120, height: 120, resizeMode: 'contain' }}
            fadeDuration={300}
          />
        </Animated.View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
} 