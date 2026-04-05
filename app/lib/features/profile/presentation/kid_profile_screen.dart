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
      body: Stack(
        children: [
          // Decorative background circles
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
          Positioned(
            bottom: -50,
            left: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                color: AppColors.secondary.withAlpha(isDark ? 12 : 8),
                shape: BoxShape.circle,
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Custom App Bar
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
                          padding: const EdgeInsets.all(AppSpacing.md),
                        ),
                      ),
                      Text(
                        isEdit ? 'Edit Profile' : 'New Profile',
                        style: theme.textTheme.displayLarge?.copyWith(fontSize: 20),
                      ),
                      const SizedBox(width: 48), // Spacer for centering
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Profile Preview
                          Center(
                            child: Hero(
                              tag: widget.profile?.id ?? 'profile_new',
                              child: Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  color: Color(int.parse(_avatarColor.replaceFirst('#', 'FF'), radix: 16)),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(int.parse(_avatarColor.replaceFirst('#', 'FF'), radix: 16)).withAlpha(80),
                                      blurRadius: 20,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  _name.isEmpty ? '?' : _name[0].toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 40,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xxxl),

                          // Name Input
                          _buildSectionTitle('What is their name?', context),
                          const SizedBox(height: AppSpacing.md),
                          TextFormField(
                            initialValue: _name,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            decoration: InputDecoration(
                              hintText: 'e.g. Liam',
                              prefixIcon: const Icon(LucideIcons.user, size: 22),
                              filled: true,
                              fillColor: isDark ? Colors.white.withAlpha(5) : Colors.white,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.all(AppSpacing.xl),
                            ),
                            onChanged: (v) => setState(() => _name = v),
                            validator: (v) => (v == null || v.isEmpty) ? 'Please enter a name' : null,
                            onSaved: (v) => _name = v ?? '',
                          ),
                          const SizedBox(height: AppSpacing.xxxl),

                          // Age Selector
                          _buildSectionTitle('How old are they?', context),
                          const SizedBox(height: AppSpacing.md),
                          SizedBox(
                            height: 64,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: 15,
                              itemBuilder: (context, i) {
                                final age = i + 2;
                                final isSelected = _age == age;
                                return Padding(
                                  padding: const EdgeInsets.only(right: AppSpacing.md),
                                  child: GestureDetector(
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() => _age = age);
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      width: 64,
                                      height: 64,
                                      decoration: BoxDecoration(
                                        color: isSelected 
                                          ? AppColors.primary 
                                          : (isDark ? Colors.white.withAlpha(5) : Colors.white),
                                        borderRadius: BorderRadius.circular(AppRadius.lg),
                                        boxShadow: isSelected ? AppShadows.medium : null,
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        '$age',
                                        style: TextStyle(
                                          fontSize: 20,
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
                          const SizedBox(height: AppSpacing.xxxl),

                          // Grade Selector
                          _buildSectionTitle('What grade are they in?', context),
                          const SizedBox(height: AppSpacing.md),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _grades.map((g) {
                              final isSelected = _gradeLevel == g;
                              return GestureDetector(
                                onTap: () {
                                  HapticFeedback.selectionClick();
                                  setState(() => _gradeLevel = g);
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
                                  decoration: BoxDecoration(
                                    color: isSelected 
                                      ? AppColors.primary 
                                      : (isDark ? Colors.white.withAlpha(5) : Colors.white),
                                    borderRadius: BorderRadius.circular(AppRadius.full),
                                    boxShadow: isSelected ? AppShadows.small : null,
                                  ),
                                  child: Text(
                                    g,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : theme.textTheme.bodyLarge?.color,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: AppSpacing.xxxl),

                          // Theme Color Selector
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
                                  scale: isSelected ? 1.2 : 1.0,
                                  child: Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: color,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isSelected ? Colors.white : Colors.transparent,
                                        width: 3,
                                      ),
                                      boxShadow: isSelected ? [
                                        BoxShadow(
                                          color: color.withAlpha(120),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        )
                                      ] : null,
                                    ),
                                    child: isSelected
                                        ? const Icon(LucideIcons.check, color: Colors.white, size: 20)
                                        : null,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 60),

                          const SizedBox(height: 100), // Space for bottom button
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Floating Save Button
          Positioned(
            bottom: 30,
            left: AppSpacing.xl,
            right: AppSpacing.xl,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                elevation: 10,
                shadowColor: AppColors.primary.withAlpha(100),
              ),
              child: _isSaving
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(isEdit ? LucideIcons.save : LucideIcons.plus, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          isEdit ? 'Update Profile' : 'Create Profile',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
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
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(140),
        letterSpacing: 1.5,
      ),
    );
  }
}
