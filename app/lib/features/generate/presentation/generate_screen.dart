import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/constants/categories.dart';
import '../../../core/constants/topics.dart';
import '../../../core/providers/review_provider.dart';
import '../../../core/widgets/review_modal.dart';

class GenerateScreen extends ConsumerStatefulWidget {
  final String? initialCategory;
  final bool isFirstActivity;

  const GenerateScreen({
    super.key,
    this.initialCategory,
    this.isFirstActivity = false,
  });

  @override
  ConsumerState<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends ConsumerState<GenerateScreen> {
  String? _selectedCategory;
  String _topic = '';
  String _difficulty = 'medium';
  String _style = 'colorful';
  String? _error;
  List<String> _suggestions = [];
  
  // Quick Guide State
  int? _guideStep; // 0: Category, 1: Topic, 2: Options/Generate

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    if (_selectedCategory != null) {
      _suggestions = getRandomSuggestions(_selectedCategory!);
      if (widget.isFirstActivity) _guideStep = 1;
    } else if (widget.isFirstActivity) {
      _guideStep = 0;
    }
    
    Future.microtask(() {
      ref.read(activityProvider.notifier).fetchRecent();
    });
  }

  void _selectCategory(String? catId) {
    setState(() {
      _selectedCategory = catId;
      _topic = '';
      _suggestions = catId != null ? getRandomSuggestions(catId) : [];
      if (_guideStep == 0 && catId != null) {
        _guideStep = 1;
      }
    });
  }

  Color get _accentColor {
    if (_selectedCategory == null) return AppColors.secondary;
    final cat = Categories.all.cast<ActivityCategory?>().firstWhere(
      (c) => c?.id == _selectedCategory,
      orElse: () => null,
    );
    return cat?.accent ?? AppColors.secondary;
  }

  bool get _isReady {
    final profileState = ref.read(profileProvider);
    return profileState.activeProfileId != null &&
        _selectedCategory != null &&
        _topic.trim().isNotEmpty;
  }

  Future<void> _handleGenerate() async {
    final profileState = ref.read(profileProvider);
    if (!_isReady || profileState.activeProfileId == null) return;

    setState(() => _error = null);
    HapticFeedback.mediumImpact();

    final result = await ref
        .read(activityProvider.notifier)
        .generateActivity(
          kidProfileId: profileState.activeProfileId!,
          category: _selectedCategory!,
          topic: _topic.trim(),
          difficulty: _difficulty,
          style: _style,
        );

    if (!mounted) return;

    if (result.error == 'rate_limit') {
      HapticFeedback.heavyImpact();
      _showRateLimitDialog();
    } else if (result.error != null) {
      HapticFeedback.heavyImpact();
      setState(() => _error = result.error);
    } else if (result.data != null) {
      HapticFeedback.lightImpact();
      
      // Navigate first
      context.push('/activity/${result.data!.id}');
      
      // Delay review check for better transition
      Future.delayed(const Duration(milliseconds: 1500), () async {
        if (!mounted) return;
        final reviewNotifier = ref.read(reviewProvider.notifier);
        if (await reviewNotifier.shouldRequestReview()) {
          if (!mounted) return;
          ReviewModal.show(context);
        }
      });
    }
  }

