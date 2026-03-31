/// Represents a scheduled activity on the kid's weekly planner.
class JourneyItem {
  final String id;
  final String userId;
  final String kidProfileId;
  final String? activityId;
  final String title;
  final String category;
  final String scheduledDate; // YYYY-MM-DD
  final String createdAt;

  const JourneyItem({
    required this.id,
    required this.userId,
    required this.kidProfileId,
    this.activityId,
    required this.title,
    required this.category,
    required this.scheduledDate,
    required this.createdAt,
  });

  factory JourneyItem.fromJson(Map<String, dynamic> json) {
    return JourneyItem(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      kidProfileId: json['kid_profile_id'] as String,
      activityId: json['activity_id'] as String?,
      title: json['title'] as String,
      category: json['category'] as String,
      scheduledDate: json['scheduled_date'] as String,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'kid_profile_id': kidProfileId,
    'activity_id': activityId,
    'title': title,
    'category': category,
    'scheduled_date': scheduledDate,
    'created_at': createdAt,
  };
}

/// Represents a completion record for an activity.
class ActivityCompletion {
  final String id;
  final String userId;
  final String kidProfileId;
  final String? activityId;
  final String? journeyItemId;
  final String completedAt;
  final String completedDate; // YYYY-MM-DD

  const ActivityCompletion({
    required this.id,
    required this.userId,
    required this.kidProfileId,
    this.activityId,
    this.journeyItemId,
    required this.completedAt,
    required this.completedDate,
  });

  factory ActivityCompletion.fromJson(Map<String, dynamic> json) {
    return ActivityCompletion(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      kidProfileId: json['kid_profile_id'] as String,
      activityId: json['activity_id'] as String?,
      journeyItemId: json['journey_item_id'] as String?,
      completedAt: json['completed_at'] as String,
      completedDate: json['completed_date'] as String,
    );
  }
}

/// Input for scheduling an activity on the planner.
class ScheduleActivityInput {
  final String kidProfileId;
  final String? activityId;
  final String title;
  final String category;
  final String scheduledDate;

  const ScheduleActivityInput({
    required this.kidProfileId,
    this.activityId,
    required this.title,
    required this.category,
    required this.scheduledDate,
  });

  Map<String, dynamic> toJson() => {
    'kid_profile_id': kidProfileId,
    'activity_id': activityId,
    'title': title,
    'category': category,
    'scheduled_date': scheduledDate,
  };
}
