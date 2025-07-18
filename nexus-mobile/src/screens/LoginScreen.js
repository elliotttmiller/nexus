import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const API_BASE_URL = 'https://nexus-production-2e34.up.railway.app';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.twofa_required) {
          navigation.replace('TwoFAScreen', { userId: data.userId });
        } else if (data.token) {
          // Save token (e.g., AsyncStorage) and navigate
          navigation.replace('Dashboard');
        }
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
      <Button title="Register" onPress={() => navigation.replace('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 16 },
}); 