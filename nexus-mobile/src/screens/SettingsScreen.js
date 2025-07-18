import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}><Text>Profile Info</Text></View>
      <View style={styles.section}><Text>2FA Management</Text></View>
      <View style={styles.section}><Text>Data Access & Privacy</Text></View>
      <Button title="Edit Profile" onPress={() => navigation.navigate('Profile')} />
      <Button title="Manage Data Access" onPress={() => navigation.navigate('DataAccess')} />
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  section: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 12, width: '100%' },
}); 