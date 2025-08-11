import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { API_BASE_URL } from '../../src/constants/api';
import { fetchWithAuth } from '../../src/constants/fetchWithAuth';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import BackArrowHeader from '../../src/components/BackArrowHeader';
import { useAuth } from '../../src/context/AuthContext';
import BottomNavigation from '../../src/components/BottomNavigation';
import { Transaction, AiCardAnalysis } from '../../src/types';
import { fetchAiCardAnalysis } from '../../src/constants/fetchAiCardAnalysis';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState({ transactions: true, payments: true });
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [aiModal, setAiModal] = useState<{ visible: boolean; analysis: AiCardAnalysis | null; tx: Transaction | null }>({ visible: false, analysis: null, tx: null });
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const auth = useAuth();
  const user = auth?.user;
  const userId = user?.id || 1;

  useEffect(() => {
    setLoading(prev => ({ ...prev, transactions: true }));
    fetchWithAuth(`${API_BASE_URL}/api/plaid/transactions?userId=${userId}`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(prev => ({ ...prev, transactions: false })));

    setLoading(prev => ({ ...prev, payments: true }));
    fetchWithAuth(`${API_BASE_URL}/api/interestkiller/payment-history?userId=${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to load payment history');
        }
        return res.json();
      })
      .then(data => {
        setPaymentHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setPaymentHistory([]);
      })
      .finally(() => setLoading(prev => ({ ...prev, payments: false })));
  }, [userId]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderPaymentItem = ({ item }: { item: Transaction }) => {
    if (!item) return null;
    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentAmount}>${(item.amount || 0).toFixed(2)}</Text>
          <Text style={styles.paymentDate}>
            {item.timestamp ? formatDate(item.timestamp) : formatDate(item.date) || 'Unknown date'}
          </Text>
        </View>
        <Text style={styles.paymentStatus}>
          Status: <Text style={[styles.statusText, { color: (item.status || '').toLowerCase() === 'success' ? '#4CAF50' : '#F44336' }]}> {(item.status || 'PENDING').toUpperCase()}</Text>
        </Text>
        <View style={styles.paymentCards}>
          <Text style={styles.paymentCardsTitle}>Cards Paid:</Text>
          {Array.isArray(item.cards) && item.cards.length > 0 ? (
            item.cards.map((card, index) => (
              <View key={index} style={styles.cardItem}>
                <Text style={styles.cardName}>{card.last4 ? `•••• ${card.last4}` : 'Card'}</Text>
                <Text style={styles.cardAmount}>{(card.amount || 0).toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.text, { fontStyle: 'italic' }]}>No card details available</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND }}>
      <BackArrowHeader />
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowPaymentHistory(true)}
        >
          <MaterialIcons name="history" size={24} color={PRIMARY} />
          <Text style={styles.historyButtonText}>Payment History</Text>
        </TouchableOpacity>
      </View>

      {loading.transactions ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.transaction_id || item.id}
          renderItem={({ item }) => (
            <View style={styles.txItem}>
              <View style={styles.txHeader}>
                <Text style={styles.txName}>{item.name || item.description || 'Unknown Transaction'}</Text>
                <Text style={[styles.txAmount, { color: item.amount < 0 ? '#4CAF50' : TEXT }]}>
                  ${Math.abs(item.amount).toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.aiIconBtn}
                  onPress={async () => {
                    setAiLoading(item.id);
                    const analysis = await fetchAiCardAnalysis(item.id);
                    setAiModal({ visible: true, analysis, tx: item });
                    setAiLoading(null);
                  }}
                  accessibilityLabel="Analyze with AI"
                >
                  <MaterialIcons name="auto-awesome" size={22} color={PRIMARY} style={{ opacity: 0.85 }} />
                </TouchableOpacity>
              </View>
              {aiLoading === item.id && <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 4 }} />}
              <Text style={styles.text}>
                <Text style={styles.label}>Category: </Text>
                {item.category?.join(' › ') || item.category || 'Uncategorized'}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Date: </Text>
                {formatDate(item.date)}
              </Text>
              {item.payment_channel && (
                <Text style={styles.text}>
                  <Text style={styles.label}>Type: </Text>
                  {item.payment_channel.charAt(0).toUpperCase() + item.payment_channel.slice(1)}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color={SUBTLE} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={[styles.emptyText, { fontSize: 14 }]}>Your transactions will appear here</Text>
            </View>
          }
          contentContainerStyle={styles.transactionList}
        />
      )}

      {/* AI CardRank Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aiModal.visible}
        onRequestClose={() => setAiModal({ visible: false, analysis: null, tx: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI CardRank Analysis</Text>
              <Pressable onPress={() => setAiModal({ visible: false, analysis: null, tx: null })} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={TEXT} />
              </Pressable>
            </View>
            {aiModal.analysis ? (
              <ScrollView>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                  {aiModal.analysis.isOptimal ? 'Optimal Card Used!' : 'Better Card Available'}
                </Text>
                <Text style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '500' }}>AI Recommendation: </Text>
                  {aiModal.analysis.aiCard?.name || 'N/A'}
                </Text>
                <Text style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '500' }}>Explanation: </Text>
                  {aiModal.analysis.explanation ? (() => { try { return JSON.parse(aiModal.analysis.explanation).answer; } catch { return 'No explanation available.'; } })() : 'No explanation available.'}
                </Text>
                {aiModal.analysis.why_not && Array.isArray(aiModal.analysis.why_not) && aiModal.analysis.why_not.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: '500', marginBottom: 4 }}>Other Cards Considered:</Text>
                    {aiModal.analysis.why_not.map((alt: { card?: { name?: string }; reason: string }, idx: number) => (
                      <View key={idx} style={{ marginBottom: 6 }}>
                        <Text style={{ fontWeight: '500' }}>{alt.card?.name || 'Card'}:</Text>
                        <Text style={{ color: TEXT }}>{alt.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={{ color: TEXT }}>No analysis available for this transaction.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentHistory}
        onRequestClose={() => setShowPaymentHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment History</Text>
              <Pressable
                onPress={() => setShowPaymentHistory(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={TEXT} />
              </Pressable>
            </View>
            {loading.payments ? (
              <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 24 }} />
            ) : paymentHistory.length > 0 ? (
              <FlatList
                data={paymentHistory}
                keyExtractor={(item, index) => `payment-${index}`}
                renderItem={renderPaymentItem}
                contentContainerStyle={styles.paymentList}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="payment" size={48} color={SUBTLE} />
                <Text style={styles.emptyText}>No payment history found</Text>
                <Text style={[styles.emptyText, { fontSize: 14 }]}>Your payment history will appear here</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  aiIconBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(41,98,255,0.07)',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: BACKGROUND,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 12,
    width: '100%',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  historyButtonText: {
    marginLeft: 6,
    color: PRIMARY,
    fontWeight: '500',
    fontSize: 14,
  },
  transactionList: {
    paddingBottom: 24,
  },
  txItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txName: {
    fontWeight: '600',
    fontSize: 16,
    color: TEXT,
    flex: 1,
    marginRight: 8,
  },
  txAmount: {
    fontWeight: '600',
    fontSize: 16,
  },
  text: {
    color: `${TEXT}99`,
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    color: `${TEXT}99`,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    opacity: 0.7,
  },
  emptyText: {
    color: TEXT,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT,
  },
  closeButton: {
    padding: 4,
  },
  paymentList: {
    paddingBottom: 24,
  },
  paymentItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentAmount: {
    fontWeight: '600',
    fontSize: 16,
    color: TEXT,
  },
  paymentDate: {
    color: `${TEXT}99`,
    fontSize: 14,
  },
  paymentStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  paymentCards: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  paymentCardsTitle: {
    color: `${TEXT}99`,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cardName: {
    color: TEXT,
    fontSize: 14,
  },
  cardAmount: {
    color: TEXT,
    fontWeight: '500',
  },
});