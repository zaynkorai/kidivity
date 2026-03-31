import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/models/activity.dart';
import '../../../core/constants/categories.dart';
import 'widgets/weekly_calendar.dart';

class ActivitiesScreen extends ConsumerStatefulWidget {
  const ActivitiesScreen({super.key});

  @override
  ConsumerState<ActivitiesScreen> createState() => _ActivitiesScreenState();
}

class _ActivitiesScreenState extends ConsumerState<ActivitiesScreen> {
  bool _showFilters = false;
  String? _filterCategory;
  String? _filterKidId;
  String? _filterDate;
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    // Fetch activities on first load
    Future.microtask(() => ref.read(activityProvider.notifier).fetchRecent());
  }

  List<Activity> get _filteredActivities {
    final activities = ref.read(activityProvider).recentActivities;
    var filtered = activities.where((a) {
      if (_filterCategory != null && a.category != _filterCategory)
        return false;
      if (_filterKidId != null && a.kidProfileId != _filterKidId) return false;
      if (_filterDate != null) {
        final d = DateTime.tryParse(a.createdAt);
        if (d != null) {
          final ds =
              '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
          if (ds != _filterDate) return false;
        }
      }
      return true;
    }).toList();

    filtered.sort((a, b) {
      final dateA = DateTime.tryParse(a.createdAt) ?? DateTime(2000);
      final dateB = DateTime.tryParse(b.createdAt) ?? DateTime(2000);
      return _sortBy == 'newest'
          ? dateB.compareTo(dateA)
          : dateA.compareTo(dateB);
    });
    return filtered;
  }

  bool get _hasActiveFilters =>
      _filterCategory != null || _filterKidId != null || _filterDate != null;

  void _clearFilters() {
    setState(() {
      _filterCategory = null;
      _filterKidId = null;
      _filterDate = null;
    });
  }

  String _relativeDate(String iso) {
    final now = DateTime.now();
    final date = DateTime.tryParse(iso) ?? now;
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.month}/${date.day}';
  }

  Color _getCategoryAccent(String category) {
    final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
      (c) => c?.id == category,
      orElse: () => null,
    );
    return cat?.accent ?? AppColors.primary;
  }

  Color _getCategoryPastel(String category) {
    final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
      (c) => c?.id == category,
      orElse: () => null,
    );
    return cat?.color ?? AppColors.primaryLight;
  }

  String _getCategoryLabel(String category) {
    final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
      (c) => c?.id == category,
      orElse: () => null,
    );
    return cat?.label.split(' ').first ?? category;
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'easy':
        return const Color(0xFF4ECDC4);
      case 'medium':
        return const Color(0xFFFFE66D);
      case 'hard':
        return const Color(0xFFFF6B6B);
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final activityState = ref.watch(activityProvider);
    final profileState = ref.watch(profileProvider);
    final filtered = _filteredActivities;

    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(activityProvider.notifier).fetchRecent(),
          color: AppColors.primary,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              // ─── Header Sliver ──────────────────────────
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.xxxl,
                  AppSpacing.xl,
                  AppSpacing.md,
                ),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.history,
                        size: 24,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Text(
                        'Activities',
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          color: Theme.of(
                            context,
                          ).textTheme.displayLarge?.color,
                          letterSpacing: -0.8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ─── Weekly Calendar Sliver ───────────────────
              SliverToBoxAdapter(
                child: WeeklyCalendar(
                  activities: activityState.recentActivities,
                  selectedDate: _filterDate,
                  onSelectDate: (date) => setState(() => _filterDate = date),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.sm)),

              // ─── Filter Toggle Row Sliver ─────────────────
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Printables badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? AppColors.primary.withAlpha(40)
                              : AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          border: Border.all(
                            color: AppColors.primary.withAlpha(
                              Theme.of(context).brightness == Brightness.dark
                                  ? 120
                                  : 40,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              LucideIcons.fileText,
                              size: 14,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Text(
                              '${activityState.recentActivities.length} Printables',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(
                                  context,
                                ).textTheme.bodyLarge?.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Filter button
                      GestureDetector(
                        onTap: () =>
                            setState(() => _showFilters = !_showFilters),
                        child: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: _hasActiveFilters
                                ? AppColors.primary
                                : Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                            border: Border.all(color: AppColors.primary),
                          ),
                          child: Icon(
                            LucideIcons.filter,
                            size: 18,
                            color: _hasActiveFilters
                                ? Colors.white
                                : Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ─── Filter Bar Sliver ────────────────────────
              if (_showFilters)
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.xl,
                      AppSpacing.sm,
                      AppSpacing.xl,
                      AppSpacing.md,
                    ),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Theme.of(context).dividerColor,
                        ),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CATEGORY',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Wrap(
                          spacing: AppSpacing.xs,
                          runSpacing: AppSpacing.xs,
                          children: [
                            _FilterChip(
                              label: 'All',
                              selected: _filterCategory == null,
                              onTap: () =>
                                  setState(() => _filterCategory = null),
                            ),
                            ...Categories.all.map(
                              (cat) => _FilterChip(
                                label: cat.label.split(' ').first,
                                selected: _filterCategory == cat.id,
                                onTap: () => setState(
                                  () => _filterCategory =
                                      _filterCategory == cat.id ? null : cat.id,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (profileState.profiles.length > 1) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'KID',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(
                                context,
                              ).textTheme.bodyLarge?.color,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Wrap(
                            spacing: AppSpacing.xs,
                            runSpacing: AppSpacing.xs,
                            children: [
                              _FilterChip(
                                label: 'All Kids',
                                selected: _filterKidId == null,
                                onTap: () =>
                                    setState(() => _filterKidId = null),
                              ),
                              ...profileState.profiles.map(
                                (p) => _FilterChip(
                                  label: p.name,
                                  selected: _filterKidId == p.id,
                                  onTap: () => setState(
                                    () => _filterKidId = _filterKidId == p.id
                                        ? null
                                        : p.id,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'SORT',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Wrap(
                          spacing: AppSpacing.xs,
                          children: [
                            _FilterChip(
                              label: 'Newest',
                              selected: _sortBy == 'newest',
                              onTap: () => setState(() => _sortBy = 'newest'),
                            ),
                            _FilterChip(
                              label: 'Oldest',
                              selected: _sortBy == 'oldest',
                              onTap: () => setState(() => _sortBy = 'oldest'),
                            ),
                          ],
                        ),
                        if (_hasActiveFilters)
                          Center(
                            child: TextButton.icon(
                              onPressed: _clearFilters,
                              icon: const Icon(
                                LucideIcons.x,
                                size: 14,
                                color: AppColors.accent,
                              ),
                              label: const Text(
                                'Clear Filters',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

              // ─── Results Count Sliver ────────────────────
              if (_hasActiveFilters)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.sm,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: Text(
                      '${filtered.length} activit${filtered.length == 1 ? 'y' : 'ies'} found',
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                  ),
                ),

              // ─── Activity Grid Sliver ─────────────────────
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.md,
                  AppSpacing.xl,
                  120,
                ),
                sliver: filtered.isEmpty
                    ? SliverToBoxAdapter(
                        child: _buildEmpty(activityState.isFetchingRecent),
                      )
                    : SliverLayoutBuilder(
                        builder: (context, constraints) {
                          final width = constraints.crossAxisExtent;
                          final crossAxisCount = width > 900
                              ? 5
                              : (width > 600 ? 3 : 2);
                          final childAspectRatio = width > 900
                              ? 0.85
                              : (width > 600 ? 0.75 : 0.72);

                          return SliverGrid(
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: crossAxisCount,
                                  crossAxisSpacing: AppSpacing.md,
                                  mainAxisSpacing: AppSpacing.md,
                                  childAspectRatio: childAspectRatio,
                                ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) =>
                                  _buildActivityCard(filtered[index]),
                              childCount: filtered.length,
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty(bool isLoading) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(38),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Icon(
              LucideIcons.history,
              size: 32,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            _hasActiveFilters ? 'No matches found' : 'No activities yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            _hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Generate your first activity and it will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).textTheme.bodySmall?.color,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityCard(Activity activity) {
    final accent = _getCategoryAccent(activity.category);
    final diffColor = _getDifficultyColor(activity.difficulty);
    final catLabel = _getCategoryLabel(activity.category);

    return GestureDetector(
      onTap: () {
        context.push('/activity/${activity.id}');
      },
      child: Container(
        padding: const EdgeInsets.all(
          AppSpacing.md * 0.75,
        ), // Tightened from 16 to 12
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? Theme.of(context).cardColor
              : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: accent.withAlpha(
              Theme.of(context).brightness == Brightness.dark ? 120 : 64,
            ),
            width: 2,
          ),
          boxShadow: AppShadows.small,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Category chip + star
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: accent.withAlpha(50),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text(
                    catLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: accent,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => ref
                      .read(activityProvider.notifier)
                      .toggleSaved(activity.id),
                  child: Icon(
                    LucideIcons.star,
                    size: 16,
                    color: activity.isSaved
                        ? AppColors.primary
                        : Theme.of(context).textTheme.bodySmall?.color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),

            // Title
            Text(
              activity.topic,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: Theme.of(context).textTheme.bodyLarge?.color,
                height: 1.25,
                letterSpacing: -0.2,
              ),
            ),

            const Spacer(),

            // Image / fallback
            Center(
              child: Container(
                height: 100, // Balanced for visual impact vs grid constraints
                width: double.infinity,
                decoration: BoxDecoration(
                  color: accent.withAlpha(30),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                clipBehavior: Clip.hardEdge,
                child: activity.imageUrl != null
                    ? Image.network(
                        activity.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, e, st) => _iconFallback(accent),
                      )
                    : _iconFallback(accent),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),

            // Bottom row: difficulty + date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: diffColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      activity.difficulty[0].toUpperCase() +
                          activity.difficulty.substring(1),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
                Text(
                  _relativeDate(activity.createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Theme.of(context).textTheme.bodySmall?.color,
                  ),
                ),
              ],
            ),

            // Kid name badge
            if (activity.kidName != null) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppColors.textTertiary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    activity.kidName!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _iconFallback(Color accent) {
    return Center(child: Icon(LucideIcons.search, size: 44, color: accent));
  }
}

// ─── Filter Chip ──────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: selected ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
