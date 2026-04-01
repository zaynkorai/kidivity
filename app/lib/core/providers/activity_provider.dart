import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/activity.dart';
import '../constants/env.dart';
import 'auth_provider.dart' as app_auth;

// ─── Rate Limit State ─────────────────────────────────────────────

class RateLimitState {
  final bool hit;
  final int used;
  final int limit;
  final String? resetAt;

  const RateLimitState({
    this.hit = false,
    this.used = 0,
    this.limit = 0,
    this.resetAt,
  });

  RateLimitState copyWith({bool? hit, int? used, int? limit, String? resetAt}) {
    return RateLimitState(
      hit: hit ?? this.hit,
      used: used ?? this.used,
      limit: limit ?? this.limit,
      resetAt: resetAt ?? this.resetAt,
    );
  }
}

// ─── Kid Stats ────────────────────────────────────────────────────

class KidStats {
  final int total;
  final int streak;
  final int weekCount;
  final String? lastCreatedAt;

  const KidStats({
    this.total = 0,
    this.streak = 0,
    this.weekCount = 0,
    this.lastCreatedAt,
  });
}

// ─── State ────────────────────────────────────────────────────────

class ActivityState {
  final List<Activity> recentActivities;
  final List<Activity> savedActivities;
  final Map<String, KidStats> kidStats;
  final bool isFetchingRecent;
  final bool isFetchingSaved;
  final bool isGenerating;
  final RateLimitState rateLimitState;

  const ActivityState({
    this.recentActivities = const [],
    this.savedActivities = const [],
    this.kidStats = const {},
    this.isFetchingRecent = false,
    this.isFetchingSaved = false,
    this.isGenerating = false,
    this.rateLimitState = const RateLimitState(),
  });

