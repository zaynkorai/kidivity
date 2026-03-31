import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/kid_profile.dart';
import '../constants/env.dart';
import 'auth_provider.dart' as app_auth;

// ─── State ────────────────────────────────────────────────────────

class ProfileState {
  final List<KidProfile> profiles;
  final String? activeProfileId;
  final bool isLoading;
  final bool hasLoaded;

  const ProfileState({
    this.profiles = const [],
    this.activeProfileId,
    this.isLoading = false,
    this.hasLoaded = false,
  });

  KidProfile? get activeProfile {
    if (activeProfileId == null) return null;
    try {
      return profiles.firstWhere((p) => p.id == activeProfileId);
    } catch (_) {
      return profiles.isNotEmpty ? profiles.first : null;
    }
  }

  ProfileState copyWith({
    List<KidProfile>? profiles,
    String? activeProfileId,
    bool? isLoading,
    bool? hasLoaded,
    bool clearActiveProfile = false,
  }) {
    return ProfileState(
      profiles: profiles ?? this.profiles,
      activeProfileId: clearActiveProfile ? null : (activeProfileId ?? this.activeProfileId),
      isLoading: isLoading ?? this.isLoading,
      hasLoaded: hasLoaded ?? this.hasLoaded,
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────

class ProfileNotifier extends Notifier<ProfileState> {
  static const _activeProfileKey = 'kidivity_active_profile_id';

  @override
  ProfileState build() {
    // Listen to auth changes — when user signs out, clear profiles
    ref.listen<app_auth.AuthState>(app_auth.authProvider, (prev, next) {
      if (prev?.user != null && next.user == null) {
        clearProfiles();
      }
      // When user signs in, auto-fetch profiles
      if (prev?.user == null && next.user != null) {
        fetchProfiles();
      }
    });

    // Restore persisted active profile ID
    _restoreActiveProfile();

    return const ProfileState();
  }

  SupabaseClient get _supabase => Supabase.instance.client;

  // ─── Persistence helpers ─────────────────────────────────────

  Future<void> _restoreActiveProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedId = prefs.getString(_activeProfileKey);
      if (savedId != null) {
        state = state.copyWith(activeProfileId: savedId);
      }
    } catch (e) {
      debugPrint('[profile] Failed to restore active profile: $e');
    }
  }

  Future<void> _persistActiveProfile(String? id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (id != null) {
        await prefs.setString(_activeProfileKey, id);
      } else {
        await prefs.remove(_activeProfileKey);
      }
    } catch (e) {
      debugPrint('[profile] Failed to persist active profile: $e');
    }
  }

  // ─── Fetch from backend API ──────────────────────────────────

  Future<void> fetchProfiles() async {
    state = state.copyWith(isLoading: true, hasLoaded: false);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isLoading: false, hasLoaded: true, profiles: []);
        return;
      }

      final response = await http.get(
        Uri.parse('${Env.apiUrl}/api/profiles'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch profiles: ${response.statusCode}');
      }

      final List<dynamic> jsonList = json.decode(response.body);
      final profiles = jsonList.map((j) => KidProfile.fromJson(j as Map<String, dynamic>)).toList();

      // Determine active profile: keep current if still valid, else first
      final currentActive = state.activeProfileId;
      final validActive = currentActive != null && profiles.any((p) => p.id == currentActive)
          ? currentActive
          : (profiles.isNotEmpty ? profiles.first.id : null);

      state = state.copyWith(
        profiles: profiles,
        isLoading: false,
        hasLoaded: true,
        activeProfileId: validActive,
      );

      _persistActiveProfile(validActive);
    } catch (e) {
      debugPrint('[profile] fetchProfiles error: $e');
      state = state.copyWith(isLoading: false, hasLoaded: true);
    }
  }

  // ─── Add profile (direct Supabase insert) ────────────────────

  Future<({String? error, KidProfile? data})> addProfile(CreateKidProfileInput input) async {
    state = state.copyWith(isLoading: true);
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        state = state.copyWith(isLoading: false);
        return (error: 'Not authenticated', data: null);
      }

      final insertData = {
        ...input.toJson(),
        'user_id': user.id,
      };

      final response = await _supabase
          .from('kid_profiles')
          .insert(insertData)
          .select()
          .single();

      final profile = KidProfile.fromJson(response);
      final updatedProfiles = [...state.profiles, profile];
      final activeId = state.activeProfileId ?? profile.id;

      state = state.copyWith(
        profiles: updatedProfiles,
        activeProfileId: activeId,
        isLoading: false,
      );

      _persistActiveProfile(activeId);
      return (error: null, data: profile);
    } catch (e) {
      debugPrint('[profile] addProfile error: $e');
      state = state.copyWith(isLoading: false);
      return (error: 'Failed to create profile. Please try again.', data: null);
    }
  }

  // ─── Update profile ──────────────────────────────────────────

  Future<String?> updateProfile(String id, UpdateKidProfileInput updates) async {
    if (state.isLoading) return 'Action in progress';
    state = state.copyWith(isLoading: true);
    try {
      final response = await _supabase
          .from('kid_profiles')
          .update(updates.toJson())
          .eq('id', id)
          .select()
          .single();

      final updated = KidProfile.fromJson(response);
      final updatedProfiles = state.profiles.map((p) => p.id == id ? updated : p).toList();

      state = state.copyWith(profiles: updatedProfiles, isLoading: false);
      return null;
    } catch (e) {
      debugPrint('[profile] updateProfile error: $e');
      state = state.copyWith(isLoading: false);
      return 'Failed to update profile. Please try again.';
    }
  }

  // ─── Delete profile (via backend API) ────────────────────────

  Future<String?> deleteProfile(String id) async {
    if (state.isLoading) return 'Action in progress';
    state = state.copyWith(isLoading: true);
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) {
        state = state.copyWith(isLoading: false);
        return 'Not authenticated';
      }

      final response = await http.delete(
        Uri.parse('${Env.apiUrl}/api/profiles/$id'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );

      if (response.statusCode != 204) {
        throw Exception('Failed to delete profile');
      }

      final remaining = state.profiles.where((p) => p.id != id).toList();
      final newActiveId = state.activeProfileId == id
          ? (remaining.isNotEmpty ? remaining.first.id : null)
          : state.activeProfileId;

      state = state.copyWith(
        profiles: remaining,
        activeProfileId: newActiveId,
        isLoading: false,
        clearActiveProfile: newActiveId == null,
      );

      _persistActiveProfile(newActiveId);
      return null;
    } catch (e) {
      debugPrint('[profile] deleteProfile error: $e');
      state = state.copyWith(isLoading: false);
      return 'An unexpected error occurred';
    }
  }

  // ─── Set active profile ──────────────────────────────────────

  void setActiveProfile(String id) {
    state = state.copyWith(activeProfileId: id);
    _persistActiveProfile(id);
  }

  // ─── Clear (on sign out) ─────────────────────────────────────

  void clearProfiles() {
    state = const ProfileState();
    _persistActiveProfile(null);
  }
}

// ─── Provider ─────────────────────────────────────────────────────

final profileProvider = NotifierProvider<ProfileNotifier, ProfileState>(() {
  return ProfileNotifier();
});
