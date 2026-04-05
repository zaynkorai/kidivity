import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/models/kid_profile.dart';
import 'widgets/synchronized_selection_wrapper.dart';

class OnboardingProfileScreen extends ConsumerStatefulWidget {
  const OnboardingProfileScreen({super.key});

  @override
  ConsumerState<OnboardingProfileScreen> createState() =>
      _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState
    extends ConsumerState<OnboardingProfileScreen> {
  // 0: Name, 1: Age/Grade/Color (merged)
  int _internalStep = 0;

  final _nameController = TextEditingController();
  String _age = '';
  String _gradeLevel = '';
  Color _selectedColor = const Color(0xFF4361EE);

  bool _isSaving = false;
  String? _error;

  final List<Color> _colors = [
    const Color(0xFF4361EE),
    const Color(0xFF4CC9F0),
    const Color(0xFFF72585),
    const Color(0xFF7209B7),
    const Color(0xFF3A0CA3),
    const Color(0xFF06D6A0),
    const Color(0xFFFFD166),
    const Color(0xFFEF476F),
  ];

  final List<String> _gradeLevels = [
    'Pre-K',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _handleNext() {
    setState(() => _error = null);

    if (_internalStep == 0) {
      if (_nameController.text.trim().isEmpty) {
        setState(() => _error = 'Please enter your child\'s name');
        return;
      }
      HapticFeedback.lightImpact();
      setState(() => _internalStep = 1);
    } else {
      if (_age.isEmpty && _gradeLevel.isEmpty) {
        setState(() => _error = 'Please select an age and grade level');
        return;
      }
      if (_age.isEmpty) {
        setState(() => _error = 'Please select an age');
        return;
      }
      if (_gradeLevel.isEmpty) {
        setState(() => _error = 'Please select a grade level');
        return;
      }
      HapticFeedback.mediumImpact();
      _saveProfile();
    }
  }

  void _handleBack() {
    HapticFeedback.lightImpact();
    if (_internalStep > 0) {
      setState(() => _internalStep--);
    } else {
      context.go('/onboarding/questionnaire');
    }
  }

  Future<void> _saveProfile() async {
    setState(() {
      _isSaving = true;
      _error = null;
    });

    final result = await ref
        .read(profileProvider.notifier)
        .addProfile(
          CreateKidProfileInput(
            name: _nameController.text.trim(),
            age: int.parse(_age),
            gradeLevel: _gradeLevel,
            avatarColor:
                '#${_selectedColor.toARGB32().toRadixString(16).substring(2).toUpperCase()}',
          ),
        );

    if (!mounted) return;

    if (result.error != null) {
      setState(() {
        _isSaving = false;
        _error = result.error;
      });
    } else {
      context.go(
        '/onboarding/celebration?name=${Uri.encodeComponent(_nameController.text.trim())}',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xxl,
            vertical: AppSpacing.lg,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: List.generate(2, (index) {
                  final isActive = index <= _internalStep;
                  return Expanded(
                    child: Container(
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: isActive
                            ? Colors.white
                            : Colors.white.withAlpha(50),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                    ),
                  );
                }),
              ),

              const SizedBox(height: AppSpacing.xl),

              Expanded(
                child: SingleChildScrollView(
                  clipBehavior: Clip.none,
                  child: _internalStep == 0
                      ? _buildNameStep()
                      : _buildDetailsStep(),
                ),
              ),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withAlpha(40),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(
                        color: AppColors.danger.withAlpha(100),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          LucideIcons.alertCircle,
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              Row(
                children: [
                  TextButton(
                    onPressed: _handleBack,
                    child: Text(
                      'Back',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white.withAlpha(180),
                      ),
                    ),
                  ),
                  const Spacer(),
                  ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 180),
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _handleNext,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        disabledBackgroundColor: Colors.white.withAlpha(60),
                        disabledForegroundColor: Colors.white.withAlpha(120),
                        padding: const EdgeInsets.symmetric(
                          vertical: 16,
                          horizontal: 24,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        elevation: 0,
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              _internalStep == 1
                                  ? 'Create Profile'
                                  : 'Continue',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Who is this for?',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            height: 1.2,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Let\'s personalize their learning journey.',
          style: TextStyle(
            fontSize: 17,
            color: Colors.white.withAlpha(200),
            height: 1.4,
          ),
        ),
        const SizedBox(height: AppSpacing.xxl),

        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: 8,
          ),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(40),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(
              color: (_error != null && _nameController.text.trim().isEmpty)
                  ? AppColors.danger
                  : Colors.white.withAlpha(100),
              width: 2,
            ),
          ),
          child: TextField(
            controller: _nameController,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              hintText: 'Child\'s Name',
              hintStyle: TextStyle(color: Colors.white.withAlpha(100)),
              border: InputBorder.none,
            ),
            onChanged: (_) => setState(() => _error = null),
            onSubmitted: (_) => _handleNext(),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        Row(
          children: [
            Icon(
              LucideIcons.shield,
              size: 16,
              color: Colors.white.withAlpha(140),
            ),
            const SizedBox(width: 8),
            Text(
              'Private & secure.',
              style: TextStyle(
                color: Colors.white.withAlpha(140),
                fontSize: 13,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDetailsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tell us about ${_nameController.text.trim()}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            height: 1.2,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'We use this to generate the perfect activities.',
          style: TextStyle(fontSize: 17, color: Colors.white.withAlpha(200)),
        ),
        const SizedBox(height: AppSpacing.xxl),

        Row(
          children: [
            const Text(
              'Age',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '(Required)',
              style: TextStyle(
                color: (_error != null && _age.isEmpty)
                    ? AppColors.danger
                    : Colors.white.withAlpha(160),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Transform.translate(
          offset: const Offset(-AppSpacing.xxl, 0),
          child: SizedBox(
            width: MediaQuery.of(context).size.width,
            child: Stack(
              alignment: Alignment.centerRight,
              children: [
                SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    padding:
                        const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
                    itemCount: 10,
                    itemBuilder: (context, i) {
                      final ageVal = (i + 4).toString();
                      final isSelected = _age == ageVal;
                      return Center(
                        key: ValueKey('age_picker_$ageVal'),
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              _age = ageVal;
                              _error = null;
                            });
                          },
                          child: SynchronizedSelectionWrapper(
                            isSelected: isSelected,
                            borderRadius: 56 / 2,
                            color: Colors.white,
                            builder: (context, isResolved) {
                              return AnimatedScale(
                                scale: isSelected ? 1.1 : 1.0,
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeOutBack,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeOut,
                                  width: 56,
                                  margin: const EdgeInsets.only(right: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.white.withAlpha(30),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: (isSelected && isResolved)
                                          ? Colors.white
                                          : Colors.white.withAlpha(0),
                                      width: 2,
                                    ),
                                    boxShadow: (isSelected && isResolved)
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withAlpha(20),
                                              blurRadius: 8,
                                              offset: const Offset(0, 4),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    ageVal,
                                    style: TextStyle(
                                      color: isSelected && isResolved
                                          ? AppColors.primary
                                          : Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Icon(
                    LucideIcons.chevronRight,
                    color: Colors.white.withAlpha(120),
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        Row(
          children: [
            const Text(
              'Grade',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '(Required)',
              style: TextStyle(
                color: (_error != null && _gradeLevel.isEmpty)
                    ? AppColors.danger
                    : Colors.white.withAlpha(160),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _gradeLevels.map((g) {
            final isSelected = _gradeLevel == g;
            return GestureDetector(
              key: ValueKey('grade_tile_$g'),
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() {
                  _gradeLevel = g;
                  _error = null;
                });
              },
              child: SynchronizedSelectionWrapper(
                isSelected: isSelected,
                borderRadius: AppRadius.full,
                color: Colors.white,
                builder: (context, isResolved) {
                  return AnimatedScale(
                    scale: isSelected ? 1.05 : 1.0,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.white
                            : Colors.white.withAlpha(30),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                        border: Border.all(
                          color: (isSelected && isResolved)
                              ? Colors.white
                              : Colors.white.withAlpha(0),
                          width: 2,
                        ),
                        boxShadow: (isSelected && isResolved)
                            ? [
                                BoxShadow(
                                  color: Colors.black.withAlpha(15),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : [],
                      ),
                      child: Text(
                        g,
                        style: TextStyle(
                          color: isSelected && isResolved
                              ? AppColors.primary
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: AppSpacing.lg),

        const Text(
          'Avatar Color',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: 14,
          runSpacing: 14,
          children: _colors.map((c) {
            final isSelected = _selectedColor == c;
            final String colorHex = '#${c.toARGB32().toRadixString(16)}';
            return GestureDetector(
              key: ValueKey('color_tile_$colorHex'),
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedColor = c);
              },
              child: SynchronizedSelectionWrapper(
                isSelected: isSelected,
                borderRadius: 52 / 2,
                color: Colors.white,
                builder: (context, isResolved) {
                  return AnimatedScale(
                    scale: isSelected ? 1.15 : 1.0,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: c,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (isSelected && isResolved)
                              ? Colors.white
                              : Colors.white.withAlpha(60),
                          width: (isSelected && isResolved) ? 4 : 2,
                        ),
                        boxShadow: (isSelected && isResolved)
                            ? [
                                BoxShadow(
                                  color: c.withAlpha(120),
                                  blurRadius: 15,
                                  spreadRadius: 4,
                                ),
                              ]
                            : [],
                      ),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: (isSelected && isResolved)
                            ? const Icon(
                                LucideIcons.check,
                                key: ValueKey('check'),
                                color: Colors.white,
                                size: 22,
                              )
                            : const SizedBox.shrink(key: ValueKey('none')),
                      ),
                    ),
                  );
                },
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }
}
