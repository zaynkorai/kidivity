import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/onboarding_provider.dart';

class QuestionnaireScreen extends ConsumerStatefulWidget {
  const QuestionnaireScreen({super.key});

  @override
  ConsumerState<QuestionnaireScreen> createState() =>
      _QuestionnaireScreenState();
}

class _QuestionnaireScreenState extends ConsumerState<QuestionnaireScreen> {
  late int _currentStep;
  late Map<String, String> _answers;
  bool _showTransition = false;

  @override
  void initState() {
    super.initState();
    final onboardingState = ref.read(onboardingProvider);
    _currentStep = onboardingState.questionnaireIndex;
    _answers = Map<String, String>.from(onboardingState.questionnaireAnswers);
  }

  void _syncProgress() {
    ref.read(onboardingProvider.notifier).updateQuestionnaireProgress(
          index: _currentStep,
          answers: _answers,
        );
  }

  final List<Map<String, dynamic>> _questions = [
    {
      'id': 'challenge',
      'title': 'What is your biggest challenge with screen time?',
      'options': [
        {'id': 'mindless', 'label': 'Mindless video consumption'},
        {'id': 'educational', 'label': 'Hard to find educational content'},
        {'id': 'tantrums', 'label': 'Tantrums when turning off devices'},
        {'id': 'boredom', 'label': 'Not challenged enough'},
      ],
    },
    {
      'id': 'goal',
      'title': 'What are you hoping Kidivity will help achieve?',
      'options': [
        {'id': 'habits', 'label': 'Build daily learning habits'},
        {'id': 'creativity', 'label': 'Foster creative thinking'},
        {'id': 'prep', 'label': 'Prepare for the next grade'},
        {'id': 'independent', 'label': 'Independent play'},
      ],
    },
    {
      'id': 'time',
      'title': 'How much productive screen time are you aiming for per day?',
      'options': [
        {'id': '15m', 'label': '15 minutes'},
        {'id': '30m', 'label': '30 minutes'},
        {'id': '1hr', 'label': '1 hour'},
        {'id': 'weekends', 'label': 'Just on weekends'},
      ],
    },
  ];

  void _handleNext() {
    HapticFeedback.lightImpact();
    if (_currentStep < _questions.length - 1) {
      setState(() {
        _currentStep++;
        _syncProgress();
      });
    } else {
      setState(() => _showTransition = true);
      // Advance to step 3 (Profile Creation) only when questionnaire is fully finished
      ref.read(onboardingProvider.notifier).setStep(3);

      // Delay for transition effect
      Future.delayed(const Duration(milliseconds: 2200), () {
        if (mounted) {
          context.go('/onboarding/profile');
        }
      });
    }
  }

  void _handleBack() {
    HapticFeedback.lightImpact();
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
        _syncProgress();
      });
    } else {
      // Go back to welcome screen and reset to step 1
      ref.read(onboardingProvider.notifier).setStep(1);
      context.go('/onboarding/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showTransition) return _buildTransitionView();

    final question = _questions[_currentStep];
    final theme = Theme.of(context);

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient (Vibrant matching Welcome)
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
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xxl,
                vertical: AppSpacing.xl,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress Bar
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: List.generate(_questions.length, (index) {
                      final isActive = index <= _currentStep;
                      return Expanded(
                        child: Container(
                          height: 6,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            color: isActive
                                ? Colors.white
                                : Colors.white.withAlpha(50),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      );
                    }),
                  ),

                  const SizedBox(height: AppSpacing.xxxl),

                  // Step Transition Wrapper
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 400),
                      transitionBuilder: (Widget child, Animation<double> animation) {
                        return FadeTransition(
                          opacity: animation,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0.05, 0),
                              end: Offset.zero,
                            ).animate(animation),
                            child: child,
                          ),
                        );
                      },
                      child: Column(
                        key: ValueKey(_currentStep),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            question['title'],
                            style: theme.textTheme.displayLarge?.copyWith(
                              fontSize: 26,
                              height: 1.2,
                              letterSpacing: -0.5,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xxxl),
                          Expanded(
                            child: ListView(
                              children: (question['options'] as List).map((opt) {
                                final isSelected =
                                    _answers[question['id']] == opt['id'];
                                return Padding(
                                  key: ValueKey(opt['id']),
                                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                                  child: GestureDetector(
                                    onTap: () {
                                      HapticFeedback.lightImpact();
                                      setState(() {
                                        _answers[question['id']] = opt['id'];
                                        _syncProgress();
                                      });
                                    },
                                    child: AnimatedScale(
                                      scale: isSelected ? 1.02 : 1.0,
                                      duration: const Duration(milliseconds: 300),
                                      curve: Curves.easeOutBack,
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 300),
                                        curve: Curves.easeOut,
                                        padding: const EdgeInsets.all(AppSpacing.xl),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? Colors.white.withAlpha(60)
                                              : Colors.white.withAlpha(30),
                                          borderRadius: BorderRadius.circular(
                                            AppRadius.xl,
                                          ),
                                          border: Border.all(
                                            color: isSelected
                                                ? Colors.white
                                                : Colors.white.withAlpha(20),
                                            width: 2,
                                          ),
                                          boxShadow: isSelected
                                              ? [
                                                  BoxShadow(
                                                    color: Colors.black.withAlpha(20),
                                                    blurRadius: 10,
                                                    offset: const Offset(0, 4),
                                                  )
                                                ]
                                              : [],
                                        ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              opt['label'],
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                          AnimatedSwitcher(
                                            duration: const Duration(milliseconds: 300),
                                            transitionBuilder: (child, animation) {
                                              return ScaleTransition(
                                                scale: animation,
                                                child: child,
                                              );
                                            },
                                            child: isSelected
                                                ? const Icon(
                                                    LucideIcons.checkCircle2,
                                                    key: ValueKey('selected'),
                                                    color: Colors.white,
                                                    size: 24,
                                                  )
                                                : const SizedBox(
                                                    key: ValueKey('unselected'),
                                                    width: 24,
                                                    height: 24,
                                                  ),
                                          ),
                                        ],
                                      ),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

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
                        width: 140,
                        child: ElevatedButton(
                          onPressed: _answers.containsKey(question['id'])
                              ? _handleNext
                              : null,
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
                          child: Text(
                            _currentStep == _questions.length - 1
                                ? 'Finish'
                                : 'Next',
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
        ],
      ),
    );
  }

  Widget _buildTransitionView() {
    final goalId = _answers['goal'];
    final goalLabel = _questions[1]['options']
        .firstWhere((o) => o['id'] == goalId)['label']
        .toLowerCase();
    final theme = Theme.of(context);

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient (Vibrant matching RN)
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
          Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xxxl),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'We\'ve got you covered.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.displayLarge?.copyWith(
                      color: Colors.white,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'We specialize in turning mindless screen time into productive $goalLabel.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withAlpha(220),
                      fontSize: 20,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxxl),
                  const CircularProgressIndicator(color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
