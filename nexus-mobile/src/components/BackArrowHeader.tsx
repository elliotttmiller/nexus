import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackArrowHeaderProps {
  children?: React.ReactNode;
}

export default function BackArrowHeader({ children }: BackArrowHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={() => router.replace('/dashboard')}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={26} color="#20C990" />
      </TouchableOpacity>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingLeft: 4,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 