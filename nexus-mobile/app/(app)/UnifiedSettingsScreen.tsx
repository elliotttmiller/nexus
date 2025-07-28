import React from 'react';
import { ScrollView } from 'react-native';
import Profile from './profile';
import Settings from './settings';

export default function UnifiedSettingsScreen() {
  return (
    <ScrollView>
      <Profile />
      <Settings />
    </ScrollView>
  );
} 