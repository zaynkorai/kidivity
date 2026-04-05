import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/onboarding_provider.dart';

class OnboardingCelebrationScreen extends ConsumerStatefulWidget {
  final String childName;

  const OnboardingCelebrationScreen({super.key, required this.childName});

  @override
  ConsumerState<OnboardingCelebrationScreen> createState() =>
      _OnboardingCelebrationScreenState();
}

class _OnboardingCelebrationScreenState
    extends ConsumerState<OnboardingCelebrationScreen>
    with TickerProviderStateMixin {
  late AnimationController _confettiController;
  late AnimationController _contentController;
  late Animation<double> _contentFade;
  late Animation<double> _contentScale;

  final List<_ConfettiParticle> _particles = [];
  final _random = Random();

  @override
  void initState() {
    super.initState();

    // Generate confetti particles
    for (int i = 0; i < 40; i++) {
      _particles.add(
        _ConfettiParticle(
          x: _random.nextDouble(),
          delay: _random.nextDouble() * 0.6,
          speed: 0.3 + _random.nextDouble() * 0.7,
          size: 6 + _random.nextDouble() * 8,
          color: [
            const Color(0xFFF72585),
            const Color(0xFF7209B7),
            const Color(0xFF4361EE),
            const Color(0xFF4CC9F0),
            const Color(0xFF06D6A0),
            const Color(0xFFFFD166),
            Colors.white,
          ][_random.nextInt(7)],
        ),
      );
    }

    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..forward();

    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _contentFade = CurvedAnimation(
      parent: _contentController,
      curve: Curves.easeOut,
    );
    _contentScale = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _contentController, curve: Curves.easeOutBack),
    );

    // Stagger content after confetti starts
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _contentController.forward();
    });
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _handleComplete() {
    HapticFeedback.mediumImpact();
    ref.read(onboardingProvider.notifier).completeOnboarding();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Confetti layer
          AnimatedBuilder(
            animation: _confettiController,
            builder: (context, _) {
              return CustomPaint(
                size: Size.infinite,
                painter: _ConfettiPainter(
                  particles: _particles,
                  progress: _confettiController.value,
                ),
              );
            },
          ),

          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xxl,
                vertical: AppSpacing.xl,
              ),
              child: FadeTransition(
                opacity: _contentFade,
                child: ScaleTransition(
                  scale: _contentScale,
                  child: Column(
                    children: [
                      const Spacer(flex: 2),

                      const SizedBox(height: AppSpacing.xxxl),

                      // Heading
                      Text(
                        'You\'re all set,\n${widget.childName}!',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.displayLarge?.copyWith(
                          color: Colors.white,
                          fontSize: 36,
                          height: 1.15,
                        ),
                      ),

                      const SizedBox(height: AppSpacing.xxl),

                      // FOMO nudge
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppRadius.xl),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                const SizedBox(width: AppSpacing.md),
                                const Expanded(
                                  child: Text(
                                    'Your free activities are ready',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.md),
                            Text(
                              'Generate printable worksheets, puzzles, and games. Tailored to ${widget.childName}\'s grade.',
                              style: TextStyle(
                                color: Colors.white.withAlpha(200),
                                fontSize: 14,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: AppSpacing.lg),

                      // CTA
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _handleComplete,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                AppRadius.full,
                              ),
                            ),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Create My Activities',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(LucideIcons.arrowRight, size: 20),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Confetti Painting ────────────────────────────────────────────

class _ConfettiParticle {
  final double x;
  final double delay;
  final double speed;
  final double size;
  final Color color;

  _ConfettiParticle({
    required this.x,
    required this.delay,
    required this.speed,
    required this.size,
    required this.color,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final adjustedProgress = ((progress - p.delay) / p.speed).clamp(0.0, 1.0);
      if (adjustedProgress <= 0) continue;

      final x = p.x * size.width;
      final y = -20 + adjustedProgress * (size.height + 40);
      final opacity = adjustedProgress < 0.8
          ? 1.0
          : (1.0 - adjustedProgress) / 0.2;

      final paint = Paint()
        ..color = p.color.withAlpha((opacity * 200).toInt())
        ..style = PaintingStyle.fill;

      // Slight horizontal sway
      final sway = sin(adjustedProgress * 3.14 * 2) * 15;

      canvas.drawCircle(Offset(x + sway, y), p.size / 2, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
