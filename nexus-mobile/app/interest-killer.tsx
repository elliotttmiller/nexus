import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, BORDER } from '../src/constants/colors';
import useLoading from '../src/hooks/useLoading';
import useError from '../src/hooks/useError';

export default function InterestKillerScreen() {
  const [amount, setAmount] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, withLoading] = useLoading();
  const [error, setError, withError] = useError();
  const router = useRouter();

  const handleSuggest = () => withError(() => withLoading(async () => {
    setSuggestion('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/interestkiller/suggest`, {
        method: 'POST',
        body: JSON.stringify({ userId: 1, amount: Number(amount) })
      });
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.suggestion) {
        setSuggestion(
          data.suggestion.map((s: any, i: number) => `${s.amount} to ${s.card} (${s.apr}% APR)`).join('\n')
        );
        setError(null);
      } else {
        setError(data.error || 'No suggestion');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interest Killer</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter payment amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholderTextColor="#888"
      />
      <PrimaryButton title={loading ? 'Loading...' : 'Get Suggestion'} onPress={handleSuggest} disabled={loading} style={{}} testID="suggestion-button" />
      {loading && <ActivityIndicator size="large" color={PRIMARY} />}
      {suggestion ? <Text style={styles.suggestion}>{suggestion}</Text> : null}
      {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
      <PrimaryButton title="Back to Dashboard" onPress={() => router.push('/dashboard')} style={{}} testID="dashboard-button" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: TEXT },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, width: '100%', marginBottom: 16, backgroundColor: '#fff', color: TEXT },
  suggestion: { marginTop: 16, fontSize: 18, color: PRIMARY },
}); 