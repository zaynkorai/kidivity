import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/constants/categories.dart';
import '../../../core/widgets/profile_switcher_badge.dart';
import 'widgets/magic_card.dart';
import 'widgets/category_grid.dart';
import 'widgets/pick_of_the_day_card.dart';
import 'widgets/weekly_activity_chart.dart';

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
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            // ─── Primary Header ───────────────────────
            SliverToBoxAdapter(
              child: Container(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  MediaQuery.of(context).padding.top + AppSpacing.md,
                  AppSpacing.lg,
                  AppSpacing.md,
                ),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(AppRadius.xl),
                    bottomRight: Radius.circular(AppRadius.xl),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Dashboard',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        ProfileSwitcherBadge(),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    MagicCard(
                      activeProfile: activeProfile,
                      lastActivityTopic: lastActivity?.topic,
                      streak: kidStats?.streak ?? 0,
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),

            // ─── Body Content ────────────────────────
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Pick of the Day
                  const PickOfTheDayCard(),

                  const SizedBox(height: AppSpacing.xxl),

                  // Categories Header
                  Text(
                    'Quick Generate',
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Category Grid
                  const CategoryGrid(),

                  const SizedBox(height: AppSpacing.xxxl),

                  // Weekly Activity Chart
                  WeeklyActivityChart(activities: visibleActivities.toList()),

                  const SizedBox(height: 120),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
