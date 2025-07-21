import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { PlaidLink } from 'react-native-plaid-link-sdk';
import { API_BASE_URL } from '../constants/api';

export default function AccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plaid/accounts?userId=1`);
      const data = await res.json();
      if (res.ok) {
        setAccounts(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkToken = async () => {
    setLinkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 })
      });
      const data = await res.json();
      if (res.ok && data.link_token) {
        setLinkToken(data.link_token);
      } else {
        Alert.alert('Error', data.error || 'Failed to get link token');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLinkToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Linked Accounts</Text>
      <Button title={loading ? 'Refreshing...' : 'Refresh'} onPress={fetchAccounts} disabled={loading} />
      <FlatList
        data={accounts}
        keyExtractor={item => item.account_id}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text>Type: {item.type}</Text>
            <Text>Mask: {item.mask}</Text>
            <Text>Balance: {item.balances?.current}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No accounts linked.</Text>}
      />
      {linkLoading && <ActivityIndicator size="large" color="#007AFF" />}
      {linkToken && (
        <PlaidLink
          tokenConfig={{ token: linkToken, noLoadingState: false }}
          onSuccess={async (success) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token: success.publicToken, userId: 1 })
              });
              if (res.ok) {
                Alert.alert('Success', 'Account linked!');
                fetchAccounts();
              } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Failed to link account');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }}
          onExit={(exit) => {
            if (exit.error) Alert.alert('Plaid Error', exit.error.display_message || exit.error.error_message);
          }}
        >
          <Text style={styles.linkButton}>Link Account</Text>
        </PlaidLink>
      )}
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  accountItem: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 12 },
  accountName: { fontWeight: 'bold', fontSize: 16 },
  linkButton: { color: '#007AFF', fontWeight: 'bold', fontSize: 18, marginVertical: 16, textAlign: 'center' },
}); 