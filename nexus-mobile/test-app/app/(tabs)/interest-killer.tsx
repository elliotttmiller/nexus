import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function InterestKillerScreen() {
  const [amount, setAmount] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_BASE_URL = 'https://nexus-production-2e34.up.railway.app';

  const handleSuggest = async () => {
    setLoading(true);
    setSuggestion('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/interestkiller/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, amount })
      });
      const data = await res.json();
      if (res.ok && data.suggestion) {
        setSuggestion(
          data.suggestion.map((s, i) => `${s.amount} to ${s.card} (${s.apr}% APR)`).join('\n')
        );
      } else {
        Alert.alert('Error', data.error || 'No suggestion');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interest Killer</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter payment amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Button title={loading ? 'Loading...' : 'Get Suggestion'} onPress={handleSuggest} disabled={loading} />
      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {suggestion ? <Text style={styles.result}>{suggestion}</Text> : null}
      <Button title="Back to Dashboard" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 16 },
  result: { marginTop: 16, fontSize: 18, color: 'blue', whiteSpace: 'pre-line' },
}); 