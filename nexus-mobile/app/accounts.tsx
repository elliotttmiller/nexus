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

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || 1;

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=${userId}`),
        fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=${userId}`)
      ]);

      const accountsData = await accountsRes.json();
      setAccounts(Array.isArray(accountsData) ? accountsData : []);

      const transactionsData = await transactionsRes.json();
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('An error occurred while fetching your financial data.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Use the correct react-native-plaid-link-sdk hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (success) => {
      try {
        await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            public_token: success.publicToken,
            userId
          }),
        });
        Alert.alert('Success!', 'Your account has been linked.');
        setLinkToken(null);
        fetchAllData();
      } catch (exchangeErr) {
        Alert.alert('Error', 'Could not complete account linking.');
      }
    },
    onExit: (exit) => {
      console.log('Plaid Link exited.');
      setLinkToken(null);
    }
  });

  const openPlaidLink = useCallback(async () => {
    setLinkLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BackArrowHeader title="Accounts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading your accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <BackArrowHeader title="Accounts" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              onPress={openPlaidLink}
              disabled={linkLoading}
            >
              <Text style={styles.linkAccountBtnText}>
                {linkLoading ? 'Preparing...' : 'Link Account'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountsContainer}>
            {accounts.map((account) => (
              <ExpandableSection
                key={account.id}
                title={account.name}
                subtitle={`${account.type} • ${account.mask}`}
                rightContent={
                  <View style={styles.accountRight}>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(account.balances.current)}
                    </Text>
                    <AccountHealthBar score={account.health_score} />
                  </View>
                }
              >
                <View style={styles.accountDetails}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Available Balance:</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(account.balances.available)}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Current Balance:</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(account.balances.current)}
                    </Text>
                  </View>
                  {account.balances.limit && (
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Credit Limit:</Text>
                      <Text style={styles.balanceValue}>
                        {formatCurrency(account.balances.limit)}
                      </Text>
                    </View>
                  )}
                </View>
              </ExpandableSection>
            ))}
          </View>
        )}
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
}); 