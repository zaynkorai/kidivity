import 'dart:math';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/activity.dart';
import '../../../../core/constants/categories.dart';

class WeeklyCalendar extends StatelessWidget {
  final List<Activity> activities;
  final String? selectedDate;
  final ValueChanged<String?> onSelectDate;
  final bool transparent;

  const WeeklyCalendar({
    super.key,
    required this.activities,
    required this.selectedDate,
    required this.onSelectDate,
    this.transparent = false,
  });

  static const _dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Get the 7 dates (Mon–Sun) for the current week
  static List<DateTime> _getWeekDates() {
    final today = DateTime.now();
    final weekday = today.weekday; // 1=Mon, 7=Sun
    final monday = today.subtract(Duration(days: weekday - 1));
    return List.generate(7, (i) => DateTime(monday.year, monday.month, monday.day + i));
  }

  static String _toDateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final weekDates = _getWeekDates();
    final todayStr = _toDateStr(DateTime.now());
    final screenWidth = MediaQuery.of(context).size.width;

    // Compute sizes to match React Native layout
    final cardInnerWidth = screenWidth - AppSpacing.xl * 2 - AppSpacing.md * 2;
    final gap = max(3.0, (cardInnerWidth * 0.012).floorToDouble());
    final pillSize = ((cardInnerWidth - gap * 6) / 7).floorToDouble();

    // Build day stats from activities
    final dayStats = <String, _DayStats>{};
    for (final a in activities) {
      final date = DateTime.tryParse(a.createdAt);
      if (date == null) continue;
      final ds = _toDateStr(date);
      dayStats.putIfAbsent(ds, () => _DayStats());
      dayStats[ds]!.count++;
      if (!dayStats[ds]!.categories.contains(a.category)) {
        dayStats[ds]!.categories.add(a.category);
      }
    }

    final activeDaysThisWeek = weekDates.where((d) => dayStats.containsKey(_toDateStr(d))).length;

