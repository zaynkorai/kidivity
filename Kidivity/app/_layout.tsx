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
    if (!isInitialized || !hasLoadedProfiles) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inPublicOnboarding =
      inOnboardingGroup && (segments[1] === 'welcome' || segments[1] === 'questionnaire');
    const isAuthenticated = !!session;
    const hasProfiles = profiles.length > 0;

    if (!isAuthenticated && !(inAuthGroup || inPublicOnboarding)) {
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
    } else if (isAuthenticated && hasProfiles && inOnboardingGroup && segments[1] !== 'first-activity') {
      // Has profiles but still on onboarding and not generating first activity → send to main app
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments, profiles.length]);

  // Show loading spinner until auth state is resolved or fonts load
  if (!isInitialized || !hasLoadedProfiles) {
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
          <Stack.Screen name="index" />
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
