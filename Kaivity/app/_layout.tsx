import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const router = useRouter();
  const segments = useSegments();

  // STABLE SELECTORS
  const profiles = useProfileStore((s) => s.profiles);
  const hasLoadedProfiles = useProfileStore((s) => s.hasLoadedProfiles);
  const fetchProfiles = useProfileStore((s) => s.fetchProfiles);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch profiles only when initialized or when session changes
  useEffect(() => {
    if (isInitialized) {
      fetchProfiles();
    }
  }, [isInitialized, session?.user?.id, fetchProfiles]);

  // Auth + onboarding routing guard
  useEffect(() => {
    if (!isInitialized || !hasLoadedProfiles || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inPublicOnboarding =
      inOnboardingGroup && (segments[1] === 'welcome' || segments[1] === 'questionnaire');
    const isAuthenticated = !!session;
    const hasProfiles = profiles.length > 0;

    // 1. Unauthenticated users -> welcome (unless already on a public onboarding screen)
    if (!isAuthenticated) {
      if (!inAuthGroup && !inPublicOnboarding) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    // 2. Authenticated users on auth screens -> check profiles
    if (inAuthGroup) {
      router.replace(hasProfiles ? '/(tabs)' : '/(onboarding)/create-profile');
      return;
    }

    // 3. Authenticated, no profiles, not in onboarding -> force onboarding
    // This ensures new users are funneled correctly after signup
    if (!hasProfiles && !inOnboardingGroup && segments[0] !== 'profile') {
      router.replace('/(onboarding)/create-profile');
      return;
    }

    // 4. Authenticated, has profiles, still in onboarding -> send to main app
    // Except if they are in the 'first-activity' generation step
    if (hasProfiles && inOnboardingGroup && segments[1] !== 'first-activity') {
      router.replace('/(tabs)');
      return;
    }

    // 5. Authenticated, has profiles, on root -> send to main app
    if (hasProfiles && (segments as string[]).length === 0) {
      router.replace('/(tabs)');
      return;
    }
  }, [session, isInitialized, segments, profiles.length, fontsLoaded, hasLoadedProfiles]);

  // Show loading spinner until auth state is resolved or fonts load
  if (!isInitialized || !hasLoadedProfiles || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
});
