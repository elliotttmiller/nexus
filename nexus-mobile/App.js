import React, { useEffect } from 'react';
import { Text, View, LogBox } from 'react-native';

console.log('App.js loaded');

// Global error handlers
if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global Error Handler:', error, 'isFatal:', isFatal);
  });
}

process.on && process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on && process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(false); // Show all logs

export default function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  try {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Hello, Expo! (Debug Mode)</Text>
      </View>
    );
  } catch (err) {
    console.error('Error rendering App:', err);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
        <Text style={{ color: 'white' }}>Error rendering App: {err.message}</Text>
      </View>
    );
  }
}

console.log('App.js executed, should register main component.'); 