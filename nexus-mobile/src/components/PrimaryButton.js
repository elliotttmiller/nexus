import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PRIMARY } from '../constants/colors';

export default function PrimaryButton({ title, onPress, style, ...props }) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} {...props}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 