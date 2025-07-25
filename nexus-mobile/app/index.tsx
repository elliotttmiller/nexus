import { Redirect } from 'expo-router';

export default function Index() {
  // This screen will never be seen. It just redirects.
  // The AuthProvider in _layout will handle redirecting to the correct group.
  return <Redirect href="/accounts" />;
} 