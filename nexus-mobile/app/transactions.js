import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE } from '../src/constants/colors';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=1`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Transactions</Text>
      <PrimaryButton title="Pay Credit Cards" onPress={() => router.push('/pay')} />
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.transaction_id || item.id}
          renderItem={({ item }) => (
            <View style={styles.txItem}>
              <Text style={styles.txName}>{item.name || item.merchant || 'Transaction'}</Text>
              <Text style={styles.text}>Amount: ${item.amount}</Text>
              <Text style={styles.text}>Category: {item.category?.join(', ') || item.category || 'N/A'}</Text>
              <Text style={styles.text}>Date: {item.date}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.text}>No transactions found.</Text>}
        />
      )}
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