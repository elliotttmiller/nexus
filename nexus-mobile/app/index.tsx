import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT } from '../src/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Nexus. The Router is working.</Text>
      <PrimaryButton title="Login" onPress={() => router.push('/login')} />
      <PrimaryButton title="Register" onPress={() => router.push('/register')} />
      <PrimaryButton title="Dashboard" onPress={() => router.push('/dashboard')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  text: { fontSize: 18, marginBottom: 16, color: TEXT },
}); 