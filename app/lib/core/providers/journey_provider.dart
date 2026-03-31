import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import '../models/journey.dart';
import '../constants/env.dart';
import 'auth_provider.dart' as app_auth;

// ─── State ────────────────────────────────────────────────────────

class JourneyState {
  final List<JourneyItem> journeyItems;
  final List<ActivityCompletion> completions;
  final bool isFetching;
  final bool isSaving;

  const JourneyState({
    this.journeyItems = const [],
    this.completions = const [],
    this.isFetching = false,
    this.isSaving = false,
  });

  JourneyState copyWith({
    List<JourneyItem>? journeyItems,
    List<ActivityCompletion>? completions,
    bool? isFetching,
    bool? isSaving,
  }) {
    return JourneyState(
      journeyItems: journeyItems ?? this.journeyItems,
      completions: completions ?? this.completions,
      isFetching: isFetching ?? this.isFetching,
      isSaving: isSaving ?? this.isSaving,
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────

class JourneyNotifier extends Notifier<JourneyState> {
  @override
  JourneyState build() {
    // Reset journey state on sign-out
    ref.listen<app_auth.AuthState>(app_auth.authProvider, (prev, next) {
      if (prev?.user != null && next.user == null) {
        state = const JourneyState();
      }
    });

    return const JourneyState();
  }

  SupabaseClient get _supabase => Supabase.instance.client;

  // ─── Fetch week data (items + completions) ───────────────────

  Future<void> fetchWeek(String kidProfileId, String weekStart, String weekEnd) async {
    state = state.copyWith(isFetching: true);
    try {
      // Fetch both in parallel
      final results = await Future.wait([
        _supabase
            .from('journey_items')
            .select()
            .eq('kid_profile_id', kidProfileId)
            .gte('scheduled_date', weekStart)
            .lte('scheduled_date', weekEnd)
            .order('scheduled_date', ascending: true),
        _supabase
            .from('activity_completions')
            .select()
            .eq('kid_profile_id', kidProfileId)
            .gte('completed_date', weekStart)
            .lte('completed_date', weekEnd)
            .order('completed_at', ascending: false),
      ]);

      final itemsData = results[0] as List<dynamic>;
      final completionsData = results[1] as List<dynamic>;

      state = state.copyWith(
        journeyItems: itemsData
            .map((j) => JourneyItem.fromJson(j as Map<String, dynamic>))
            .toList(),
        completions: completionsData
            .map((c) => ActivityCompletion.fromJson(c as Map<String, dynamic>))
            .toList(),
        isFetching: false,
      );
    } catch (e) {
      debugPrint('[journey] fetchWeek error: $e');
      state = state.copyWith(isFetching: false);
    }
  }

  // ─── Schedule an activity ────────────────────────────────────

  Future<({JourneyItem? data, String? error})> scheduleActivity(ScheduleActivityInput input) async {
    state = state.copyWith(isSaving: true);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isSaving: false);
        return (data: null, error: 'Not authenticated');
      }

      final response = await http.post(
        Uri.parse('${Env.apiUrl}/api/journey/schedule'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
        body: json.encode(input.toJson()),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        Map<String, dynamic> errorData;
        try {
          errorData = json.decode(response.body) as Map<String, dynamic>;
        } catch (_) {
          errorData = {};
        }
        state = state.copyWith(isSaving: false);
        return (
          data: null,
          error: (errorData['error'] as String?) ?? 'Failed to schedule activity',
        );
      }

      final data = json.decode(response.body) as Map<String, dynamic>;
      final item = JourneyItem.fromJson(data);
      state = state.copyWith(
        journeyItems: [...state.journeyItems, item],
        isSaving: false,
      );
      return (data: item, error: null);
    } catch (e) {
      debugPrint('[journey] scheduleActivity error: $e');
      state = state.copyWith(isSaving: false);
      return (data: null, error: 'An unexpected error occurred');
    }
  }

  // ─── Toggle completion for a journey item ────────────────────

  Future<void> toggleCompletionForJourneyItem(JourneyItem journeyItem) async {
    final existing = state.completions.cast<ActivityCompletion?>().firstWhere(
      (c) => c?.journeyItemId == journeyItem.id,
      orElse: () => null,
    );

    if (existing != null) {
      // Remove completion
      try {
        await _supabase
            .from('activity_completions')
            .delete()
            .eq('id', existing.id);
        state = state.copyWith(
          completions: state.completions.where((c) => c.id != existing.id).toList(),
        );
      } catch (e) {
        debugPrint('[journey] remove completion error: $e');
      }
      return;
    }

    // Add completion
    final session = _supabase.auth.currentSession;
    if (session == null) return;

    final completedDate = journeyItem.scheduledDate.isNotEmpty
        ? journeyItem.scheduledDate
        : _toLocalDateStr(DateTime.now());

    try {
      final data = await _supabase
          .from('activity_completions')
          .insert({
            'kid_profile_id': journeyItem.kidProfileId,
            'user_id': session.user.id,
            'activity_id': journeyItem.activityId,
            'journey_item_id': journeyItem.id,
            'completed_date': completedDate,
          })
          .select()
          .single();

      final completion = ActivityCompletion.fromJson(data);
      state = state.copyWith(
        completions: [completion, ...state.completions],
      );
    } catch (e) {
      debugPrint('[journey] add completion error: $e');
    }
  }

  // ─── Complete activity ad-hoc (without journey item) ─────────

  Future<bool> completeActivityAdhoc(String kidProfileId, String activityId) async {
    final session = _supabase.auth.currentSession;
    if (session == null) return false;

    final completedDate = _toLocalDateStr(DateTime.now());

    try {
      final data = await _supabase
          .from('activity_completions')
          .insert({
            'user_id': session.user.id,
            'kid_profile_id': kidProfileId,
            'activity_id': activityId,
            'completed_date': completedDate,
          })
          .select()
          .single();

      final completion = ActivityCompletion.fromJson(data);
      state = state.copyWith(
        completions: [completion, ...state.completions],
      );
      return true;
    } catch (e) {
      // Check if it's a duplicate key error (already completed)
      if (e.toString().toLowerCase().contains('duplicate')) {
        return true;
      }
      debugPrint('[journey] completeAdhoc error: $e');
      return false;
    }
  }

  // ─── Helper ──────────────────────────────────────────────────

  static String _toLocalDateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// ─── Provider ─────────────────────────────────────────────────────

final journeyProvider = NotifierProvider<JourneyNotifier, JourneyState>(() {
  return JourneyNotifier();
});
