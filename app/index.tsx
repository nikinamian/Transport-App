import { Redirect, useRootNavigationState } from 'expo-router';

export default function Index() {
  const rootNavigationState = useRootNavigationState();

  // Wait for the navigation tree to be ready before redirecting
  if (!rootNavigationState?.key) return null;

  return <Redirect href="/(tabs)" />;
}