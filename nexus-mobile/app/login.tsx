import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { saveToken, saveRefreshToken, removeToken, removeRefreshToken } from '../src/constants/token';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, BORDER } from '../src/constants/colors';
import BackArrowHeader from '../src/components/BackArrowHeader';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // TEMP: Log API_BASE_URL for debugging
  console.log('API_BASE_URL at runtime:', API_BASE_URL);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (res.ok) {
        if (data.twofa_required) {
          router.replace('/twofa');
        } else if (data.token && data.refreshToken) {
          await saveToken(data.token);
          await saveRefreshToken(data.refreshToken);
          router.replace('/dashboard');
        }
      } else {
        await removeToken();
        await removeRefreshToken();
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackArrowHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Nexus Ai</Text>
        {/* TEMP: Show API_BASE_URL on screen for debugging */}
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>API: {API_BASE_URL}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <PrimaryButton title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
        <PrimaryButton title="Register" onPress={() => router.replace('/register')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: BACKGROUND },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, color: TEXT, textAlign: 'center', marginTop: 12, letterSpacing: 0.2 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, width: '100%', marginBottom: 16, backgroundColor: '#fff', color: TEXT },
}); 