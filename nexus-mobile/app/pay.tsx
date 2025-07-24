import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable, Keyboard, Animated } from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { fetchWithAuth } from '../src/constants/fetchWithAuth';
import { BACKGROUND, TEXT, PRIMARY, BORDER, SUBTLE } from '../src/constants/colors';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import BackArrowHeader from '../src/components/BackArrowHeader';
import AccountHealthBar from '../src/components/AccountHealthBar';
import { AppConfig } from '../src/config';

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
  const [editedSplit, setEditedSplit] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [originalSplit, setOriginalSplit] = useState(null);
  const [splitHighlight, setSplitHighlight] = useState(new Animated.Value(0));
  // Add state for editing split values as strings for robust input
  const [splitInputValues, setSplitInputValues] = useState([]);
  const [splitExplanation, setSplitExplanation] = useState('');
  const [splitProjectedOutcome, setSplitProjectedOutcome] = useState('');
  const [splitExplainLoading, setSplitExplainLoading] = useState(false);
  const [splitExplainHighlight, setSplitExplainHighlight] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=1`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched accounts (raw):', data);
        // Robust filter for credit cards
        const creditCards = data.filter(acc => acc.type && acc.type.toLowerCase().includes('credit'));
        console.log('Filtered credit cards:', creditCards);
        setCards(creditCards.length > 0 ? creditCards : [
          { id: 'mock1', name: 'Mock Credit Card', balance: 500, apr: 19.99, creditLimit: 2000, last4: '1234', type: 'credit' }
        ]);
        setFundingAccounts(data.filter(acc => acc.type && !acc.type.toLowerCase().includes('credit')));
      })
      .catch((err) => {
        console.log('Error fetching accounts:', err);
        setCards([
          { id: 'mock1', name: 'Mock Credit Card', balance: 500, apr: 19.99, creditLimit: 2000, last4: '1234', type: 'credit' }
        ]);
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
      .catch((err) => {
        console.log('Error fetching payment context:', err);
        setPaymentContext(null);
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
    let accounts = (selected.length > 0 ? cards.filter(c => selected.includes(c.id)) : cards)
      .map(c => ({
        id: c.id || '',
        name: c.name || c.card_name || 'Card',
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
    // Filter out any accounts missing required fields
    const validAccounts = accounts.filter(acc =>
      acc.id && typeof acc.balance === 'number' && !isNaN(acc.balance) &&
      typeof acc.apr === 'number' && !isNaN(acc.apr) &&
      typeof acc.creditLimit === 'number' && !isNaN(acc.creditLimit)
    );
    if (validAccounts.length !== accounts.length) {
      setError('Some cards are missing required data and were excluded from the recommendation.');
      Alert.alert('Data Error', 'Some cards are missing required data and were excluded from the recommendation.');
    }
    const payload = {
      userId: 1,
      accounts: validAccounts,
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

  // When a recommendation is applied, store the original split and initialize input values
  const applyRecommendation = (recommendation, newGoal) => {
    if (!recommendation?.split) return;
    const selectedCardIds = [];
    const filteredSplit = recommendation.split.filter(item => item.amount > 0);
    filteredSplit.forEach(splitItem => {
      if (splitItem.amount > 0) {
        selectedCardIds.push(splitItem.card_id);
      }
    });
    const totalAmount = filteredSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setSelected(selectedCardIds);
    setAmount(totalAmount.toString());
    setGoal(newGoal);
    setResult({
      ...recommendation,
      split: filteredSplit
    });
    setEditedSplit(filteredSplit);
    setOriginalSplit(filteredSplit);
    setSplitInputValues(filteredSplit.map(item => String(item.amount)));
    setAiModalVisible(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setSplitHighlight(new Animated.Value(1));
      Animated.timing(splitHighlight, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }, 300);
  };

  // Handle input change for split values (just update input value, don't redistribute yet)
  const handleSplitInputChange = (index, value) => {
    let newInputs = [...splitInputValues];
    // Allow only numbers and empty string
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      newInputs[index] = value;
      setSplitInputValues(newInputs);
    }
  };

  // Helper to build custom split payload for backend
  const buildCustomSplitPayload = () => {
    if (!editedSplit) return [];
    return editedSplit.map((item, i) => ({
      card_id: item.card_id,
      amount: parseFloat(splitInputValues[i]) || 0,
      type: item.type,
      card_name: item.card_name || item.name || ''
    }));
  };

  // Helper to get optimal plan for backend
  const getOptimalPlan = () => {
    if (!result) return {};
    return result;
  };

  // Helper to get user context for backend
  const getUserContext = () => {
    // Use paymentContext or fallback
    return paymentContext || { primary_goal: goal };
  };

  // Helper to get accounts for backend
  const getAccounts = () => {
    return cards;
  };

  // Call re-explain endpoint after split edit
  const fetchReExplanation = async () => {
    setSplitExplainLoading(true);
    try {
      const payload = {
        accounts: getAccounts(),
        optimal_plan: getOptimalPlan(),
        custom_split: buildCustomSplitPayload(),
        user_context: getUserContext(),
      };
      const res = await fetch(`${AppConfig.API_BASE_URL}/v2/interestkiller/re-explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSplitExplanation(data.explanation || '');
      setSplitProjectedOutcome(data.projected_outcome || '');
      setSplitExplainHighlight(true);
      setTimeout(() => setSplitExplainHighlight(false), 1200);
    } catch (err) {
      setSplitExplanation('Unable to update explanation.');
      setSplitProjectedOutcome('');
    } finally {
      setSplitExplainLoading(false);
    }
  };

  // On blur or enter, trigger redistribution and fetch new explanation
  const handleSplitInputBlur = (index) => {
    let newInputs = [...splitInputValues];
    let newSplit = editedSplit.map((item, i) => ({ ...item }));
    let value = parseFloat(newInputs[index]);
    if (isNaN(value) || value < 0) value = 0;
    const oldValue = parseFloat(newSplit[index].amount) || 0;
    const originalTotal = originalSplit ? originalSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
    const currentTotal = newSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    let diff = value - oldValue;
    if (currentTotal + diff > originalTotal) value = oldValue + (originalTotal - currentTotal);
    newSplit[index].amount = value;
    newInputs[index] = String(value);
    // Redistribute the difference
    let remainingDiff = value - oldValue;
    let indices = newSplit.map((_, i) => i).filter(i => i !== index);
    indices.sort((a, b) => {
      const aAPR = parseFloat(newSplit[a].apr) || 0;
      const bAPR = parseFloat(newSplit[b].apr) || 0;
      return bAPR - aAPR;
    });
    for (let i of indices) {
      if (remainingDiff === 0) break;
      let thisValue = parseFloat(newSplit[i].amount) || 0;
      let adjust = Math.min(Math.abs(remainingDiff), thisValue);
      if (remainingDiff > 0) adjust = -adjust;
      newSplit[i].amount = Math.max(0, thisValue + adjust);
      newInputs[i] = String(newSplit[i].amount);
      remainingDiff += adjust;
    }
    // Final pass to ensure total matches
    const finalTotal = newSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (finalTotal !== originalTotal) {
      newSplit[index].amount += (originalTotal - finalTotal);
      newInputs[index] = String(newSplit[index].amount);
    }
    setEditedSplit(newSplit);
    setSplitInputValues(newInputs);
    setEditingIndex(-1);
    // Fetch new explanation
    fetchReExplanation();
  };

  // When a recommendation is applied, also fetch initial explanation
  useEffect(() => {
    if (result && editedSplit && splitInputValues.length === editedSplit.length) {
      fetchReExplanation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Cancel recommendation and restore account list
  const cancelRecommendation = () => {
    setResult(null);
    setEditedSplit(null);
    setOriginalSplit(null);
    setSplitInputValues([]);
    setEditingIndex(-1);
  };

  // Smart redistribution logic (fix input bug)
  const handleSplitEdit = (index, newValue) => {
    if (!editedSplit) return;
    // Allow empty string for input
    if (newValue === '') {
      let newSplit = editedSplit.map((item, i) => ({ ...item }));
      newSplit[index].amount = '';
      setEditedSplit(newSplit);
      return;
    }
    const oldValue = parseFloat(editedSplit[index].amount) || 0;
    let value = parseFloat(newValue);
    if (isNaN(value) || value < 0) value = 0;
    const diff = value - oldValue;
    const total = editedSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const originalTotal = originalSplit ? originalSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : total;
    if (total + diff > originalTotal) value = oldValue + (originalTotal - total);
    let remainingDiff = value - oldValue;
    let newSplit = editedSplit.map((item, i) => ({ ...item }));
    newSplit[index].amount = value;
    let indices = newSplit.map((_, i) => i).filter(i => i !== index);
    indices.sort((a, b) => {
      const aAPR = parseFloat(newSplit[a].apr) || 0;
      const bAPR = parseFloat(newSplit[b].apr) || 0;
      return bAPR - aAPR;
    });
    for (let i of indices) {
      if (remainingDiff === 0) break;
      let thisValue = parseFloat(newSplit[i].amount) || 0;
      let adjust = Math.min(Math.abs(remainingDiff), thisValue);
      if (remainingDiff > 0) adjust = -adjust;
      newSplit[i].amount = Math.max(0, thisValue + adjust);
      remainingDiff += adjust;
    }
    const finalTotal = newSplit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (finalTotal !== originalTotal) {
      newSplit[index].amount += (originalTotal - finalTotal);
    }
    setEditedSplit(newSplit);
  };

  // On blur, treat empty as 0
  const handleSplitBlur = (index) => {
    let newSplit = editedSplit.map((item, i) => ({ ...item }));
    if (newSplit[index].amount === '' || isNaN(parseFloat(newSplit[index].amount))) {
      newSplit[index].amount = 0;
      setEditedSplit(newSplit);
    }
    setEditingIndex(-1);
  };

  const resetSplit = () => {
    setEditedSplit(originalSplit ? originalSplit.map(item => ({ ...item })) : null);
    setEditingIndex(-1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BACKGROUND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView 
        ref={scrollViewRef} 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        <BackArrowHeader />
        <Text style={styles.title}>Pay Credit Cards</Text>
        <Text style={styles.subtitle}>Select one or more cards to pay and enter a total payment amount.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput
            placeholder="Total payment amount"
            value={amount}
            onChangeText={val => {
              setAmount(val);
              setUsingSuggested(false);
            }}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={{ backgroundColor: PRIMARY, borderRadius: 8, padding: 10, justifyContent: 'center', alignItems: 'center' }}
            onPress={handleAIRecommendation}
            disabled={aiLoading}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Removed Optimization Goal selection for cleaner UI */}
        {/* <Text style={styles.label}>Optimization Goal:</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity ...>...</TouchableOpacity>
          <TouchableOpacity ...>...</TouchableOpacity>
        </View> */}
        {/* Adjust spacing after removing goal selection */}
        <View style={{ height: 8 }} />
        {/* Payment Split section: now above card list, only shown if result && !paymentResults */}
        {result && !paymentResults && (
          <Animated.View style={[styles.resultBox, { backgroundColor: splitHighlight.interpolate({ inputRange: [0, 1], outputRange: ['#f8f9fa', '#e0fff3'] }) }]}> 
            <Text style={styles.resultTitle}>Payment Split</Text>
            {editedSplit && Array.isArray(editedSplit) && editedSplit.map((s, i) => (
              <View key={i} style={styles.splitCardContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.splitCardLabel}>
                    Card: <Text style={styles.splitCardNumber}>••••{(s.card_id || '').slice(-4)}</Text>
                  </Text>
                  {editingIndex === i ? (
                    <TextInput
                      style={styles.splitCardAmountInput}
                      value={splitInputValues[i]}
                      autoFocus
                      keyboardType="numeric"
                      onChangeText={val => handleSplitInputChange(i, val)}
                      onBlur={() => handleSplitInputBlur(i)}
                      onSubmitEditing={() => handleSplitInputBlur(i)}
                      returnKeyType="done"
                      selectTextOnFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setEditingIndex(i)} activeOpacity={0.7}>
                      <Text style={styles.splitCardAmountDisplay}>${splitInputValues[i]}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.splitCardType}>{s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : ''}</Text>
              </View>
            ))}
            {/* Loading spinner for explanation */}
            {splitExplainLoading && (
              <View style={styles.aiLoadingBox}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.aiLoadingText}>Updating explanation...</Text>
              </View>
            )}
            {/* Updated explanation and projected outcome */}
            {!splitExplainLoading && splitExplanation && (
              <Animated.View style={{
                backgroundColor: splitExplainHighlight ? '#e0fff3' : 'transparent',
                borderRadius: 8,
                padding: 8,
                marginTop: 10,
                marginBottom: 2,
                transition: 'background-color 0.3s',
              }}>
                <Text style={styles.resultExplanation}>{splitExplanation}</Text>
                {splitProjectedOutcome ? (
                  <Text style={styles.projectedOutcome}>{splitProjectedOutcome}</Text>
                ) : null}
              </Animated.View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <TouchableOpacity style={styles.resetButton} onPress={resetSplit} activeOpacity={0.8}>
                <Text style={styles.resetButtonText}>Reset to Recommended</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.resetButton, { backgroundColor: '#ffeaea', marginLeft: 8 }]} onPress={cancelRecommendation} activeOpacity={0.8}>
                <Text style={[styles.resetButtonText, { color: '#d32f2f' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {result.explanation && <Text style={styles.resultExplanation}>{result.explanation}</Text>}
            <Text style={[styles.label, { marginTop: 16 }]}>Select Funding Account:</Text>
            {fundingAccounts.length === 0 ? (
              <Text style={styles.text}>No funding accounts found.</Text>
            ) : (
              (fundingAccounts || []).map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedFunding(item.id)}
                  style={[
                    styles.fundingAccountContainer,
                    selectedFunding === item.id && styles.fundingAccountSelected
                  ]}
                  activeOpacity={0.88}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.fundingAccountLabel}>
                      {item.institution || 'Account'} <Text style={styles.fundingAccountNumber}>••••{item.id ? String(item.id).slice(-4) : '----'}</Text>
                    </Text>
                    <Text style={styles.fundingAccountBalance}>${typeof item.balance === 'number' ? item.balance.toFixed(2) : '--'}</Text>
                  </View>
                  <Text style={styles.fundingAccountType}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : ''}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.payButton} onPress={handleExecute} disabled={executing}>
              {executing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Execute Payment</Text>}
            </TouchableOpacity>
          </Animated.View>
        )}
        {/* Card selection list: only show if no recommendation is applied */}
        {!(result && !paymentResults) && (
          <>
            <Text style={styles.label}>Select Credit Card(s):</Text>
            {cards.length === 0 ? (
              <Text style={styles.text}>No credit cards found.</Text>
            ) : (
              (cards || []).map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleSelect(item.id)}
                  style={[
                    styles.cardItemPolished,
                    selected.includes(item.id) && styles.cardItemSelectedPolished
                  ]}
                  activeOpacity={0.92}
                >
                  {item.institution && (
                    <Text style={styles.institutionName}>{item.institution}</Text>
                  )}
                  <View style={styles.cardTopRowPolished}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountNamePolished}>{item.name}</Text>
                      <Text style={styles.accountNumberPolished}>••••{item.last4 || String(item.id).slice(-4)}</Text>
                    </View>
                    <Text style={styles.accountBalancePolished}>
                      {typeof item.balance === 'number' ? `$${item.balance.toFixed(2)}` : '--'}
                    </Text>
                  </View>
                  <View style={styles.dividerPolished} />
                  {item.apr > 0 && (
                    <View style={styles.metricsRowPolished}>
                      <Text style={styles.metricTextPolished}>APR: {typeof item.apr === 'number' ? item.apr : '--'}%</Text>
                      <Text style={styles.metricTextPolished}>Interest: {typeof item.monthlyInterest === 'number' ? `$${item.monthlyInterest.toFixed(2)}` : '--'}</Text>
                      <View style={styles.healthBarRowPolished}>
                        <AccountHealthBar value={typeof item.creditHealth === 'number' ? item.creditHealth : 0} />
                        <Text style={styles.healthLabelPolished}>{typeof item.creditHealth === 'number' ? item.creditHealth : '--'}%</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay</Text>}
        </TouchableOpacity>
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
              {aiRecommendations && console.log('SUCCESS! AI Recommendation Received:', JSON.stringify(aiRecommendations, null, 2))}
              {aiRecommendations && (
                <ScrollView>
                  {/* Minimize Interest */}
                  <View style={{ marginBottom: 24, borderWidth: aiRecommendations.nexus_recommendation === 'Avalanche Method' ? 2 : 0, borderColor: aiRecommendations.nexus_recommendation === 'Avalanche Method' ? 'green' : 'transparent', borderRadius: 8, padding: 8 }}>
                    <Text style={styles.label}>
                      Minimize Interest {aiRecommendations.nexus_recommendation === 'Avalanche Method' && <Text style={{ color: 'green', fontWeight: 'bold' }}> (Recommended)</Text>}
                    </Text>
                    <Text style={styles.explanationHighlight}>{aiRecommendations.minimize_interest_plan.explanation}</Text>
                    <Text style={[styles.projectedOutcome, { marginTop: 6 }]}>{aiRecommendations.minimize_interest_plan.projected_outcome}</Text>
                    <Text style={[styles.label, { marginTop: 8 }]}>Payment Split:</Text>
                    <ScrollView style={{ maxHeight: 180, marginBottom: 8 }} nestedScrollEnabled={true}>
                      {Array.isArray(aiRecommendations.minimize_interest_plan?.split) && aiRecommendations.minimize_interest_plan.split.map((s, i) => (
                        <View key={i} style={[styles.splitRow, { flexDirection: 'column', alignItems: 'flex-start' }]}> 
                          <Text
                            style={[styles.resultText, { maxWidth: '100%', fontWeight: 'bold' }]} 
                            numberOfLines={1} 
                            ellipsizeMode="tail"
                          >
                            Card: {s.card_name}
                          </Text>
                          <Text style={[styles.resultText, { color: PRIMARY, marginTop: 2 }]}>${s.amount.toFixed(2)} ({s.type})</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <Pressable 
                      style={styles.applyButton} 
                      onPress={() => applyRecommendation(aiRecommendations.minimize_interest_plan, 'MINIMIZE_INTEREST_COST')}>
                      <Text style={styles.applyButtonText}>Apply This Recommendation</Text>
                    </Pressable>
                  </View>
                  {/* Maximize Score */}
                  <View style={{ borderWidth: aiRecommendations.nexus_recommendation === 'Credit Score Booster' ? 2 : 0, borderColor: aiRecommendations.nexus_recommendation === 'Credit Score Booster' ? 'green' : 'transparent', borderRadius: 8, padding: 8 }}>
                    <Text style={styles.label}>
                      Maximize Score {aiRecommendations.nexus_recommendation === 'Credit Score Booster' && <Text style={{ color: 'green', fontWeight: 'bold' }}> (Recommended)</Text>}
                    </Text>
                    <Text style={styles.explanationHighlight}>{aiRecommendations.maximize_score_plan.explanation}</Text>
                    <Text style={[styles.projectedOutcome, { marginTop: 6 }]}>{aiRecommendations.maximize_score_plan.projected_outcome}</Text>
                    <Text style={[styles.label, { marginTop: 8 }]}>Payment Split:</Text>
                    <ScrollView style={{ maxHeight: 180, marginBottom: 8 }} nestedScrollEnabled={true}>
                      {Array.isArray(aiRecommendations.maximize_score_plan?.split) && aiRecommendations.maximize_score_plan.split.map((s, i) => (
                        <View key={i} style={[styles.splitRow, { flexDirection: 'column', alignItems: 'flex-start' }]}> 
                          <Text
                            style={[styles.resultText, { maxWidth: '100%', fontWeight: 'bold' }]} 
                            numberOfLines={1} 
                            ellipsizeMode="tail"
                          >
                            Card: {s.card_name}
                          </Text>
                          <Text style={[styles.resultText, { color: PRIMARY, marginTop: 2 }]}>${s.amount.toFixed(2)} ({s.type})</Text>
                        </View>
                      ))}
                    </ScrollView>
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
        {/* AI Recommendation Loading Overlay */}
        {aiLoading && (
          <View style={styles.aiLoadingOverlay}>
            <View style={styles.aiLoadingBox}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.aiLoadingText}>Generating AI Recommendation...</Text>
            </View>
          </View>
        )}
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
  projectedOutcome: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    marginTop: 4,
  },
  cardItemPolished: {
    backgroundColor: SUBTLE,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'center',
    transition: 'box-shadow 0.2s',
  },
  cardItemSelectedPolished: {
    backgroundColor: PRIMARY + '18',
    borderColor: PRIMARY,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },
  institutionName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
    marginLeft: 2,
  },
  cardTopRowPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  accountNamePolished: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 1,
  },
  accountNumberPolished: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  accountBalancePolished: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    marginLeft: 8,
    marginRight: 2,
  },
  dividerPolished: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 10,
    borderRadius: 1,
    opacity: 0.7,
  },
  metricsRowPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricTextPolished: {
    fontSize: 13,
    color: '#757575',
    marginRight: 8,
    fontWeight: '500',
  },
  healthBarRowPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthLabelPolished: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  splitCardContainer: {
    backgroundColor: '#f4f8f7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  splitCardLabel: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  splitCardNumber: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  splitCardAmount: {
    fontSize: 17,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  splitCardType: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
  fundingAccountContainer: {
    backgroundColor: '#f7fafd',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  fundingAccountSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY + '10',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fundingAccountLabel: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  fundingAccountNumber: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  fundingAccountBalance: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  fundingAccountType: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
  splitCardAmountInput: {
    fontSize: 17,
    color: PRIMARY,
    fontWeight: 'bold',
    borderBottomWidth: 1.5,
    borderBottomColor: PRIMARY,
    minWidth: 70,
    textAlign: 'right',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
  splitCardAmountDisplay: {
    fontSize: 17,
    color: PRIMARY,
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'right',
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
    paddingVertical: 2,
  },
  resetButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  resetButtonText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  aiLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  aiLoadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  aiLoadingText: {
    marginTop: 18,
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
}); 