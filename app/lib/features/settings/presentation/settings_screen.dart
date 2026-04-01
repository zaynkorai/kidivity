import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/components/parent_gate_dialog.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isDeletingAccount = false;
  String _appVersion = '1.0.0';

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() {
      _appVersion = '${info.version}+${info.buildNumber}';
    });
  }

  void _showUnimplemented(String feature) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('$feature not yet implemented.')));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.success),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
    );
  }

  Future<void> _handleGateAction(
    String actionName,
    String userEmail,
    Future<void> Function() action,
  ) async {
    final success = await ParentGateDialog.show(
      context,
      userEmail: userEmail,
      description: 'Enter your password to $actionName.',
    );
    if (success) {
      await action();
    }
  }

  void _confirmSignOut() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).signOut();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleResetPassword(String email) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Password'),
        content: Text('Send a password reset email to $email?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                // In production, configure matching deep link redirectTo url
                await Supabase.instance.client.auth.resetPasswordForEmail(
                  email,
                );
                _showSuccess('Password reset email sent! Check your inbox.');
              } catch (e) {
                _showError('Error: able to send password reset');
              }
            },
            child: const Text('Send Email'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleDeleteAccount(String userId) async {
    if (_isDeletingAccount) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Delete Account',
          style: TextStyle(color: AppColors.danger),
        ),
        content: const Text(
          'Are you sure you want to permanently delete your account and all kid profiles? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isDeletingAccount = true);

    try {
      await Supabase.instance.client.functions.invoke(
        'delete-account',
        body: {'userId': userId},
      );
      await ref.read(authProvider.notifier).signOut();
      if (mounted) {
        _showSuccess('Your account has been deleted.');
      }
    } catch (_) {
      if (mounted)
        _showError(
          'Unable to delete your account right now. Please try again.',
        );
    } finally {
      if (mounted) setState(() => _isDeletingAccount = false);
    }
  }

  Future<void> _handleShare() async {
    try {
      await SharePlus.instance.share(
        ShareParams(
          text:
              'Check out Kidivity - The best app for supercharging your kid\'s development!',
        ),
      );
    } catch (e) {
      _showError('Share failed');
    }
  }

  Future<void> _handleRateApp() async {
    final url = Platform.isIOS
        ? 'itms-apps://itunes.apple.com/app/id6759043670'
        : 'market://details?id=com.kidivity.app';
    final parsed = Uri.parse(url);
    if (await canLaunchUrl(parsed)) {
      await launchUrl(parsed);
    } else {
      _showError('Unable to open store.');
    }
  }

  Future<void> _handlePrivacyTerms() async {
    final parsed = Uri.parse('https://kaivity.com/privacy');
    if (await canLaunchUrl(parsed)) {
      await launchUrl(parsed);
    } else {
      _showError('Unable to open browser.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final email = user?.email ?? '';
    final profileState = ref.watch(profileProvider);
    final profiles = profileState.profiles;

    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.xxxl,
            AppSpacing.xl,
            120,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(20),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      LucideIcons.settings,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.displayLarge?.color,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xxxl),

              // Kid Profiles Section
              const _SectionTitle(title: 'KID PROFILES'),
              _SettingsCard(
                children: [
                  // Dynamic profile rows from Riverpod
                  ...profiles.asMap().entries.expand((entry) {
                    final index = entry.key;
                    final profile = entry.value;
                    return [
                      _ProfileRow(
                        name: profile.name,
                        age: '${profile.age}yo',
                        gradeLevel: profile.gradeLevel,
                        color: profile.avatarColorValue,
                        onEdit: () => _handleGateAction(
                          'edit the profile',
                          email,
                          () async => _showUnimplemented('Edit Profile Screen'),
                        ),
                        onDelete: () => _handleGateAction(
                          'manage profiles',
                          email,
                          () async {
                            final error = await ref
                                .read(profileProvider.notifier)
                                .deleteProfile(profile.id);
                            if (error != null && mounted) _showError(error);
                          },
                        ),
                      ),
                      if (index < profiles.length - 1) _buildDivider(56),
                    ];
                  }),
                  if (profiles.isNotEmpty) _buildDivider(56),
                  // Empty state
                  if (profiles.isEmpty && !profileState.isLoading)
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      child: Text(
                        'No kid profiles yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Theme.of(context).textTheme.bodySmall?.color,
                        ),
                      ),
                    ),
                  if (profileState.isLoading)
                    const Padding(
                      padding: EdgeInsets.all(AppSpacing.xl),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  InkWell(
                    onTap: () => _handleGateAction(
                      'add a new kid\'s profile',
                      email,
                      () async => _showUnimplemented('Create Profile Screen'),
                    ),
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            LucideIcons.plus,
                            size: 18,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: AppSpacing.sm),
                          Text(
                            'Add Kid Profile',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Account Section
              const _SectionTitle(title: 'ACCOUNT'),
              _SettingsCard(
                children: [
                  _SettingsRow(
                    icon: LucideIcons.mail,
                    iconBackgroundColor: AppCategoryColors.mathAccent,
                    label: 'Email',
                    value: email.isEmpty ? 'Not signed in' : email,
                    onTap: null, // Read-only
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.keyRound,
                    iconBackgroundColor: AppColors.success,
                    label: 'Reset Password',
                    onTap: email.isEmpty
                        ? null
                        : () => _handleResetPassword(email),
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.userX,
                    iconBackgroundColor: AppColors.accent,
                    label: 'Delete Account',
                    onTap: user == null
                        ? null
                        : () => _handleGateAction(
                            'verify your identity',
                            email,
                            () async => _handleDeleteAccount(user.id),
                          ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xxl),

              // About & Support Section
              const _SectionTitle(title: 'ABOUT & SUPPORT'),
              _SettingsCard(
                children: [
                  _SettingsRow(
                    icon: LucideIcons.helpCircle,
                    iconBackgroundColor: AppColors.secondary,
                    label: 'Help & Support',
                    onTap: () => _showUnimplemented('Help & Support'),
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.star,
                    iconBackgroundColor: AppCategoryColors.artAccent,
                    label: 'Rate App',
                    onTap: _handleRateApp,
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.share,
                    iconBackgroundColor: AppCategoryColors.mathAccent,
                    label: 'Share App',
                    onTap: _handleShare,
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.shield,
                    iconBackgroundColor: AppColors.success,
                    label: 'Privacy & Terms',
                    onTap: _handlePrivacyTerms,
                  ),
                  _buildDivider(56),
                  _SettingsRow(
                    icon: LucideIcons.info,
                    iconBackgroundColor: AppColors.secondary,
                    label: 'App Version',
                    value: _appVersion,
                    onTap: null, // Read-only
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xxxl),

              // Sign Out Button
              ElevatedButton.icon(
                onPressed: _confirmSignOut,
                icon: const Icon(LucideIcons.logOut, size: 18),
                label: const Text('Sign Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  elevation: 4,
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider(double leftPadding) {
    return Container(
      margin: EdgeInsets.only(left: leftPadding),
      height: 1,
      color: Theme.of(context).dividerColor,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.sm,
        bottom: AppSpacing.sm,
      ),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.bodySmall?.color?.withAlpha(160),
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.small,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final Color iconBackgroundColor;
  final String label;
  final String? value;
  final VoidCallback? onTap;

  const _SettingsRow({
    required this.icon,
    required this.iconBackgroundColor,
    required this.label,
    this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBackgroundColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(width: AppSpacing.md),
          Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const Spacer(),
          if (value != null)
            Text(
              value!,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            )
          else if (onTap != null)
            Icon(
              LucideIcons.chevronRight,
              size: 18,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(onTap: onTap, child: content);
    }
    return content;
  }
}

class _ProfileRow extends StatelessWidget {
  final String name;
  final String age;
  final String gradeLevel;
  final Color color;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ProfileRow({
    required this.name,
    required this.age,
    required this.gradeLevel,
    required this.color,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Theme.of(context).cardColor, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(20),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              name[0].toUpperCase(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '$age · $gradeLevel',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).textTheme.bodySmall?.color,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Edit Button
          InkWell(
            onTap: onEdit,
            child: _actionButton(AppColors.accent, LucideIcons.edit3),
          ),
          const SizedBox(width: AppSpacing.sm),
          // Delete Button
          InkWell(
            onTap: onDelete,
            child: _actionButton(AppColors.danger, LucideIcons.trash2),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(Color bgColor, IconData icon) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Icon(icon, size: 16, color: Colors.white),
    );
  }
}
