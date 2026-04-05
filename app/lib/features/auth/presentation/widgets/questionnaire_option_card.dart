import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import 'synchronized_selection_wrapper.dart';

/// A specialized card for questionnaire options that synchronizes the 
/// 'border drawing' animation with the final selected state.
class QuestionnaireOptionCard extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const QuestionnaireOptionCard({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SynchronizedSelectionWrapper(
      isSelected: isSelected,
      borderRadius: AppRadius.xl,
      builder: (context, isResolved) {
        return GestureDetector(
          onTap: onTap,
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
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(
                  color: (isSelected && isResolved)
                      ? Colors.white
                      : Colors.white.withAlpha(isSelected ? 0 : 20),
                  width: 2,
                ),
                boxShadow: (isSelected && isResolved)
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
                      label,
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
        );
      },
    );
  }
}
