import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/models/kid_profile.dart';

class OnboardingProfileScreen extends ConsumerStatefulWidget {
  const OnboardingProfileScreen({super.key});

  @override
  ConsumerState<OnboardingProfileScreen> createState() => _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState extends ConsumerState<OnboardingProfileScreen> {
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
    'Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'
  ];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  bool _canProceed() {
    if (_internalStep == 0) {
      return _nameController.text.trim().isNotEmpty;
    }
    return _age.isNotEmpty && _gradeLevel.isNotEmpty;
  }

  void _handleNext() {
    if (_internalStep == 0) {
      if (_nameController.text.trim().isEmpty) return;
      HapticFeedback.lightImpact();
      setState(() => _internalStep = 1);
    } else {
      if (_age.isEmpty || _gradeLevel.isEmpty) return;
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

    final result = await ref.read(profileProvider.notifier).addProfile(
      CreateKidProfileInput(
        name: _nameController.text.trim(),
        age: int.parse(_age),
        gradeLevel: _gradeLevel,
        avatarColor: '#${_selectedColor.toARGB32().toRadixString(16).substring(2).toUpperCase()}',
      ),
    );

    if (!mounted) return;

    if (result.error != null) {
      setState(() {
        _isSaving = false;
        _error = result.error;
      });
    } else {
      // Navigate to celebration screen with child's name
      context.go('/onboarding/celebration?name=${Uri.encodeComponent(_nameController.text.trim())}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Shared Background Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primary,
                  Color(0xFF3B59DA),
                ],
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl, vertical: AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress Bar (2 steps now)
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: List.generate(2, (index) {
                      final isActive = index <= _internalStep;
                      return Expanded(
                        child: Container(
                          height: 6,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            color: isActive ? Colors.white : Colors.white.withAlpha(50),
                            borderRadius: BorderRadius.circular(AppRadius.full),
                          ),
                        ),
                      );
                    }),
                  ),

                  const SizedBox(height: AppSpacing.xxxl),

                  // Steps
                  Expanded(
                    child: SingleChildScrollView(
                      child: _internalStep == 0
                          ? _buildNameStep()
                          : _buildDetailsStep(),
                    ),
                  ),

                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(30),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.alertCircle, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Footer
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
                      SizedBox(
                        width: 160,
                        child: ElevatedButton(
                          onPressed: (_isSaving || !_canProceed()) ? null : _handleNext,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            disabledBackgroundColor: Colors.white.withAlpha(60),
                            disabledForegroundColor: Colors.white.withAlpha(120),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppRadius.full),
                            ),
                            elevation: 0,
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(
                                  _internalStep == 1 ? 'Create Profile' : 'Continue',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Step 0: Name ───────────────────────────────────────────────
  Widget _buildNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Who is this for?',
          style: TextStyle(
            fontSize: 32,
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
        const SizedBox(height: AppSpacing.xxxl),

        // Name Input
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(40),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(color: Colors.white.withAlpha(100), width: 2),
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
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => _handleNext(),
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Reassurance
        Row(
          children: [
            Icon(LucideIcons.shield, size: 16, color: Colors.white.withAlpha(140)),
            const SizedBox(width: 8),
            Text(
              'Private & secure. Never shared.',
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

  // ─── Step 1: Age/Grade + Color (merged) ─────────────────────────
  Widget _buildDetailsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tell us about ${_nameController.text.trim()}',
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            height: 1.2,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'We use this to generate the perfect activities.',
          style: TextStyle(
            fontSize: 17,
            color: Colors.white.withAlpha(200),
          ),
        ),
        const SizedBox(height: AppSpacing.xxxl),

        // Age Picker
        const Text('Age', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 56,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 10,
            itemBuilder: (context, i) {
              final ageVal = (i + 4).toString();
              final isSelected = _age == ageVal;
              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _age = ageVal);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutBack,
                  width: 56,
                  transform: isSelected 
                      ? Matrix4.diagonal3Values(1.1, 1.1, 1.0) 
                      : Matrix4.identity(),
                  margin: const EdgeInsets.only(right: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white : Colors.white.withAlpha(30),
                    shape: BoxShape.circle,
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.black.withAlpha(20),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : [],
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    ageVal,
                    style: TextStyle(
                      color: isSelected ? AppColors.primary : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Grade Picker
        const Text('Grade', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _gradeLevels.map((g) {
            final isSelected = _gradeLevel == g;
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _gradeLevel = g);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutBack,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                transform: isSelected 
                    ? Matrix4.diagonal3Values(1.05, 1.05, 1.0) 
                    : Matrix4.identity(),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : Colors.white.withAlpha(30),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: Colors.black.withAlpha(15),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          )
                        ]
                      : [],
                ),
                child: Text(
                  g,
                  style: TextStyle(
                    color: isSelected ? AppColors.primary : Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Color Picker
        const Text('Avatar Color', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: 14,
          runSpacing: 14,
          children: _colors.map((c) {
            final isSelected = _selectedColor == c;
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedColor = c);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutBack,
                width: 52,
                height: 52,
                transform: isSelected 
                    ? Matrix4.diagonal3Values(1.15, 1.15, 1.0) 
                    : Matrix4.identity(),
                decoration: BoxDecoration(
                  color: c,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: isSelected ? 4 : 2,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: c.withAlpha(120),
                            blurRadius: 15,
                            spreadRadius: 4,
                          )
                        ]
                      : [],
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: isSelected
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
          }).toList(),
        ),

        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }
}
