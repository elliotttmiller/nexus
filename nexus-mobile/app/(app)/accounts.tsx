import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../../src/constants/fetchWithAuth';
import GreenButton from '../../src/components/GreenButton';
import ExpandableSection from '../../src/components/ExpandableSection';
import BottomNavigation from '../../src/components/BottomNavigation';
import { PRIMARY, TEXT } from '../../src/constants/colors';
import { Account, Transaction } from '../../src/types';
import AccountHealthBar from '../../src/components/AccountHealthBar';
import BackArrowHeader from '../../src/components/BackArrowHeader';
import { usePlaidLink } from 'react-native-plaid-link-sdk';
import { useAuth } from '../../src/context/AuthContext';

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

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`);
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Non-JSON response for accounts:', text);
          data = [];
        }
        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setAccounts([]);
      }
    };
    const fetchTransactions = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=1`);
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Non-JSON response for transactions:', text);
          data = [];
        }
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setTransactions([]);
      }
    };
    Promise.all([fetchAccounts(), fetchTransactions()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Fetch Plaid Link token
  const fetchLinkToken = async () => {
    setLinkLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        body: JSON.stringify({ userId: 1 }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = {};
      }
      setLinkToken(data.link_token || null);
    } catch (err) {
      setLinkToken(null);
    } finally {
      setLinkLoading(false);
    }
  };

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (publicToken, metadata) => {
      // Exchange public token
      await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
        method: 'POST',
        body: JSON.stringify({ public_token: publicToken, userId: 1 }),
      });
      // Refresh accounts
      fetchAccounts();
    },
    onExit: () => {},
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 10, color: TEXT }}>Loading your financial data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>Error</Text>
        <Text style={{ color: TEXT, textAlign: 'center', marginTop: 10 }}>{error}</Text>
      </View>
    );
  }

  // Sorting/filtering logic
  const sortedTx = [...transactions].sort((a, b) => {
    if (sortTx === 'date') return new Date(b.date) - new Date(a.date);
    if (sortTx === 'amount') return b.amount - a.amount;
    return 0;
  }).filter(tx => !filterTx || (tx.description && tx.description.toLowerCase().includes(filterTx.toLowerCase())));

  // Defensive fallback for accounts
  const safeAccounts: Account[] = Array.isArray(accounts) ? accounts : [];
  console.log('accounts:', accounts, 'safeAccounts:', safeAccounts, 'type:', typeof accounts);

  return (
    <>
      <BackArrowHeader />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View style={styles.topRow}>
            <Text style={styles.pageTitle}>Accounts</Text>
            <TouchableOpacity
              style={styles.payBtnCard}
              onPress={() => router.replace('/pay')}
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
                      <Text style={styles.accountNumber}>•••• {item.mask || item.last4 || 'XXXX'}</Text>
                      <Text style={styles.accountTypeLabel}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Account'}</Text>
                    </View>
                    <Text style={styles.accountBalance}>
                      {typeof item.balance === 'number' ? `$${item.balance.toFixed(2)}` : '--'}
                    </Text>
                  </View>
                  {(item.type === 'credit' || item.type === 'loan') && item.apr > 0 && (
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>APR: {item.apr}%</Text>
                    </View>
                  )}
                  {item.type === 'credit' && item.creditLimit > 0 && (
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
              <Text style={styles.emptyStateText}>No accounts found. Link an account to get started.</Text>
              <TouchableOpacity
                style={styles.linkAccountBtn}
                onPress={() => {
                  if (!linkToken) fetchLinkToken();
                  else open();
                }}
                activeOpacity={0.85}
                disabled={linkLoading || (!linkToken && !ready)}
              >
                <Text style={styles.linkAccountBtnText}>{linkLoading ? 'Loading...' : 'Link Account'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <TouchableOpacity style={[styles.sortBtn, sortTx === 'date' && { backgroundColor: PRIMARY + '22' }]} onPress={() => setSortTx('date')}>
                <Text style={styles.sortBtnText}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sortBtn, sortTx === 'amount' && { backgroundColor: PRIMARY + '22' }]} onPress={() => setSortTx('amount')}>
                <Text style={styles.sortBtnText}>Amount</Text>
              </TouchableOpacity>
            </View>
            {sortedTx.slice(0, 6).map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <Text style={styles.txDesc}>{tx.name || tx.description}</Text>
                <Text style={[styles.txAmount, { color: tx.amount < 0 ? '#F44336' : PRIMARY }]}>${Math.abs(tx.amount).toFixed(2)}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/transactions')} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
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
}); 