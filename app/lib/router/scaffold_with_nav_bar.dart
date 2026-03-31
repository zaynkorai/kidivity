import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme/app_theme.dart';

class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  /// The navigation shell and container for the branch Navigators.
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Content
          navigationShell,

          // Floating Tab Bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                0,
                AppSpacing.xxxl,
                20,
              ),
              child: Container(
                height: 68,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.full + 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(isDark ? 100 : 40),
                      blurRadius: 25,
                      offset: const Offset(0, 12),
                      spreadRadius: -5,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.full + 4),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
                    child: Container(
                      decoration: BoxDecoration(
                        color: (isDark ? Colors.black : Colors.white).withAlpha(
                          isDark ? 40 : 30,
                        ),
                        borderRadius: BorderRadius.circular(AppRadius.full + 4),
                        border: Border.all(
                          color: (isDark ? Colors.white : Colors.black)
                              .withAlpha(isDark ? 30 : 20),
                          width: 1.5,
                        ),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            (isDark ? Colors.white : Colors.white).withAlpha(
                              isDark ? 30 : 50,
                            ),
                            (isDark ? Colors.white : Colors.white).withAlpha(
                              isDark ? 5 : 10,
                            ),
                          ],
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _NavItem(
                            icon: LucideIcons.home,
                            label: 'Home',
                            isSelected: navigationShell.currentIndex == 0,
                            onTap: () => _onTap(context, 0),
                          ),
                          _NavItem(
                            icon: LucideIcons.calendar,
                            label: 'Activities',
                            isSelected: navigationShell.currentIndex == 1,
                            onTap: () => _onTap(context, 1),
                          ),
                          _NavItem(
                            icon: LucideIcons.wand2,
                            label: 'Generate',
                            isSelected: navigationShell.currentIndex == 2,
                            onTap: () => _onTap(context, 2),
                          ),
                          _NavItem(
                            icon: LucideIcons.settings,
                            label: 'Settings',
                            isSelected: navigationShell.currentIndex == 3,
                            onTap: () => _onTap(context, 3),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withAlpha(isDark ? 60 : 30)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.full),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected
                  ? AppColors.primary
                  : (isDark ? Colors.white70 : Colors.black54),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? AppColors.primary
                    : (isDark ? Colors.white60 : Colors.black45),
                letterSpacing: 0.2,
              ),
            ),
            if (isSelected)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Container(
                  width: 3,
                  height: 3,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
