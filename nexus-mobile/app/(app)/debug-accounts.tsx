import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

// Simple debug component to understand user state
export default function DebugAccountsScreen() {
  const auth = useAuth();
  const user = auth?.user;
  const userId = user?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Debug Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Context:</Text>
        <Text style={styles.debugText}>auth exists: {auth ? 'YES' : 'NO'}</Text>
        <Text style={styles.debugText}>user exists: {user ? 'YES' : 'NO'}</Text>
        <Text style={styles.debugText}>user.authenticated: {String(user?.authenticated)}</Text>
        <Text style={styles.debugText}>userId: {userId || 'MISSING'}</Text>
        <Text style={styles.debugText}>user.email: {user?.email || 'MISSING'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Object:</Text>
        <Text style={styles.debugText}>{JSON.stringify(user, null, 2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform:</Text>
        <Text style={styles.debugText}>Platform: iOS</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#666',
  },
});
