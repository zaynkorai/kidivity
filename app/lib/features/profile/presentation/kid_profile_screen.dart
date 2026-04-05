import 'package:flutter/material.dart';
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

class ProfileCreationScreen extends ConsumerStatefulWidget {
  const ProfileCreationScreen({super.key});

  @override
  ConsumerState<ProfileCreationScreen> createState() => _ProfileCreationScreenState();
}

class _ProfileCreationScreenState extends ConsumerState<ProfileCreationScreen> {
  final _formKey = GlobalKey<FormState>();
  String _name = '';
  int _age = 5;
  String _gradeLevel = 'Kindergarten';
  String _avatarColor = '#6C63FF';

  final List<String> _colors = [
    '#6C63FF', // Primary Purple
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#FF9F43', // Orange
    '#1DD1A1', // Green
  ];

  final List<String> _grades = [
    'Preschool',
    'Pre-K',
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    'Other',
  ];

  bool _isSaving = false;

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
        description: 'Please solve this math problem to add a profile.',
      );
    } else {
      gatePassed = await ParentGateDialog.show(
        context,
        userEmail: userEmail!,
        description: 'Enter your password to add a profile.',
      );
    }

    if (!gatePassed) return;

    setState(() => _isSaving = true);

    final result = await ref.read(profileProvider.notifier).addProfile(
          CreateKidProfileInput(
            name: _name,
            age: _age,
            gradeLevel: _gradeLevel,
            avatarColor: _avatarColor,
          ),
        );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.error!), backgroundColor: AppColors.danger),
      );
    } else {
      final onboardingState = ref.read(onboardingProvider);
      if (onboardingState.status == OnboardingStatus.inProgress) {
        // Complete onboarding and go straight to home
        ref.read(onboardingProvider.notifier).completeOnboarding();
        context.go('/');
      } else {
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Add your Kid Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Header
              Text(
                'Let\'s customize the activities for your little one!',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xxxl),

              // Name Input
              Text(
                'WHAT IS THEIR NAME?',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(150),
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextFormField(
                style: const TextStyle(fontSize: 18),
                decoration: InputDecoration(
                  hintText: 'e.g. Liam',
                  prefixIcon: const Icon(LucideIcons.user, size: 20),
                  contentPadding: const EdgeInsets.all(AppSpacing.lg),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Please enter a name' : null,
                onSaved: (v) => _name = v ?? '',
              ),
              const SizedBox(height: AppSpacing.xxl),

              // Age & Grade
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AGE',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(150),
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        DropdownButtonFormField<int>(
                          value: _age,
                          items: List.generate(
                            18,
                            (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1} years')),
                          ),
                          onChanged: (v) => setState(() => _age = v ?? 5),
                          decoration: const InputDecoration(
                            contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GRADE',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(150),
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        DropdownButtonFormField<String>(
                          value: _gradeLevel,
                          items: _grades.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                          onChanged: (v) => setState(() => _gradeLevel = v ?? 'Kindergarten'),
                          decoration: const InputDecoration(
                            contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xxl),

              // Avatar Color
              Text(
                'PICK A THEME COLOR',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(150),
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: 12,
                children: _colors.map((c) {
                  final color = Color(int.parse(c.replaceFirst('#', 'FF'), radix: 16));
                  final isSelected = _avatarColor == c;

                  return GestureDetector(
                    onTap: () => setState(() => _avatarColor = c),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: isSelected
                            ? Border.all(color: Theme.of(context).textTheme.bodyLarge!.color!, width: 3)
                            : null,
                        boxShadow: isSelected ? AppShadows.medium : null,
                      ),
                      child: isSelected
                          ? const Icon(LucideIcons.check, color: Colors.white, size: 20)
                          : null,
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: AppSpacing.xxxl * 2),

              // Save Button
              ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                  elevation: 4,
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Create Profile',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
