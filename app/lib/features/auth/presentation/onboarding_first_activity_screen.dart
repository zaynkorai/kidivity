import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/activity_provider.dart';
import '../../../core/providers/onboarding_provider.dart';

class FirstActivityScreen extends ConsumerStatefulWidget {
  final String profileId;
  final String profileName;

  const FirstActivityScreen({
    super.key,
    required this.profileId,
    required this.profileName,
  });

  @override
  ConsumerState<FirstActivityScreen> createState() => _FirstActivityScreenState();
}

class _FirstActivityScreenState extends ConsumerState<FirstActivityScreen> {
  String? _error;
  bool _showSkipFallback = false;
  Timer? _fallbackTimer;

  @override
  void initState() {
    super.initState();
    _generateFirstActivity();
    
    // Show a skip option if it takes more than 10 seconds
    _fallbackTimer = Timer(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() => _showSkipFallback = true);
      }
    });
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    super.dispose();
  }

  Future<void> _generateFirstActivity() async {
    final result = await ref.read(activityProvider.notifier).generateActivity(
          kidProfileId: widget.profileId,
          category: 'math',
          topic: 'Counting',
          difficulty: 'Easy',
          style: 'Colorful',
        );

    if (!mounted) return;
    _fallbackTimer?.cancel();

    if (result.error != null) {
      setState(() => _error = result.error);
    } else {
      // Successfully generated, finalize onboarding and go to home
      ref.read(onboardingProvider.notifier).completeOnboarding();
      
      // Artificial delay for the "magic" feel
      await Future.delayed(const Duration(milliseconds: 1500));
      if (mounted) {
        context.go('/');
      }
    }
  }

  void _handleSkip() {
    HapticFeedback.lightImpact();
    ref.read(onboardingProvider.notifier).completeOnboarding();
    context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.wand2, size: 64, color: AppColors.primary),
              const SizedBox(height: AppSpacing.xxl),
              Text(
                'Building Engine...',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 28),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Customizing math quests for ${widget.profileName}',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(fontSize: 18),
              ),
              if (_error != null || _showSkipFallback)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xxl),
                  child: Column(
                    children: [
                      if (_error != null)
                        Text(
                          'Oops! We had a small hiccup: $_error',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.danger),
                        )
                      else
                        Text(
                          'Taking a little longer than expected...',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: theme.textTheme.bodySmall?.color,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      const SizedBox(height: AppSpacing.xl),
                      TextButton(
                        onPressed: _handleSkip,
                        child: Text(
                          _error != null ? 'Skip to Dashboard' : 'Continue to Dashboard Anyway',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                const Padding(
                  padding: EdgeInsets.only(top: AppSpacing.xxxl),
                  child: CircularProgressIndicator(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
