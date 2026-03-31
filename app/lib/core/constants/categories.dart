import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class ActivityCategory {
  final String id;
  final String label;
  final IconData icon;
  final String description;
  final Color color;
  final Color accent;

  const ActivityCategory({
    required this.id,
    required this.label,
    required this.icon,
    required this.description,
    required this.color,
    required this.accent,
  });
}

class Categories {
  static const List<ActivityCategory> all = [
    ActivityCategory(
      id: 'puzzles',
      label: 'Puzzles & Logic',
      icon: LucideIcons.puzzle,
      description: 'Mazes, matching & sorting',
      color: AppCategoryColors.puzzlesPastel,
      accent: AppCategoryColors.puzzlesAccent,
    ),
    ActivityCategory(
      id: 'tracing',
      label: 'Letters & Tracing',
      icon: LucideIcons.penTool,
      description: 'Alphabet, shapes & writing',
      color: AppCategoryColors.tracingPastel,
      accent: AppCategoryColors.tracingAccent,
    ),
    ActivityCategory(
      id: 'science',
      label: 'Science & Discovery',
      icon: LucideIcons.flaskConical,
      description: 'Animals, space & facts',
      color: AppCategoryColors.sciencePastel,
      accent: AppCategoryColors.scienceAccent,
    ),
    ActivityCategory(
      id: 'art',
      label: 'Art & Creation',
      icon: LucideIcons.palette,
      description: 'Drawing, coloring & crafts',
      color: AppCategoryColors.artPastel,
      accent: AppCategoryColors.artAccent,
    ),
    ActivityCategory(
      id: 'math',
      label: 'Math & Numbers',
      icon: LucideIcons.calculator,
      description: 'Counting, addition & logic',
      color: AppCategoryColors.mathPastel,
      accent: AppCategoryColors.mathAccent,
    ),
    ActivityCategory(
      id: 'reading',
      label: 'Reading & Stories',
      icon: LucideIcons.bookOpen,
      description: 'Stories & reading skills',
      color: AppCategoryColors.readingPastel,
      accent: AppCategoryColors.readingAccent,
    ),
  ];
}
