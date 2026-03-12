import { useAuthStore } from '@/store/authStore';

/**
 * Convenience hook that selects commonly-needed auth values in one call.
 * Avoids repeating `useAuthStore((s) => ...)` in every screen.
 */
export function useAuth() {
    const user = useAuthStore((s) => s.user);
    const session = useAuthStore((s) => s.session);
    const isLoading = useAuthStore((s) => s.isLoading);
    const isInitialized = useAuthStore((s) => s.isInitialized);
    const signIn = useAuthStore((s) => s.signIn);
    const signUp = useAuthStore((s) => s.signUp);
    const signOut = useAuthStore((s) => s.signOut);

    const isAuthenticated = !!session;

    return {
        user,
        session,
        isLoading,
        isInitialized,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
    };
}
