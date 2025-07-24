import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRIMARY } from '../src/constants/colors';
import AccountHealthBar from '../src/components/AccountHealthBar';
import BottomNavigation from '../src/components/BottomNavigation';
import { LineChart } from 'react-native-chart-kit';
import * as shape from 'd3-shape';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  // ...fetch accounts, transactions, etc...
  // For demonstration, use mock data:
  const accounts = [
    { id: '1', name: 'Plaid Credit Card', last4: '1234', balance: 410, apr: 12.5, monthlyInterest: 20, creditHealth: 85 },
    { id: '2', name: 'Plaid Business Credit Card', last4: '5678', balance: 5020, apr: 19.99, monthlyInterest: 80, creditHealth: 72 },
  ];
  const transactions = [
    { id: 't1', description: 'Starbucks', amount: -5.25, date: '2024-07-01' },
    { id: 't2', description: 'Amazon', amount: -120.99, date: '2024-06-30' },
    { id: 't3', description: 'Payroll', amount: 2000, date: '2024-06-29' },
    { id: 't4', description: 'Uber', amount: -18.50, date: '2024-06-28' },
    { id: 't5', description: 'Whole Foods', amount: -60.00, date: '2024-06-27' },
    { id: 't6', description: 'Spotify', amount: -9.99, date: '2024-06-26' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Dashboard</Text>
        {/* Account Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
            snapToAlignment="start"
            decelerationRate={0.95}
            snapToInterval={CARD_WIDTH + 16}
            overScrollMode="always"
          >
            {accounts.map((acc) => (
              <TouchableOpacity key={acc.id} style={styles.accountCard} activeOpacity={0.88}>
                <Text style={styles.accountName}>{acc.name}</Text>
                <Text style={styles.accountNumber}>••••{acc.last4}</Text>
                <Text style={styles.accountBalance}>${acc.balance.toFixed(2)}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>APR: {acc.apr}%</Text>
                  <Text style={styles.metricText}>Interest: ${acc.monthlyInterest.toFixed(2)}</Text>
                </View>
                <View style={styles.healthBarRow}>
                  <AccountHealthBar value={acc.creditHealth} />
                  <Text style={styles.healthLabel}>{acc.creditHealth}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.viewAllBtnRow}>
            <TouchableOpacity style={styles.viewAllBtnCard} onPress={() => router.push('/accounts')} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Section Divider */}
        <View style={styles.sectionDivider} />
        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 6).map((tx) => (
            <View key={tx.id} style={styles.transactionRow}>
              <Text style={styles.txDesc}>{tx.description}</Text>
              <Text style={[styles.txAmount, { color: tx.amount < 0 ? '#F44336' : PRIMARY }]}>${Math.abs(tx.amount).toFixed(2)}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
          ))}
        </View>
        {/* Analysis Container */}
        <AnalysisContainer />
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

function AnalysisContainer() {
  // Mock data for the line graph (e.g., daily spending for the last 7 days)
  const data = [120, 80, 95, 60, 130, 90, 70];
  const totalSpent = data.reduce((sum, v) => sum + v, 0);
  const maxSpent = Math.max(...data);
  return (
    <View style={analysisStyles.container}>
      <Text style={analysisStyles.title}>Spending Analysis</Text>
      <Text style={analysisStyles.subtitle}>Your spending trend this week</Text>
      <LineChart
        data={{
          labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
          datasets: [
            { data, color: () => PRIMARY, strokeWidth: 3 },
          ],
        }}
        width={SCREEN_WIDTH - 48}
        height={110}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => PRIMARY,
          labelColor: (opacity = 1) => '#888',
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: PRIMARY,
          },
          propsForBackgroundLines: {
            stroke: '#e6e9ef',
            strokeDasharray: '',
          },
        }}
        bezier
        style={{ borderRadius: 12, marginVertical: 6 }}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
      />
      <View style={analysisStyles.statsRow}>
        <View style={analysisStyles.statBox}>
          <Text style={analysisStyles.statLabel}>Total Spent</Text>
          <Text style={analysisStyles.statValue}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={analysisStyles.statBox}>
          <Text style={analysisStyles.statLabel}>Max Day</Text>
          <Text style={analysisStyles.statValue}>${maxSpent.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320); // Premium wide card
const CARD_HEIGHT = 148;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
    minHeight: '100%',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 18,
    marginLeft: 2,
  },
  carouselContainer: {
    marginBottom: 28,
  },
  carouselScroll: {
    flexDirection: 'row',
    paddingBottom: 2,
    paddingHorizontal: 8,
    gap: 16,
  },
  accountCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#f0f2f7',
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 13,
    color: '#757575',
    marginRight: 8,
    fontWeight: '500',
  },
  healthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  healthLabel: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  viewAllBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 2,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
  },
  viewAllText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  txDesc: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  txDate: {
    fontSize: 13,
    color: '#888',
    minWidth: 80,
    textAlign: 'right',
  },
  viewAllBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 2,
    marginLeft: 8,
  },
  viewAllBtnCard: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  viewAllBtnFixed: {
    marginLeft: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: PRIMARY + '11',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: '#e6e9ef',
    marginVertical: 18,
    borderRadius: 1,
    opacity: 0.7,
  },
});

// Add styles for analysis container
const analysisStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
  },
  chartRow: {
    width: '100%',
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'flex-start',
    marginRight: 18,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY,
  },
}); 