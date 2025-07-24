import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import GreenButton from '../src/components/GreenButton';
import ExpandableSection from '../src/components/ExpandableSection';
import BottomNavigation from '../src/components/BottomNavigation';
import { PRIMARY } from '../src/constants/colors';
import { Account, Transaction } from '../src/types';
import AccountHealthBar from '../src/components/AccountHealthBar';
import BackArrowHeader from '../src/components/BackArrowHeader';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortTx, setSortTx] = useState<'date' | 'amount'>('date');
  const [filterTx, setFilterTx] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`)
      .then(res => res.json())
      .then(data => setAccounts(data || []))
      .catch(() => setAccounts([]));
    fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=1`)
      .then(res => res.json())
      .then(data => setTransactions(data || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  // Sorting/filtering logic placeholder
  const sortedTx = [...transactions].sort((a, b) => {
    if (sortTx === 'date') return new Date(b.date) - new Date(a.date);
    if (sortTx === 'amount') return b.amount - a.amount;
    return 0;
  }).filter(tx => !filterTx || tx.description.toLowerCase().includes(filterTx.toLowerCase()));

  // Defensive fallback for accounts
  let safeAccounts: Account[] = [];
  if (Array.isArray(accounts)) {
    safeAccounts = accounts;
  } else if (accounts && typeof accounts === 'object' && typeof accounts.length === 'number') {
    // If it's array-like
    safeAccounts = Array.from(accounts);
  } else {
    safeAccounts = [];
  }
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
          {safeAccounts.length > 0 ? (
            <ExpandableSection
              data={safeAccounts}
              initialCount={5}
              title=""
              renderItem={(item: Account, i) => (
                <View key={item.id} style={styles.accountCard}>
                  <View style={styles.accountCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{item.name}</Text>
                      <Text style={styles.accountNumber}>••••{item.last4}</Text>
                    </View>
                    <Text style={styles.accountBalance}>
                      {typeof item.balance === 'number' ? `$${item.balance.toFixed(2)}` : '--'}
                    </Text>
                  </View>
                  {item.apr > 0 && (
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>APR: {typeof item.apr === 'number' ? item.apr : '--'}%</Text>
                      <Text style={styles.metricText}>Interest: {typeof item.monthlyInterest === 'number' ? `$${item.monthlyInterest.toFixed(2)}` : '--'}</Text>
                    </View>
                  )}
                  {item.apr > 0 && (
                    <View style={styles.healthBarRow}>
                      <AccountHealthBar value={typeof item.creditHealth === 'number' ? item.creditHealth : 0} />
                      <Text style={styles.healthLabel}>{typeof item.creditHealth === 'number' ? item.creditHealth : '--'}%</Text>
                    </View>
                  )}
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyStateText}>No accounts linked to your user. Link an account to get started.</Text>
          )}
          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            {transactions.slice(0, 6).map((tx) => (
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 0,
    paddingHorizontal: 0,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 0,
    marginTop: 0,
  },
  payBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 90,
  },
  accountCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'column',
    minHeight: 90,
    minWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 6,
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#757575',
    marginRight: 12,
  },
  healthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  txHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  sortBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 4,
  },
  sortBtnText: {
    color: PRIMARY,
    fontWeight: 'bold',
    fontSize: 13,
  },
  filterBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 4,
  },
  filterBtnText: {
    color: PRIMARY,
    fontWeight: 'bold',
    fontSize: 13,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  txDesc: {
    flex: 2,
    color: '#222',
    fontSize: 14,
  },
  txAmount: {
    flex: 1,
    color: PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
  txDate: {
    flex: 1,
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
    marginLeft: 8,
  },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  txDesc: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  txDate: {
    fontSize: 13,
    color: '#888',
    minWidth: 80,
    textAlign: 'right',
  },
  viewAllBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  viewAllText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  payBtnCard: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    marginLeft: 8,
  },
  payBtnCardText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
}); 