  ActivityState copyWith({
    List<Activity>? recentActivities,
    List<Activity>? savedActivities,
    Map<String, KidStats>? kidStats,
    bool? isFetchingRecent,
    bool? isFetchingSaved,
    bool? isGenerating,
    RateLimitState? rateLimitState,
  }) {
    return ActivityState(
      recentActivities: recentActivities ?? this.recentActivities,
      savedActivities: savedActivities ?? this.savedActivities,
      kidStats: kidStats ?? this.kidStats,
      isFetchingRecent: isFetchingRecent ?? this.isFetchingRecent,
      isFetchingSaved: isFetchingSaved ?? this.isFetchingSaved,
      isGenerating: isGenerating ?? this.isGenerating,
      rateLimitState: rateLimitState ?? this.rateLimitState,
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────

class ActivityNotifier extends Notifier<ActivityState> {
  static const _recentCacheKey = 'kidivity_recent_activities_cache';
  static const _savedCacheKey = 'kidivity_saved_activities_cache';
  @override
  ActivityState build() {
    // Restore cached data
    _restoreCache();

    // Auto-fetch when user signs in
    ref.listen<app_auth.AuthState>(app_auth.authProvider, (prev, next) {
      if (prev?.user == null && next.user != null) {
        fetchRecent();
        fetchQuota();
      }
      if (prev?.user != null && next.user == null) {
        reset();
      }
    });

    return const ActivityState();
  }

  SupabaseClient get _supabase => Supabase.instance.client;

  // ─── Persistence ─────────────────────────────────────────────

  Future<void> _restoreCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final recentJson = prefs.getString(_recentCacheKey);
      List<Activity> recent = [];
      if (recentJson != null) {
        final List<dynamic> list = json.decode(recentJson);
        recent = list.map((j) => Activity.fromJson(j as Map<String, dynamic>)).toList();
      }

      final savedJson = prefs.getString(_savedCacheKey);
      List<Activity> saved = [];
      if (savedJson != null) {
        final List<dynamic> list = json.decode(savedJson);
        saved = list.map((j) => Activity.fromJson(j as Map<String, dynamic>)).toList();
      }

      state = state.copyWith(
        recentActivities: recent,
        savedActivities: saved,
      );
    } catch (e) {
      debugPrint('[activity] Failed to restore cache: $e');
    }
  }

  Future<void> _persistRecent(List<Activity> activities) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = json.encode(activities.map((a) => a.toJson()).toList());
      await prefs.setString(_recentCacheKey, jsonStr);
    } catch (e) {
      debugPrint('[activity] Failed to persist recent: $e');
    }
  }

  Future<void> _persistSaved(List<Activity> activities) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = json.encode(activities.map((a) => a.toJson()).toList());
      await prefs.setString(_savedCacheKey, jsonStr);
    } catch (e) {
      debugPrint('[activity] Failed to persist saved: $e');
    }
  }

  Map<String, String> _authHeaders(Session session) => {
    'Authorization': 'Bearer ${session.accessToken}',
    'Content-Type': 'application/json',
  };

  // ─── Fetch recent from backend ───────────────────────────────

  Future<void> fetchRecent() async {
    state = state.copyWith(isFetchingRecent: true);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isFetchingRecent: false);
        return;
      }

      // Also refresh quota in the background
      fetchQuota();

      final response = await http.get(
        Uri.parse('${Env.apiUrl}/api/activities'),
        headers: _authHeaders(session),
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        final activities = jsonList.map((j) => Activity.fromJson(j as Map<String, dynamic>)).toList();
        state = state.copyWith(recentActivities: activities, isFetchingRecent: false);
        _persistRecent(activities);
      } else {
        state = state.copyWith(isFetchingRecent: false);
      }
    } catch (e) {
      debugPrint('[activity] fetchRecent error: $e');
      state = state.copyWith(isFetchingRecent: false);
    }
  }

  // ─── Fetch saved from backend ────────────────────────────────

  Future<void> fetchSaved() async {
    state = state.copyWith(isFetchingSaved: true);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isFetchingSaved: false);
        return;
      }

      final response = await http.get(
        Uri.parse('${Env.apiUrl}/api/activities/saved'),
        headers: _authHeaders(session),
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        final activities = jsonList.map((j) => Activity.fromJson(j as Map<String, dynamic>)).toList();
        state = state.copyWith(savedActivities: activities, isFetchingSaved: false);
        _persistSaved(activities);
      } else {
        state = state.copyWith(isFetchingSaved: false);
      }
    } catch (e) {
      debugPrint('[activity] fetchSaved error: $e');
      state = state.copyWith(isFetchingSaved: false);
    }
  }

  // ─── Fetch kid stats via Supabase RPC ────────────────────────

  Future<void> fetchKidStats(String kidProfileId) async {
    try {
      const timezone = 'UTC'; // Fallback to UTC to avoid Postgres error with empty string
      final data = await _supabase.rpc('get_kid_activity_stats', params: {
        'p_kid_profile_id': kidProfileId,
        'p_timezone_name': timezone,
      });

      if (data != null) {
        final stats = KidStats(
          total: (data['total'] as int?) ?? 0,
          streak: (data['streak'] as int?) ?? 0,
          weekCount: (data['weekCount'] as int?) ?? (data['week_count'] as int?) ?? 0,
          lastCreatedAt: data['lastCreatedAt'] as String? ?? data['last_created_at'] as String?,
        );
        state = state.copyWith(
          kidStats: {...state.kidStats, kidProfileId: stats},
        );
      }
    } catch (e) {
      // Non-critical: home can still render without stats
      debugPrint('[activity] fetchKidStats error: $e');
    }
  }

  // ─── Fetch activity detail ──────────────────────────────────

  Future<Activity?> fetchActivityDetail(String id) async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) return null;

      final response = await http.get(
        Uri.parse('${Env.apiUrl}/api/activities/$id'),
        headers: _authHeaders(session),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final fullActivity = Activity.fromJson(data);

        // Update or add to local store lists
        final inRecent = state.recentActivities.any((a) => a.id == id);
        final inSaved = state.savedActivities.any((a) => a.id == id);

        state = state.copyWith(
          recentActivities: inRecent
              ? state.recentActivities.map((a) => a.id == id ? fullActivity : a).toList()
              : [fullActivity, ...state.recentActivities].take(50).toList(),
          savedActivities: inSaved
              ? state.savedActivities.map((a) => a.id == id ? fullActivity : a).toList()
              : state.savedActivities,
        );
        
        _persistRecent(state.recentActivities);
        if (inSaved) _persistSaved(state.savedActivities);

        return fullActivity;
      }
    } catch (e) {
      debugPrint('[activity] fetchActivityDetail error: $e');
    }
    return null;
  }

  // ─── Toggle saved (optimistic) ───────────────────────────────

  Future<void> toggleSaved(String id) async {
    final allActivities = [...state.recentActivities, ...state.savedActivities];
    final activity = allActivities.cast<Activity?>().firstWhere((a) => a?.id == id, orElse: () => null);
    if (activity == null) return;

    final newSaved = !activity.isSaved;

    // Optimistic update
    state = state.copyWith(
      recentActivities: state.recentActivities.map((a) => a.id == id ? a.copyWith(isSaved: newSaved) : a).toList(),
      savedActivities: newSaved
          ? [...state.savedActivities, activity.copyWith(isSaved: true)]
          : state.savedActivities.where((a) => a.id != id).toList(),
    );
    _persistRecent(state.recentActivities);
    _persistSaved(state.savedActivities);

    try {
      await _supabase.from('activities').update({'is_saved': newSaved}).eq('id', id);
    } catch (e) {
      // Rollback
      debugPrint('[activity] toggleSaved rollback: $e');
      state = state.copyWith(
        recentActivities: state.recentActivities.map((a) => a.id == id ? a.copyWith(isSaved: !newSaved) : a).toList(),
      );
    }
  }

  // ─── Submit feedback (optimistic) ────────────────────────────

  Future<void> submitFeedback(String id, int rating, {String? feedbackText}) async {
    final allActivities = [...state.recentActivities, ...state.savedActivities];
    final activity = allActivities.cast<Activity?>().firstWhere((a) => a?.id == id, orElse: () => null);
    if (activity == null) return;

    final oldRating = activity.rating;
    final oldFeedback = activity.feedbackText;

    // Optimistic update
    state = state.copyWith(
      recentActivities: state.recentActivities.map((a) =>
        a.id == id ? a.copyWith(rating: rating, feedbackText: feedbackText) : a
      ).toList(),
      savedActivities: state.savedActivities.map((a) =>
        a.id == id ? a.copyWith(rating: rating, feedbackText: feedbackText) : a
      ).toList(),
    );
    _persistRecent(state.recentActivities);
    _persistSaved(state.savedActivities);

    try {
      final session = _supabase.auth.currentSession;
      if (session == null) return;

      final response = await http.post(
        Uri.parse('${Env.apiUrl}/api/activities/$id/feedback'),
        headers: _authHeaders(session),
        body: json.encode({
          'rating': rating,
          'feedback_text': feedbackText,
        }),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Feedback submission failed');
      }
    } catch (e) {
      debugPrint('[activity] submitFeedback error: $e');
      // Rollback
      state = state.copyWith(
        recentActivities: state.recentActivities.map((a) =>
          a.id == id ? a.copyWith(rating: oldRating, feedbackText: oldFeedback) : a
        ).toList(),
        savedActivities: state.savedActivities.map((a) =>
          a.id == id ? a.copyWith(rating: oldRating, feedbackText: oldFeedback) : a
        ).toList(),
      );
    }
  }

  // ─── Fetch quota from backend ────────────────────────────────

  Future<void> fetchQuota() async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) return;

      const timezone = 'UTC'; // Fallback to UTC
      final response = await http.get(
        Uri.parse('${Env.apiUrl}/api/activities/quota'),
        headers: {
          ..._authHeaders(session),
          'x-timezone': timezone,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final used = (data['used'] as int?) ?? 0;
        final limit = (data['limit'] as int?) ?? 0;
        state = state.copyWith(
          rateLimitState: RateLimitState(
            hit: used >= limit,
            used: used,
            limit: limit,
            resetAt: data['reset_at'] as String?,
          ),
        );
      }
    } catch (e) {
      debugPrint('[activity] fetchQuota error: $e');
    }
  }

  // ─── Generate activity via backend ────────────────────────────

  Future<({Activity? data, String? error})> generateActivity({
    required String kidProfileId,
    required String category,
    required String topic,
    required String difficulty,
    required String style,
  }) async {
    state = state.copyWith(isGenerating: true);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isGenerating: false);
        return (data: null, error: 'Not authenticated');
      }

      const timezone = 'UTC'; // Fallback to UTC for empty or invalid timezones
      final response = await http.post(
        Uri.parse('${Env.apiUrl}/api/activities/generate'),
        headers: {
          ..._authHeaders(session),
          'x-timezone': timezone,
        },
        body: json.encode({
          'kid_profile_id': kidProfileId,
          'category': category,
          'topic': topic,
          'difficulty': difficulty,
          'style': style,
        }),
      ).timeout(const Duration(seconds: 60));

      final body = response.body;
      Map<String, dynamic> data;
      try {
        data = json.decode(body) as Map<String, dynamic>;
      } catch (_) {
        debugPrint('[Generate] Invalid JSON response. Status: ${response.statusCode}');
        state = state.copyWith(isGenerating: false);
        return (data: null, error: 'Server error (${response.statusCode})');
      }

      if (response.statusCode == 429) {
        state = state.copyWith(
          isGenerating: false,
          rateLimitState: RateLimitState(
            hit: true,
            used: (data['used'] as int?) ?? 0,
            limit: (data['limit'] as int?) ?? 0,
            resetAt: data['reset_at'] as String?,
          ),
        );
        return (data: null, error: 'rate_limit');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        state = state.copyWith(isGenerating: false);
        return (data: null, error: (data['error'] as String?) ?? 'Failed to generate activity');
      }

      final activity = Activity.fromJson(data);
      final currentQuota = state.rateLimitState;
      state = state.copyWith(
        recentActivities: [activity, ...state.recentActivities].take(50).toList(),
        isGenerating: false,
        rateLimitState: currentQuota.copyWith(
          used: currentQuota.used + 1,
          hit: currentQuota.used + 1 >= currentQuota.limit,
        ),
      );
      _persistRecent(state.recentActivities);
      return (data: activity, error: null);
    } catch (e) {
      debugPrint('[Generate] Exception: $e');
      state = state.copyWith(isGenerating: false);
      if (e.toString().contains('TimeoutException')) {
        return (data: null, error: 'Server took too long. Please check your connection and try again.');
      }
      return (data: null, error: 'Failed to generate activity');
    }
  }

  // ─── Clear rate limit ────────────────────────────────────────

  void clearRateLimit() {
    state = state.copyWith(rateLimitState: const RateLimitState());
  }

  // ─── Reset ───────────────────────────────────────────────────

  void reset() {
    state = const ActivityState();
    _persistRecent([]);
    _persistSaved([]);
  }
}

// ─── Provider ─────────────────────────────────────────────────────

final activityProvider = NotifierProvider<ActivityNotifier, ActivityState>(() {
  return ActivityNotifier();
});
