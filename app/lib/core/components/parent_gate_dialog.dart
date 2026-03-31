import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class ParentGateDialog extends StatefulWidget {
  final String userEmail;
  final String title;
  final String description;

  const ParentGateDialog({
    super.key,
    required this.userEmail,
    this.title = 'Parent Gate',
    this.description = 'Enter your password to continue.',
  });

  static Future<bool> show(
    BuildContext context, {
    required String userEmail,
    String title = 'Parent Gate',
    String description = 'Enter your password to continue.',
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => ParentGateDialog(
        userEmail: userEmail,
        title: title,
        description: description,
      ),
    );
    return result ?? false;
  }

  @override
  State<ParentGateDialog> createState() => _ParentGateDialogState();
}

class _ParentGateDialogState extends State<ParentGateDialog> {
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String _error = '';
  int _attempts = 0;
  int _lockoutSeconds = 0;
  Timer? _lockoutTimer;

  static const int _maxAttempts = 5;
  static const int _lockoutDuration = 30;

  @override
  void dispose() {
    _passwordController.dispose();
    _lockoutTimer?.cancel();
    super.dispose();
  }

  void _startLockout() {
    setState(() {
      _lockoutSeconds = _lockoutDuration;
    });
    _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_lockoutSeconds <= 1) {
        timer.cancel();
        setState(() {
          _lockoutSeconds = 0;
          _attempts = 0;
          _error = '';
        });
      } else {
        setState(() {
          _lockoutSeconds--;
        });
      }
    });
  }

  Future<void> _handleSubmit() async {
    final password = _passwordController.text.trim();
    if (password.isEmpty || _lockoutSeconds > 0) return;

    setState(() {
      _error = '';
      _isLoading = true;
    });

    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: widget.userEmail,
        password: password,
      );
      
      if (!mounted) return;
      // Success! Return true.
      Navigator.of(context).pop(true);
      
    } on AuthException catch (_) {
      _attempts++;
      if (_attempts >= _maxAttempts) {
        _error = 'Too many attempts. Please wait $_lockoutDuration seconds.';
        _startLockout();
      } else {
        final remaining = _maxAttempts - _attempts;
        _error = 'Incorrect password. $remaining attempt${remaining == 1 ? '' : 's'} remaining.';
      }
    } catch (e) {
      _error = 'An unexpected error occurred.';
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _passwordController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLockedOut = _lockoutSeconds > 0;

    return Dialog(
      backgroundColor: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
      insetPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                const Icon(LucideIcons.lock, size: 20, color: AppColors.primary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    widget.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.displayLarge?.color,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(false),
                  child: Padding(
                    padding: EdgeInsets.all(4.0),
                    child: Icon(LucideIcons.x, size: 20, color: Theme.of(context).textTheme.bodySmall?.color),
                  ),
                )
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            
            // Description
            Text(
              widget.description,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodyLarge?.color,
                height: 1.4,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // Content
            if (isLockedOut)
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.accent.withAlpha(30),
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: Text(
                  'Too many failed attempts. Try again in $_lockoutSeconds s.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.accent,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
            else
              TextField(
                controller: _passwordController,
                obscureText: true,
                autofocus: true,
                enabled: !_isLoading,
                onSubmitted: (_) => _handleSubmit(),
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
                  ),
                ),
              ),

            if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: Text(
                  _error,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontSize: 14,
                  ),
                ),
              ),

            const SizedBox(height: AppSpacing.xl),

            // Footer / Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: ElevatedButton(
                    onPressed: (isLockedOut || _isLoading) ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: Text(_isLoading ? 'Verifying...' : 'Submit'),
                  ),
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
