import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { PRIMARY } from '../constants/colors';
import { Feather, Ionicons } from '@expo/vector-icons';

const NAV_ITEMS = [
  { key: 'accounts', icon: <Feather name="credit-card" size={26} color="#fff" />, route: '/(app)/accounts' },
  { key: 'pay', icon: <Feather name="zap" size={26} color="#fff" />, route: '/(app)/pay' },
  { key: 'dashboard', icon: <Ionicons name="home" size={30} color="#fff" />, route: '/(app)/dashboard' },
  { key: 'settings', icon: <Feather name="settings" size={26} color="#fff" />, route: '/(app)/settings' },
] as const;

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item, idx) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.iconButton, idx === 1 && styles.centerButton]}
          onPress={() => router.replace(item.route as any)}
          activeOpacity={0.8}
        >
          {item.icon}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    height: 54,
    paddingHorizontal: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: Platform.OS === 'ios' ? 36 : 0,
    borderBottomRightRadius: Platform.OS === 'ios' ? 36 : 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerButton: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 