import React from 'react';
import { ScrollView } from 'react-native';
import Profile from './(app)/profile';
import Settings from './(app)/settings';

export default function UnifiedSettingsScreen() {
  return (
    <ScrollView>
      <Profile />
      <Settings />
    </ScrollView>
  );
} 