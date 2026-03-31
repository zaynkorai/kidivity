import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../core/theme/app_theme.dart';

String normalizeActivityContent(String? raw) {
  if (raw == null) return '';
  String text = raw.trim();

  try {
    if ((text.startsWith('"') && text.endsWith('"')) ||
        text.startsWith('{') ||
        text.startsWith('[')) {
      final parsed = json.decode(text);
      if (parsed is String) {
        text = parsed;
      } else if (parsed is Map<String, dynamic>) {
        final title = parsed['title'] as String?;
        final instructions = parsed['instructions'] as String?;
        final content = parsed['content'] as String?;
        
        if (title != null || instructions != null || content != null) {
          text = '${title != null ? "# $title\n\n" : ""}${instructions != null ? "$instructions\n\n" : ""}${content ?? ""}';
        }
      }
    }
  } catch (_) {
    // ignore
  }

  // Handle double-escaped newlines coming from storage/API
  if (text.contains('\\n') || text.contains('\\r\\n')) {
    text = text.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n');
  }

  return text;
}

class MarkdownContent extends StatelessWidget {
  final String content;
  final bool compact;

  const MarkdownContent({
    super.key,
    required this.content,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final normalized = normalizeActivityContent(content);
    final theme = Theme.of(context);
    final baseColor = theme.textTheme.bodyLarge?.color ?? AppColors.textPrimary;
    
    return MarkdownBody(
      data: normalized,
      styleSheet: MarkdownStyleSheet(
        p: TextStyle(
          fontSize: compact ? 14 : 16,
          color: baseColor,
          height: 1.5,
        ),
        h1: TextStyle(
          fontSize: compact ? 22 : 28,
          fontWeight: FontWeight.bold,
          color: baseColor,
          height: 1.3,
        ),
        h2: TextStyle(
          fontSize: compact ? 18 : 22,
          fontWeight: FontWeight.bold,
          color: baseColor,
          height: 1.3,
        ),
        h3: TextStyle(
          fontSize: compact ? 16 : 18,
          fontWeight: FontWeight.w600,
          color: baseColor,
          height: 1.3,
        ),
        listBullet: TextStyle(
          fontSize: compact ? 14 : 16,
          color: baseColor,
        ),
        blockquote: TextStyle(
          fontSize: compact ? 14 : 16,
          color: baseColor,
          fontStyle: FontStyle.italic,
        ),
        blockquoteDecoration: BoxDecoration(
          color: AppColors.primary.withAlpha(theme.brightness == Brightness.dark ? 40 : 15),
          border: const Border(
            left: BorderSide(color: AppColors.secondary, width: 3),
          ),
          borderRadius: BorderRadius.circular(4),
        ),
        blockquotePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        listIndent: 20,
        blockSpacing: 12,
      ),
    );
  }
}
