import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Account } from '../src/types';
import AccountHealthBar from '../src/components/AccountHealthBar';
import GreenButton from '../src/components/GreenButton';
import { PRIMARY } from '../src/constants/colors';

interface AccountDetailModalProps {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onPay: (account: Account) => void;
}

export default function AccountDetailModal({ visible, account, onClose, onPay }: AccountDetailModalProps) {
  if (!account) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{account.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balance}>${account.balance.toFixed(2)}</Text>
          <View style={styles.metricsBar}>
            <AccountHealthBar value={account.credit_health ?? 0} />
            <Text style={styles.healthLabel}>{account.credit_health ?? '--'}%</Text>
          </View>
          <View style={styles.financialDetails}>
            <Text style={styles.detailText}>APR: {account.apr}%</Text>
            <Text style={styles.detailText}>Monthly Interest: ${account.monthly_interest?.toFixed(2) ?? '--'}</Text>
          </View>
          <GreenButton title="Pay Card" onPress={() => onPay(account)} style={styles.payBtn} />
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
    width: '92%',
    padding: 24,
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
    fontSize: 18,
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
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthLabel: {
    marginLeft: 10,
    fontSize: 12,
    color: '#757575',
    fontWeight: 'bold',
  },
  financialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  detailText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  payBtn: {
    marginTop: 8,
  },
}); 