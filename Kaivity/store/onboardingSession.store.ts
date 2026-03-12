import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { getApiUrl } from '@/lib/network';
import { useAuthStore } from './authStore';

export interface OnboardingSessionData {
  id: string;
  user_id: string;
  status: 'in-progress' | 'completed';
  current_step: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingState {
  step: number;
  status: 'in-progress' | 'completed';
  sessionData: OnboardingSessionData | null;
  isLoading: boolean;
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
      isLoading: false,
      setStep: (step) => {
        // Only allow setting step if in-progress or returning to a previous step
        set({ step });
      },
      setStatus: (status) => set({ status }),
      completeOnboarding: () => set({ status: 'completed', step: 4 }),
      syncWithBackend: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const apiUrl = getApiUrl();
          const { status, step } = get();
          const token = useAuthStore.getState().session?.access_token;
          
          await fetch(`${apiUrl}/api/onboarding/sessions/sync`, {
            method: 'POST',
            body: JSON.stringify({ status, step }),
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
          });
        } catch (error) {
          // silently fail or handle error
        } finally {
          set({ isLoading: false });
        }
      },
      restoreSession: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const apiUrl = getApiUrl();
          const token = useAuthStore.getState().session?.access_token;
          
          // The "New Evaluation" flow for returning users now attempts to restore the latest completed onboarding session
          const res = await fetch(`${apiUrl}/api/onboarding/sessions/restore`, {
             method: 'POST',
             headers: { 
               'Content-Type': 'application/json',
               ...(token ? { 'Authorization': `Bearer ${token}` } : {})
             },
          });
          if (res.ok) {
            const data = await res.json();
            set({ sessionData: data as OnboardingSessionData, step: 4, status: 'completed' });
          } else {
            // fallback if api no backend
            set({ step: 4, status: 'completed' });
          }
        } catch (error) {
            set({ step: 4, status: 'completed' });
        } finally {
          set({ isLoading: false });
        }
      },
      reset: () => set({ step: 1, status: 'in-progress', sessionData: null, isLoading: false }),
    }),
    {
      name: 'kaivity-onboarding-session',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
