import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Colors } from '@/constants/theme';

export default function RootIndex() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const profiles = useProfileStore((s) => s.profiles);
  const hasLoadedProfiles = useProfileStore((s) => s.hasLoadedProfiles);

  useEffect(() => {
    if (!isInitialized || !hasLoadedProfiles) return;

    if (!session) {
      // Not logged in -> Auth
      router.replace('/(auth)/welcome');
    } else if (profiles.length === 0) {
      // Logged in but no profiles -> Onboarding
      router.replace('/(onboarding)/create-profile');
    } else {
      // Full access -> Tabs
      router.replace('/(tabs)');
    }
  }, [isInitialized, hasLoadedProfiles, session, profiles.length, router]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
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
