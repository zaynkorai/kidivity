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

/**
 * Ensures a row exists in `public.users` for the given Supabase Auth user.
 * Called on every successful sign-in / session restore — the upsert is
 * idempotent so duplicates are harmless.
 */
async function ensureUserRow(user: User) {
    try {
        await supabase.from('users').upsert(
            {
                id: user.id,
                email: user.email ?? '',
                display_name: user.user_metadata?.full_name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null,
            },
            { onConflict: 'id' }
        );
    } catch {
        // Non-critical — the row may already exist or the table might not
        // be deployed yet (Phase 0 placeholder env).
        console.warn('[auth] ensureUserRow failed — users table may not exist yet');
    }
}

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

                    // Ensure user row exists for current session
                    if (session?.user) {
                        ensureUserRow(session.user);
                    }

                    // Listen for auth changes
                    supabase.auth.onAuthStateChange((_event, session) => {
                        set({
                            session,
                            user: session?.user ?? null,
                        });
                        // Ensure user row on every SIGNED_IN event
                        if (session?.user) {
                            ensureUserRow(session.user);
                        }
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
                    // Create public.users row for new sign-up
                    if (data.user) {
                        ensureUserRow(data.user);
                    }
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
                    // Ensure public.users row exists
                    if (data.user) {
                        ensureUserRow(data.user);
                    }
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
