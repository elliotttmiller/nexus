import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="accounts" />
      <Stack.Screen name="pay" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="data-access" />
    </Stack>
  );
} 