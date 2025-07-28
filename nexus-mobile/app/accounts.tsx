import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import ExpandableSection from '../src/components/ExpandableSection';
import BottomNavigation from '../src/components/BottomNavigation';
import { PRIMARY, TEXT } from '../src/constants/colors';
import { Account, Transaction } from '../src/types';
import AccountHealthBar from '../src/components/AccountHealthBar';
import BackArrowHeader from '../src/components/BackArrowHeader';
import { usePlaidLink } from 'react-native-plaid-link-sdk';
import { useAuth } from '../src/context/AuthContext';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
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
  const { user } = useAuth(); // Ensure user is available for authenticated calls

  // --- REFACTORED: Memoize fetch functions to avoid re-creation if possible ---
  const fetchAccountsData = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`); // Using userId directly from auth context might be safer if available
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      } else {
        console.error("API did not return an array for accounts:", data);
        setError('Failed to load accounts: Unexpected server response.');
        setAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('An error occurred while fetching your accounts.');
      setAccounts([]);
    }
  }, []); // Dependencies might include user.id if you decide to pass it

  const fetchTransactionsData = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=1`); // Using userId directly from auth context
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error("API did not return an array for transactions:", data);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    }
  }, []); // Dependencies might include user.id

  useEffect(() => {
    // Only attempt to fetch data if the user is authenticated.
    // This depends on your AuthContext setting `user` to non-null on success.
    if (user && user.authenticated) { // Ensure authentication check is complete before fetching
      setLoading(true);
      Promise.all([fetchAccountsData(), fetchTransactionsData()]).finally(() => {
        setLoading(false);
      });
    } else if (!user) {
        // If user is explicitly null (not authenticated), stop loading if not already
        setLoading(false); 
    }
  }, [user, fetchAccountsData, fetchTransactionsData]);

  // Fetch Plaid Link token (also `useCallback` for memoization)
  const fetchLinkToken = useCallback(async () => {
    setLinkLoading(true);
    try {
      // It's crucial that userId is safely available here.
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Explicitly set content type for POST
        body: JSON.stringify({ userId: user?.id || 1 }), // Use authenticated userId if possible
      });
      const data = await res.json(); // Direct .json() for expected JSON
      if (data && data.link_token) {
        setLinkToken(data.link_token);
      } else {
        console.error('Failed to get link_token:', data);
        setError('Failed to generate Plaid Link token. Please try again.');
        setLinkToken(null);
      }
    } catch (err) {
      console.error('Error fetching link token:', err);
      setError(`Error fetching link token: ${err.message}`);
      setLinkToken(null);
    } finally {
      setLinkLoading(false);
    }
  }, [user]); // Re-fetch link token if user changes

  // --- CRITICAL FIX: Conditionally initialize usePlaidLink ---
  // Only call usePlaidLink when we have a valid token
  const plaidLinkConfig = React.useMemo(() => {
    if (linkToken) {
      return {
        token: linkToken,
        onSuccess: async (publicToken, metadata) => {
          try {
            await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ public_token: publicToken, userId: user?.id || 1 }), // Use authenticated userId
            });
            Alert.alert('Success', 'Account linked successfully!');
            fetchAccountsData(); // Refresh accounts after linking
          } catch (exchangeErr) {
            console.error('Error exchanging public token:', exchangeErr);
            Alert.alert('Error', 'Failed to link account. Please try again.');
          }
        },
        onExit: (error, metadata) => {
          if (error != null) {
            console.error('Plaid Link exited with error:', error, metadata);
            // Alert.alert('Plaid Link Error', error.message || 'Plaid Link failed.');
          } else {
            console.log('Plaid Link exited without error:', metadata);
          }
        },
      };
    }
    return null; // Don't return config if no token
  }, [linkToken, user, fetchAccountsData]); // Recreate config if linkToken changes

  // Only call usePlaidLink when we have a valid config
  const plaidLinkHook = linkToken ? usePlaidLink(plaidLinkConfig) : { open: () => {}, ready: false };
  const { open, ready } = plaidLinkHook;

  // --- Loading and Error States ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BackArrowHeader title="Accounts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading your financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <BackArrowHeader title="Accounts" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error Loading Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}>
            <Text style={styles.retryButtonText}>Go to Home / Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Sorting/filtering logic
  const sortedTx = [...transactions].sort((a, b) => {
    if (sortTx === 'date') return new Date(b.date) - new Date(a.date);
    if (sortTx === 'amount') return b.amount - a.amount;
    return 0;
  }).filter(tx => !filterTx || (tx.description && tx.description.toLowerCase().includes(filterTx.toLowerCase())));

  return (
    <SafeAreaView style={styles.container}>
      <BackArrowHeader title="Accounts" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Accounts Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Link your first bank account to get started
            </Text>
            <TouchableOpacity
              style={styles.linkAccountBtn}
              onPress={() => {
                if (!linkToken) fetchLinkToken(); // Fetch token if not already fetched
                else if (ready) open(); // Open Link only if token is ready
                else Alert.alert('Plaid Link not ready', 'Please wait or try again.');
              }}
              activeOpacity={0.85}
              disabled={linkLoading || (!linkToken && !ready)}
            >
              <Text style={styles.linkAccountBtnText}>
                {linkLoading ? 'Generating Link...' : (!linkToken ? 'Link Account' : (ready ? 'Open Plaid Link' : 'Plaid Not Ready'))}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ExpandableSection
            data={accounts}
            initialCount={5}
            title=""
            renderItem={(item: Account) => (
              <View key={item.id} style={styles.accountCard}>
                <View style={styles.accountCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>{item.name}</Text>
                    <Text style={styles.accountNumber}>•••• {item.mask || (item.account_id ? String(item.account_id).slice(-4) : 'XXXX')}</Text> {/* Using item.account_id as fallback for mask */}
                    <Text style={styles.accountTypeLabel}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Account'}</Text>
                  </View>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(item.balance)}
                  </Text>
                </View>
                {(item.type === 'credit' || item.type === 'loan') && typeof item.apr === 'number' && item.apr > 0 && (
                  <View style={styles.metricsRow}>
                    <Text style={styles.metricText}>APR: {item.apr}%</Text>
                  </View>
                )}
                {item.type === 'credit' && typeof item.creditLimit === 'number' && item.creditLimit > 0 && (
                  <View style={styles.healthBarRow}>
                    {/* Ensure utilization calculation is safe */}
                    <AccountHealthBar value={(item.balance / item.creditLimit) * 100} />
                    <Text style={styles.healthLabel}>{((item.balance / item.creditLimit) * 100).toFixed(0)}% Util.</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
        
        {/* Transactions Section */}
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
              <Text style={styles.txDesc} numberOfLines={1} ellipsizeMode="tail">{tx.name || tx.description || 'Unknown Transaction'}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: TEXT,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
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
  },
  linkAccountBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  accountsContainer: {
    paddingVertical: 16,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 4,
  },
  accountDetails: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
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
  transactionsSection: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT,
  },
  sortFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    padding: 4,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sortBtnActive: {
    backgroundColor: PRIMARY,
    color: 'white',
  },
  sortBtnText: {
    fontSize: 14,
    color: '#6c757d',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  txDesc: {
    flex: 1,
    fontSize: 16,
    color: TEXT,
    marginRight: 10,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 10,
  },
  viewAllBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
}); 