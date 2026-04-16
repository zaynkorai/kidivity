import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';
import 'auth_provider.dart' as app_auth;
import '../constants/env.dart';

// Entitlement identifiers from RevenueCat Dashboard
const String _entitlementProAnnual = 'pro_annual';
const String _entitlementProMonthly = 'pro_monthly';
const String _entitlementProLegacy = 'Kidivity -Printable Activities Pro';

class SubscriptionState {
  final CustomerInfo? customerInfo;
  final Offerings? offerings;
  final bool isLoading;
  final String? error;

  const SubscriptionState({
    this.customerInfo,
    this.offerings,
    this.isLoading = false,
    this.error,
  });

  bool get isPro {
    if (customerInfo == null) return false;
    final entitlements = customerInfo!.entitlements.all;

    return entitlements[_entitlementProAnnual]?.isActive == true ||
        entitlements[_entitlementProMonthly]?.isActive == true ||
        entitlements[_entitlementProLegacy]?.isActive == true ||
        entitlements['pro']?.isActive == true;
  }

  bool get isAnnual {
    if (customerInfo == null) return false;
    final entitlements = customerInfo!.entitlements.all;
    return entitlements[_entitlementProAnnual]?.isActive == true;
  }

  SubscriptionState copyWith({
    CustomerInfo? customerInfo,
    Offerings? offerings,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return SubscriptionState(
      customerInfo: customerInfo ?? this.customerInfo,
      offerings: offerings ?? this.offerings,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class SubscriptionNotifier extends Notifier<SubscriptionState>
    with WidgetsBindingObserver {
  final Completer<void> _initCompleter = Completer<void>();

  @override
  SubscriptionState build() {
    WidgetsBinding.instance.addObserver(this);

    Future.microtask(_initRevenueCat);

    ref.listen<app_auth.AuthState>(app_auth.authProvider, (prev, next) {
      if (prev?.user?.id != next.user?.id) {
        if (next.user != null) {
          _logIn(next.user!.id);
        } else {
          _logOut();
        }
      }
    });

    ref.onDispose(() {
      WidgetsBinding.instance.removeObserver(this);
    });

    return const SubscriptionState(isLoading: true);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _initCompleter.isCompleted) {
      _refreshCustomerInfo();
    }
  }

  Future<void> _initRevenueCat() async {
    try {
      await Purchases.setLogLevel(kDebugMode ? LogLevel.debug : LogLevel.info);

      PurchasesConfiguration? configuration;
      if (Platform.isAndroid) {
        configuration = PurchasesConfiguration(Env.revenueCatGoogleKey);
      } else if (Platform.isIOS || Platform.isMacOS) {
        configuration = PurchasesConfiguration(Env.revenueCatAppleKey);
      }

      if (configuration != null) {
        await Purchases.configure(configuration);

        final currentUser = ref.read(app_auth.authProvider).user;
        if (currentUser != null) {
          await Purchases.logIn(currentUser.id);
        }

        Purchases.addCustomerInfoUpdateListener((customerInfo) {
          state = state.copyWith(customerInfo: customerInfo);
        });

        final offerings = await Purchases.getOfferings();
        final customerInfo = await Purchases.getCustomerInfo();

        state = state.copyWith(
          offerings: offerings,
          customerInfo: customerInfo,
          isLoading: false,
        );

        if (!_initCompleter.isCompleted) _initCompleter.complete();
      } else {
        throw Exception(
          'Current platform is not supported for In-App Purchases.',
        );
      }
    } catch (e) {
      debugPrint('[RevenueCat] Initialization Error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to initialize billing service.',
      );
      if (!_initCompleter.isCompleted) _initCompleter.complete();
    }
  }

  Future<void> _refreshCustomerInfo() async {
    try {
      final customerInfo = await Purchases.getCustomerInfo();
      state = state.copyWith(customerInfo: customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat] Background Refresh Error: $e');
    }
  }

  Future<void> _logIn(String appUserId) async {
    await _initCompleter.future;
    try {
      final logInResult = await Purchases.logIn(appUserId);
      state = state.copyWith(customerInfo: logInResult.customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat] Login Error: $e');
    }
  }

  Future<void> _logOut() async {
    await _initCompleter.future;
    try {
      final customerInfo = await Purchases.logOut();
      state = state.copyWith(customerInfo: customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat] Logout Error: $e');
    }
  }

  Future<void> restorePurchases() async {
    await _initCompleter.future;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final customerInfo = await Purchases.restorePurchases();
      state = state.copyWith(customerInfo: customerInfo, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _mapError(e));
    }
  }

  Future<void> presentPaywall({bool force = false}) async {
    await _initCompleter.future;

    if (state.isPro && !force) {
      return;
    }

    try {
      // Pass the main entitlement ID to the paywall. RC Dashboard should map this
      // to the appropriate offering with Monthly/Annual packages.
      final paywallResult = await RevenueCatUI.presentPaywallIfNeeded(
        _entitlementProAnnual,
        displayCloseButton: true,
      );

      if (paywallResult == PaywallResult.purchased ||
          paywallResult == PaywallResult.restored) {
        await _refreshCustomerInfo();
      }
    } catch (e) {
      debugPrint('[RevenueCat] UI Presentation Error: $e. Falling back.');
      try {
        await RevenueCatUI.presentPaywall();
        await _refreshCustomerInfo();
      } catch (e2) {
        state = state.copyWith(error: _mapError(e2));
      }
    }
  }

  Future<void> presentCustomerCenter() async {
    await _initCompleter.future;
    try {
      await RevenueCatUI.presentCustomerCenter();
      await _refreshCustomerInfo();
    } catch (e) {
      state = state.copyWith(error: _mapError(e));
    }
  }

  String _mapError(Object e) {
    if (e is PlatformException) {
      // RevenueCat Error Codes mapping
      // https://www.revenuecat.com/docs/errors
      switch (e.code) {
        case '1': // PurchaseCancelledError
          return 'Purchase was cancelled.';
        case '2': // StoreProblemError
          return 'There is a problem with the App Store. Please try again later.';
        case '3': // PurchaseNotAllowedError
          return 'Purchases are not allowed on this device (e.g. Parental Controls).';
        case '5': // NetworkError
          return 'Network error. Please check your internet connection.';
        case '7': // ReceiptAlreadyInUseError
          return 'This receipt is already in use by another account.';
        case '8': // InvalidReceiptError
          return 'The receipt is invalid. Please contact support.';
        default:
          return e.message ?? 'An unexpected billing error occurred.';
      }
    }
    return 'Could not connect to the billing service.';
  }
}

final subscriptionProvider =
    NotifierProvider<SubscriptionNotifier, SubscriptionState>(() {
      return SubscriptionNotifier();
    });
