import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useOnboardingSessionStore } from '../store/onboardingSession.store';

export function useOnboardingGuard(currentStep: number) {
  const router = useRouter();
  const segments = useSegments();
  const { step, status, restoreSession } = useOnboardingSessionStore();

  useEffect(() => {
    // Automatically redirect returning "completed" users to Step 4 (Upload)
    if (status === 'completed' && currentStep !== 4) {
      router.replace('/(onboarding)/upload');
      return;
    }

    // Enforce sequential navigation
    if (status === 'in-progress' && currentStep > step) {
      const stepMap: Record<number, any> = {
        1: '/(auth)/onboarding-welcome',
        2: '/(auth)/questionnaire',
        3: '/(onboarding)/create-profile',
        4: '/(onboarding)/upload'
      };
      
      router.replace(stepMap[step] || '/(auth)/onboarding-welcome');
    }
  }, [currentStep, step, status, router, segments]);
}