    // Streak calculation
    int streak = 0;
    final today = DateTime.now();
    for (int i = 0; i < 30; i++) {
      final d = DateTime(today.year, today.month, today.day - i);
      if (dayStats.containsKey(_toDateStr(d))) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return Container(
      margin: transparent ? EdgeInsets.zero : const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      padding: EdgeInsets.symmetric(
        horizontal: transparent ? 0 : AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      decoration: transparent
          ? null
          : BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(15),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
      child: Column(
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'This Week',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: transparent
                      ? Colors.white
                      : Theme.of(context).textTheme.bodyLarge?.color,
                  letterSpacing: -0.3,
                ),
              ),
              Row(
                children: [
                  if (streak > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 3),
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
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(LucideIcons.flame, size: 12, color: Colors.white),
                          const SizedBox(width: 3),
                          Text(
                            '$streak streak',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(width: AppSpacing.xs),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 3),
                    decoration: BoxDecoration(
                      color: transparent
                          ? Colors.white.withAlpha(40)
                          : (Theme.of(context).brightness == Brightness.dark
                              ? AppColors.secondary.withAlpha(50)
                              : AppColors.secondary.withAlpha(30)),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.zap, size: 12, color: AppColors.secondary),
                        const SizedBox(width: 3),
                        Text(
                          '$activeDaysThisWeek/7 days',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: transparent
                                ? Colors.white
                                : Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),

          // Day pills row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (i) {
              final date = weekDates[i];
              final ds = _toDateStr(date);
              final stats = dayStats[ds];
              final isToday = ds == todayStr;
              final isSelected = ds == selectedDate;
              final hasActivity = (stats?.count ?? 0) > 0;
              final dominantCat = stats?.categories.isNotEmpty == true ? stats!.categories.first : null;

              Color pillBg = (Theme.of(context).brightness == Brightness.dark ||
                      transparent)
                  ? (transparent
                      ? Colors.white.withAlpha(30)
                      : Theme.of(context).dividerColor.withAlpha(40))
                  : AppColors.primaryLight;
              if (isSelected) {
                pillBg = AppColors.secondary;
              } else if (isToday) {
                pillBg = transparent ? Colors.white : AppColors.primary;
              } else if (hasActivity && dominantCat != null) {
                final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
                  (c) => c?.id == dominantCat,
                  orElse: () => null,
                );
                pillBg = (Theme.of(context).brightness == Brightness.dark ||
                        transparent)
                    ? (cat?.accent.withAlpha(transparent ? 150 : 50) ??
                        Theme.of(context).dividerColor)
                    : (cat?.color ?? AppColors.primaryLight);
              }

              final isActive = isToday || isSelected;
              final textColor = isActive
                  ? (isToday && transparent ? AppColors.primary : Colors.white)
                  : (transparent ? Colors.white70 : null);

              return GestureDetector(
                onTap: () => onSelectDate(ds == selectedDate ? null : ds),
                child: Container(
                  width: pillSize,
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: pillBg,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    boxShadow: isActive
                        ? [BoxShadow(color: AppColors.primary.withAlpha(60), blurRadius: 4, offset: const Offset(0, 2))]
                        : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _dayLetters[i],
                        style: TextStyle(
                          fontSize: max(8, pillSize * 0.22),
                          fontWeight: FontWeight.bold,
                          color: textColor ?? Theme.of(context).textTheme.bodySmall?.color,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: max(10, pillSize * 0.28),
                          fontWeight: FontWeight.bold,
                          color: textColor ?? Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                      ),
                      const SizedBox(height: 2),
                      if (hasActivity && isActive)
                        Icon(LucideIcons.checkCircle2, size: max(11, pillSize * 0.30), color: Colors.white)
                      else if (hasActivity)
                        Container(
                          constraints: BoxConstraints(minWidth: max(14, pillSize * 0.38)),
                          height: max(14, pillSize * 0.38),
                          decoration: BoxDecoration(
                            color: _getCatAccent(dominantCat),
                            borderRadius: BorderRadius.circular(max(7, pillSize * 0.19)),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '${stats!.count}',
                            style: TextStyle(
                              fontSize: max(8, pillSize * 0.20),
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        )
                      else
                        Container(
                          width: 5,
                          height: 5,
                          decoration: BoxDecoration(color: Theme.of(context).dividerColor, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: activeDaysThisWeek / 7,
              minHeight: 5,
              backgroundColor: transparent
                  ? Colors.white.withAlpha(40)
                  : Theme.of(context).dividerColor,
              valueColor: AlwaysStoppedAnimation<Color>(
                transparent ? Colors.white : AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 4),

          // Star row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (i) {
              final ds = _toDateStr(weekDates[i]);
              final done = dayStats.containsKey(ds);
              return Icon(
                LucideIcons.star,
                size: 9,
                color: done
                    ? (transparent ? Colors.white : AppColors.primary)
                    : (transparent
                        ? Colors.white.withAlpha(40)
                        : Theme.of(context).dividerColor),
              );
            }),
          ),

          // Perfect week banner
          if (activeDaysThisWeek == 7)
            Container(
              margin: const EdgeInsets.only(top: AppSpacing.sm),
              padding: const EdgeInsets.symmetric(vertical: 5),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark ? AppColors.primary.withAlpha(40) : AppCategoryColors.artPastel,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.star, size: 11, color: AppColors.primary),
                  const SizedBox(width: AppSpacing.xs),
                  Text('Perfect Week!', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color, letterSpacing: 0.3)),
                  const SizedBox(width: AppSpacing.xs),
                  const Icon(LucideIcons.star, size: 11, color: AppColors.primary),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Color _getCatAccent(String? catId) {
    if (catId == null) return AppColors.primary;
    final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
      (c) => c?.id == catId,
      orElse: () => null,
    );
    return cat?.accent ?? AppColors.primary;
  }
}

class _DayStats {
  int count = 0;
  List<String> categories = [];
}
