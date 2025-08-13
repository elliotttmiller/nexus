import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, BORDER } from '../src/constants/colors';
import useLoading from '../src/hooks/useLoading';
import useError from '../src/hooks/useError';

export default function CardRankScreen() {
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, withLoading] = useLoading();
  const [error, setError, withError] = useError();
  const router = useRouter();

  const handleRecommend = () => withError(() => withLoading(async () => {
    setRecommendation('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/cardrank/recommend`, {
        method: 'POST',
        body: JSON.stringify({ userId: 1, merchant, category })
      });
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.recommendation) {
        setRecommendation(data.recommendation.card_name || JSON.stringify(data.recommendation));
        setError(null);
      } else {
        setError(data.error || 'No recommendation');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      // setLoading(false); // This is now handled by withLoading
    }
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CardRank</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter merchant"
        value={merchant}
        onChangeText={setMerchant}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter category (e.g. dining)"
        value={category}
        onChangeText={setCategory}
        placeholderTextColor="#888"
      />
      <PrimaryButton title={loading ? 'Loading...' : 'Get Recommendation'} onPress={handleRecommend} disabled={loading} style={{}} testID="recommend-button" />
      {loading && <ActivityIndicator size="large" color={PRIMARY} />}
      {recommendation ? <Text style={styles.recommendation}>{recommendation}</Text> : null}
      {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
      <PrimaryButton title="Back to Dashboard" onPress={() => router.push('/dashboard')} style={{}} testID="dashboard-button" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: TEXT },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, width: '100%', marginBottom: 16, backgroundColor: '#fff', color: TEXT },
  recommendation: { marginTop: 16, fontSize: 18, color: PRIMARY },
}); 