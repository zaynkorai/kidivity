import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import 'react-native-reanimated';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const profiles = useProfileStore((s) => s.profiles);
  const fetchProfiles = useProfileStore((s) => s.fetchProfiles);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  // Fetch profiles whenever user signs in
  useEffect(() => {
    if (session) {
      fetchProfiles();
    }
  }, [session]);

  // Auth + onboarding routing guard
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const isAuthenticated = !!session;
    const hasProfiles = profiles.length > 0;

    if (!isAuthenticated && !inAuthGroup) {
      // Not signed in → send to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Signed in on auth screen → check for profiles
      if (hasProfiles) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/create-profile');
      }
    } else if (isAuthenticated && !hasProfiles && !inOnboardingGroup) {
      // Signed in, no profiles, not on onboarding → send to onboarding
      router.replace('/(onboarding)/create-profile');
    } else if (isAuthenticated && hasProfiles && inOnboardingGroup) {
      // Has profiles but still on onboarding → send to main app
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments, profiles.length]);

  // Show loading spinner until auth state is resolved
  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="profile/create"
          options={{ presentation: 'modal', headerShown: true, title: 'Add Kid' }}
        />
        <Stack.Screen
          name="profile/[id]/edit"
          options={{ presentation: 'modal', headerShown: true, title: 'Edit Profile' }}
        />
        <Stack.Screen
          name="activity/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="print-preview"
          options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
