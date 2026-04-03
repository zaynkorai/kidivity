import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:printing/printing.dart';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:flutter/services.dart' show NetworkAssetBundle;

import '../../../core/theme/app_theme.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/providers/journey_provider.dart';
import '../../../core/models/activity.dart';
import '../../../core/constants/categories.dart';
import 'widgets/markdown_content.dart';

class ActivityDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const ActivityDetailScreen({super.key, required this.id});

  @override
  ConsumerState<ActivityDetailScreen> createState() =>
      _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends ConsumerState<ActivityDetailScreen> {
  bool _isLoadingDetail = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final activity = _getActivity();
    if (activity == null || activity.content == null) {
      setState(() => _isLoadingDetail = true);
      await ref.read(activityProvider.notifier).fetchActivityDetail(widget.id);
      if (mounted) setState(() => _isLoadingDetail = false);
    }

    // Also fetch worker completions for status
    final currentActivity = _getActivity();
    if (currentActivity != null) {
      final now = DateTime.now();
      final start = now.subtract(Duration(days: now.weekday - 1));
      final end = start.add(const Duration(days: 6));

      final startStr = _formatDate(start);
      final endStr = _formatDate(end);

      Future.microtask(() {
        if (!mounted) return;
        ref
            .read(journeyProvider.notifier)
            .fetchWeek(currentActivity.kidProfileId, startStr, endStr);
      });
    }
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Activity? _getActivity() {
    final state = ref.read(activityProvider);
    final all = [...state.recentActivities, ...state.savedActivities];
    try {
      return all.firstWhere((a) => a.id == widget.id);
    } catch (_) {
      return null;
    }
  }

  void _handleToggleSave() {
    HapticFeedback.lightImpact();
    ref.read(activityProvider.notifier).toggleSaved(widget.id);
  }

  Future<void> _handleShare(Activity activity) async {
    await Share.share(
      'Check out this ${activity.category} activity about "${activity.topic}"!\n\n${activity.content?.substring(0, 200)}...',
      subject: '${activity.topic} Activity',
    );
  }

  String _cleanTextForPdf(String text) {
    return text
        .replaceAll('“', '"')
        .replaceAll('”', '"')
        .replaceAll('‘', "'")
        .replaceAll('’', "'")
        .replaceAll('—', '-')
        .replaceAll('–', '-')
        .replaceAll('…', '...')
        .replaceAll('✅', '[v]')
        .replaceAll('❌', '[x]')
        .replaceAll('✨', '*')
        .replaceAll('🔥', '!')
        .replaceAll('🚀', '>')
        .replaceAll('⭐', '*');
  }

  pw.Widget _renderTextWithStyles(
    String text, {
    double fontSize = 12,
    pw.FontWeight fontWeight = pw.FontWeight.normal,
    PdfColor color = PdfColors.grey900,
  }) {
    final List<pw.InlineSpan> spans = [];
    final cleanedText = _cleanTextForPdf(text);

    // Bold regex: **text**
    // Italic regex: *text* (but not part of bold)
    final RegExp exp = RegExp(r'(\*\*.*?\*\*|\*.*?\*)');
    int lastMatchEnd = 0;

    for (final match in exp.allMatches(cleanedText)) {
      if (match.start > lastMatchEnd) {
        spans.add(
          pw.TextSpan(text: cleanedText.substring(lastMatchEnd, match.start)),
        );
      }

      final matchText = match.group(0)!;
      if (matchText.startsWith('**')) {
        spans.add(
          pw.TextSpan(
            text: matchText.substring(2, matchText.length - 2),
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
          ),
        );
      } else if (matchText.startsWith('*')) {
        spans.add(
          pw.TextSpan(
            text: matchText.substring(1, matchText.length - 1),
            style: pw.TextStyle(fontStyle: pw.FontStyle.italic),
          ),
        );
      }
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < cleanedText.length) {
      spans.add(pw.TextSpan(text: cleanedText.substring(lastMatchEnd)));
    }

    if (spans.isEmpty)
      return pw.Text(
        cleanedText,
        style: pw.TextStyle(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          lineSpacing: 4,
        ),
      );

    return pw.RichText(
      text: pw.TextSpan(
        style: pw.TextStyle(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          lineSpacing: 4,
        ),
        children: spans,
      ),
    );
  }

  List<pw.Widget> _parseMarkdownToPdf(String content) {
    final List<pw.Widget> widgets = [];
    final lines = content.split('\n');

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;

      // Secondary Title (Section)
      if (trimmed.startsWith('## ')) {
        final heading = pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            pw.SizedBox(height: 18),
            pw.Stack(
              alignment: pw.Alignment.centerLeft,
              children: [
                pw.Container(
                  padding: const pw.EdgeInsets.fromLTRB(12, 6, 10, 6),
                  color: PdfColors.grey100,
                  width: double.infinity,
                  child: pw.Text(
                    _cleanTextForPdf(
                      trimmed.replaceFirst('## ', '').toUpperCase(),
                    ),
                    style: pw.TextStyle(
                      fontSize: 11,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.grey900,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                pw.Container(width: 3, height: 24, color: PdfColors.grey600),
              ],
            ),
            pw.SizedBox(height: 10),
          ],
        );

        // Peek ahead to find the next meaningful content to keep with the heading
        int nextI = i + 1;
        while (nextI < lines.length && lines[nextI].trim().isEmpty) {
          nextI++;
        }

        if (nextI < lines.length) {
          final nextLine = lines[nextI].trim();
          pw.Widget? nextWidget;

          if (nextLine.startsWith('- ') || nextLine.startsWith('* ')) {
            nextWidget = _renderBullet(nextLine);
          } else if (!nextLine.startsWith('# ')) {
            nextWidget = _renderParagraph(nextLine);
          }

          if (nextWidget != null) {
            widgets.add(
              pw.Header(
                level: 1,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                  children: [heading, nextWidget],
                ),
              ),
            );
            i = nextI; // Consume the next line
            continue;
          }
        }

        widgets.add(heading);
      }
      // Bullet items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        widgets.add(_renderBullet(trimmed));
      }
      // Simple text / Paragraph
      else if (!trimmed.startsWith('# ')) {
        widgets.add(_renderParagraph(trimmed));
      }
    }

    return widgets;
  }

  pw.Widget _renderBullet(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(left: 12, bottom: 6),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Padding(
            padding: const pw.EdgeInsets.only(top: 2, right: 10),
            child: pw.Text(
              'H',
              style: pw.TextStyle(
                font: pw.Font.zapfDingbats(),
                fontSize: 8,
                color: PdfColors.grey700,
              ),
            ),
          ),
          pw.Expanded(child: _renderTextWithStyles(text.substring(2))),
        ],
      ),
    );
  }

  pw.Widget _renderParagraph(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 12),
      child: _renderTextWithStyles(text, fontSize: 11.5),
    );
  }

  Future<void> _handlePrint(Activity activity) async {
    HapticFeedback.lightImpact();
    final doc = pw.Document();

    // Load image if available
    pw.MemoryImage? image;
    if (activity.imageUrl != null) {
      try {
        final response = await NetworkAssetBundle(
          Uri.parse(activity.imageUrl!),
        ).load("");
        image = pw.MemoryImage(response.buffer.asUint8List());
      } catch (e) {
        debugPrint('Error loading image for PDF: $e');
      }
    }

    final normalizedContent = normalizeActivityContent(activity.content);

    doc.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          buildForeground: (pw.Context context) {
            return pw.Stack(
              children: [
                pw.Container(
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300, width: 2),
                  ),
                  child: pw.Container(
                    margin: const pw.EdgeInsets.all(2),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(
                        color: PdfColors.grey300,
                        width: 0.5,
                      ),
                    ),
                  ),
                ),
                // Decorative Corner Alignment Markers (Refactored to avoid non-uniform border radius conflicts)
                pw.Positioned(
                  top: 0,
                  left: 0,
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Container(
                        width: 15,
                        height: 1.5,
                        color: PdfColors.grey400,
                      ),
                      pw.Container(
                        width: 1.5,
                        height: 15,
                        color: PdfColors.grey400,
                      ),
                    ],
                  ),
                ),
                pw.Positioned(
                  top: 0,
                  right: 0,
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Container(
                        width: 15,
                        height: 1.5,
                        color: PdfColors.grey400,
                      ),
                      pw.Container(
                        width: 1.5,
                        height: 15,
                        color: PdfColors.grey400,
                      ),
                    ],
                  ),
                ),
                pw.Positioned(
                  bottom: 0,
                  left: 0,
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    verticalDirection: pw.VerticalDirection.up,
                    children: [
                      pw.Container(
                        width: 15,
                        height: 1.5,
                        color: PdfColors.grey400,
                      ),
                      pw.Container(
                        width: 1.5,
                        height: 15,
                        color: PdfColors.grey400,
                      ),
                    ],
                  ),
                ),
                pw.Positioned(
                  bottom: 0,
                  right: 0,
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    verticalDirection: pw.VerticalDirection.up,
                    children: [
                      pw.Container(
                        width: 15,
                        height: 1.5,
                        color: PdfColors.grey400,
                      ),
                      pw.Container(
                        width: 1.5,
                        height: 15,
                        color: PdfColors.grey400,
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
        header: (pw.Context context) => pw.Container(
          padding: const pw.EdgeInsets.fromLTRB(40, 40, 40, 10),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                'KIDIVITY',
                style: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                  letterSpacing: 2,
                  color: PdfColors.grey600,
                ),
              ),
              pw.Text(
                activity.category.toUpperCase(),
                style: pw.TextStyle(fontSize: 10, color: PdfColors.grey500),
              ),
            ],
          ),
        ),
        footer: (pw.Context context) => pw.Container(
          padding: const pw.EdgeInsets.fromLTRB(40, 10, 40, 40),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                'Page ${context.pageNumber} of ${context.pagesCount}',
                style: pw.TextStyle(fontSize: 9, color: PdfColors.grey500),
              ),
              pw.Text(
                'www.kidivity.pro',
                style: pw.TextStyle(fontSize: 9, color: PdfColors.grey500),
              ),
            ],
          ),
        ),
        build: (pw.Context context) => [
          // Dynamic Header Section
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: 16),
            child: pw.Column(
              children: [
                pw.SizedBox(height: 10),
                pw.Text(
                  _cleanTextForPdf(activity.topic),
                  style: pw.TextStyle(
                    fontSize: 28,
                    fontWeight: pw.FontWeight.bold,
                  ),
                  textAlign: pw.TextAlign.center,
                ),
                pw.SizedBox(height: 8),
                pw.Divider(color: PdfColors.grey200, thickness: 1),
                pw.SizedBox(height: 24),
              ],
            ),
          ),

          // Activity Feature Image
          if (image != null)
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              child: pw.Center(
                child: pw.Container(
                  height: 240,
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey200, width: 1),
                  ),
                  child: pw.Image(image, fit: pw.BoxFit.contain),
                ),
              ),
            ),

          // Main Content Widgets (Dynamic Markdown Parsing)
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: 16),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: _parseMarkdownToPdf(normalizedContent),
            ),
          ),

          // Signature Area
          pw.Padding(
            padding: const pw.EdgeInsets.fromLTRB(16, 48, 16, 20),
            child: pw.Column(
              children: [
                pw.Divider(color: PdfColors.grey400),
                pw.SizedBox(height: 12),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Completed by: ________________________',
                          style: const pw.TextStyle(fontSize: 11),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'Date: ________________________',
                          style: const pw.TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                    pw.Row(
                      children: [
                        pw.Text(
                          'Grade: ',
                          style: const pw.TextStyle(fontSize: 11),
                        ),
                        ...List.generate(
                          5,
                          (_) => pw.Padding(
                            padding: const pw.EdgeInsets.symmetric(
                              horizontal: 2,
                            ),
                            child: pw.Container(
                              width: 12,
                              height: 12,
                              decoration: pw.BoxDecoration(
                                shape: pw.BoxShape.circle,
                                border: pw.Border.all(color: PdfColors.grey600),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) => doc.save(),
      name: '${activity.topic}_activity',
    );
  }

  void _handleLoveIt() {
    HapticFeedback.mediumImpact();
    ref.read(activityProvider.notifier).submitFeedback(widget.id, 1);
  }

  void _handleRedo() {
    _showRedoDialog();
  }

  void _showRedoDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Improve this activity'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'What would you like to change? (e.g. "Too many numbers", "Change theme to space")',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Enter your changes...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              _processRedo(controller.text);
            },
            child: const Text('Redo Now'),
          ),
        ],
      ),
    );
  }

  Future<void> _processRedo(String feedback) async {
    final activity = _getActivity();
    if (activity == null) return;

    HapticFeedback.mediumImpact();

    // Submit feedback
    await ref
        .read(activityProvider.notifier)
        .submitFeedback(widget.id, -1, feedbackText: feedback);

    // Regenerate
    final result = await ref
        .read(activityProvider.notifier)
        .generateActivity(
          kidProfileId: activity.kidProfileId,
          category: activity.category,
          topic: activity.topic,
          difficulty: activity.difficulty,
          style: activity.style,
        );

    if (!mounted) return;
    if (result.data != null) {
      context.replace('/activity/${result.data!.id}');
    } else if (result.error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.error!)));
    }
  }

  Future<void> _handleMarkCompleted(Activity activity) async {
    HapticFeedback.lightImpact();
    final success = await ref
        .read(journeyProvider.notifier)
        .completeActivityAdhoc(activity.kidProfileId, activity.id);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✨ Activity marked as completed!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to mark completed. Try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity =
        ref
            .watch(activityProvider)
            .recentActivities
            .followedBy(ref.watch(activityProvider).savedActivities)
            .where((a) => a.id == widget.id)
            .firstOrNull ??
        _getActivity();

    final isGenerating = ref.watch(activityProvider).isGenerating;

    if (_isLoadingDetail || activity == null) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: _isLoadingDetail
              ? const CircularProgressIndicator.adaptive()
              : Text(
                  'Activity not found',
                  style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
        ),
      );
    }

    final category = Categories.all.firstWhere(
      (c) => c.id == activity.category,
      orElse: () => Categories.all.first,
    );

    final todayStr = _formatDate(DateTime.now());
    final isCompletedToday = ref
        .watch(journeyProvider)
        .completions
        .any((c) => c.activityId == activity.id && c.completedDate == todayStr);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Stack(
            children: [
              CustomScrollView(
                slivers: [
                  // ─── Custom Top Bar ──────────────────────────
                  SliverAppBar(
                    floating: true,
                    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                    elevation: 0,
                    leading: IconButton(
                      icon: Icon(
                        LucideIcons.arrowLeft,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                      onPressed: () => context.pop(),
                    ),
                    actions: [
                      IconButton(
                        icon: Icon(
                          activity.isSaved
                              ? LucideIcons.bookMarked
                              : LucideIcons.bookmark,
                          color: activity.isSaved
                              ? AppColors.primary
                              : Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                        onPressed: _handleToggleSave,
                      ),
                      IconButton(
                        icon: Icon(
                          LucideIcons.share2,
                          color: Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                        onPressed: () => _handleShare(activity),
                      ),
                    ],
                  ),

                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.xl,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        const SizedBox(height: AppSpacing.sm),

                        // ─── Meta Row: Category Badge + Date ──────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: category.color,
                                borderRadius: BorderRadius.circular(
                                  AppRadius.sm,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    category.icon,
                                    size: 14,
                                    color:
                                        Theme.of(context).brightness ==
                                            Brightness.dark
                                        ? Colors.black
                                        : AppColors.textPrimary,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    category.label,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color:
                                          Theme.of(context).brightness ==
                                              Brightness.dark
                                          ? Colors.black
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                Icon(
                                  LucideIcons.clock,
                                  size: 14,
                                  color: Theme.of(
                                    context,
                                  ).textTheme.bodySmall?.color,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Recent', // simplified for now
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.color
                                        ?.withAlpha(180),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // ─── Meta Chips ───────────────────────────
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildMetaChip(LucideIcons.tag, activity.topic),
                            _buildMetaChip(
                              LucideIcons.zap,
                              activity.difficulty[0].toUpperCase() +
                                  activity.difficulty.substring(1),
                            ),
                            _buildMetaChip(
                              LucideIcons.palette,
                              activity.style == 'colorful' ? 'Colorful' : 'B&W',
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.lg),

                        // ─── Content Card ─────────────────────────
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(15),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (activity.imageUrl != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(
                                    AppRadius.md,
                                  ),
                                  child: Image.network(
                                    activity.imageUrl!,
                                    height: 300,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              if (activity.imageUrl != null)
                                const SizedBox(height: AppSpacing.lg),

                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      activity.kidName != null
                                          ? 'Created for ${activity.kidName}'
                                          : 'Created for you',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.color
                                            ?.withAlpha(180),
                                      ),
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: () => _handlePrint(activity),
                                    icon: const Icon(
                                      LucideIcons.printer,
                                      size: 14,
                                    ),
                                    label: const Text('Print'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                      ),
                                      minimumSize: const Size(0, 36),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.md),

                              MarkdownContent(content: activity.content ?? ''),
                            ],
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xl),

                        // ─── Feedback Section ─────────────────────
                        _buildFeedbackSection(activity),
                        const SizedBox(height: AppSpacing.md),

                        // ─── Mark Completed ───────────────────────
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: isCompletedToday
                                ? null
                                : () => _handleMarkCompleted(activity),
                            icon: Icon(
                              isCompletedToday
                                  ? LucideIcons.checkCircle2
                                  : LucideIcons.checkCircle2,
                              size: 18,
                            ),
                            label: Text(
                              isCompletedToday
                                  ? 'Completed Today'
                                  : 'Mark Completed',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isCompletedToday
                                  ? Theme.of(context).cardColor
                                  : AppColors.primary,
                              foregroundColor: isCompletedToday
                                  ? AppColors.primary
                                  : Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  AppRadius.md,
                                ),
                              ),
                              elevation: isCompletedToday ? 0 : 2,
                            ),
                          ),
                        ),

                        const SizedBox(height: 100),
                      ]),
                    ),
                  ),
                ],
              ),

              // Generating overlay
              if (isGenerating) _buildGeneratingOverlay(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedbackSection(Activity activity) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        children: [
          Text(
            'How was this activity?',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _buildFeedbackBtn(
                  icon: LucideIcons.heart,
                  label: 'Love it',
                  isActive: activity.rating == 1,
                  onTap: _handleLoveIt,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildFeedbackBtn(
                  icon: LucideIcons.refreshCw,
                  label: 'Redo',
                  isActive: activity.rating == -1,
                  onTap: _handleRedo,
                  activeColor: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeedbackBtn({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    Color? activeColor,
  }) {
    final color = activeColor ?? AppColors.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? color : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: isActive ? color : Theme.of(context).dividerColor,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? Colors.white : color,
              fill: isActive && icon == LucideIcons.heart ? 1 : 0,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGeneratingOverlay() {
    return _GeneratingOverlay();
  }
}

class _GeneratingOverlay extends StatefulWidget {
  @override
  State<_GeneratingOverlay> createState() => _GeneratingOverlayState();
}

class _GeneratingOverlayState extends State<_GeneratingOverlay>
    with SingleTickerProviderStateMixin {
  int _messageIndex = 0;
  late final AnimationController _controller;

  final List<String> _messages = [
    'Mixing creative juices...',
    'Thinking really hard...',
    'Sprinkling magic dust...',
    'Launching imagination...',
    'Crafting something special...',
    'Tailoring it just right...',
    'Setting up the fun...',
    'Gathering cool ideas...',
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _startTimer();
  }

  void _startTimer() async {
    while (mounted) {
      await Future.delayed(const Duration(milliseconds: 2500));
      if (mounted) {
        setState(() => _messageIndex = (_messageIndex + 1) % _messages.length);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withAlpha(120),
      child: Center(
        child: Container(
          width: 300,
          padding: const EdgeInsets.all(AppSpacing.xxxl),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(AppRadius.xl),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 24),
              Text(
                'Creating Activity',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.displayLarge?.color,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: Center(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Text(
                      _messages[_messageIndex],
                      key: ValueKey(_messages[_messageIndex]),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
