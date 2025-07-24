import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Account, Transaction } from '../src/types';
import GreenButton from '../src/components/GreenButton';
import ExpandableSection from '../src/components/ExpandableSection';
import { PRIMARY } from '../src/constants/colors';

interface DashboardModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  onViewAllAccounts: () => void;
  onViewAllTransactions: () => void;
  onAccountPress: (account: Account) => void;
}

export default function DashboardModal({ visible, onClose, accounts, transactions, onViewAllAccounts, onViewAllTransactions, onAccountPress }: DashboardModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Dashboard</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Account Carousel */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <GreenButton title="View All" onPress={onViewAllAccounts} style={styles.viewAllBtn} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {accounts.slice(0, 5).map(account => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountCard}
                onPress={() => onAccountPress(account)}
                activeOpacity={0.85}
              >
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountNumber}>••••{account.last4}</Text>
                <Text style={styles.accountBalance}>${account.balance.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Recent Transactions */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <GreenButton title="View All" onPress={onViewAllTransactions} style={styles.viewAllBtn} />
          </View>
          <ExpandableSection
            data={transactions}
            initialCount={5}
            title=""
            renderItem={(tx, i) => (
              <View key={tx.id} style={styles.txRow}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txAmount}>${tx.amount.toFixed(2)}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '94%',
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  closeText: {
    fontSize: 18,
    color: '#888',
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
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
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
}); 