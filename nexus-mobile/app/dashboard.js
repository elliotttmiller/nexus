import React from 'react';
import { View, Text, Button, StyleSheet, ProgressBarAndroid } from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  // Mock data for demonstration
  const autopilotHealth = 85;
  const rewardsEarned = 120;
  const rewardsMissed = 30;
  const debtFreedomMonths = 15;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Autopilot Health Score</Text>
        <ProgressBarAndroid styleAttr="Horizontal" indeterminate={false} progress={autopilotHealth / 100} color="#4caf50" />
        <Text style={styles.healthScore}>{autopilotHealth} / 100</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Rewards Snapshot</Text>
        <Text>Earned: ${rewardsEarned} this month</Text>
        <Text>Missed: ${rewardsMissed} potential</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Debt Freedom</Text>
        <Text>{debtFreedomMonths} months to debt freedom</Text>
      </View>
      <Button title="Go to CardRank" onPress={() => router.push('/card-rank')} />
      <Button title="Go to InterestKiller" onPress={() => router.push('/interest-killer')} />
      <Button title="Go to Accounts" onPress={() => router.push('/accounts')} />
      <Button title="Go to Transactions" onPress={() => router.push('/transactions')} />
      <Button title="Go to Profile" onPress={() => router.push('/profile')} />
      <Button title="Go to Settings" onPress={() => router.push('/settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  widget: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 16 },
  widgetTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  healthScore: { fontSize: 16, color: '#4caf50', marginTop: 4 },
}); 