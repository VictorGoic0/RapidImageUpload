import { Stack, Redirect, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

/**
 * Root layout component with authentication provider and routing logic.
 */
function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check if we're in the auth group
  const inAuthGroup = segments[0] === 'auth';

  if (!isAuthenticated && !inAuthGroup) {
    // Redirect to login if not authenticated and not already in auth
    return <Redirect href="/auth/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    // Redirect to tabs if authenticated and in auth screens
    return <Redirect href="/tabs/gallery" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
    </Stack>
  );
}

/**
 * Root layout component with authentication provider.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

