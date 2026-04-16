import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/constants/categories.dart';
import '../../../core/widgets/profile_switcher_badge.dart';
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if ((kidStats?.streak ?? 0) > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(40),
                              borderRadius: BorderRadius.circular(
                                AppRadius.full,
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  LucideIcons.flame,
                                  size: 14,
                                  color: Colors.amberAccent,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${kidStats?.streak ?? 0} streak',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          const SizedBox(),
                        const ProfileSwitcherBadge(),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      activeId != null
                          ? (activeProfile?.name ?? 'Welcome')
                          : 'Welcome',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      activeId != null
                          ? 'Ready for a new adventure?'
                          : 'Add a profile to start generating activities.',
                      style: TextStyle(
                        color: Colors.white.withAlpha(200),
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    GestureDetector(
                      onTap: () {
                        if (activeId != null) {
                          context.go('/generate');
                        } else {
                          context.push('/profile-create');
                        }
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(25),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Generate Activity',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(width: 6),
                            Icon(
                              LucideIcons.wand2,
                              size: 18,
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

            // ─── Body Content ────────────────────────
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Pick of the Day
                  const PickOfTheDayCard(),

                  const SizedBox(height: AppSpacing.md),

                  // Category Grid
                  const CategoryGrid(),

                  const SizedBox(height: AppSpacing.md),

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
