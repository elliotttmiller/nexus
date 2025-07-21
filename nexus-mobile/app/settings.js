import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { BACKGROUND, TEXT, SUBTLE, BORDER } from '../src/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: BACKGROUND }}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.section}><Text style={styles.sectionText}>Profile Info</Text></View>
        <View style={styles.section}><Text style={styles.sectionText}>2FA Management</Text></View>
        <View style={styles.section}><Text style={styles.sectionText}>Data Access & Privacy</Text></View>
        <PrimaryButton title="Edit Profile" onPress={() => router.push('/profile')} />
        <PrimaryButton title="Manage Data Access" onPress={() => router.push('/data-access')} />
        <PrimaryButton title="Back to Dashboard" onPress={() => router.push('/dashboard')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: TEXT },
  section: { backgroundColor: SUBTLE, padding: 16, borderRadius: 8, marginBottom: 12, width: '100%', borderColor: BORDER, borderWidth: 1 },
  sectionText: { color: TEXT },
}); 