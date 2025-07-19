import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState({
    autopilotHealth: 0,
    rewardsEarned: 0,
    rewardsMissed: 0,
    debtFreedomMonths: 0,
  });

  const API_BASE_URL = 'https://nexus-production-2e34.up.railway.app';

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/insights?userId=1`);
      const data = await res.json();
      if (res.ok) {
        setInsights({
          autopilotHealth: data.autopilotHealth ?? 0,
          rewardsEarned: data.rewardsEarned ?? 0,
          rewardsMissed: data.rewardsMissed ?? 0,
          debtFreedomMonths: data.debtFreedomMonths ?? 0,
        });
      } else {
        setError(data.error || 'Failed to fetch dashboard insights');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Button title="Retry" onPress={fetchInsights} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Autopilot Health Score</Text>
        {Platform.OS === 'android' ? (
          <View style={{ width: '100%' }}>
            <View style={{ height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 }}>
              <View style={{ width: `${insights.autopilotHealth}%`, height: 8, backgroundColor: '#4caf50', borderRadius: 4 }} />
            </View>
          </View>
        ) : null}
        <Text style={styles.healthScore}>{insights.autopilotHealth} / 100</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Rewards Snapshot</Text>
        <Text>Earned: ${insights.rewardsEarned} this month</Text>
        <Text>Missed: ${insights.rewardsMissed} potential</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Debt Freedom Clock</Text>
        <Text>Estimated: {insights.debtFreedomMonths} months to debt-free</Text>
      </View>
      <Button title="CardRank" onPress={() => router.push('/(tabs)/card-rank')} />
      <Button title="Interest Killer" onPress={() => router.push('/(tabs)/interest-killer')} />
      <Button title="Settings" onPress={() => router.push('/(tabs)/settings')} />
      <Button title="Accounts" onPress={() => router.push('/(tabs)/accounts')} />
      <Button title="Transactions" onPress={() => router.push('/(tabs)/transactions')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  widget: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 16, width: '100%' },
  widgetTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  healthScore: { fontSize: 16, color: '#4caf50', marginTop: 4 },
}); 