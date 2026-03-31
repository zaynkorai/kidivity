import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFF4361EE);
  static const Color primaryLight = Color(0xFFDDE2FF);
  static const Color primaryDark = Color(0xFF2B3A8C);
  static const Color secondary = Color(0xFFFFB703);

  static const Color accent = Color(0xFFFF9F1C);
  static const Color success = Color(0xFF4CD137);
  static const Color warning = Color(0xFFFDCB6E);
  static const Color danger = Color(0xFFFF4757);

  static const Color background = Color(0xFFF2F2F7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFEAECEE);

  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color borderDark = Color(0xFF2C2C2E);

  static const Color textPrimary = Color(0xFF1A2837);
  static const Color textSecondary = Color(0xFF515A5B);
  static const Color textTertiary = Color(0xFFBDC3C7);

  static const Color textPrimaryDark = Color(0xFFFDFDFD);
  static const Color textSecondaryDark = Color(0xFFA0A0A0);
  static const Color textTertiaryDark = Color(0xFF636366);
  
  static const List<Color> avatarPalette = [
    Color(0xFFFF8A00), Color(0xFFFECAC3), Color(0xFFA2DDC2), Color(0xFFFFE3C1), 
    Color(0xFF8AE3FF), Color(0xFFE7E1FF), Color(0xFFFD79A8), Color(0xFF00CEC9), 
    Color(0xFFE17055), Color(0xFF0984E3), Color(0xFF55A3E8)
  ];
}

class AppCategoryColors {
  static const puzzlesAccent = Color(0xFFFF9F1C);
  static const puzzlesPastel = Color(0xFFFFF4E6);
  
  static const tracingAccent = Color(0xFF4ECDC4);
  static const tracingPastel = Color(0xFFE6F7F6);
  
  static const scienceAccent = Color(0xFFA06CD5);
  static const sciencePastel = Color(0xFFF3EBF9);
  
  static const artAccent = Color(0xFFFF6B6B);
  static const artPastel = Color(0xFFFFEBEB);
  
  static const mathAccent = Color(0xFF4361EE);
  static const mathPastel = Color(0xFFE8EDFF);
  
  static const readingAccent = Color(0xFF6AB04C);
  static const readingPastel = Color(0xFFF0F7ED);
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
}

class AppRadius {
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double full = 9999;
}

class AppShadows {
  static List<BoxShadow> get card => [
    BoxShadow(
      color: Colors.black.withAlpha(10), // Subtle shadow
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get small => [
    BoxShadow(
      color: Colors.black.withAlpha(8),
      blurRadius: 6,
      offset: const Offset(0, 2),
    ),
  ];
}

class AppTheme {
  static ThemeData get light => ThemeData(
        brightness: Brightness.light,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.background,
        textTheme: GoogleFonts.poppinsTextTheme(
          const TextTheme(
            displayLarge: TextStyle(color: AppColors.textPrimary, letterSpacing: -0.8, fontWeight: FontWeight.w800),
            bodyLarge: TextStyle(color: AppColors.textPrimary, letterSpacing: -0.2),
            bodyMedium: TextStyle(color: AppColors.textSecondary),
          ),
        ),
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: AppColors.surface,
          error: AppColors.danger,
        ),
        cardTheme: CardThemeData(
          color: AppColors.surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            side: const BorderSide(color: Color(0x0F000000), width: 0.5), // Subtle tactile edge
          ),
        ),
        dividerColor: AppColors.border,
      );

  static ThemeData get dark => ThemeData(
        brightness: Brightness.dark,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.backgroundDark,
        textTheme: GoogleFonts.poppinsTextTheme(
          const TextTheme(
            displayLarge: TextStyle(color: AppColors.textPrimaryDark, letterSpacing: -0.8, fontWeight: FontWeight.w800),
            bodyLarge: TextStyle(color: AppColors.textPrimaryDark, letterSpacing: -0.2),
            bodyMedium: TextStyle(color: AppColors.textSecondaryDark),
          ),
        ),
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: AppColors.surfaceDark,
          error: AppColors.danger,
        ),
        cardTheme: CardThemeData(
          color: AppColors.surfaceDark,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            side: const BorderSide(color: Color(0x1FDDDDDD), width: 0.5), // Subtle tactile edge for dark mode
          ),
        ),
        dividerColor: AppColors.borderDark,
      );
}
