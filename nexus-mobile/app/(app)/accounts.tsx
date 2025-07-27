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
// --- FIX #1: Import from the new, official Expo library ---
import { usePlaidLink } from 'expo-plaid-link';
import { useAuth } from '../../src/context/AuthContext';

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortTx, setSortTx] = useState<'date' | 'amount'>('date');
  const [filterTx, setFilterTx] = useState('');
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || 1;

  const fetchAllData = useCallback(async () => {
    try {
      const accountsRes = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=${userId}`);
      const accountsData = await accountsRes.json();
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      const txRes = await fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=${userId}`);
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      setError('');
    } catch (err) {
      setError('Failed to load accounts or transactions.');
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // --- FIX #2: The usePlaidLink hook is now the correct one ---
  const { open, ready } = usePlaidLink({
    tokenConfig: {
      token: linkToken,
      // noLoadingState: true // Optional: if you want to manage your own loading spinner
    },
    onSuccess: async (success) => {
      try {
        await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token: success.publicToken, userId }),
        });
        Alert.alert('Success!', 'Your account has been linked.');
        setLinkToken(null); // Reset token after use
        fetchAllData(); // Refresh all data
      } catch (exchangeErr) {
        Alert.alert('Error', 'Could not complete account linking.');
      }
    },
    onExit: (exit) => {
      console.log('Plaid Link exited.');
      setLinkToken(null); // Reset token on exit
    }
  });

  // --- FIX #3: Logic to open Plaid ---
  // We fetch the token, and when it's ready, we open the link.
  const openPlaidLink = useCallback(async () => {
    setLinkLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data && data.link_token) {
        setLinkToken(data.link_token);
      } else {
        throw new Error(data.error || 'Failed to retrieve Plaid link token.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLinkLoading(false);
    }
  }, [userId]);

  useEffect(() => {
      // This effect will automatically open Plaid once the token is fetched and the hook is ready.
      if (linkToken && ready) {
        open();
      }
  }, [linkToken, ready, open]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullscreenCenter}>
        <Text style={styles.errorTitle}>Error Loading Data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}> 
          <Text style={styles.retryButtonText}>Go to Home / Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedTx = [...transactions].sort((a, b) => {
    if (sortTx === 'date') return new Date(b.date) - new Date(a.date);
    if (sortTx === 'amount') return b.amount - a.amount;
    return 0;
  }).filter(tx => !filterTx || (tx.description && tx.description.toLowerCase().includes(filterTx.toLowerCase())));

  return (
    <>
      <BackArrowHeader />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.topRow}>
            <Text style={styles.pageTitle}>Accounts</Text>
            <TouchableOpacity
              style={styles.payBtnCard}
              onPress={() => router.push('/pay')}
              activeOpacity={0.8}
            >
              <Text style={styles.payBtnCardText}>Pay Cards</Text>
            </TouchableOpacity>
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
                      <Text style={styles.accountNumber}>•••• {item.last4 || 'XXXX'}</Text>
                      {/* If you want to show type, add a type property to Account or remove this line */}
                    </View>
                    <Text style={styles.accountBalance}>
                      {typeof item.balance === 'number' ? formatCurrency(item.balance) : '--'}
                    </Text>
                  </View>
                  {/* If you want to show APR, check if it's a number and > 0 */}
                  {typeof item.apr === 'number' && item.apr > 0 && (
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>APR: {item.apr}%</Text>
                    </View>
                  )}
                  {/* If you want to show utilization, add creditLimit to Account type or remove this block */}
                </View>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text style={styles.emptyStateText}>No accounts found. Link an account to get started.</Text>
              <TouchableOpacity
                style={styles.linkAccountBtn}
                onPress={openPlaidLink} // <-- This is the only change in the JSX
                disabled={linkLoading}
              >
                <Text style={styles.linkAccountBtnText}>{linkLoading ? 'Preparing...' : 'Link Account'}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <View style={styles.sortFilterContainer}>
                <TouchableOpacity style={[styles.sortBtn, sortTx === 'date' && styles.sortBtnActive]} onPress={() => setSortTx('date')}>
                  <Text style={styles.sortBtnText}>Date</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBtn, sortTx === 'amount' && styles.sortBtnActive]} onPress={() => setSortTx('amount')}>
                  <Text style={styles.sortBtnText}>Amount</Text>
                </TouchableOpacity>
              </View>
            </View>
            {sortedTx.length > 0 ? sortedTx.slice(0, 6).map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <Text style={styles.txDesc} numberOfLines={1} ellipsizeMode="tail">{tx.description || 'Unknown Transaction'}</Text>
                <Text style={[styles.txAmount, { color: tx.amount < 0 ? '#F44336' : PRIMARY }]}>{formatCurrency(Math.abs(tx.amount))}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
            )) : (
              <Text style={styles.emptyStateText}>No recent transactions to display.</Text>
            )}
            {transactions.length > 6 && (
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/transactions')} activeOpacity={0.8}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  payBtnCard: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  payBtnCardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  accountTypeLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  metricText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  healthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  healthLabel: {
    fontSize: 12,
    color: PRIMARY,
    marginLeft: 5,
  },
  transactionsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 10,
  },
  sortBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginLeft: 10,
  },
  sortBtnText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  sortBtnActive: {
    backgroundColor: PRIMARY + '22',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  txDesc: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  txDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 10,
  },
  viewAllBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  linkAccountBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  linkAccountBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fullscreenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: TEXT,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sortFilterContainer: {
    flexDirection: 'row',
  },
}); 