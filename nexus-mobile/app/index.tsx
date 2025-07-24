import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT } from '../src/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Nexus Ai</Text>
      <PrimaryButton title="Login" onPress={() => router.push('/login')} />
      <PrimaryButton title="Register" onPress={() => router.push('/register')} />
      <PrimaryButton title="Dashboard" onPress={() => router.push('/dashboard')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, color: TEXT, textAlign: 'center', marginTop: 12, letterSpacing: 0.2 },
}); 