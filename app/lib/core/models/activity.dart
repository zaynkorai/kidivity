class Activity {
  final String id;
  final String userId;
  final String kidProfileId;
  final String category;
  final String topic;
  final String difficulty;
  final String style;
  final String? content;
  final String? imageUrl;
  final bool isSaved;
  final int? rating;
  final String? feedbackText;
  final String createdAt;
  final String? kidName;

  const Activity({
    required this.id,
    required this.userId,
    required this.kidProfileId,
    required this.category,
    required this.topic,
    required this.difficulty,
    required this.style,
    this.content,
    this.imageUrl,
    this.isSaved = false,
    this.rating,
    this.feedbackText,
    required this.createdAt,
    this.kidName,
  });

  Activity copyWith({bool? isSaved, int? rating, String? feedbackText}) {
    return Activity(
      id: id,
      userId: userId,
      kidProfileId: kidProfileId,
      category: category,
      topic: topic,
      difficulty: difficulty,
      style: style,
      content: content,
      imageUrl: imageUrl,
      isSaved: isSaved ?? this.isSaved,
      rating: rating ?? this.rating,
      feedbackText: feedbackText ?? this.feedbackText,
      createdAt: createdAt,
      kidName: kidName,
    );
  }

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'] as String,
      userId: (json['user_id'] ?? '') as String, // user_id may be missing in list view
      kidProfileId: json['kid_profile_id'] as String,
      category: json['category'] as String,
      topic: json['topic'] as String,
      difficulty: json['difficulty'] as String,
      style: json['style'] as String,
      content: json['content'] as String?,
      imageUrl: json['image_url'] as String?,
      isSaved: json['is_saved'] as bool? ?? false,
      rating: json['rating'] as int?,
      feedbackText: json['feedback_text'] as String?,
      createdAt: json['created_at'] as String,
      kidName: json['kid_name'] as String?,
    );
  }
}
