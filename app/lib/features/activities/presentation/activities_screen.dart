import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'dart:ui' show ImageFilter;
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/models/activity.dart';
import '../../../core/constants/categories.dart';
import '../../../core/widgets/profile_switcher_badge.dart';
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
        top: false,
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(activityProvider.notifier).fetchRecent(),
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
                    AppSpacing.xl,
                    MediaQuery.of(context).padding.top + AppSpacing.lg,
                    AppSpacing.xl,
                    AppSpacing.xl,
                  ),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(AppRadius.xl),
                      bottomRight: Radius.circular(AppRadius.xl),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x30000000),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Activities',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const ProfileSwitcherBadge(),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      // Weekly Calendar part of header
                      WeeklyCalendar(
                        activities: activityState.recentActivities,
                        selectedDate: _filterDate,
                        onSelectDate: (date) =>
                            setState(() => _filterDate = date),
                        transparent: true,
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

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
                              ? 0.75
                              : (width > 600 ? 0.68 : 0.65);

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: accent.withAlpha(isDark ? 12 : 20),
            blurRadius: 16,
            spreadRadius: -2,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/activity/${activity.id}'),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          splashColor: accent.withAlpha(20),
          highlightColor: accent.withAlpha(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Section: Image + Overlays
              Expanded(
                flex: 5,
                child: Stack(
                  children: [
                    // Hero image with rounded top corners
                    Positioned.fill(
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(AppRadius.lg),
                        ),
                        child: Hero(
                          tag: 'activity_image_${activity.id}',
                          child: activity.imageUrl != null
                              ? Image.network(
                                  activity.imageUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _iconFallback(accent),
                                )
                              : _iconFallback(accent),
                        ),
                      ),
                    ),
                    // Glassmorphic Category Badge (Top Left)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.full),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: accent.withAlpha(
                                210,
                              ), // The category color
                              borderRadius: BorderRadius.circular(
                                AppRadius.full,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: accent.withAlpha(80),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Text(
                              catLabel.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: Colors.white, // Non-colored font
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Gradient shadow for readability
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withAlpha(30),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Action Pill: Save (Top Right)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            ref
                                .read(activityProvider.notifier)
                                .toggleSaved(activity.id);
                          },
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.black.withAlpha(120)
                                  : Colors.white.withAlpha(120),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(20),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Icon(
                              activity.isSaved
                                  ? LucideIcons.star
                                  : LucideIcons.star,
                              fill: activity.isSaved ? 1.0 : 0.0,
                              size: 16,
                              color: activity.isSaved
                                  ? AppColors.secondary
                                  : isDark
                                  ? Colors.white
                                  : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom Section: Info with a subtle border transition
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: isDark
                          ? accent.withAlpha(30)
                          : accent.withAlpha(15),
                      width: 1.5,
                    ),
                  ),
                ),
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity.topic,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimary,
                        height: 1.25,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Single Row for Meta Info instead of separate sections
                    Row(
                      children: [
                        // Difficulty Indicator
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            color: diffColor,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: diffColor.withAlpha(100),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        Text(
                          activity.difficulty.toUpperCase(),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Date with a small divider
                        Container(
                          width: 3,
                          height: 3,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white24 : Colors.black12,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _relativeDate(activity.createdAt),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.textTertiaryDark
                                  : AppColors.textTertiary,
                            ),
                          ),
                        ),
                        // Kid name (Right aligned badge)
                        if (activity.kidName != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.white.withAlpha(15)
                                  : Colors.black.withAlpha(8),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.user,
                                  size: 10,
                                  color: isDark
                                      ? AppColors.textTertiaryDark
                                      : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  activity.kidName!,
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: isDark
                                        ? AppColors.textSecondaryDark
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _iconFallback(Color accent) {
    return Container(
      color: accent.withAlpha(20),
      child: Center(
        child: Icon(LucideIcons.image, size: 40, color: accent.withAlpha(120)),
      ),
    );
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
