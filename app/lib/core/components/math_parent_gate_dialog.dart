import 'dart:math';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class MathParentGateDialog extends StatefulWidget {
  final String title;
  final String description;

  const MathParentGateDialog({
    super.key,
    this.title = 'Parental Gate',
    this.description = 'Please solve this math problem to continue.',
  });

  static Future<bool> show(
    BuildContext context, {
    String title = 'Parental Gate',
    String description = 'Please solve this math problem to continue.',
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => MathParentGateDialog(
        title: title,
        description: description,
      ),
    );
    return result ?? false;
  }

  @override
  State<MathParentGateDialog> createState() => _MathParentGateDialogState();
}

class _MathParentGateDialogState extends State<MathParentGateDialog> {
  final _answerController = TextEditingController();
  late int _num1;
  late int _num2;
  late int _correctAnswer;
  String? _error;

  @override
  void initState() {
    super.initState();
    _generateProblem();
  }

  void _generateProblem() {
    final rand = Random();
    _num1 = rand.nextInt(8) + 2; // 2-9
    _num2 = rand.nextInt(8) + 2; // 2-9
    _correctAnswer = _num1 * _num2;
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    final input = int.tryParse(_answerController.text.trim());
    if (input == _correctAnswer) {
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _error = 'Incorrect. Please try again.';
        _answerController.clear();
        _generateProblem();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(LucideIcons.lock, size: 20, color: AppColors.primary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  widget.title,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              widget.description,
              style: TextStyle(fontSize: 14, color: Theme.of(context).textTheme.bodyLarge?.color),
            ),
            const SizedBox(height: AppSpacing.xl),
            
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Column(
                children: [
                   Text(
                    '$_num1 x $_num2 = ?',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: 4),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  TextField(
                    controller: _answerController,
                    keyboardType: TextInputType.number,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    onSubmitted: (_) => _handleSubmit(),
                    decoration: InputDecoration(
                      hintText: 'Answer',
                      errorText: _error,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: const Text('Verify'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
