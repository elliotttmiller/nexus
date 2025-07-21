import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../../app/OnboardingScreen';
import DashboardScreen from '../../app/DashboardScreen';
import CardRankScreen from '../../app/CardRankScreen';
import InterestKillerScreen from '../../app/InterestKillerScreen';
import SettingsScreen from '../../app/SettingsScreen';
import AccountsScreen from '../../app/AccountsScreen';
import TransactionsScreen from '../../app/TransactionsScreen';
import ProfileScreen from '../../app/ProfileScreen';
import DataAccessScreen from '../../app/DataAccessScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="CardRank" component={CardRankScreen} />
      <Stack.Screen name="InterestKiller" component={InterestKillerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="DataAccess" component={DataAccessScreen} />
    </Stack.Navigator>
  );
} 