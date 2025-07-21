import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE } from '../src/constants/colors';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=1`);
      if (res.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Transactions</Text>
      <PrimaryButton title={loading ? 'Refreshing...' : 'Refresh'} onPress={fetchTransactions} disabled={loading} />
      <FlatList
        data={transactions}
        keyExtractor={item => item.transaction_id}
        renderItem={({ item }) => (
          <View style={styles.txItem}>
            <Text style={styles.txName}>{item.name}</Text>
            <Text style={styles.text}>Amount: ${item.amount}</Text>
            <Text style={styles.text}>Category: {item.category?.join(', ')}</Text>
            <Text style={styles.text}>Date: {item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.text}>No transactions found.</Text>}
      />
      <PrimaryButton title="Back to Dashboard" onPress={() => router.push('/dashboard')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: TEXT },
  txItem: { backgroundColor: SUBTLE, padding: 12, borderRadius: 8, marginBottom: 12 },
  txName: { fontWeight: 'bold', fontSize: 16, color: TEXT },
  text: { color: TEXT },
});