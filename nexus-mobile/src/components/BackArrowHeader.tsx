import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BackArrowHeaderProps { children?: React.ReactNode; }

const BackArrowHeader = memo<BackArrowHeaderProps>(({ children }) => {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top', 'left']} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={26} color="#20C990" />
        </TouchableOpacity>
        {children}
      </View>
    </SafeAreaView>
  );
});

BackArrowHeader.displayName = 'BackArrowHeader';

export default BackArrowHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingLeft: 16,
    paddingBottom: 4,
    minHeight: 48,
  },
  backBtn: {
    padding: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: 8,
  },
}); 