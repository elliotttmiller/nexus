import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface AccountHealthBarProps {
  value: number; // 0-100
}

const AccountHealthBar = memo<AccountHealthBarProps>(({ value }) => {
  let barColor = '#20C990';
  if (value < 40) barColor = '#F44336'; // red
  else if (value < 80) barColor = '#FFA726'; // orange

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: barColor }]} />
      <View style={styles.bgBar} />
    </View>
  );
});

AccountHealthBar.displayName = 'AccountHealthBar';

export default AccountHealthBar;

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    zIndex: 2,
    height: 6,
  },
  bgBar: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
}); 