import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT } from '../src/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Nexus</Text>
      <Text style={styles.subtitle}>Your Credit Autopilot</Text>
      <PrimaryButton title="Get Started" onPress={() => router.replace('/dashboard')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: TEXT },
  subtitle: { fontSize: 18, marginBottom: 32, color: TEXT },
}); 