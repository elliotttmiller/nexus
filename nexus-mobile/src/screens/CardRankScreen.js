import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../constants/api';

export default function CardRankScreen({ navigation }) {
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setRecommendation('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/cardrank/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, merchant, category })
      });
      const data = await res.json();
      if (res.ok && data.recommendation) {
        setRecommendation(data.recommendation.card_name || JSON.stringify(data.recommendation));
      } else {
        Alert.alert('Error', data.error || 'No recommendation');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CardRank</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter merchant"
        value={merchant}
        onChangeText={setMerchant}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter category (e.g. dining)"
        value={category}
        onChangeText={setCategory}
      />
      <Button title={loading ? 'Loading...' : 'Get Recommendation'} onPress={handleRecommend} disabled={loading} />
      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {recommendation ? <Text style={styles.result}>{recommendation}</Text> : null}
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 16 },
  result: { marginTop: 16, fontSize: 18, color: 'green' },
}); 