import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useOnboardingGuard } from '../../hooks/useOnboardingGuard';
import { useOnboardingSessionStore } from '../../store/onboardingSession.store';
import { Colors, Spacing, Fonts, FontSize } from '../../constants/theme';

export default function UploadActivityScreen() {
  useOnboardingGuard(4);
  const router = useRouter();
  const { sessionData, completeOnboarding } = useOnboardingSessionStore();

  const handleComplete = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 4: Upload</Text>
      <Text style={styles.subtitle}>
        {sessionData
          ? 'Session restored! Ready to generate.'
          : 'Upload your childs reference works or materials before we generate an activity.'}
      </Text>

      <Button
        title={sessionData ? 'Continue' : 'Complete Onboarding'}
        onPress={handleComplete}
        variant="primary"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing['3xl'],
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
