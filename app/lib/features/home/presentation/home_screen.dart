import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/activity_provider.dart';
import 'widgets/magic_card.dart';
import 'widgets/category_grid.dart';
import 'widgets/journey_map.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      ref.read(activityProvider.notifier).fetchRecent();
      final activeId = ref.read(profileProvider).activeProfileId;
      if (activeId != null) {
        ref.read(activityProvider.notifier).fetchKidStats(activeId);
      }
    });
  }

  Future<void> _onRefresh() async {
    final notifier = ref.read(activityProvider.notifier);
    final profileNotifier = ref.read(profileProvider.notifier);
    final activeId = ref.read(profileProvider).activeProfileId;

    await Future.wait([
      profileNotifier.fetchProfiles(),
      notifier.fetchRecent(),
      if (activeId != null) notifier.fetchKidStats(activeId),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);
    final activityState = ref.watch(activityProvider);
    final activeProfile = profileState.activeProfile;
    final activeId = profileState.activeProfileId;

    // Filter activities for active kid
    final visibleActivities = activeId != null
        ? activityState.recentActivities
              .where((a) => a.kidProfileId == activeId)
              .toList()
        : activityState.recentActivities;

    final lastActivity = visibleActivities.isNotEmpty
        ? visibleActivities.first
        : null;
    final kidStats = activeId != null ? activityState.kidStats[activeId] : null;

    final theme = Theme.of(context);

    return Material(
      color: theme.scaffoldBackgroundColor,
      child: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SafeArea(
            top: true,
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.xl,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Magic Card — wired to real profile + last activity
                  MagicCard(
                    activeProfile: activeProfile,
                    lastActivityTopic: lastActivity?.topic,
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  // Journey Map — wired to streak
                  JourneyMap(
                    streak: kidStats?.streak ?? 0,
                    hasActiveProfile: activeProfile != null,
                    activities: visibleActivities,
                    onAddPressed: () => context.push('/generate'),
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  // Categories Header
                  Text(
                    'Create by Categories',
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),

                  // Category Grid
                  const CategoryGrid(),

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
