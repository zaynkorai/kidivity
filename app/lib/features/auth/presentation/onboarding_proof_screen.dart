import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/onboarding_provider.dart';

class OnboardingProofScreen extends ConsumerStatefulWidget {
  const OnboardingProofScreen({super.key});

  @override
  ConsumerState<OnboardingProofScreen> createState() =>
      _OnboardingProofScreenState();
}

class _OnboardingProofScreenState extends ConsumerState<OnboardingProofScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xxl,
            vertical: AppSpacing.xl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xxl),

              // Big stat
              _buildAnimatedStat(
                delay: 0.0,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kids spend',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withAlpha(180),
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '4+ hours daily',
                      style: theme.textTheme.displayLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 42,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'on screens.',
                      style: theme.textTheme.displayLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 42,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // Emotional hook
              _buildAnimatedStat(
                delay: 0.2,
                child: Text(
                  'What if that time built real skills instead?',
                  style: TextStyle(
                    color: Colors.white.withAlpha(220),
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xxxl),

              // Benefit cards (Lucide icons, no emojis)
              _buildBenefitCard(
                delay: 0.35,
                icon: LucideIcons.brain,
                title: 'Critical thinking',
                subtitle: 'Not passive consumption',
              ),
              const SizedBox(height: AppSpacing.md),
              _buildBenefitCard(
                delay: 0.5,
                icon: LucideIcons.pencil,
                title: 'Fine motor skills',
                subtitle: 'Through hands-on activities',
              ),
              const SizedBox(height: AppSpacing.md),
              _buildBenefitCard(
                delay: 0.65,
                icon: LucideIcons.target,
                title: 'Grade aligned content',
                subtitle: 'Zero ads, zero distractions',
              ),

              const Spacer(),

              // Footer
              Row(
                children: [
                  TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      ref.read(onboardingProvider.notifier).setStep(1);
                      context.go('/onboarding/welcome');
                    },
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
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        context.go('/onboarding/questionnaire');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            AppRadius.full,
                          ),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Continue',
                        style: TextStyle(
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

  Widget _buildAnimatedStat({required double delay, required Widget child}) {
    final curved = CurvedAnimation(
      parent: _controller,
      curve: Interval(delay, delay + 0.3, curve: Curves.easeOutCubic),
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.2),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  }

  Widget _buildBenefitCard({
    required double delay,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    final curved = CurvedAnimation(
      parent: _controller,
      curve: Interval(delay, delay + 0.3, curve: Curves.easeOutCubic),
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.15, 0),
          end: Offset.zero,
        ).animate(curved),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(30),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(color: Colors.white.withAlpha(20)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withAlpha(180),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
