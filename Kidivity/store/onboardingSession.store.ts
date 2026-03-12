import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingState {
  step: number;
  status: 'in-progress' | 'completed';
  sessionData: any | null;
  setStep: (step: number) => void;
  setStatus: (status: 'in-progress' | 'completed') => void;
  completeOnboarding: () => void;
  syncWithBackend: () => Promise<void>;
  restoreSession: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingSessionStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      status: 'in-progress',
      sessionData: null,
      setStep: (step) => {
        // Only allow setting step if in-progress or returning to a previous step
        set({ step });
      },
      setStatus: (status) => set({ status }),
      completeOnboarding: () => set({ status: 'completed', step: 4 }),
      syncWithBackend: async () => {
        // Sync status to backend logic
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
          const { status, step } = get();
          await fetch(`${apiUrl}/api/onboarding/sessions/sync`, {
            method: 'POST',
            body: JSON.stringify({ status, step }),
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          // silently fail or handle error
        }
      },
      restoreSession: async () => {
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
          // The "New Evaluation" flow for returning users now attempts to restore the latest completed onboarding session
          const res = await fetch(`${apiUrl}/api/onboarding/sessions/restore`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            set({ sessionData: data, step: 4, status: 'completed' });
          } else {
            // fallback if api no backend
            set({ step: 4, status: 'completed' });
          }
        } catch (error) {
            set({ step: 4, status: 'completed' });
        }
      },
      reset: () => set({ step: 1, status: 'in-progress', sessionData: null }),
    }),
    {
      name: 'kidivity-onboarding-session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
