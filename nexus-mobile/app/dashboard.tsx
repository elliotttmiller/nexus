import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import BottomNavigation from '../src/components/BottomNavigation';
import GreenButton from '../src/components/GreenButton';
import { Account, Transaction } from '../src/types';
import { PRIMARY } from '../src/constants/colors';
import AccountHealthBar from '../src/components/AccountHealthBar';
import { useRouter } from 'expo-router';

// Mock data for demonstration
const mockAccounts: Account[] = [
  { id: '1', name: 'Checking', balance: 1200.50, last4: '1234', apr: 0, monthlyInterest: 0, creditHealth: 90, transactions: [] },
  { id: '2', name: 'Credit Card', balance: 500.00, last4: '5678', apr: 19.99, monthlyInterest: 8.25, creditHealth: 75, transactions: [] },
  { id: '3', name: 'Savings', balance: 8000.00, last4: '4321', apr: 0, monthlyInterest: 0, creditHealth: 100, transactions: [] },
];
const mockTransactions: Transaction[] = [
  { id: 't1', description: 'Starbucks', amount: 5.75, date: '2024-07-01' },
  { id: 't2', description: 'Amazon', amount: 120.00, date: '2024-06-30' },
  { id: 't3', description: 'Rent', amount: 950.00, date: '2024-06-28' },
  { id: 't4', description: 'Uber', amount: 18.50, date: '2024-06-27' },
  { id: 't5', description: 'Whole Foods', amount: 60.00, date: '2024-06-26' },
  { id: 't6', description: 'Spotify', amount: 9.99, date: '2024-06-25' },
];

export default function DashboardScreen() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        {/* Accounts List (vertical, skinnier but longer cards) */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <TouchableOpacity
            onPress={() => router.replace('/accounts')}
            style={styles.viewAllTextBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {mockAccounts.slice(0, 5).map(account => (
          <TouchableOpacity
            key={account.id}
            style={styles.accountCard}
            activeOpacity={0.85}
            onPress={() => setSelectedAccount(account)}
          >
            <View style={styles.accountCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountNumber}>••••{account.last4}</Text>
              </View>
              <Text style={styles.accountBalance}>
                {typeof account.balance === 'number' ? `$${account.balance.toFixed(2)}` : '--'}
              </Text>
            </View>
            {account.apr > 0 && (
              <View style={styles.metricsRow}>
                <Text style={styles.metricText}>APR: {typeof account.apr === 'number' ? account.apr : '--'}%</Text>
                <Text style={styles.metricText}>Interest: {typeof account.monthlyInterest === 'number' ? `$${account.monthlyInterest.toFixed(2)}` : '--'}</Text>
              </View>
            )}
            {account.apr > 0 && (
              <View style={styles.healthBarRow}>
                <AccountHealthBar value={typeof account.creditHealth === 'number' ? account.creditHealth : 0} />
                <Text style={styles.healthLabel}>{typeof account.creditHealth === 'number' ? account.creditHealth : '--'}%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {/* Recent Transactions (moved further down) */}
        <View style={[styles.sectionRow, { marginTop: 28 }]}> 
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => router.replace('/transactions')}
            style={styles.viewAllTextBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {mockTransactions.slice(0, 5).map(tx => (
          <View key={tx.id} style={styles.txRow}>
            <Text style={styles.txDesc}>{tx.description}</Text>
            <Text style={styles.txAmount}>{typeof tx.amount === 'number' ? `$${tx.amount.toFixed(2)}` : '--'}</Text>
            <Text style={styles.txDate}>{tx.date}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Account Details Modal (placeholder) */}
      <Modal visible={!!selectedAccount} transparent animationType="slide" onRequestClose={() => setSelectedAccount(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedAccount?.name}</Text>
            <Text style={styles.modalBalance}>
              {typeof selectedAccount?.balance === 'number' ? `$${selectedAccount?.balance.toFixed(2)}` : '--'}
            </Text>
            {selectedAccount?.apr > 0 && (
              <>
                <Text style={styles.metricText}>APR: {typeof selectedAccount.apr === 'number' ? selectedAccount.apr : '--'}%</Text>
                <Text style={styles.metricText}>Interest: {typeof selectedAccount.monthlyInterest === 'number' ? `$${selectedAccount.monthlyInterest.toFixed(2)}` : '--'}</Text>
                <View style={styles.healthBarRow}>
                  <AccountHealthBar value={typeof selectedAccount.creditHealth === 'number' ? selectedAccount.creditHealth : 0} />
                  <Text style={styles.healthLabel}>{typeof selectedAccount.creditHealth === 'number' ? selectedAccount.creditHealth : '--'}%</Text>
                </View>
              </>
            )}
            <GreenButton title="Close" onPress={() => setSelectedAccount(null)} style={{ marginTop: 18 }} />
          </View>
        </View>
      </Modal>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  viewAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 8,
  },
  viewAllTextBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  viewAllText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.1,
  },
}); 