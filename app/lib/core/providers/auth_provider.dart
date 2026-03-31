import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_provider.dart';
import 'profile_provider.dart';

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
            ref.invalidate(profileProvider);
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
        'email': user.email ?? '',
        // Handle optional metadata safely
        'display_name': user.userMetadata?['full_name'],
        'avatar_url': user.userMetadata?['avatar_url'],
      }, onConflict: 'id');
    } catch (e) {
      // Non-critical — the table may not exist yet or row exists
      debugPrint('[auth] ensureUserRow failed: $e');
    }
  }

  Future<void> signIn(String email, String password) async {
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
      // Sign-out event listener will clean up the state, 
      // but we do it manually just in case.
      state = AuthState();
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
