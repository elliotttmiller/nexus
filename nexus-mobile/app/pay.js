import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Credit Cards</Text>
      <Text style={styles.subtitle}>Select one or more cards to pay and enter a total payment amount.</Text>
      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleSelect(item.id)}
            style={[styles.cardItem, selected.includes(item.id) && styles.cardItemSelected]}
            activeOpacity={0.8}
          >
            <Text style={styles.cardName}>{item.institution || 'Card'} •••• {item.id.slice(-4)}</Text>
            <Text style={styles.cardDetails}>Balance: ${item.balance}   APR: {item.apr || 'N/A'}%</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.text}>No credit cards found.</Text>}
        style={{ marginBottom: 16 }}
      />
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
          {result.split && result.split.map((s, i) => (
            <Text key={i} style={styles.resultText}>Card {s.card_id}: ${s.amount}</Text>
          ))}
          {result.explanation && <Text style={styles.resultExplanation}>{result.explanation}</Text>}
          <Text style={[styles.label, { marginTop: 16 }]}>Select Funding Account:</Text>
          <FlatList
            data={fundingAccounts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedFunding(item.id)}
                style={[styles.cardItem, selectedFunding === item.id && styles.cardItemSelected]}
                activeOpacity={0.8}
              >
                <Text style={styles.cardName}>{item.institution || 'Account'} •••• {item.id.slice(-4)}</Text>
                <Text style={styles.cardDetails}>Balance: ${item.balance}   Type: {item.type}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.text}>No funding accounts found.</Text>}
            style={{ marginBottom: 16, marginTop: 8 }}
          />
          <TouchableOpacity style={styles.payButton} onPress={handleExecute} disabled={executing}>
            {executing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Execute Payment</Text>}
          </TouchableOpacity>
        </View>
      )}
      {paymentResults && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Payment Results</Text>
          {paymentResults.map((p, i) => (
            <Text key={i} style={styles.resultText}>Card {p.card_id}: ${p.amount} - {p.status} ({p.message})</Text>
          ))}
          <TouchableOpacity style={[styles.payButton, { marginTop: 16 }]} onPress={() => { setResult(null); setPaymentResults(null); setSelected([]); setAmount(''); setSelectedFunding(''); }}>
            <Text style={styles.payButtonText}>Make Another Payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: BACKGROUND },
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
}); 