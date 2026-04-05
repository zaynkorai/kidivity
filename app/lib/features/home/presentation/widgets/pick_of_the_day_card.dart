import 'dart:math';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/categories.dart';
import '../../../../core/constants/topics.dart';

class PickOfTheDayCard extends StatelessWidget {
  const PickOfTheDayCard({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Use a seed based on the current date so the pick changes daily but stays consistent during the day
    final now = DateTime.now();
    final seed = now.year * 10000 + now.month * 100 + now.day;
    final random = Random(seed);

    // Pick a random category
    final catIndex = random.nextInt(Categories.all.length);
    final cat = Categories.all[catIndex];

    // Pick a random topic from that category
    final categoryTopics = suggestedTopics[cat.id] ?? ['Surprise Activity'];
    final topic = categoryTopics[random.nextInt(categoryTopics.length)];

    final idea = 'How about a ${cat.label} session about "$topic"?';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.card,
        border: Border.all(
          color: isDark ? cat.accent.withAlpha(50) : Colors.white.withAlpha(150),
          width: 2,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg), // Reduced padding
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pick of the Day Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.black38
                          : Colors.white.withAlpha(180),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'PICK OF THE DAY',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : cat.accent,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12), // Reduced spacing
                  // Idea Text
                  Text(
                    idea,
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                      color: isDark ? Colors.white : AppColors.primaryDark,
                    ),
                  ),
                  const SizedBox(height: 4), // Reduced spacing
                  // Category Info
                  Text(
                    'Category: ${cat.label}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white70 : AppColors.textSecondary,
                    ),
                  ),

                  const SizedBox(height: 16), // Reduced spacing
                  // Action CTA
                  Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: () {
                        context.push(
                          '/generate?category=${cat.id}&topic=${Uri.encodeComponent(topic)}',
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ), // Reduced CTA padding
                        decoration: BoxDecoration(
                          color: isDark ? cat.accent : Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          boxShadow: isDark
                              ? [
                                  BoxShadow(
                                    color: cat.accent.withAlpha(80),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : AppShadows.small,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Try it now',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : cat.accent,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(
                              LucideIcons.arrowRight,
                              size: 16,
                              color: isDark ? Colors.white : cat.accent,
                            ),
                          ],
                        ),
                      ),
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
