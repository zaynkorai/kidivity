import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'supabase_provider.dart';
import '../constants/env.dart';

class AuthState {
  final User? user;
  final Session? session;
  final bool isLoading;
  final bool isInitialized;
  final String? error;

  AuthState({
    this.user,
    this.session,
    this.isLoading = false,
    this.isInitialized = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    Session? session,
    bool? isLoading,
    bool? isInitialized,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      session: session ?? this.session,
      isLoading: isLoading ?? this.isLoading,
      isInitialized: isInitialized ?? this.isInitialized,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final SupabaseClient _supabase;

  @override
  AuthState build() {
    _supabase = ref.watch(supabaseProvider);
    // Asynchronous initialization
    _initialize();
    
    // Start with current synchronous state
    final session = _supabase.auth.currentSession;
    return AuthState(
      user: session?.user,
      session: session,
    );
  }

  Future<void> _initialize() async {
    try {
      _supabase.auth.onAuthStateChange.listen((data) async {
        final AuthChangeEvent event = data.event;
        final Session? session = data.session;
        final User? user = session?.user;

        state = state.copyWith(
          session: session, 
          user: user,
          isInitialized: true,
        );

        if (user != null && 
            (event == AuthChangeEvent.signedIn || 
             event == AuthChangeEvent.initialSession || 
             event == AuthChangeEvent.userUpdated)) {
            await _ensureUserRow(user);
        }

        if (event == AuthChangeEvent.signedOut) {
            // After sign out, we immediately sign in anonymously
            // to ensure the app is never in an unauthenticated state.
            // Note: ProfileNotifier and OnboardingNotifier handle their own 
            // state resets by listening to authProvider.
            await signInAnonymously();
        }
      });

      // Initial check for session after a brief delay to ensure
      // the initial session has been processed by the listener.
      Future.microtask(() async {
        if (_supabase.auth.currentSession == null && !state.isLoading) {
          await signInAnonymously();
        }
      });
    } catch (e) {
      state = state.copyWith(isInitialized: true);
    }
  }

  Future<void> _ensureUserRow(User user) async {
    try {
      await _supabase.from('users').upsert({
        'id': user.id,
        'email': user.email, // email can now be null
        // Handle optional metadata safely
        'display_name': user.userMetadata?['full_name'] ?? 'Guest',
        'avatar_url': user.userMetadata?['avatar_url'],
      }, onConflict: 'id');
    } catch (e) {
      // Non-critical — the table may not exist yet or row exists
      debugPrint('[auth] ensureUserRow failed: $e');
    }
  }

  Future<void> signInAnonymously() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _supabase.auth.signInAnonymously();
      state = state.copyWith(
        isLoading: false,
        user: res.user,
        session: res.session,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'An unexpected error occurred during guest login.');
    }
  }

  Future<void> signIn(String email, String password) async {
    // Keep this for future identity linkage/admin use
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      state = state.copyWith(
        isLoading: false,
        user: res.user,
        session: res.session,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'An unexpected error occurred.');
    }
  }

  Future<void> signUp(String email, String password) async {
    // Keep this for future identity linkage
    state = state.copyWith(isLoading: true, clearError: true);
    try {
       final res = await _supabase.auth.signUp(
        email: email,
        password: password,
      );
      
      // If user identities is empty but a user is returned, it means the 
      // email is already taken.
      if (res.user != null && (res.user?.identities?.isEmpty ?? true)) {
          state = state.copyWith(
            isLoading: false, 
            error: 'An account with this email already exists. Try signing in.',
          );
          return;
      }
      
      state = state.copyWith(
        isLoading: false,
        user: res.user,
        session: res.session,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'An unexpected error occurred.');
    }
  }

  Future<void> signOut() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _supabase.auth.signOut();
    } finally {
      // Listener handles clearing state and re-signing in anonymously
      state = AuthState();
    }
  }

  Future<({String? error})> deleteAccount() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return (error: 'Not authenticated');

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await http.delete(
        Uri.parse('${Env.apiUrl}/api/account'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );

      if (response.statusCode != 204) {
        state = state.copyWith(isLoading: false, error: 'Failed to delete account');
        return (error: 'Failed to delete account from server');
      }

      // If server deletion succeeded, we should sign out
      // Supabase's auth.signOut will be called, and the session should be gone
      await signOut();

      return (error: null);
    } catch (e) {
      debugPrint('[auth] deleteAccount error: $e');
      state = state.copyWith(isLoading: false, error: 'An unexpected error occurred');
      return (error: 'An unexpected error occurred');
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
