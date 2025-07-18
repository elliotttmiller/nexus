import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';

export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/plaid/transactions?userId=1');
      const data = await res.json();
      if (res.ok) {
        setTransactions(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch transactions');
      }
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
      <Button title={loading ? 'Refreshing...' : 'Refresh'} onPress={fetchTransactions} disabled={loading} />
      <FlatList
        data={transactions}
        keyExtractor={item => item.transaction_id}
        renderItem={({ item }) => (
          <View style={styles.txItem}>
            <Text style={styles.txName}>{item.name}</Text>
            <Text>Amount: ${item.amount}</Text>
            <Text>Category: {item.category?.join(', ')}</Text>
            <Text>Date: {item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No transactions found.</Text>}
      />
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  txItem: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 12 },
  txName: { fontWeight: 'bold', fontSize: 16 },
}); 