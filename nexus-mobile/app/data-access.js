import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';

export default function DataAccessScreen() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/data-access?userId=1`);
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

  const revokeAccess = async (accountId) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/data-access/${accountId}`, {
        method: 'DELETE'
      });
      if (res.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Account access revoked');
        fetchAccounts();
      } else {
        Alert.alert('Error', data.error || 'Failed to revoke access');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Data Access & Privacy</Text>
      <FlatList
        data={accounts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.institution || 'Account'}</Text>
            <Button title="Revoke Access" onPress={() => revokeAccess(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text>No linked accounts.</Text>}
      />
      <Button title="Back to Settings" onPress={() => router.push('/settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  accountItem: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 12 },
  accountName: { fontWeight: 'bold', fontSize: 16 },
});