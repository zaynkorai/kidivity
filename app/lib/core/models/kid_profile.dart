import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class KidProfile {
  final String id;
  final String userId;
  final String name;
  final int age;
  final String gradeLevel;
  final String avatarColor;
  final int activityCount;
  final String createdAt;
  final String updatedAt;

  const KidProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.age,
    required this.gradeLevel,
    required this.avatarColor,
    this.activityCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Parse the hex avatar_color string into a Flutter Color.
  Color get avatarColorValue {
    try {
      final hex = avatarColor.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppColors.primary;
    }
  }

  factory KidProfile.fromJson(Map<String, dynamic> json) {
    return KidProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      age: json['age'] as int,
      gradeLevel: json['grade_level'] as String,
      avatarColor: json['avatar_color'] as String? ?? '#4361EE',
      activityCount: json['activity_count'] as int? ?? 0,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'age': age,
      'grade_level': gradeLevel,
      'avatar_color': avatarColor,
      'activity_count': activityCount,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  static String randomAvatarColor() {
    final colors = AppColors.avatarPalette;
    final rng = Random();
    final c = colors[rng.nextInt(colors.length)];
    return '#${c.toARGB32().toRadixString(16).substring(2).toUpperCase()}';
  }
}

class CreateKidProfileInput {
  final String name;
  final int age;
  final String gradeLevel;
  final String? avatarColor;

  const CreateKidProfileInput({
    required this.name,
    required this.age,
    required this.gradeLevel,
    this.avatarColor,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'age': age,
      'grade_level': gradeLevel,
      'avatar_color': avatarColor ?? KidProfile.randomAvatarColor(),
    };
  }
}

class UpdateKidProfileInput {
  final String? name;
  final int? age;
  final String? gradeLevel;
  final String? avatarColor;

  const UpdateKidProfileInput({
    this.name,
    this.age,
    this.gradeLevel,
    this.avatarColor,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (name != null) map['name'] = name;
    if (age != null) map['age'] = age;
    if (gradeLevel != null) map['grade_level'] = gradeLevel;
    if (avatarColor != null) map['avatar_color'] = avatarColor;
    return map;
  }
}
