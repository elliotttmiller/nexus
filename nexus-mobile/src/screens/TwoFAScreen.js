import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function TwoFAScreen({ route, navigation }) {
  const { userId } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: code })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // Save token (e.g., AsyncStorage) and navigate
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', data.error || '2FA verification failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two-Factor Authentication</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 2FA code"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />
      <Button title={loading ? 'Verifying...' : 'Verify'} onPress={handleVerify} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 16 },
}); 