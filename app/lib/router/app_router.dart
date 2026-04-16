import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/home/presentation/home_screen.dart';
import '../features/activities/presentation/activities_screen.dart';
import '../features/activities/presentation/activity_detail_screen.dart';
import '../features/generate/presentation/generate_screen.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../features/profile/presentation/kid_profile_screen.dart';
import '../core/models/kid_profile.dart';
import '../features/auth/presentation/onboarding_welcome_screen.dart';
import '../features/auth/presentation/onboarding_proof_screen.dart';
import '../features/auth/presentation/onboarding_questionnaire_screen.dart';
import '../features/auth/presentation/onboarding_profile_screen.dart';
import '../features/auth/presentation/onboarding_celebration_screen.dart';
import '../core/providers/supabase_provider.dart';
import '../core/providers/onboarding_provider.dart';
import '../core/theme/app_theme.dart';
import '../core/providers/activity_provider.dart';
import '../core/providers/auth_provider.dart' as app_auth;
import 'scaffold_with_nav_bar.dart';
import 'router_refresh_stream.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'shellHome');
final _shellNavigatorActivitiesKey = GlobalKey<NavigatorState>(debugLabel: 'shellActivities');
final _shellNavigatorGenerateKey = GlobalKey<NavigatorState>(debugLabel: 'shellGenerate');
final _shellNavigatorSettingsKey = GlobalKey<NavigatorState>(debugLabel: 'shellSettings');

/// A notifier that bridges Riverpod state changes to GoRouter's refreshListenable.
class AppRouterNotifier extends ChangeNotifier {
  AppRouterNotifier(this.ref) {
    // Listen to auth changes
    ref.listen(supabaseProvider, (prev, next) => notifyListeners());
    // Listen for onboarding status changes
    ref.listen(onboardingProvider.select((s) => s.status), (prev, next) => notifyListeners());
  }

  final Ref ref;
}

final routerProvider = Provider<GoRouter>((ref) {
  final supabase = ref.read(supabaseProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: Listenable.merge([
      GoRouterRefreshStream(supabase.auth.onAuthStateChange),
      ValueNotifier<OnboardingStatus>(ref.watch(onboardingProvider.select((s) => s.status))),
    ]),
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellNavigatorHomeKey,
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorActivitiesKey,
            routes: [
              GoRoute(
                path: '/activities',
                builder: (context, state) => const ActivitiesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorGenerateKey,
            routes: [
              GoRoute(
                path: '/generate',
                builder: (context, state) => GenerateScreen(
                  initialCategory: state.uri.queryParameters['category'],
                  initialTopic: state.uri.queryParameters['topic'],
                  isFirstActivity: state.uri.queryParameters['first_activity'] == 'true',
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorSettingsKey,
            routes: [
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/activity/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ActivityDetailScreen(id: id);
        },
      ),
      GoRoute(
        path: '/profile-create',
        builder: (context, state) {
          final profile = state.extra as KidProfile?;
          return KidProfileScreen(profile: profile);
        },
      ),
      // ─── Onboarding Flow (Shared Background via ShellRoute) ──────────
      ShellRoute(
        builder: (context, state, child) {
          return Scaffold(
            resizeToAvoidBottomInset: false,
            body: Stack(
              children: [
                // Shared Background Gradient (Fixed: Positioned.fill to ensure it covers the screen)
                Positioned.fill(
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.primary, Color(0xFF3B59DA)],
                      ),
                    ),
                  ),
                ),
                child,
              ],
            ),
          );
        },
        routes: [
          GoRoute(
            path: '/onboarding/welcome',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const OnboardingWelcomeScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                  FadeTransition(opacity: animation, child: child),
            ),
          ),
          GoRoute(
            path: '/onboarding/proof',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const OnboardingProofScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                  SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
          ),
          GoRoute(
            path: '/onboarding/questionnaire',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const QuestionnaireScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                  SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
          ),
          GoRoute(
            path: '/onboarding/profile',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const OnboardingProfileScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                  SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
          ),
          GoRoute(
            path: '/onboarding/celebration',
            pageBuilder: (context, state) {
              final name = state.uri.queryParameters['name'] ?? '';
              return CustomTransitionPage(
                key: state.pageKey,
                child: OnboardingCelebrationScreen(childName: name),
                transitionsBuilder:
                    (context, animation, secondaryAnimation, child) =>
                        FadeTransition(opacity: animation, child: child),
              );
            },
          ),
        ],
      ),
    ],
    redirect: (context, state) {
      final authState = ref.read(app_auth.authProvider);
      final onboardingState = ref.read(onboardingProvider);
      
      // DO NOT REDIRECT until both providers are fully initialized.
      // This prevents the "Flicker Bug" where the app briefly redirects to Welcome 
      // because it thinks the user isn't logged in or onboarding isn't done.
      if (!authState.isInitialized || !onboardingState.isInitialized) {
        return null; // Stay on current screen (usually the Native Splash)
      }

      final isCompleted = onboardingState.status == OnboardingStatus.completed;
      final location = state.uri.path;

      // Handle uncompleted onboarding
      if (!isCompleted) {
        if (location.startsWith('/onboarding')) {
          return null;
        }
        return '/onboarding/welcome';
      }

      // Handle completed onboarding — bounce out to the first activity generation flow
      if (isCompleted && location.startsWith('/onboarding')) {
        return '/generate?first_activity=true';
      }

      // Force first activity generation if none exist
      final activityState = ref.read(activityProvider);
      final hasNoActivities = activityState.recentActivities.isEmpty && activityState.isInitialized;
      
      if (isCompleted && hasNoActivities && location != '/generate' && !location.startsWith('/onboarding')) {
        return '/generate?first_activity=true';
      }

      return null;
    },
  );
});
