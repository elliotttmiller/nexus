import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import { BACKGROUND, TEXT, PRIMARY, BORDER, SUBTLE } from '../src/constants/colors';
import { useRouter } from 'expo-router';

export default function PayScreen() {
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
  }, []);

  const toggleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const handlePay = async () => {
    setError('');
    setResult(null);
    if (selected.length === 0) return setError('Select at least one card.');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount.');
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
      setError('Select a funding account.');
      setExecuting(false);
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/pay/execute`, {
        method: 'POST',
        body: JSON.stringify({
          userId: 1,
          funding_account_id: selectedFunding,
          split: result.split
        })
      });
      const data = await res.json();
      setPaymentResults(data.payments);
    } catch (err) {
      setError('Payment execution failed.');
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
    // If no cards selected, send all cards; backend will use them for AI
    const accounts = selected.length > 0 ? cards.filter(c => selected.includes(c.id)) : cards;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/interestkiller/pay/ai-recommendation`, {
        method: 'POST',
        body: JSON.stringify({
          userId: 1,
          accounts,
          payment_amount: Number(amount)
        })
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
    setResult(null); // Clear previous results
    setPaymentResults(null);
    setSelected([]);
    setAmount('');
    setSelectedFunding('');
    setGoal(newGoal);
    setResult(recommendation); // recommendation is { split, explanation }
    setAiModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={{ flex: 1, backgroundColor: BACKGROUND }} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Pay Credit Cards</Text>
        <Text style={styles.subtitle}>Select one or more cards to pay and enter a total payment amount.</Text>
        {/* AI Recommendation Button */}
        <TouchableOpacity style={styles.aiButton} onPress={handleAIRecommendation} disabled={aiLoading}>
          <Text style={styles.aiButtonText}>{aiLoading ? 'Loading...' : 'AI Recommendation'}</Text>
        </TouchableOpacity>
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
        <TextInput
          placeholder="Total payment amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#888"
        />
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
        {/* AI Recommendation Modal (already present) */}
        <Modal visible={aiModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.resultTitle}>AI Recommendations</Text>
              {aiRecommendations && (
                <ScrollView>
                  {/* Minimize Interest */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={styles.label}>Minimize Interest</Text>
                    {Array.isArray(aiRecommendations.minimize_interest?.split) && aiRecommendations.minimize_interest.split.map((s, i) => (
                      <View key={i} style={styles.splitRow}>
                        <Text style={styles.resultText}>Card {s.card_id}:</Text>
                        <Text style={styles.resultText}>${s.amount}</Text>
                      </View>
                    ))}
                    {aiRecommendations.minimize_interest?.explanation && (
                      <Text style={styles.explanationHighlight}>{aiRecommendations.minimize_interest.explanation}</Text>
                    )}
                    <Pressable style={styles.applyButton} onPress={() => applyRecommendation(aiRecommendations.minimize_interest, 'MINIMIZE_INTEREST_COST')}>
                      <Text style={styles.applyButtonText}>Apply This Recommendation</Text>
                    </Pressable>
                  </View>
                  {/* Maximize Score */}
                  <View>
                    <Text style={styles.label}>Maximize Score</Text>
                    {Array.isArray(aiRecommendations.maximize_score?.split) && aiRecommendations.maximize_score.split.map((s, i) => (
                      <View key={i} style={styles.splitRow}>
                        <Text style={styles.resultText}>Card {s.card_id}:</Text>
                        <Text style={styles.resultText}>${s.amount}</Text>
                      </View>
                    ))}
                    {aiRecommendations.maximize_score?.explanation && (
                      <Text style={styles.explanationHighlight}>{aiRecommendations.maximize_score.explanation}</Text>
                    )}
                    <Pressable style={styles.applyButton} onPress={() => applyRecommendation(aiRecommendations.maximize_score, 'MAXIMIZE_CREDIT_SCORE')}>
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
  label: { fontWeight: 'bold', color: TEXT, marginBottom: 4 },
  goalRow: { flexDirection: 'row', marginBottom: 16 },
  goalButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#eee', marginRight: 8 },
  goalButtonActive: { backgroundColor: PRIMARY + 'cc' },
  goalButtonText: { textAlign: 'center', color: TEXT, fontWeight: 'bold' },
  goalButtonTextActive: { color: '#fff' },
  payButton: { backgroundColor: PRIMARY, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  error: { color: 'red', marginBottom: 8, marginTop: 4, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginTop: 24 },
  resultTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: PRIMARY },
  resultText: { fontSize: 16, color: TEXT },
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
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeButton: {
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  closeButtonText: { color: TEXT, fontWeight: 'bold', fontSize: 16 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  explanationHighlight: {
    marginTop: 10,
    marginBottom: 10,
    color: PRIMARY,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 