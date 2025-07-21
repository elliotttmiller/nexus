import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PlaidLink } from 'react-native-plaid-link-sdk';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE, BORDER } from '../src/constants/colors';
import { AntDesign, Feather } from '@expo/vector-icons';

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
      {/* Top bar with back and refresh icons */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.iconButton}>
          <AntDesign name="arrowleft" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Accounts</Text>
        <TouchableOpacity onPress={fetchAccounts} style={styles.iconButton}>
          <Feather name="refresh-cw" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>
      <PrimaryButton title="Pay Credit Cards" onPress={() => router.push('/pay')} style={{ marginBottom: 12 }} />
      <FlatList
        data={accounts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.institution || 'Account'}</Text>
            <Text style={styles.text}>Balance: ${item.balance}</Text>
            <Text style={styles.text}>Type: {item.type}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.text}>No linked accounts.</Text>}
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
          <Text style={{ color: '#fff', backgroundColor: PRIMARY, padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 8 }}>
            Open Plaid Link
          </Text>
        </PlaidLink>
      )}
      <PrimaryButton title={linkLoading ? 'Getting Link Token...' : 'Link New Account'} onPress={fetchLinkToken} disabled={linkLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: BACKGROUND },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  iconButton: { padding: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: TEXT, flex: 1, textAlign: 'center' },
  accountItem: { backgroundColor: SUBTLE, padding: 12, borderRadius: 8, marginBottom: 12 },
  accountName: { fontWeight: 'bold', fontSize: 16, color: TEXT },
  text: { color: TEXT },
}); 