  void _showRateLimitDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(LucideIcons.zap, color: AppColors.secondary, size: 20),
            SizedBox(width: 8),
            Text('Daily Limit Reached'),
          ],
        ),
        content: const Text(
          'You\'ve used all your free generations for today. Come back tomorrow for more!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activityState = ref.watch(activityProvider);
    final profileState = ref.watch(profileProvider);
    final hasProfile = profileState.activeProfileId != null;
    final isGenerating = activityState.isGenerating;

    final theme = Theme.of(context);

    return Material(
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        top: false,
        bottom: false,
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 800),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ─── Primary Header ───────────────────────
                      _buildHeader(profileState),
                      const SizedBox(height: AppSpacing.xxl),

                      // ─── No Profile Warning ───────────────────
                      if (!hasProfile) _buildWarningCard(),

                      // ─── Step 1: Category ─────────────────────
                      _buildStepCard(
                        stepNumber: '1',
                        stepBadgeColor: AppColors.primary,
                        title: 'Choose a category',
                        child: _buildCategorySelector(),
                      ),
                      const SizedBox(height: AppSpacing.xxl),

                      // ─── Step 2: Topic ────────────────────────
                      _buildStepCard(
                        stepNumber: '2',
                        stepBadgeColor: AppColors.primary,
                        title: 'Pick a topic',
                        child: _buildTopicSection(),
                      ),
                      const SizedBox(height: AppSpacing.xxl),

                      // ─── Step 3: Options ──────────────────────
                      _buildStepCard(
                        stepNumber: '3',
                        stepBadgeColor: AppColors.primary,
                        title: 'Choose options',
                        child: _buildOptionsSection(),
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ─── CTA Button ───────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.xl,
                        ),
                        child: _buildGenerateButton(isGenerating),
                      ),

                      // ─── Hint text ────────────────────────────
                      if (!_isReady && !isGenerating)
                        const Padding(
                          padding: EdgeInsets.only(
                            left: AppSpacing.lg,
                            top: AppSpacing.xs,
                          ),
                          child: Text(
                            'Select a category and topic to enable generation.',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),

                      // ─── Error ────────────────────────────────
                      if (_error != null) _buildErrorCard(),

                      const SizedBox(height: 60),
                    ],
                  ),
                ),
              ),
            ),

            // Generating overlay
            if (isGenerating) _buildGeneratingOverlay(),

            // First Activity Guide Overlay
            if (_guideStep != null && !isGenerating) _buildGuideOverlay(),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Header
  // ═══════════════════════════════════════════════════════════════

  Widget _buildHeader(ProfileState profileState) {
    final activeProfile = profileState.profiles.cast().firstWhere(
      (p) => p.id == profileState.activeProfileId,
      orElse: () => null,
    );

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        MediaQuery.of(context).padding.top + AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.xl,
      ),
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppRadius.xl),
          bottomRight: Radius.circular(AppRadius.xl),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x30000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: title + profile badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Generate an activity',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: -0.2,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Pick a category and topic.',
                      style: TextStyle(fontSize: 14, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              // Profile badge
              if (activeProfile != null)
                GestureDetector(
                  onTap: () => _showProfilePicker(profileState),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(50),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(color: Colors.white.withAlpha(80)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: activeProfile.avatarColorValue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            activeProfile.name[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          activeProfile.name,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          LucideIcons.chevronDown,
                          size: 14,
                          color: Colors.white70,
                        ),
                      ],
                    ),
                  ),
                )
              else
                // No profile selected yet — tap to add/select
                GestureDetector(
                  onTap: () => _showProfilePicker(profileState),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withAlpha(60),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(
                        color: Colors.white.withAlpha(100),
                        width: 1.5,
                      ),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          LucideIcons.userPlus,
                          size: 16,
                          color: Colors.white,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Pick Kid Profile',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showProfilePicker(ProfileState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Switch Profile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (state.profiles.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Text(
                  'No profiles found. Create one in Settings!',
                  textAlign: TextAlign.center,
                ),
              )
            else
              ...state.profiles.map((p) {
                final isSelected = p.id == state.activeProfileId;
                return ListTile(
                  onTap: () {
                    ref.read(profileProvider.notifier).setActiveProfile(p.id);
                    Navigator.pop(ctx);
                  },
                  leading: CircleAvatar(
                    backgroundColor: p.avatarColorValue,
                    child: Text(
                      p.name[0].toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    p.name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('${p.age}yo · ${p.gradeLevel}'),
                  trailing: isSelected
                      ? const Icon(
                          LucideIcons.checkCircle2,
                          color: AppColors.success,
                        )
                      : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                );
              }),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Warning Card
  // ═══════════════════════════════════════════════════════════════

  Widget _buildWarningCard() {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.warning),
      ),
      child: const Row(
        children: [
          Icon(LucideIcons.alertTriangle, size: 16, color: AppColors.warning),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Create a kid profile first to start generating.',
              style: TextStyle(fontSize: 14, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Step Card wrapper
  // ═══════════════════════════════════════════════════════════════

  Widget _buildStepCard({
    required String stepNumber,
    required Color stepBadgeColor,
    required String title,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step header
          Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: stepBadgeColor,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  stepNumber,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.black
                        : Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                title,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Category Selector (Step 1)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildCategorySelector() {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: Categories.all.map((cat) {
        final isSelected = _selectedCategory == cat.id;
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            _selectCategory(isSelected ? null : cat.id);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? cat.accent
                  : (Theme.of(context).brightness == Brightness.dark
                        ? cat.accent.withAlpha(40)
                        : cat.color),
              borderRadius: BorderRadius.circular(AppRadius.full),
              border: Border.all(
                color: isSelected ? cat.accent : cat.accent.withAlpha(60),
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: cat.accent.withAlpha(60),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  cat.icon,
                  size: 14,
                  color: isSelected ? Colors.white : cat.accent,
                ),
                const SizedBox(width: 6),
                Text(
                  cat.label.split(' ').first,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? Colors.white
                        : Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Topic Section (Step 2)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildTopicSection() {
    if (_selectedCategory == null) {
      return Text(
        'Choose a category to unlock topic suggestions.',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Theme.of(context).textTheme.bodySmall?.color,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Choose a suggestion below.',
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        // Suggestion chips
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: _suggestions.map((t) {
            final isSelected = _topic.trim().toLowerCase() == t.toLowerCase();
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() {
                  _topic = t;
                  if (_guideStep == 1) {
                    _guideStep = 2;
                  }
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? _accentColor : _accentColor.withAlpha(15),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(
                    color: isSelected
                        ? _accentColor
                        : _accentColor.withAlpha(40),
                  ),
                ),
                child: Text(
                  t,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? Colors.white
                        : Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.lg),
        // Topic Input Field (Custom)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: _topic.isNotEmpty
                  ? _accentColor.withAlpha(120)
                  : Theme.of(context).dividerColor,
              width: _topic.isNotEmpty ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              const Icon(
                LucideIcons.penTool,
                size: 16,
                color: AppColors.textTertiary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: TextField(
                  onChanged: (val) {
                    setState(() {
                      _topic = val;
                      if (_guideStep == 1 && val.length > 3) {
                        _guideStep = 2;
                      }
                    });
                  },
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                  cursorColor: _accentColor,
                  maxLength: 60,
                  decoration: const InputDecoration(
                    hintText: 'Or type custom: "Space dinosaurs"',
                    hintStyle: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.normal,
                      color: AppColors.textTertiary,
                    ),
                    border: InputBorder.none,
                    counterText: '',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              if (_topic.isNotEmpty)
                GestureDetector(
                  onTap: () => setState(() => _topic = ''),
                  child: const Icon(
                    LucideIcons.xCircle,
                    size: 16,
                    color: AppColors.textTertiary,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Options Section (Step 3)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildOptionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Difficulty
        Text(
          'Difficulty',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          children: ['easy', 'medium', 'hard'].map((d) {
            final isSelected = _difficulty == d;
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _difficulty = d);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? _accentColor : _accentColor.withAlpha(15),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(
                    color: isSelected
                        ? _accentColor
                        : _accentColor.withAlpha(40),
                  ),
                ),
                child: Text(
                  d[0].toUpperCase() + d.substring(1),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? Colors.white
                        : Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Output style
        Text(
          'Output',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          children: [
            _buildStyleChip('colorful', 'Colorful', LucideIcons.palette),
            _buildStyleChip('bw', 'Print (B&W)', LucideIcons.printer),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          _style == 'colorful'
              ? 'Best for screens and tablets.'
              : 'High-contrast black & white optimized for printing.',
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
        ),
      ],
    );
  }

  Widget _buildStyleChip(String value, String label, IconData icon) {
    final isSelected = _style == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _style = value);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? _accentColor : _accentColor.withAlpha(15),
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
            color: isSelected ? _accentColor : _accentColor.withAlpha(40),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : _accentColor,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isSelected
                    ? Colors.white
                    : Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Generate Button
  // ═══════════════════════════════════════════════════════════════

  Widget _buildGenerateButton(bool isGenerating) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: (_isReady && !isGenerating) ? _handleGenerate : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.primary.withAlpha(80),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.full),
          ),
          elevation: _isReady ? 4 : 0,
        ),
        child: isGenerating
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  SizedBox(width: 10),
                  Text(
                    'Generating...',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.wand2, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Generate Activity',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Error Card
  // ═══════════════════════════════════════════════════════════════

  Widget _buildErrorCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.md,
        AppSpacing.xl,
        0,
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.accent),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.xCircle, size: 16, color: AppColors.accent),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.accent,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Generating Overlay
  // ═══════════════════════════════════════════════════════════════

  Widget _buildGeneratingOverlay() {
    return _PolishedGeneratingOverlay();
  }

  // ═══════════════════════════════════════════════════════════════
  // First Activity Guide Overlay
  // ═══════════════════════════════════════════════════════════════

  Widget _buildGuideOverlay() {
    String message = '';
    IconData icon = LucideIcons.info;
    Alignment alignment = Alignment.bottomCenter;
    double topPadding = 0;

    switch (_guideStep) {
      case 0:
        message = 'First, choose what type of activity you want to create.';
        icon = LucideIcons.mousePointer;
        alignment = Alignment.topCenter;
        topPadding = 220;
        break;
      case 1:
        message = 'Great! Now pick a topic or type your own special preference.';
        icon = LucideIcons.sparkles;
        alignment = Alignment.topCenter;
        topPadding = 420;
        break;
      case 2:
        message = 'Perfect! Now click "Generate Activity" to create it.';
        icon = LucideIcons.zap;
        alignment = Alignment.bottomCenter;
        topPadding = 0;
        break;
    }

    return Align(
      alignment: alignment,
      child: Padding(
        padding: EdgeInsets.only(
          top: topPadding == 0 ? 0 : topPadding,
          bottom: topPadding == 0 ? 120 : 0,
          left: 20,
          right: 20,
        ),
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: const Duration(milliseconds: 400),
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - value)),
                child: child,
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(245),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(80),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
              border: Border.all(
                color: Colors.white.withAlpha(50),
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(40),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        message,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => setState(() => _guideStep = null),
                      child: Text(
                        'Skip Guide',
                        style: TextStyle(
                          color: Colors.white.withAlpha(180),
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PolishedGeneratingOverlay extends StatefulWidget {
  @override
  State<_PolishedGeneratingOverlay> createState() =>
      _PolishedGeneratingOverlayState();
}

class _PolishedGeneratingOverlayState extends State<_PolishedGeneratingOverlay>
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
      color: Colors.black.withAlpha(80),
      child: Center(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              width: 320,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xxl,
                vertical: AppSpacing.xxxl,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.black.withAlpha(100)
                    : Colors.white.withAlpha(150),
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(
                  color: Colors.white.withAlpha(
                    Theme.of(context).brightness == Brightness.dark ? 40 : 80,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(30),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 52,
                    height: 52,
                    child: CircularProgressIndicator(
                      strokeWidth: 4,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                      backgroundColor: Colors.transparent,
                    ),
                  ),
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
        ),
      ),
    );
  }
}
