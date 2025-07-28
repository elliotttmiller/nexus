import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../../src/constants/fetchWithAuth';
import ExpandableSection from '../../src/components/ExpandableSection';
import BottomNavigation from '../../src/components/BottomNavigation';
import { PRIMARY, TEXT } from '../../src/constants/colors';
import { Account, Transaction } from '../../src/types';
import AccountHealthBar from '../../src/components/AccountHealthBar';
import BackArrowHeader from '../../src/components/BackArrowHeader';
import PlaidLink from 'react-native-plaid-link-sdk';
import { useAuth } from '../../src/context/AuthContext';

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [linkLoading, setLinkLoading] = useState(false);
  const auth = useAuth();
  const user = auth?.user;
  const userId = user?.id || 1;

  const fetchAllData = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=${userId}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
      const txRes = await fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=${userId}`);
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // --- DEFINITIVE FIX: The Imperative Plaid Link Flow ---
  const handleLinkAccountPress = useCallback(async () => {
    setLinkLoading(true);
    try {
      // 1. Fetch the link_token from your backend
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data || !data.link_token) {
        throw new Error(data.error || 'Failed to retrieve Plaid link token.');
      }
      // 2. Create Plaid session
      PlaidLink.create({ token: data.link_token });
      PlaidLink.open({
        onSuccess: async (success: { publicToken: string; metadata: any }) => {
          try {
            await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ public_token: success.publicToken, userId }),
            });
            Alert.alert('Success!', 'Your account has been linked.');
            await fetchAllData();
          } catch (exchangeErr) {
            Alert.alert('Error', 'Could not complete account linking.');
          } finally {
            setLoading(false);
          }
        },
        onExit: (exit: { error?: any; metadata: any }) => {
          setLoading(false);
        }
      });
      // 4. Handle Plaid events (success, exit, error) via event emitter if needed (see SDK docs)
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred while preparing Plaid.');
      }
    } finally {
      setLinkLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 10, color: TEXT }}>Loading your financial data...</Text>
      </View>
    );
  }

  return (
    <>
      <BackArrowHeader />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View style={styles.topRow}>
            <Text style={styles.pageTitle}>Accounts</Text>
            {accounts.length > 0 && (
              <TouchableOpacity
                style={styles.payBtnCard}
                onPress={() => router.push('/(app)/pay')}
                activeOpacity={0.8}
              >
                <Text style={styles.payBtnCardText}>Pay Cards</Text>
              </TouchableOpacity>
            )}
          </View>
          {accounts.length > 0 ? (
            <ExpandableSection
              data={accounts}
              initialCount={5}
              title=""
              renderItem={(item: Account) => (
                <View key={item.id} style={styles.accountCard}>
                  <View style={styles.accountCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{item.name}</Text>
                      <Text style={styles.accountNumber}>•••• {item.mask || item.last4 || 'XXXX'}</Text>
                      <Text style={styles.accountTypeLabel}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Account'}</Text>
                    </View>
                    <Text style={styles.accountBalance}>{formatCurrency(item.balance)}</Text>
                  </View>
                  {(item.type === 'credit' || item.type === 'loan') && item.apr && item.apr > 0 && (
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>APR: {item.apr}%</Text>
                    </View>
                  )}
                  {item.type === 'credit' && item.creditLimit && item.creditLimit > 0 && (
                    <View style={styles.healthBarRow}>
                      <AccountHealthBar value={(item.balance / item.creditLimit) * 100} />
                      <Text style={styles.healthLabel}>{((item.balance / item.creditLimit) * 100).toFixed(0)}% Util.</Text>
                    </View>
                  )}
                </View>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text style={styles.emptyStateText}>No accounts linked. Link an account to get started.</Text>
              <TouchableOpacity
                style={styles.linkAccountBtn}
                onPress={handleLinkAccountPress}
                disabled={linkLoading}
              >
                <Text style={styles.linkAccountBtnText}>
                  {linkLoading ? 'Preparing...' : 'Link Account'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT,
  },
  payBtnCard: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  payBtnCardText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  accountTypeLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#6c757d',
  },
  healthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  linkAccountBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 16,
  },
  linkAccountBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 