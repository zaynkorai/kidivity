import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/models/kid_profile.dart';
import '../../../core/components/math_parent_gate_dialog.dart';
import '../../../core/components/parent_gate_dialog.dart';
import '../../../core/providers/onboarding_provider.dart';

class KidProfileScreen extends ConsumerStatefulWidget {
  final KidProfile? profile;
  const KidProfileScreen({super.key, this.profile});

  @override
  ConsumerState<KidProfileScreen> createState() => _KidProfileScreenState();
}

class _KidProfileScreenState extends ConsumerState<KidProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _name;
  late int _age;
  late String _gradeLevel;
  late String _avatarColor;

  bool _ageSelected = false;
  bool _gradeSelected = false;

  final List<Color> _colors = AppColors.avatarPalette;

  final List<String> _grades = [
    'Pre-K',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
  ];

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _name = widget.profile?.name ?? '';
    _age = widget.profile?.age ?? 5;
    _gradeLevel = widget.profile?.gradeLevel ?? 'Kindergarten';
    _avatarColor = widget.profile?.avatarColor ?? '#4361EE';
    
    if (widget.profile != null) {
      _ageSelected = true;
      _gradeSelected = true;
    }
  }

  // Exact Alignment mapping as requested:
  // Before first selection: Middle (Alignment 0.0)
  // After first selection (Age): 3/5 of screen (Alignment 0.2)
  // After second selection (Grade): 2/5 of screen (Alignment -0.2)
  Alignment get _contentAlignment {
    if (_gradeSelected) return const Alignment(0, -0.2); // 2/5 of screen vertically
    if (_ageSelected) return const Alignment(0, 0.2);    // 3/5 of screen vertically
    return Alignment.center;                             // Middle of screen vertically
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    final user = ref.read(authProvider).user;
    final String? userEmail = user?.email;
    final bool isAnonymous = userEmail == null || userEmail.isEmpty;
    final onboardingState = ref.read(onboardingProvider);
    final bool isInOnboarding = onboardingState.status == OnboardingStatus.inProgress;
    final bool gatePassed;

    if (isInOnboarding) {
      gatePassed = true;
    } else if (isAnonymous) {
      gatePassed = await MathParentGateDialog.show(
        context,
        description: 'Please solve this math problem to ${widget.profile == null ? 'add' : 'update'} a profile.',
      );
    } else {
      gatePassed = await ParentGateDialog.show(
        context,
        userEmail: userEmail!,
        description: 'Enter your password to ${widget.profile == null ? 'add' : 'update'} a profile.',
      );
    }

    if (!gatePassed) return;

    setState(() => _isSaving = true);

    String? error;
    if (widget.profile == null) {
      final result = await ref.read(profileProvider.notifier).addProfile(
            CreateKidProfileInput(
              name: _name,
              age: _age,
              gradeLevel: _gradeLevel,
              avatarColor: _avatarColor,
            ),
          );
      error = result.error;
    } else {
      error = await ref.read(profileProvider.notifier).updateProfile(
            widget.profile!.id,
            UpdateKidProfileInput(
              name: _name,
              age: _age,
              gradeLevel: _gradeLevel,
              avatarColor: _avatarColor,
            ),
          );
    }

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppColors.danger),
      );
    } else {
      final onboardingState = ref.read(onboardingProvider);
      if (onboardingState.status == OnboardingStatus.inProgress) {
        ref.read(onboardingProvider.notifier).completeOnboarding();
        context.go('/');
      } else {
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.profile != null;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      // Fixed: Let keyboard interact naturally but keep positioning control in Expanded
      body: Stack(
        children: [
          // Decorative background circles (Ambient aesthetics)
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(isDark ? 15 : 10),
                shape: BoxShape.circle,
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Minimal Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(LucideIcons.arrowLeft, size: 24),
                        style: IconButton.styleFrom(
                          backgroundColor: (isDark ? Colors.white10 : Colors.white),
                        ),
                      ),
                      Text(
                        isEdit ? 'Edit Profile' : 'New Profile',
                        style: theme.textTheme.displayLarge?.copyWith(fontSize: 18),
                      ),
                      const SizedBox(width: 44),
                    ],
                  ),
                ),

                // Main Content with Dynamic Centering
                Expanded(
                  child: AnimatedAlign(
                    duration: const Duration(milliseconds: 750),
                    curve: Curves.fastEaseInToSlowEaseOut,
                    alignment: _contentAlignment,
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          mainAxisSize: MainAxisSize.min, // Vital for centering
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Profile Avatar Hero
                            Center(
                              child: Hero(
                                tag: widget.profile?.id ?? 'profile_new',
                                child: Container(
                                  width: 84,
                                  height: 84,
                                  decoration: BoxDecoration(
                                    color: Color(int.parse(_avatarColor.replaceFirst('#', 'FF'), radix: 16)),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Color(int.parse(_avatarColor.replaceFirst('#', 'FF'), radix: 16)).withAlpha(60),
                                        blurRadius: 20,
                                        offset: const Offset(0, 8),
                                      ),
                                    ],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    _name.isEmpty ? '?' : _name[0].toUpperCase(),
                                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xxl),

                            // Name Field
                            _buildSectionTitle('What is their name?', context),
                            const SizedBox(height: AppSpacing.md),
                            TextFormField(
                              initialValue: _name,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                hintText: 'e.g. Liam',
                                prefixIcon: const Icon(LucideIcons.user, size: 20),
                                filled: true,
                                fillColor: isDark ? Colors.white.withAlpha(8) : Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(AppRadius.lg),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.all(AppSpacing.xl),
                              ),
                              onChanged: (v) => setState(() => _name = v),
                              validator: (v) => (v == null || v.isEmpty) ? 'Name is required' : null,
                              onSaved: (v) => _name = v ?? '',
                            ),
                            
                            // Age Selection (Appearance depends on Name)
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 400),
                              child: _name.isNotEmpty ? Column(
                                key: const ValueKey('age_section'),
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const SizedBox(height: AppSpacing.xxxl),
                                  _buildSectionTitle('How old are they?', context),
                                  const SizedBox(height: AppSpacing.md),
                                  SizedBox(
                                    height: 56,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      padding: EdgeInsets.zero,
                                      itemCount: 15,
                                      itemBuilder: (context, i) {
                                        final age = i + 2;
                                        final isSelected = _age == age && _ageSelected;
                                        return Padding(
                                          padding: const EdgeInsets.only(right: AppSpacing.md),
                                          child: GestureDetector(
                                            onTap: () {
                                              HapticFeedback.selectionClick();
                                              setState(() {
                                                _age = age;
                                                _ageSelected = true;
                                              });
                                            },
                                            child: AnimatedContainer(
                                              duration: const Duration(milliseconds: 200),
                                              width: 56,
                                              height: 56,
                                              decoration: BoxDecoration(
                                                color: isSelected ? AppColors.primary : (isDark ? Colors.white.withAlpha(8) : Colors.white),
                                                borderRadius: BorderRadius.circular(AppRadius.lg),
                                              ),
                                              alignment: Alignment.center,
                                              child: Text(
                                                '$age',
                                                style: TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                  color: isSelected ? Colors.white : theme.textTheme.bodyLarge?.color,
                                                ),
                                              ),
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ) : const SizedBox.shrink(),
                            ),

                            // Grade Selection (Appearance depends on Age)
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 400),
                              child: _ageSelected ? Column(
                                key: const ValueKey('grade_section'),
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const SizedBox(height: AppSpacing.xxxl),
                                  _buildSectionTitle('What grade are they in?', context),
                                  const SizedBox(height: AppSpacing.md),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _grades.map((g) {
                                      final isSelected = _gradeLevel == g && _gradeSelected;
                                      return GestureDetector(
                                        onTap: () {
                                          HapticFeedback.selectionClick();
                                          setState(() {
                                            _gradeLevel = g;
                                            _gradeSelected = true;
                                          });
                                        },
                                        child: AnimatedContainer(
                                          duration: const Duration(milliseconds: 200),
                                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 12),
                                          decoration: BoxDecoration(
                                            color: isSelected ? AppColors.primary : (isDark ? Colors.white.withAlpha(8) : Colors.white),
                                            borderRadius: BorderRadius.circular(AppRadius.full),
                                          ),
                                          child: Text(
                                            g,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: isSelected ? Colors.white : theme.textTheme.bodyLarge?.color,
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ) : const SizedBox.shrink(),
                            ),

                            // Theme Selection (Appearance depends on Grade)
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 400),
                              child: _gradeSelected ? Column(
                                key: const ValueKey('color_section'),
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const SizedBox(height: AppSpacing.xxxl),
                                  _buildSectionTitle('Pick a theme color', context),
                                  const SizedBox(height: AppSpacing.md),
                                  Wrap(
                                    spacing: 12,
                                    runSpacing: 12,
                                    children: _colors.map((color) {
                                      final String hex = '#${color.toARGB32().toRadixString(16).substring(2).toUpperCase()}';
                                      final isSelected = _avatarColor == hex;

                                      return GestureDetector(
                                        onTap: () {
                                          HapticFeedback.selectionClick();
                                          setState(() => _avatarColor = hex);
                                        },
                                        child: AnimatedScale(
                                          duration: const Duration(milliseconds: 200),
                                          scale: isSelected ? 1.15 : 1.0,
                                          child: Container(
                                            width: 42,
                                            height: 42,
                                            decoration: BoxDecoration(
                                              color: color,
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: isSelected ? Colors.white : Colors.transparent,
                                                width: 3,
                                              ),
                                              boxShadow: isSelected ? [
                                                BoxShadow(color: color.withAlpha(120), blurRadius: 10)
                                              ] : null,
                                            ),
                                            child: isSelected ? const Icon(LucideIcons.check, color: Colors.white, size: 18) : null,
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ) : const SizedBox.shrink(),
                            ),

                            const SizedBox(height: 140), // Pad for floating button
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Primary Floating button
          AnimatedPositioned(
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutBack,
            bottom: (_gradeSelected || isEdit) ? 30 : -100,
            left: AppSpacing.xl,
            right: AppSpacing.xl,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                elevation: 8,
              ),
              child: _isSaving
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(isEdit ? LucideIcons.save : LucideIcons.plus, size: 20),
                        const SizedBox(width: 8),
                        Text(isEdit ? 'Update Profile' : 'Create Profile', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(120),
        letterSpacing: 2.0,
      ),
    );
  }
}
