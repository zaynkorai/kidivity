import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;
}

interface AuthActions {
    initialize: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    setSession: (session: Session | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // State
            user: null,
            session: null,
            isLoading: false,
            isInitialized: false,

            // Actions
            initialize: async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    set({
                        session,
                        user: session?.user ?? null,
                        isInitialized: true,
                    });

                    // Listen for auth changes
                    supabase.auth.onAuthStateChange((_event, session) => {
                        set({
                            session,
                            user: session?.user ?? null,
                        });
                    });
                } catch {
                    set({ isInitialized: true });
                }
            },

            signUp: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signUp({ email, password });
                    if (error) {
                        set({ isLoading: false });
                        return { error: error.message };
                    }
                    set({
                        user: data.user,
                        session: data.session,
                        isLoading: false,
                    });
                    return { error: null };
                } catch (err) {
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred' };
                }
            },

            signIn: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) {
                        set({ isLoading: false });
                        return { error: error.message };
                    }
                    set({
                        user: data.user,
                        session: data.session,
                        isLoading: false,
                    });
                    return { error: null };
                } catch (err) {
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred' };
                }
            },

            signOut: async () => {
                set({ isLoading: true });
                await supabase.auth.signOut();
                set({
                    user: null,
                    session: null,
                    isLoading: false,
                });
            },

            setSession: (session) => {
                set({
                    session,
                    user: session?.user ?? null,
                });
            },
        }),
        {
            name: 'kidivity-auth',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                session: state.session,
                user: state.user,
            }),
        }
    )
);
