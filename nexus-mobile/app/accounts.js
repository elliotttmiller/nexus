import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { PlaidLink } from 'react-native-plaid-link-sdk';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const router = useRouter();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`);
      if (res.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkToken = async () => {
    setLinkLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        body: JSON.stringify({ userId: 1 })
      });
      if (res.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      console.log('Link token response:', data);
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
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accounts</Text>
      <Button title="Refresh Accounts" onPress={fetchAccounts} disabled={loading} />
      <Button title="Back to Dashboard" onPress={() => router.push('/dashboard')} />
      <FlatList
        data={accounts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.institution || 'Account'}</Text>
            <Text>Balance: ${item.balance}</Text>
            <Text>Type: {item.type}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No linked accounts.</Text>}
      />
      {linkToken && (
        <PlaidLink
          tokenConfig={{ token: linkToken, noLoadingState: false }}
          onSuccess={async ({ publicToken, metadata }) => {
            try {
              const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
                method: 'POST',
                body: JSON.stringify({ public_token: publicToken, userId: 1, institution: metadata.institution?.name })
              });
              const data = await res.json();
              console.log('Exchange public_token response:', data);
              if (res.ok) {
                Alert.alert('Success', 'Account linked!');
                fetchAccounts();
              } else {
                Alert.alert('Error', data.error || 'Failed to link account');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }}
          onExit={() => setLinkToken(null)}
        >
          <Text style={{ color: 'white', backgroundColor: '#007AFF', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 8 }}>
            Open Plaid Link
          </Text>
        </PlaidLink>
      )}
      <Button title={linkLoading ? 'Getting Link Token...' : 'Link New Account'} onPress={fetchLinkToken} disabled={linkLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  accountItem: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 12 },
  accountName: { fontWeight: 'bold', fontSize: 16 },
}); 