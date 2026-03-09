# Initialization & Architecture Plan - Kidivity

## Goal Description
Set up the foundational mobile application for **Kidivity** per the gathered requirements.

## User Review Required
> [!IMPORTANT]
> Because you previously mentioned a monorepo structure (`backend/` and `frontend/`), should I initialize this new mobile app inside a `mobile/` directory at the root (`/Users/zayn/ground/kidivity/mobile/`), or do you want it directly in the root folder?

> [!NOTE]
> I propose using Expo (React Native) for cross-platform compatibility, along with `Zustand` for state management and local persistence, mapping perfectly to how you built the web version.

## Proposed Changes

### Setup Monorepo / Mobile App
- If approved, use `npx create-expo-app@latest mobile -t default` to scaffold the mobile app.
- Initialize `pnpm` if required or simply use it for the mobile directory.

### Core Dependencies
- Install **Zustand** and `@react-native-async-storage/async-storage` for persisting profiles and journeys locally.
- Install UI libraries (e.g. `lucide-react-native` for icons, possibly `nativewind` for Tailwind styling if you prefer that over StyleSheet).

## Verification Plan

### Automated Tests
- Run `pnpm run lint` or `npm run lint` within the mobile directory.

### Manual Verification
- We will start the Expo development server: `npx expo start`.
- The user can open the app on an iOS Simulator or scan the QR code using the Expo Go app.
- We will verify that the app successfully launches and displays a "Hello World" screen with the basic navigation layout.
