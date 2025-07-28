import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, BORDER } from '../src/constants/colors';
import BackArrowHeader from '../src/components/BackArrowHeader';
import useLoading from '../src/hooks/useLoading';
import useError from '../src/hooks/useError';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [loading, withLoading] = useLoading();
  const [error, setError, withError] = useError();
  const router = useRouter();

  const fetchProfile = () => withError(() => withLoading(async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/users/profile?userId=1`);
    if (res.status === 401) {
      setError('Session expired. Please log in again.');
      router.replace('/login');
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setEmail(data.email);
    } else {
      setError(data.error || 'Failed to fetch profile');
    }
  }));

  const updateProfile = () => withError(() => withLoading(async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ userId: 1, email })
    });
    if (res.status === 401) {
      setError('Session expired. Please log in again.');
      router.replace('/login');
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setError(null);
      Alert.alert('Success', 'Profile updated');
    } else {
      setError(data.error || 'Update failed');
    }
  }));

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <>
      <BackArrowHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: BACKGROUND }}>
          <Text style={styles.title}>Profile</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PrimaryButton title={loading ? 'Saving...' : 'Save'} onPress={updateProfile} disabled={loading} style={{}} />
          <PrimaryButton title="Back to Settings" onPress={() => router.push('/settings')} style={{}} />
          {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: TEXT },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, width: '100%', marginBottom: 16, backgroundColor: '#fff', color: TEXT },
});