import { create } from 'zustand';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { resetAllStores } from './reset';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;
    _authSubscription: (() => void) | null;
}

interface AuthActions {
    initialize: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

/**
 * Ensures a row exists in `public.users` for the given Supabase Auth user.
 * Called only via auth state change listener to prevent redundant triggers.
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
        // be deployed yet.
        console.warn('[auth] ensureUserRow failed — users table may not exist yet');
    }
}

const INVALID_REFRESH_TOKEN_MESSAGES = ['invalid refresh token', 'refresh token not found'];

function isInvalidRefreshTokenError(message?: string): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return INVALID_REFRESH_TOKEN_MESSAGES.some(fragment => normalized.includes(fragment));
}

export const useAuthStore = create<AuthStore>()(
        (set, get) => ({
            // State
            user: null,
            session: null,
            isLoading: false,
            isInitialized: false,
            _authSubscription: null,

            // Actions
            initialize: async () => {
                // Unsubscribe any existing listener before re-init
                get()._authSubscription?.();

                try {
                    const { data, error } = await supabase.auth.getSession();
                    if (error && isInvalidRefreshTokenError(error.message)) {
                        try {
                            await supabase.auth.signOut();
                        } catch {
                            // Best-effort cleanup for stale refresh token.
                        }
                        resetAllStores();
                        set({
                            session: null,
                            user: null,
                            isInitialized: true,
                        });
                        return;
                    }

                    const session = data.session;
                    set({
                        session,
                        user: session?.user ?? null,
                        isInitialized: true,
                    });

                    // Single source of truth for auth changes and user row syncing
                    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
                        const user = session?.user ?? null;
                        
                        set({
                            session,
                            user,
                        });

                        // Sync user metadata on entry or login events
                        if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
                            await ensureUserRow(user);
                        }
                        
                        if (event === 'SIGNED_OUT') {
                            resetAllStores();
                        }
                    });
                    
                    set({ _authSubscription: () => subscription.unsubscribe() });
                } catch {
                    resetAllStores();
                    set({ isInitialized: true });
                }
            },

            signUp: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signUp({ email, password });

                    if (error) {
                        console.warn('[auth] signUp error:', error.message);
                        set({ isLoading: false });
                        if (error.message.toLowerCase().includes('already registered')) {
                            return { error: 'An account with this email already exists. Try signing in.' };
                        }
                        return { error: 'Failed to create account. Please try again.' };
                    }

                    if (
                        data.user &&
                        data.user.identities &&
                        data.user.identities.length === 0
                    ) {
                        set({ isLoading: false });
                        return { error: 'An account with this email may already exist. Try signing in instead.' };
                    }

                    // No manual ensureUserRow here; listener will catch the SIGNED_IN event
                    set({
                        user: data.user,
                        session: data.session,
                        isLoading: false,
                    });
                    return { error: null };
                } catch (err: unknown) {
                    console.error('[auth] signUp exception:', err instanceof Error ? err.message : err);
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred. Please try again.' };
                }
            },

            signIn: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) {
                        console.warn('[auth] signIn error:', error.message);
                        set({ isLoading: false });
                        return { error: 'Invalid email or password.' };
                    }
                    
                    // No manual ensureUserRow here; listener will catch the SIGNED_IN event
                    set({
                        user: data.user,
                        session: data.session,
                        isLoading: false,
                    });
                    return { error: null };
                } catch (err: unknown) {
                    console.error('[auth] signIn exception:', err instanceof Error ? err.message : err);
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred. Please try again.' };
                }
            },

            signOut: async () => {
                set({ isLoading: true });
                get()._authSubscription?.();

                try {
                    await supabase.auth.signOut();
                } catch (err: unknown) {
                    console.warn('[auth] signOut failed:', err instanceof Error ? err.message : err);
                } finally {
                    // resetAllStores is handled by listener for SIGNED_OUT, 
                    // but we call it here as well for immediate cleanup in case listener fails.
                    resetAllStores();
                    set({
                        user: null,
                        session: null,
                        isLoading: false,
                        _authSubscription: null,
                    });
                }
            },

        })
);
