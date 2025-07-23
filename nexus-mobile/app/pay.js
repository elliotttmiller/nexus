import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import { BACKGROUND, TEXT, PRIMARY, BORDER, SUBTLE } from '../src/constants/colors';
import { useRouter } from 'expo-router';

export default function PayScreen() {
  const scrollViewRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [amount, setAmount] = useState('');
  const [goal, setGoal] = useState('MINIMIZE_INTEREST_COST');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingAccounts, setFundingAccounts] = useState([]);
  const [selectedFunding, setSelectedFunding] = useState('');
  const [executing, setExecuting] = useState(false);
  const [paymentResults, setPaymentResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [paymentContext, setPaymentContext] = useState(null);
  const [usingSuggested, setUsingSuggested] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`)
      .then(res => res.json())
      .then(data => {
        setCards(data.filter(acc => acc.type === 'credit'));
        setFundingAccounts(data.filter(acc => acc.type !== 'credit'));
      })
      .catch(() => {
        setCards([]);
        setFundingAccounts([]);
      });
    // Fetch safe payment context
    fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts/payment-context?userId=1`)
      .then(res => res.json())
      .then(ctx => {
        setPaymentContext(ctx);
        setUsingSuggested(false); // Do not pre-fill amount
        if (ctx && ctx.recommendedFundingAccountId) setSelectedFunding(ctx.recommendedFundingAccountId);
      })
      .catch(() => setPaymentContext(null));
  }, []);

  const toggleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const handlePay = async () => {
    setError('');
    setResult(null);
    if (selected.length === 0) return setError('Select at least one card.');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount.');
    if (paymentContext && Number(amount) > paymentContext.maxSafePayment) {
      setError(`Payment amount exceeds your safe maximum of $${paymentContext.maxSafePayment.toFixed(2)}.`);
      Alert.alert('Payment Too High', `Your safe maximum payment is $${paymentContext.maxSafePayment.toFixed(2)}. Please enter a lower amount.`);
      return;
    }
    setLoading(true);
    const accounts = cards.filter(c => selected.includes(c.id));
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/pay`, {
        method: 'POST',
        body: JSON.stringify({
          userId: 1,
          accounts,
          payment_amount: Number(amount),
          optimization_goal: goal
        })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setError('');
    setExecuting(true);
    setPaymentResults(null);
    
    if (!selectedFunding) {
      setError('Please select a funding account.');
      setExecuting(false);
      return;
    }
    
    if (!result?.split || result.split.length === 0) {
      setError('No payment split found. Please try the recommendation again.');
      setExecuting(false);
      return;
    }
    
    try {
      console.log('Executing payment with:', {
        funding_account_id: selectedFunding,
        split: result.split
      });
      
      const res = await fetchWithAuth(`${API_BASE_URL}/api/interestkiller/pay/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1,
          funding_account_id: selectedFunding,
          split: result.split.map(item => ({
            card_id: item.card_id,
            amount: parseFloat(item.amount) || 0
          }))
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Payment execution failed:', res.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Payment execution successful:', data);
      setPaymentResults(data.payments || []);
      
      // Save payment to history
      try {
        await fetchWithAuth(`${API_BASE_URL}/api/interestkiller/save-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 1,
            amount: parseFloat(amount),
            status: 'success',
            cards: result.split.map(item => ({
              card_id: item.card_id,
              amount: parseFloat(item.amount),
              last4: cards.find(c => c.id === item.card_id)?.last4 || '••••'
            }))
          })
        });
      } catch (error) {
        console.error('Failed to save payment history:', error);
      }
      
      // Show success message
      Alert.alert(
        'Payment Successful',
        'Your payment has been processed successfully!',
        [
          { 
            text: 'View Transactions',
            onPress: () => {
              // Reset form
              setSelected([]);
              setAmount('');
              setSelectedFunding('');
              setResult(null);
              // Navigate to transactions after a short delay
              setTimeout(() => router.replace('/transactions'), 500);
            }
          },
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form
              setSelected([]);
              setAmount('');
              setSelectedFunding('');
              setResult(null);
            }
          }
        ],
        { cancelable: false }
      );
      
    } catch (err) {
      console.error('Payment execution error:', err);
      setError(`Payment execution failed: ${err.message || 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleAIRecommendation = async () => {
    setAiLoading(true);
    setAiRecommendations(null);
    setError('');
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Enter a valid amount first.');
      setAiLoading(false);
      return;
    }
    // Map accounts to required structure
    const accounts = (selected.length > 0 ? cards.filter(c => selected.includes(c.id)) : cards)
      .map(c => ({
        id: c.id || '',
        name: c.name || c.card_name || 'Card', // Ensure name is always present
        balance: typeof c.balance === 'number' ? c.balance : parseFloat(c.balance) || 0,
        apr: typeof c.apr === 'number' ? c.apr : parseFloat(c.apr) || 0,
        creditLimit: typeof c.creditLimit === 'number'
          ? c.creditLimit
          : (typeof c.credit_limit === 'number'
            ? c.credit_limit
            : parseFloat(c.creditLimit || c.credit_limit) || 0),
        promo_apr_expiry_date: c.promo_apr_expiry_date || null,
        type: c.type || 'credit'
      }));
    const payload = {
      userId: 1,
      accounts,
      payment_amount: Number(amount),
      user_context: {
        primary_goal: goal
      }
    };
    console.log('DEBUG: AI Recommendation payload:', payload);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/interestkiller/pay/ai-recommendation`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAiRecommendations(data);
      setAiModalVisible(true);
    } catch (err) {
      setError('Failed to get AI recommendations.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyRecommendation = (recommendation, newGoal) => {
    if (!recommendation?.split) return;
    
    // Auto-select the cards that have a payment amount in the recommendation
    const selectedCardIds = [];
    recommendation.split.forEach(splitItem => {
      if (splitItem.amount > 0) {
        selectedCardIds.push(splitItem.card_id);
      }
    });
    
    // Update the payment amount to the total from the recommendation
    const totalAmount = recommendation.split.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // Set the state
    setSelected(selectedCardIds);
    setAmount(totalAmount.toString());
    setGoal(newGoal);
    setResult({
      ...recommendation,
      // Make sure the split is in the format expected by the payment execution
      split: recommendation.split.filter(item => item.amount > 0)
    });
    setAiModalVisible(false);
    
    // Auto-scroll to the payment section
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView 
        ref={scrollViewRef} 
        style={{ flex: 1, backgroundColor: BACKGROUND }} 
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={styles.title}>Pay Credit Cards</Text>
        <Text style={styles.subtitle}>Select one or more cards to pay and enter a total payment amount.</Text>
        {/* AI Recommendation Button */}
        <TouchableOpacity style={styles.aiButton} onPress={handleAIRecommendation} disabled={aiLoading}>
          <Text style={styles.aiButtonText}>{aiLoading ? 'Loading...' : 'AI Recommendation'}</Text>
        </TouchableOpacity>
        {aiLoading && (
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={{ color: PRIMARY, fontWeight: 'bold', fontSize: 18, marginTop: 12 }}>Nexus AI is analyzing your options...</Text>
            <Text style={{ color: '#555', fontSize: 15, marginTop: 6 }}>This may take a few moments.</Text>
          </View>
        )}
        {cards.length === 0 ? (
          <Text style={styles.text}>No credit cards found.</Text>
        ) : (
          (cards || []).map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleSelect(item.id)}
              style={[styles.cardItem, selected.includes(item.id) && styles.cardItemSelected]}
              activeOpacity={0.8}
            >
              <Text style={styles.cardName}>{item.institution || 'Card'} •••• {item.id ? String(item.id).slice(-4) : '----'}</Text>
              <Text style={styles.cardDetails}>Balance: ${item.balance}   APR: {item.apr || 'N/A'}%</Text>
            </TouchableOpacity>
          ))
        )}
        <View style={{ marginBottom: 12 }}>
          {paymentContext && (
            <View style={{ backgroundColor: '#f5f6fa', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', color: PRIMARY, marginBottom: 4 }}>Safe Payment Suggestion</Text>
              <Text>Total Cash: ${paymentContext.totalCash.toFixed(2)}</Text>
              <Text>Upcoming Bills: ${paymentContext.totalUpcomingBills.toFixed(2)}</Text>
              <Text>Safety Buffer: ${paymentContext.safetyBuffer.toFixed(2)}</Text>
              <Text style={{ fontWeight: 'bold', marginTop: 4 }}>Max Safe Payment: ${paymentContext.maxSafePayment.toFixed(2)}</Text>
              {paymentContext.recommendedFundingAccountId && (
                <Text>Recommended Funding Account: ••••{String(paymentContext.recommendedFundingAccountId).slice(-4)}</Text>
              )}
              {Array.isArray(paymentContext.upcomingBills) && paymentContext.upcomingBills.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>Upcoming Bills:</Text>
                  {paymentContext.upcomingBills.map((b, i) => (
                    <Text key={i}>- {b.name}: ${b.estimated_amount.toFixed(2)}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        <TextInput
          placeholder="Total payment amount"
          value={amount}
          onChangeText={val => {
            setAmount(val);
            setUsingSuggested(false);
          }}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#888"
        />
        {usingSuggested && paymentContext && (
          <Text style={{ color: PRIMARY, fontWeight: 'bold', marginBottom: 8 }}>Suggested</Text>
        )}
        <Text style={styles.label}>Optimization Goal:</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity
            style={[styles.goalButton, goal === 'MINIMIZE_INTEREST_COST' && styles.goalButtonActive]}
            onPress={() => setGoal('MINIMIZE_INTEREST_COST')}
          >
            <Text style={[styles.goalButtonText, goal === 'MINIMIZE_INTEREST_COST' && styles.goalButtonTextActive]}>Minimize Interest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.goalButton, goal === 'MAXIMIZE_CREDIT_SCORE' && styles.goalButtonActive]}
            onPress={() => setGoal('MAXIMIZE_CREDIT_SCORE')}
          >
            <Text style={[styles.goalButtonText, goal === 'MAXIMIZE_CREDIT_SCORE' && styles.goalButtonTextActive]}>Maximize Score</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay</Text>}
        </TouchableOpacity>
        {result && !paymentResults && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Payment Split</Text>
            {result.split && Array.isArray(result.split) && result.split.map((s, i) => (
              <Text key={i} style={styles.resultText}>Card {s.card_id}: ${s.amount}</Text>
            ))}
            {result.explanation && <Text style={styles.resultExplanation}>{result.explanation}</Text>}
            <Text style={[styles.label, { marginTop: 16 }]}>Select Funding Account:</Text>
            {fundingAccounts.length === 0 ? (
              <Text style={styles.text}>No funding accounts found.</Text>
            ) : (
              (fundingAccounts || []).map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedFunding(item.id)}
                  style={[styles.cardItem, selectedFunding === item.id && styles.cardItemSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardName}>{item.institution || 'Account'} •••• {item.id ? String(item.id).slice(-4) : '----'}</Text>
                  <Text style={styles.cardDetails}>Balance: ${item.balance}   Type: {item.type}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.payButton} onPress={handleExecute} disabled={executing}>
              {executing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Execute Payment</Text>}
            </TouchableOpacity>
          </View>
        )}
        {paymentResults && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Payment Results</Text>
            {Array.isArray(paymentResults) && paymentResults.map((p, i) => (
              <Text key={i} style={styles.resultText}>Card {p.card_id}: ${p.amount} - {p.status} ({p.message})</Text>
            ))}
            <TouchableOpacity style={[styles.payButton, { marginTop: 16 }]} onPress={() => { setResult(null); setPaymentResults(null); setSelected([]); setAmount(''); setSelectedFunding(''); }}>
              <Text style={styles.payButtonText}>Make Another Payment</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* AI Recommendation Modal */}
        <Modal visible={aiModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.resultTitle}>AI Recommendations</Text>
              {aiRecommendations && console.log('AI Recommendations:', aiRecommendations)}
              {aiRecommendations && (
                <ScrollView>
                  {/* Minimize Interest */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={styles.label}>Minimize Interest</Text>
                    {Array.isArray(aiRecommendations.minimize_interest_plan?.split) && aiRecommendations.minimize_interest_plan.split.map((s, i) => (
                      <View key={i} style={styles.splitRow}>
                        <Text style={styles.resultText}>Card ••••{String(s.card_id).slice(-4)}:</Text>
                        <Text style={styles.resultText}>${s.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    {aiRecommendations.minimize_interest_plan?.explanation && (
                      <Text style={styles.explanationHighlight}>{aiRecommendations.minimize_interest_plan.explanation}</Text>
                    )}
                    <Pressable 
                      style={styles.applyButton} 
                      onPress={() => applyRecommendation(aiRecommendations.minimize_interest_plan, 'MINIMIZE_INTEREST_COST')}>
                      <Text style={styles.applyButtonText}>Apply This Recommendation</Text>
                    </Pressable>
                  </View>
                  {/* Maximize Score */}
                  <View>
                    <Text style={styles.label}>Maximize Score</Text>
                    {Array.isArray(aiRecommendations.maximize_score_plan?.split) && aiRecommendations.maximize_score_plan.split.map((s, i) => (
                      <View key={i} style={styles.splitRow}>
                        <Text style={styles.resultText}>Card ••••{String(s.card_id).slice(-4)}:</Text>
                        <Text style={styles.resultText}>${s.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    {aiRecommendations.maximize_score_plan?.explanation && (
                      <Text style={styles.explanationHighlight}>{aiRecommendations.maximize_score_plan.explanation}</Text>
                    )}
                    <Pressable 
                      style={styles.applyButton} 
                      onPress={() => applyRecommendation(aiRecommendations.maximize_score_plan, 'MAXIMIZE_CREDIT_SCORE')}>
                      <Text style={styles.applyButtonText}>Apply This Recommendation</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
              <Pressable style={styles.closeButton} onPress={() => setAiModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { /* remove flexGrow, remove alignItems */ },
  title: { fontSize: 28, fontWeight: 'bold', color: PRIMARY, marginBottom: 8 },
  subtitle: { fontSize: 16, color: TEXT, marginBottom: 16 },
  cardItem: { backgroundColor: SUBTLE, padding: 16, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  cardItemSelected: { backgroundColor: PRIMARY + '22', borderColor: PRIMARY },
  cardName: { fontWeight: 'bold', fontSize: 16, color: TEXT },
  cardDetails: { color: TEXT, fontSize: 14, marginTop: 2 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff', color: TEXT, fontSize: 16 },
  label: { 
    fontWeight: '600', 
    color: '#2d3748', 
    marginBottom: 8, 
    fontSize: 16,
    marginTop: 8,
  },
  goalRow: { flexDirection: 'row', marginBottom: 16 },
  goalButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 10, 
    backgroundColor: '#f5f5f5', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  goalButtonActive: { 
    backgroundColor: PRIMARY + '15',
    borderColor: PRIMARY,
    borderWidth: 1,
  },
  goalButtonText: { 
    textAlign: 'center', 
    color: TEXT, 
    fontWeight: '500',
    fontSize: 14,
  },
  goalButtonTextActive: { 
    color: PRIMARY,
    fontWeight: '600',
  },
  payButton: { backgroundColor: PRIMARY, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  error: { color: 'red', marginBottom: 8, marginTop: 4, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginTop: 24 },
  resultTitle: { 
    fontWeight: '700', 
    fontSize: 20, 
    marginBottom: 16, 
    color: PRIMARY,
    textAlign: 'center',
    marginTop: 8,
  },
  resultText: { 
    fontSize: 15, 
    color: TEXT,
    fontWeight: '500',
  },
  resultExplanation: { marginTop: 12, color: TEXT, fontStyle: 'italic' },
  text: { color: TEXT },
  aiButton: { backgroundColor: PRIMARY + '11', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  aiButtonText: { color: PRIMARY, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButton: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  closeButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  closeButtonText: { 
    color: '#555', 
    fontWeight: '500', 
    fontSize: 15,
  },
  splitRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  explanationHighlight: {
    marginTop: 12,
    marginBottom: 16,
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
}); 