import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/home/presentation/home_screen.dart';
import '../features/activities/presentation/activities_screen.dart';
import '../features/activities/presentation/activity_detail_screen.dart';
import '../features/generate/presentation/generate_screen.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../features/profile/presentation/profile_creation_screen.dart';
import '../features/auth/presentation/onboarding_welcome_screen.dart';
import '../features/auth/presentation/onboarding_proof_screen.dart';
import '../features/auth/presentation/onboarding_questionnaire_screen.dart';
import '../features/auth/presentation/onboarding_profile_screen.dart';
import '../features/auth/presentation/onboarding_celebration_screen.dart';
import '../core/providers/supabase_provider.dart';
import '../core/providers/onboarding_provider.dart';
import '../core/theme/app_theme.dart';
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
        builder: (context, state) => const ProfileCreationScreen(),
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
      final onboardingState = ref.read(onboardingProvider);
      final isCompleted = onboardingState.status == OnboardingStatus.completed;
      final location = state.uri.path;

      // Handle uncompleted onboarding
      if (!isCompleted) {
        if (location.startsWith('/onboarding')) {
          return null;
        }
        return '/onboarding/welcome';
      }

      // Handle completed onboarding — bounce out
      if (isCompleted && location.startsWith('/onboarding')) {
        return '/';
      }

      return null;
    },
  );
});
