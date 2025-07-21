import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, PRIMARY, SUBTLE } from '../src/constants/colors';
import { ProgressBarAndroid } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  // Mock data for demonstration
  const autopilotHealth = 85;
  const rewardsEarned = 120;
  const rewardsMissed = 30;
  const debtFreedomMonths = 15;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Autopilot Health Score</Text>
        <ProgressBarAndroid styleAttr="Horizontal" indeterminate={false} progress={autopilotHealth / 100} color={PRIMARY} />
        <Text style={styles.healthScore}>{autopilotHealth} / 100</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Rewards Snapshot</Text>
        <Text style={styles.text}>Earned: ${rewardsEarned} this month</Text>
        <Text style={styles.text}>Missed: ${rewardsMissed} potential</Text>
      </View>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Debt Freedom</Text>
        <Text style={styles.text}>{debtFreedomMonths} months to debt freedom</Text>
      </View>
      <PrimaryButton title="Go to CardRank" onPress={() => router.push('/card-rank')} />
      <PrimaryButton title="Go to InterestKiller" onPress={() => router.push('/interest-killer')} />
      <PrimaryButton title="Go to Accounts" onPress={() => router.push('/accounts')} />
      <PrimaryButton title="Go to Transactions" onPress={() => router.push('/transactions')} />
      <PrimaryButton title="Go to Profile" onPress={() => router.push('/profile')} />
      <PrimaryButton title="Go to Settings" onPress={() => router.push('/settings')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: BACKGROUND },
  container: { padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: TEXT },
  widget: { backgroundColor: SUBTLE, padding: 16, borderRadius: 12, marginBottom: 16 },
  widgetTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: TEXT },
  healthScore: { fontSize: 16, color: PRIMARY, marginTop: 4 },
  text: { color: TEXT },
}); 