import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'https://nexus-production-2e34.up.railway.app';

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile?userId=1`);
      const data = await res.json();
      if (res.ok) {
        setEmail(data.email);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, email })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Profile updated');
      } else {
        Alert.alert('Error', data.error || 'Update failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title={loading ? 'Saving...' : 'Save'} onPress={updateProfile} disabled={loading} />
      <Button title="Back to Settings" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 16 },
}); 