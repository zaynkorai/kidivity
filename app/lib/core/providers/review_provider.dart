import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'activity_provider.dart';

class ReviewState {
  final bool hasReviewed;
  final DateTime? lastRequested;
  final int totalActivitiesAtLastRequest;

  const ReviewState({
    this.hasReviewed = false,
    this.lastRequested,
    this.totalActivitiesAtLastRequest = 0,
  });

  ReviewState copyWith({
    bool? hasReviewed,
    DateTime? lastRequested,
    int? totalActivitiesAtLastRequest,
  }) {
    return ReviewState(
      hasReviewed: hasReviewed ?? this.hasReviewed,
      lastRequested: lastRequested ?? this.lastRequested,
      totalActivitiesAtLastRequest: totalActivitiesAtLastRequest ?? this.totalActivitiesAtLastRequest,
    );
  }
}

class ReviewNotifier extends Notifier<ReviewState> {
  static const _hasReviewedKey = 'kidivity_has_reviewed';
  static const _lastRequestedKey = 'kidivity_last_review_request';
  static const _activitiesAtLastKey = 'kidivity_activities_at_last_request';
  
  final InAppReview _inAppReview = InAppReview.instance;

  @override
  ReviewState build() {
    _loadState();
    return const ReviewState();
  }

  Future<void> _loadState() async {
    final prefs = await SharedPreferences.getInstance();
    final hasReviewed = prefs.getBool(_hasReviewedKey) ?? false;
    final lastRequestedStr = prefs.getString(_lastRequestedKey);
    final lastRequested = lastRequestedStr != null ? DateTime.parse(lastRequestedStr) : null;
    final totalAtLast = prefs.getInt(_activitiesAtLastKey) ?? 0;

    state = ReviewState(
      hasReviewed: hasReviewed,
      lastRequested: lastRequested,
      totalActivitiesAtLastRequest: totalAtLast,
    );
  }

  Future<void> _saveState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_hasReviewedKey, state.hasReviewed);
    if (state.lastRequested != null) {
      await prefs.setString(_lastRequestedKey, state.lastRequested!.toIso8601String());
    }
    await prefs.setInt(_activitiesAtLastKey, state.totalActivitiesAtLastRequest);
  }

  Future<void> markAsReviewed() async {
    state = state.copyWith(hasReviewed: true);
    await _saveState();
  }

  Future<void> logRequest() async {
    final activityState = ref.read(activityProvider);
    // Sum up total activities across all kids if needed, or just use recent length as a proxy
    // For now, let's use the sum of totals in kidStats if available
    int total = 0;
    for (final stats in activityState.kidStats.values) {
      total += stats.total;
    }
    // If kidStats is empty, use recentActivities.length as fallback
    if (total == 0) total = activityState.recentActivities.length;

    state = state.copyWith(
      lastRequested: DateTime.now(),
      totalActivitiesAtLastRequest: total,
    );
    await _saveState();
  }

  Future<bool> shouldRequestReview() async {
    if (state.hasReviewed) return false;

    final activityState = ref.read(activityProvider);
    int total = 0;
    for (final stats in activityState.kidStats.values) {
      total += stats.total;
    }
    if (total == 0) total = activityState.recentActivities.length;

    // Condition 1: At least 3 activities generated
    if (total < 3) return false;

    // Condition 2: Frequent enough? 
    // If never requested, show.
    if (state.lastRequested == null) return true;

    // If requested before, wait at least 2 months AND at least 5 more activities
    final twoMonthsAgo = DateTime.now().subtract(const Duration(days: 60));
    final hasBeenLongEnough = state.lastRequested!.isBefore(twoMonthsAgo);
    final hasEnoughNewActivities = (total - state.totalActivitiesAtLastRequest) >= 5;

    return hasBeenLongEnough && hasEnoughNewActivities;
  }

  Future<void> requestReview() async {
    if (await _inAppReview.isAvailable()) {
      await _inAppReview.requestReview();
      await markAsReviewed();
    }
  }

  Future<void> openStoreListing() async {
    await _inAppReview.openStoreListing(
      appStoreId: '6740698114', // Replace with actual App Store ID if known
    );
    await markAsReviewed();
  }
}

final reviewProvider = NotifierProvider<ReviewNotifier, ReviewState>(() {
  return ReviewNotifier();
});
