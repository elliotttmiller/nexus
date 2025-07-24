import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE } from '../src/constants/colors';
import BackArrowHeader from '../src/components/BackArrowHeader';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

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

  // Remove old revokeAllAccess and add new resetAllAccess
  const resetAllAccess = async () => {
    if (!accounts.length) return;
    Alert.alert('Reset All Data', 'Are you sure you want to completely reset all your financial data? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset All', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/users/data-access/reset?userId=1`, { method: 'DELETE' });
          if (res.status === 401) {
            Alert.alert('Session expired', 'Please log in again.');
            router.replace('/login');
            return;
          }
          if (res.ok) {
            setAccounts([]);
            Alert.alert('Success', 'All financial data reset.');
          } else {
            const data = await res.json();
            Alert.alert('Error', data.error || 'Failed to reset all data');
          }
        } catch (err) {
          Alert.alert('Error', err.message);
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <>
      <BackArrowHeader />
      <SafeAreaViewContext style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.topBarRow}>
            <Text style={styles.titleSmall}>Data Access & Privacy</Text>
            <View style={{ width: 38 }} /> {/* Spacer for symmetry if needed */}
          </View>
          <View style={styles.accountsContainer}>
            {accounts.length > 0 && (
              <TouchableOpacity style={styles.revokeAllBtnRight} onPress={resetAllAccess} disabled={loading} activeOpacity={0.8}>
                <Text style={styles.revokeAllText}>Reset All</Text>
              </TouchableOpacity>
            )}
            {accounts.length === 0 ? (
              <Text style={styles.text}>No linked accounts.</Text>
            ) : (
              accounts.map((item) => (
                <View key={item.id} style={styles.accountItem}>
                  <Text style={styles.accountName}>{item.institution || 'Account'}</Text>
                  <PrimaryButton title="Revoke Access" onPress={() => revokeAccess(item.id)} />
                </View>
              ))
            )}
          </View>
          <PrimaryButton title="Back to Settings" onPress={() => router.push('/settings')} style={{ marginTop: 18 }} />
        </ScrollView>
      </SafeAreaViewContext>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: TEXT },
  accountItem: { backgroundColor: SUBTLE, padding: 12, borderRadius: 8, marginBottom: 12 },
  accountName: { fontWeight: 'bold', fontSize: 16, color: TEXT },
  text: { color: TEXT },
  safeArea: { flex: 1, backgroundColor: BACKGROUND },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 2 : 4,
    marginLeft: 2,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
    marginTop: 2,
    marginBottom: 0,
  },
  revokeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  revokeAllText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContainer: {
    paddingBottom: 32,
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 2 : 4,
    marginBottom: 2,
    paddingHorizontal: 0,
    minHeight: 44,
    position: 'relative',
  },
  arrowBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    padding: 2,
    marginLeft: 2,
    marginTop: 2,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    minHeight: 44,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
    marginTop: 0,
    marginBottom: 0,
    letterSpacing: 0.1,
  },
  accountsContainer: {
    position: 'relative',
    marginTop: 2,
    marginBottom: 8,
    paddingTop: 2,
  },
  revokeAllBtnRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  arrowColCentered: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  titleSmall: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    color: PRIMARY,
    marginTop: 0,
    marginBottom: 0,
    letterSpacing: 0.1,
  },
});