# AGENT_WORKINGLOG

## Operating Note

- Every future agent task in `vanpick-app` must update this `AGENT_WORKINGLOG.md` with the work performed, verification run, and any unresolved items.
- This project is the Expo React Native WebView shell app for VanPick. Do not modify, run, or depend on the sibling `../vanpick` web project when working here unless the user explicitly asks for it.
- The app WebView must keep the production URL as `https://vanpick.app` unless the user explicitly asks to change it.

## 2026-05-29

### Initial Expo WebView App Setup

- Created a new Expo TypeScript app inside `vanpick-app`.
- Installed and configured:
  - `expo`
  - `react`
  - `react-native`
  - `react-native-webview`
  - `expo-linking`
  - `expo-status-bar`
  - `typescript`
- Implemented `App.tsx` as a WebView wrapper that loads `https://vanpick.app`.
- Added `src/config.ts` to keep the production URL and link-handling host allowlists centralized.
- Added WebView behavior:
  - quiet VanPick loading screen
  - simple network error screen
  - retry button
  - Android hardware back handling
  - internal handling for `vanpick.app` and `www.vanpick.app`
  - WebView continuity for Kakao, Toss Payments, and Supabase callback hosts
  - external browser fallback for other external links
- Updated `app.json`:
  - app name: `VanPick`
  - slug: `vanpick-app`
  - scheme: `vanpick`
  - iOS bundle identifier: `app.vanpick.mobile`
  - Android package: `app.vanpick.mobile`
  - iOS camera/photo usage strings
  - Android internet/camera/photo permissions
- Added `npm run typecheck`.

### Initial Verification

- `npm run typecheck` passed.
- `npx expo config --type public` passed and showed SDK `56.0.0`.
- `npm run start -- --localhost` started Metro and served the Expo manifest.
- iOS bundle export passed:
  - `npx expo export --platform ios --output-dir /private/tmp/vanpick-app-export`
- Actual iOS Simulator and Android Emulator execution could not be verified because local simulator tools were unavailable in the environment at that time.

### Expo Go Launch Error Investigation And Fix

- User reported Expo Go QR launch error:
  - `there was a problem running the requested app.`
- Confirmed the app must keep loading deployed production site `https://vanpick.app`; no local `../vanpick` web server should be used.
- Verified current package versions:
  - `expo@56.0.6`
  - `react@19.2.3`
  - `react-native@0.85.3`
  - `react-native-webview@13.16.1`
  - `expo-linking@56.0.12`
- Ran `npm run typecheck`; passed.
- Ran `npx expo config --type public`; passed.
- Ran `npx expo-doctor`; it initially failed due to duplicated native module dependency:
  - duplicate `expo-constants@56.0.16`
- Ran `npm dedupe`; duplicated `expo-constants` was resolved.
- Re-ran `npx expo-doctor`; all 21 checks passed.
- Ran `npx expo start -c --tunnel`; first failure was due to missing tunnel dependency:
  - `@expo/ngrok` required in non-interactive mode
- Installed `@expo/ngrok@^4.1.0` as a devDependency.
- Re-ran tunnel command. Expo reached ngrok startup but failed with:
  - `failed to start tunnel`
  - `remote gone away`
- Interpreted this as ngrok/tunnel network failure rather than an app bundle or Expo config failure.
- Verified local Metro after cache reset:
  - manifest served from `http://localhost:8081`
  - iOS JS bundle returned HTTP 200
  - Android JS bundle returned HTTP 200
- Export verification after fixes:
  - `npx expo export --platform ios --output-dir /private/tmp/vanpick-app-export-ios` passed
  - `npx expo export --platform android --output-dir /private/tmp/vanpick-app-export-android` passed

### Runtime Hardening

- Updated `App.tsx` to avoid relying on global `URL` parsing in the React Native runtime.
- Added a small local URL parser for link-routing decisions.
- Kept `VANPICK_WEB_URL` unchanged as `https://vanpick.app`.
- Re-ran:
  - `npm run typecheck` passed
  - `npx expo-doctor` passed
  - `npx expo config --type public` passed
  - iOS and Android exports passed

### Remaining Unverified Items

- Physical iPhone/Android Expo Go QR execution was not directly confirmed in this environment.
- Tunnel mode still depends on ngrok/network availability. If `remote gone away` persists, retry later or use LAN/local connection where possible.
