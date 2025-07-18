import React from 'react';
import { View, Text, Button, StyleSheet, ProgressBarAndroid } from 'react-native';

export default function DashboardScreen({ navigation }) {
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
        <Text style={styles.widgetTitle}>Debt Freedom Clock</Text>
        <Text>Estimated: {debtFreedomMonths} months to debt-free</Text>
      </View>
      <Button title="CardRank" onPress={() => navigation.navigate('CardRank')} />
      <Button title="Interest Killer" onPress={() => navigation.navigate('InterestKiller')} />
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
      <Button title="Accounts" onPress={() => navigation.navigate('Accounts')} />
      <Button title="Transactions" onPress={() => navigation.navigate('Transactions')} />
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