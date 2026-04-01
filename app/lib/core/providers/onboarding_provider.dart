import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import '../constants/env.dart';
import 'supabase_provider.dart';
import 'auth_provider.dart' as app_auth;

enum OnboardingStatus { inProgress, completed }

class OnboardingState {
  final int step;
  final OnboardingStatus status;
  final bool isLoading;
  final Map<String, String> questionnaireAnswers;
  final int questionnaireIndex;

  const OnboardingState({
    this.step = 1,
    this.status = OnboardingStatus.inProgress,
    this.isLoading = false,
    this.questionnaireAnswers = const {},
    this.questionnaireIndex = 0,
  });

  OnboardingState copyWith({
    int? step,
    OnboardingStatus? status,
    bool? isLoading,
    Map<String, String>? questionnaireAnswers,
    int? questionnaireIndex,
  }) {
    return OnboardingState(
      step: step ?? this.step,
      status: status ?? this.status,
      isLoading: isLoading ?? this.isLoading,
      questionnaireAnswers: questionnaireAnswers ?? this.questionnaireAnswers,
      questionnaireIndex: questionnaireIndex ?? this.questionnaireIndex,
    );
  }
}

class OnboardingNotifier extends Notifier<OnboardingState> {
  static const _cacheKey = 'kidivity_onboarding_state';

  @override
  OnboardingState build() {
    _initialize();
    
    // Listen for sign-out to reset onboarding progress
    ref.listen<app_auth.AuthState>(app_auth.authProvider, (prev, next) {
      if (prev?.user != null && next.user == null) {
        reset();
      }
    });

    return const OnboardingState();
  }

  SupabaseClient get _supabase => ref.watch(supabaseProvider);

  Future<void> _initialize() async {
    await _restoreState();
    
    // If not completed locally, check backend
    if (state.status != OnboardingStatus.completed) {
      await restoreFromBackend();
    }
  }

  Future<void> _restoreState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_cacheKey);
      if (jsonStr != null) {
        final data = json.decode(jsonStr);
        state = OnboardingState(
          step: data['step'] ?? 1,
          status: (data['status'] == 'completed') 
              ? OnboardingStatus.completed 
              : OnboardingStatus.inProgress,
          questionnaireIndex: data['questionnaireIndex'] ?? 0,
          questionnaireAnswers: Map<String, String>.from(data['questionnaireAnswers'] ?? {}),
        );
      }
    } catch (e) {
      debugPrint('[onboarding] restore error: $e');
    }
  }

  Future<void> _persistState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = {
        'step': state.step,
        'status': (state.status == OnboardingStatus.completed) ? 'completed' : 'in-progress',
        'questionnaireIndex': state.questionnaireIndex,
        'questionnaireAnswers': state.questionnaireAnswers,
      };
      await prefs.setString(_cacheKey, json.encode(data));
    } catch (e) {
      debugPrint('[onboarding] persist error: $e');
    }
  }

  void setStep(int step) {
    state = state.copyWith(step: step);
    _persistState();
    _syncWithBackend();
  }

  void updateQuestionnaireProgress({int? index, Map<String, String>? answers}) {
    state = state.copyWith(
      questionnaireIndex: index,
      questionnaireAnswers: answers,
    );
    _persistState();
  }

  void completeOnboarding() {
    state = state.copyWith(status: OnboardingStatus.completed, step: 4);
    _persistState();
    _syncWithBackend();
  }

  Future<void> _syncWithBackend() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return;

    try {
      final response = await http.post(
        Uri.parse('${Env.apiUrl}/api/onboarding/sessions/sync'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'status': (state.status == OnboardingStatus.completed) ? 'completed' : 'in-progress',
          'step': state.step,
        }),
      );
      if (response.statusCode != 200) {
        debugPrint('[onboarding] sync error status: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[onboarding] sync error: $e');
    }
  }

  Future<void> restoreFromBackend() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return;

    if (state.isLoading) return;
    state = state.copyWith(isLoading: true);

    try {
      final response = await http.post(
        Uri.parse('${Env.apiUrl}/api/onboarding/sessions/restore'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'completed') {
          state = state.copyWith(
            status: OnboardingStatus.completed,
            step: 4,
            isLoading: false,
          );
          _persistState();
        }
      }
    } catch (e) {
      debugPrint('[onboarding] restore from backend error: $e');
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  void reset() {
    state = const OnboardingState();
    _persistState();
  }
}

final onboardingProvider = NotifierProvider<OnboardingNotifier, OnboardingState>(() {
  return OnboardingNotifier();
});
