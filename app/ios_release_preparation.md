# iOS Release Preparation Plan

We have prepared the `kidivity` Flutter app for App Store submission with a consistent brand identity and necessary iOS-specific configurations.

## 1. App Configuration Updates ✅
- [x] **Bundle Identifier**: Migrated to `com.kidivity.app` globally (iOS, Android, Linux).
- [x] **Info.plist**: 
  - Added `LSApplicationQueriesSchemes` for `url_launcher` (https, http, itms-apps).
  - Added `NSPhotoLibraryUsageDescription` for `share_plus` file sharing support.
  - Enabled `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace` for PDF saving.
- [x] **Podfile**: Set target platform to `iOS 15.0`.
- [x] **Display Name**: Verified as "Kidivity".

## 2. Asset & Icon Generation ✅
- [x] **Launcher Icons**: Generated for iOS and Android using `flutter_launcher_icons`.
- [x] **Splash Screen**: Created a premium branded splash screen using `flutter_native_splash`.
  - Background: Brand Blue (`#4361EE`)
  - Image: Centered App Icon
  - Support: iOS, Android 12+, and Web included.

## 3. Code & Localization ✅
- [x] **Dynamic Versioning**: Integrated `package_info_plus` to display real app version in Settings.
- [x] **Package Consistency**: Updated `MainActivity.kt` and directory structure for Android.
- [x] **Links**: Prepared App Store and Play Store deep links in `settings_screen.dart`.

## 4. Final Steps (Action Required) ⚠️
- [x] **App Store ID**: Replace `YOUR_APP_ID` placeholder in `lib/features/settings/presentation/settings_screen.dart` with the numeric ID from App Store Connect.
- [x] **Code Signing**: Open `ios/Runner.xcworkspace` in Xcode to configure your development team and certificates.
- [x] **Build for Release**:
  ```bash
  flutter build ios --release
  ```

## 5. Post-Build: Packaging & Upload 📦
- [ ] **Generate IPA**: Create the distribution package.
  ```bash
  flutter build ipa --release
  ```
- [ ] **Fastlane Upload**: Automatically push to TestFlight.
  ```ruby
  # Add to Fastfile
  lane :beta do
    upload_to_testflight(
      api_key_path: "fastlane/api_key.json",
      ipa: "build/ios/ipa/Kidivity.ipa"
    )
  end
  ```
  ```bash
  fastlane beta
  ```

## 6. Submission for Review 🚀
- [ ] **TestFlight Verification**: Ensure build processing is complete on App Store Connect.
- [ ] **Metadata & Screenshots**: Fill out app description, keywords, and upload required visual assets.
- [ ] **App Store Submission**: Select the build, update release notes, and click **Submit for Review**.

---
*Last Updated: 2026-04-01*
