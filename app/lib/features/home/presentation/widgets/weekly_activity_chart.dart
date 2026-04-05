import 'dart:math';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/activity.dart';

class WeeklyActivityChart extends StatelessWidget {
  final List<Activity> activities;

  const WeeklyActivityChart({super.key, required this.activities});

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  List<DateTime> _getWeekDates() {
    final today = DateTime.now();
    final weekday = today.weekday; // 1=Mon, 7=Sun
    final monday = today.subtract(Duration(days: weekday - 1));
    return List.generate(
      7,
      (i) => DateTime(monday.year, monday.month, monday.day + i),
    );
  }

  String _toDateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final weekDates = _getWeekDates();
    final todayStr = _toDateStr(DateTime.now());

    // Calculate counts
    final counts = <String, int>{};
    for (final a in activities) {
      final date = DateTime.tryParse(a.createdAt);
      if (date == null) continue;
      final ds = _toDateStr(date);
      counts[ds] = (counts[ds] ?? 0) + 1;
    }

    final weeklyCounts = weekDates
        .map((d) => counts[_toDateStr(d)] ?? 0)
        .toList();
    final totalWeekCount = weeklyCounts.fold(0, (sum, item) => sum + item);
    final maxCount = weeklyCounts.isEmpty ? 0 : weeklyCounts.reduce(max);
    final displayMax = max(5, maxCount + 1);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.card,
        border: Border.all(
          color: isDark ? Colors.white10 : AppColors.primary.withAlpha(50),
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        child: Stack(
          children: [
            // Decorative background gradient accent
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.primary.withAlpha(25),
                      AppColors.primary.withAlpha(0),
                    ],
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Improved Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Weekly Progress',
                            style: theme.textTheme.displayLarge?.copyWith(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          Text(
                            '$totalWeekCount activities completed',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? Colors.white70
                                  : AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Empty state message if needed
                  if (totalWeekCount == 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.lg,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.black26
                            : AppColors.primary.withAlpha(10),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Text(
                        'Start creating to see your progress!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? Colors.white54
                              : AppColors.textSecondary,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),

                  const SizedBox(height: 12),

                  // Chart Area
                  SizedBox(
                    height: 120,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(7, (index) {
                        final count = weeklyCounts[index];
                        final isToday =
                            _toDateStr(weekDates[index]) == todayStr;
                        final barHeightHeight =
                            (count / displayMax) *
                            110; // scaled for 120 max height

                        return Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // Capsule Bar
                              Expanded(
                                child: Container(
                                  width: 14,
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.white.withAlpha(5)
                                        : Colors.black.withAlpha(5),
                                    borderRadius: BorderRadius.circular(
                                      AppRadius.full,
                                    ),
                                  ),
                                  alignment: Alignment.bottomCenter,
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 500),
                                    width: 14,
                                    height: max(14, barHeightHeight),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: isToday
                                            ? [
                                                AppColors.primary,
                                                AppColors.primary.withAlpha(
                                                  180,
                                                ),
                                              ]
                                            : [
                                                AppColors.primary.withAlpha(
                                                  isDark ? 50 : 30,
                                                ),
                                                AppColors.primary.withAlpha(
                                                  isDark ? 30 : 15,
                                                ),
                                              ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                      borderRadius: BorderRadius.circular(
                                        AppRadius.full,
                                      ),
                                      boxShadow: isToday
                                          ? [
                                              BoxShadow(
                                                color: AppColors.primary
                                                    .withAlpha(60),
                                                blurRadius: 10,
                                                offset: const Offset(0, 4),
                                              ),
                                            ]
                                          : null,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              // Day Label
                              Text(
                                _dayLabels[index].substring(0, 1),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isToday
                                      ? FontWeight.bold
                                      : FontWeight.w600,
                                  color: isToday
                                      ? AppColors.primary
                                      : (isDark
                                            ? Colors.white38
                                            : Colors.black26),
                                ),
                              ),
                              if (isToday)
                                Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  width: 4,
                                  height: 4,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
