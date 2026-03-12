import { useEffect } from 'react';
import { usePathname, useRouter, Href } from 'expo-router';
import { useOnboardingSessionStore } from '../store/onboardingSession.store';
import { useAuthStore } from '../store/authStore';

export function useOnboardingGuard(currentStep: number) {
  const router = useRouter();
  const pathname = usePathname();
  const { step, status } = useOnboardingSessionStore();
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = !!session;

  useEffect(() => {
    const go = (target: Href) => {
      if (pathname !== target) router.replace(target);
    };

    // Automatically redirect returning "completed" users to Step 4 (Upload)
    if (status === 'completed' && currentStep !== 4) {
      if (isAuthenticated) go('/(onboarding)/upload');
      return;
    }

    // Enforce sequential navigation
    if (status === 'in-progress' && currentStep > step) {
      const stepMap: Record<number, Href> = {
        1: '/(auth)/onboarding-welcome',
        2: '/(auth)/questionnaire',
        3: '/(onboarding)/create-profile',
        4: '/(onboarding)/upload'
      };

      let target = stepMap[step] || ('/(auth)/onboarding-welcome' as Href);
      if (!isAuthenticated && (target as string).startsWith('/(onboarding)/')) {
        target = '/(auth)/onboarding-welcome' as Href;
      }
      go(target);
    }
  }, [currentStep, step, status, isAuthenticated, pathname, router]);
}
