import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/activity.dart';

class JourneyMap extends StatelessWidget {
  final int streak;
  final bool hasActiveProfile;
  final List<Activity> activities;

  const JourneyMap({
    super.key,
    this.streak = 0,
    this.hasActiveProfile = false,
    this.activities = const [],
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.small,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left side title
              Row(
                children: [
                  const Icon(LucideIcons.calendar, size: 20, color: AppColors.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Journey Map',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: theme.textTheme.bodyLarge?.color,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),

              // Right side badges
              Row(
                children: [
                  // Streak badge — shows real data
                    if (streak > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, Color(0xFF6389F1)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withAlpha(80),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.flame, size: 14, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              '$streak day${streak == 1 ? '' : 's'} streak',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                  const SizedBox(width: AppSpacing.sm),

                  // Add Button
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(50),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    alignment: Alignment.center,
                    child: const Icon(LucideIcons.plus, size: 16, color: Colors.white),
                  ),
                ],
              )
            ],
          ),

          const SizedBox(height: AppSpacing.xl),

          // Content — Weekly Streak Grid or empty state
          if (!hasActiveProfile)
            _buildEmptyState(theme)
          else
            _buildStreakGrid(theme),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.sparkles, size: 32, color: AppColors.primary),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Start your creative journey!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: theme.textTheme.bodyLarge?.color,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            child: Text(
              'Select a kid profile above to see your weekly printable progress here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: theme.textTheme.bodyMedium?.color?.withAlpha(160),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakGrid(ThemeData theme) {
    final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    // Get the 7 dates (Mon–Sun) for the current week
    final today = DateTime.now();
    final weekday = today.weekday; // 1=Mon, 7=Sun
    final monday = today.subtract(Duration(days: weekday - 1));
    final weekDates = List.generate(7, (i) => DateTime(monday.year, monday.month, monday.day + i));

    final dayStats = <String, bool>{};
    for (final a in activities) {
      final date = DateTime.tryParse(a.createdAt);
      if (date == null) continue;
      final ds = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      dayStats[ds] = true;
    }

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.lg, bottom: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Journey Progress',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: theme.textTheme.bodyMedium?.color?.withAlpha(180),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (index) {
              final date = weekDates[index];
              final ds = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
              final completed = dayStats.containsKey(ds);
              return Column(
                children: [
                    Text(
                      days[index],
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      color: completed ? AppColors.primary : theme.textTheme.bodySmall?.color?.withAlpha(100),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: completed ? AppColors.primary : theme.scaffoldBackgroundColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: completed ? AppColors.primary : theme.dividerColor,
                        width: 1.5,
                      ),
                      boxShadow: completed ? [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(40),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        )
                      ] : null,
                    ),
                    alignment: Alignment.center,
                    child: completed 
                      ? const Icon(LucideIcons.check, size: 18, color: Colors.white)
                      : Text(
                          (index + 1).toString(),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: theme.textTheme.bodySmall?.color?.withAlpha(100),
                          ),
                        ),
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }
}
