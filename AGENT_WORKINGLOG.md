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

### Expo SDK 55 Downgrade For Expo Go Compatibility

- User reported iPhone Expo Go compatibility messages:
  - `project is incompatible with this version of Expo Go`
  - `the project you requested requires a newer version of Expo Go`
- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Kept WebView production URL unchanged:
  - `https://vanpick.app`
- Downgraded the project from Expo SDK 56 to SDK 55 for safer physical-device Expo Go testing.
- Updated SDK-compatible package versions:
  - `expo` from `~56.0.6` to `~55.0.0` (`55.0.26` installed)
  - `expo-linking` to `~55.0.15`
  - `expo-status-bar` to `~55.0.6`
  - `react` to `19.2.0`
  - `react-native` to `0.83.6`
  - `react-native-webview` to `13.16.0`
  - `typescript` to `~5.9.2` (`5.9.3` installed)
- Removed `@expo/ngrok` because the current requested test path is `--lan`, not `--tunnel`.
- Regenerated `package-lock.json` through npm install / Expo install / npm dedupe.
- Added minimal `metro.config.js` that extends Expo's default Metro config:
  - `const { getDefaultConfig } = require('expo/metro-config')`
  - `module.exports = getDefaultConfig(__dirname)`
- Reason for adding `metro.config.js`:
  - SDK 55 `expo-doctor` reported a Metro config check failure even though no root Metro config existed.
  - Adding the explicit Expo default config made the check pass.

### SDK 55 Verification

- `npm run typecheck` passed.
- `npx expo-doctor` passed:
  - `19/19 checks passed. No issues detected!`
- `npx expo config --type public` passed and reported:
  - `sdkVersion: 55.0.0`
- `npx expo start -c --lan` started Metro successfully after clearing an old Expo process that was holding port `8081`.
- Metro status check passed:
  - `http://localhost:8081/status` returned `packager-status:running`
- Expo manifest check passed:
  - runtime version `exposdk:55.0.0`
  - app name `VanPick`
  - scheme `vanpick`
  - URL config still points to deployed production service through app code.
- iOS JS bundle request returned HTTP `200`.
- Android JS bundle request returned HTTP `200`.
- Verification server was stopped after checks.

### Remaining Unverified Items After SDK 55 Downgrade

- Physical iPhone/Android Expo Go QR launch was not directly confirmed in this environment.
- User should run `npx expo start -c --lan` locally and scan the QR with Expo Go on the same network.

### Expo SDK 54 Downgrade For iPhone Expo Go Compatibility

- User reported that SDK 55 still produced iPhone Expo Go compatibility messages:
  - `Project is incompatible with this version of Expo Go`
  - `The project you requested requires a newer version of Expo Go`
- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Kept WebView production URL unchanged:
  - `https://vanpick.app`
- Checked Expo SDK 54 documentation before changing packages.
- Downgraded the project from Expo SDK 55 to SDK 54 for physical iPhone Expo Go testing.
- Updated SDK-compatible package versions:
  - `expo` from `~55.0.0` to `~54.0.0` (`54.0.35` installed)
  - `expo-linking` to `~8.0.12`
  - `expo-status-bar` to `~3.0.9`
  - `react` to `19.1.0`
  - `react-native` to `0.81.5`
  - `react-native-webview` to `13.15.0`
  - `@types/react` to `~19.1.10` (`19.1.17` installed)
  - `typescript` kept at SDK-compatible `~5.9.2` (`5.9.3` installed)
- Regenerated `package-lock.json` through npm install / Expo install / npm dedupe.
- Kept the minimal `metro.config.js` that extends Expo's default Metro config. It remains valid for SDK 54 and does not change app behavior.
- Made one TypeScript-only compatibility adjustment in `App.tsx`:
  - replaced object spread of `StyleSheet.absoluteFill` with explicit absolute-position style fields
  - WebView behavior and URL handling were otherwise preserved.

### SDK 54 Verification

- `npm run typecheck` passed.
- `npx expo-doctor` passed:
  - `18/18 checks passed. No issues detected!`
- `npx expo config --type public` passed and reported:
  - `sdkVersion: 54.0.0`
- `npx expo start -c --lan` started Metro successfully.
- Metro status check passed:
  - `http://localhost:8081/status` returned `packager-status:running`
- Expo manifest check passed:
  - runtime version `exposdk:54.0.0`
  - app name `VanPick`
  - scheme `vanpick`
- iOS JS bundle request returned HTTP `200`.
- Android JS bundle request returned HTTP `200`.
- Verification server was stopped after checks.

### Remaining Unverified Items After SDK 54 Downgrade

- Physical iPhone/Android Expo Go QR launch was not directly confirmed in this environment.
- User should run `npx expo start -c --lan` locally and scan the QR with Expo Go on the same network.

### Kakao App Switch Handling In WebView

- User asked to check and minimally improve Kakao login app-switch behavior inside the WebView.
- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Kept WebView production URL unchanged:
  - `https://vanpick.app`
- Checked the deployed `https://vanpick.app/login` page by HTTP request.
- Observed:
  - `/login` redirects to `https://www.vanpick.app/login`
  - login page renders Kakao login buttons through client-side JS
  - the visible server-rendered page does not expose the final OAuth URL directly
- Updated `src/config.ts`:
  - added explicit external app schemes for Kakao and Android intent handling:
    - `intent`
    - `kakaokompassauth`
    - `kakaolink`
    - `kakaoplus`
    - `kakaotalk`
- Updated `App.tsx`:
  - centralized WebView navigation decisions into `allow`, `external-app`, and `external-browser`
  - kept `vanpick.app`, `www.vanpick.app`, Kakao HTTPS hosts, Toss hosts, and Supabase hosts inside the WebView
  - sends Kakao app schemes and Android `intent://` URLs to `Linking.openURL`
  - parses Android `intent://...S.browser_fallback_url=...` and opens the fallback URL if the app launch fails
  - changed `originWhitelist` to `['*']` so every navigation can be handled by `onShouldStartLoadWithRequest`
  - added sanitized navigation logs that omit OAuth query strings and codes
- Updated `app.json`:
  - added iOS `LSApplicationQueriesSchemes` for Kakao app schemes:
    - `kakaokompassauth`
    - `kakaolink`
    - `kakaoplus`
    - `kakaotalk`
- Verification:
  - `npm run typecheck` passed
  - `npx expo-doctor` passed
  - `npx expo config --type public` passed and showed SDK `54.0.0`
  - restarted `npx expo start -c --lan`
  - Metro status returned `packager-status:running`
  - iOS JS bundle returned HTTP `200`
- Important limitation:
  - Expo Go may not fully apply `app.json` native scheme/query settings because those belong to the host native app.
  - If KakaoTalk opens but does not return cleanly to the WebView in Expo Go, a development build / EAS build is likely required.
  - No React Native Kakao SDK was added.

## 2026-05-31

### Android versionCode Bump And Production AAB Build

- User reported Google Play Console rejected the existing AAB because `versionCode 2` had already been used.
- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Changed only Android version code in `app.json`:
  - added `android.versionCode: 3`
- Kept app version name unchanged:
  - `expo.version: 1.0.0`
- Did not change WebView URL, WebView logic, icons, splash assets, permissions, or native feature behavior.
- Verification:
  - `npx expo config --type public` showed `android.versionCode: 3`
  - `npm run typecheck` passed
  - `npx expo-doctor` passed with `18/18 checks passed`
- Ran Android production build:
  - `eas build -p android --profile production`
- EAS remote app version source was enabled in `eas.json`, so EAS also incremented remote build version:
  - `versionCode` from `2` to `3`
  - build `appBuildVersion: 3`
- Build result:
  - build ID: `0e7f9de3-3c70-4d97-86a0-a31f1d803eda`
  - AAB: `https://expo.dev/artifacts/eas/2MQGdX8thBtxSzRYPKmepy.aab`

## 2026-06-08

### In-App OAuth Browser Handling For iOS App Review

- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Checked Expo SDK 56 WebBrowser/AuthSession docs before code as requested by `AGENTS.md`.
- Kept WebView production URL unchanged:
  - `https://vanpick.app`
- Added `expo-web-browser` with Expo-compatible install and app config plugin.
- Updated `App.tsx` WebView navigation interception:
  - detects Supabase OAuth authorize/callback URLs, `appleid.apple.com`, `kauth.kakao.com`, and `vanpick.app/auth/callback`
  - opens OAuth URLs with `WebBrowser.openAuthSessionAsync` instead of `Linking.openURL`
  - loads successful AuthSession return URL back into the WebView so the WebView can complete `/auth/callback`
  - preserves existing internal VanPick navigation and non-OAuth external link handling
- Updated `src/config.ts` with OAuth host/path constants.
- Did not add new Apple login UI.
- Did not change `ios.supportsTablet`.
- Did not run `npm run build`.
- Verification:
  - `npm run typecheck` passed
  - `git diff --check` passed
- Remaining unverified items:
  - Real Apple/Kakao login completion and WebView cookie/session persistence require device or TestFlight verification with a fresh iOS build.
  - Because `expo-web-browser` is a native module/config plugin, a new iOS build is required.

### EAS Export Script Shortcuts

- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Checked Expo SDK 56 docs before code as requested by `AGENTS.md`.
- Confirmed `eas.json` has a `production` build profile.
- Confirmed Android production has no non-AAB override; EAS production Android build command remains `eas build -p android --profile production`.
- Confirmed iOS production command remains `eas build -p ios --profile production` for App Store-ready EAS build flow.
- Added package scripts:
  - `npm run export:ipa`
  - `npm run export:aab`
- Did not modify app logic, WebView/OAuth/AuthSession code, or `app.json`.
- Did not run any EAS build or `npm run build`.

### iOS EAS Capability Sync Opt-Out Script

- Updated only `package.json` export script:
  - `export:ipa` now prefixes the iOS production EAS build command with `EXPO_NO_CAPABILITY_SYNC=1`.
- Left `export:aab` unchanged.
- Did not modify app logic, WebView/OAuth/AuthSession code, or `app.json`.
- Did not run any EAS build.
- Verification:
  - `package.json` JSON parse passed.
  - `git diff --check` passed.

## 2026-06-15

### Apple Login Auth Callback Recursive Session Bug Fix

- User received App Store rejection (Guideline 2.1a): Apple login sign-up failed on iPhone 17 Pro Max, iOS 26.5.1.
- Kept work strictly inside `vanpick-app`; did not access, run, or modify sibling `../vanpick`.
- Kept WebView production URL unchanged: `https://vanpick.app`.
- Root cause identified from user screenshots:
  - After Apple auth completed, `openAuthSessionAsync` returned `https://vanpick.app/auth/callback?code=...`.
  - `completeAuthInWebView` stored the URL in `allowedAuthReturnUrlRef` and remounted the WebView.
  - On WebView remount, `handleShouldStartLoad` performed exact string match against `allowedAuthReturnUrlRef.current`. Due to subtle URL encoding differences, the match failed.
  - `isOAuthBrowserUrl` was then called on the callback URL; `isVanPickAuthCallbackUrl` returned `true`.
  - This incorrectly triggered a second `openOAuthSession` call, opening a second `ASWebAuthenticationSession` browser with the auth callback URL.
  - The callback page loaded inside that second browser (not the WebView), consuming the auth code in Safari's cookie context rather than the WebView's. The WebView had no session, showing "로그인 인증값을 밴픽 세션으로 바꾸지 못했습니다".
- Fix applied in `App.tsx`:
  - Removed `isVanPickAuthCallbackUrl` from `isOAuthBrowserUrl`. The auth callback URL is a VanPick host and is correctly handled as `allow` by `getUrlDecision`, so it must never trigger a new auth session.
  - Removed now-dead `isVanPickAuthCallbackUrl` function.
  - Removed now-unused `VANPICK_AUTH_CALLBACK_PATH` import (kept `VANPICK_AUTH_CALLBACK_URL` which is still used as the redirect URL in `openAuthSessionAsync`).
- Verification:
  - `npm run typecheck` passed.
- Remaining unverified items:
  - Requires a new iOS EAS build and TestFlight/App Store review to confirm Apple login now completes successfully end-to-end.
  - The `ASWebAuthenticationSession` dialog shows 'Expo' as the app name rather than 'VanPick' on user's test device; this is cosmetic and expected in non-production or development builds; production App Store build should show 'VanPick'.

### Common Capability Sync Opt-Out For Export Scripts

- Updated only `package.json` export scripts.
- Kept `export:ipa` as `EXPO_NO_CAPABILITY_SYNC=1 eas build -p ios --profile production`.
- Added the same `EXPO_NO_CAPABILITY_SYNC=1` prefix to `export:aab`.
- Did not modify app logic, `App.tsx`, `src/config.ts`, `app.json`, or `eas.json`.
- Did not run any EAS build.
- Verification:
  - `package.json` JSON parse passed.
  - `git diff --check` passed.

## 2026-06-16

### Second App Store Rejection Investigation (Guideline 2.1a x2) — Fixed In Sibling `../vanpick` Web Project

- User received a second App Store rejection with two issues:
  1. Performance/App Completeness: Apple Sign In failed on iPad Air 11-inch (M3), iPadOS 26.5, with a generic in-app error.
  2. Information Needed: reviewer could not complete the provided demo (Kakao) login because Kakao's "unusual login detected" security check demanded phone/email OTP verification the reviewer could not complete.
- User explicitly authorized accessing and modifying the sibling `../vanpick` Next.js web project for this task (deviation from the usual "do not touch `../vanpick`" rule, granted per this conversation only).
- Investigated `vanpick-app/App.tsx` and `src/config.ts` first; concluded the native WebView OAuth interception logic (`isOAuthBrowserUrl`, `handleShouldStartLoad`, `openOAuthSession`, `completeAuthInWebView`) was correct and unchanged from the 2026-06-15 fix. No native app code changes were needed this round.
- Root-caused both issues in `../vanpick`:
  - **False "login failed" error (the actual Apple Sign In bug):** `components/auth/login-buttons.tsx`'s `clearWhenPageReturns()` (wired to `visibilitychange`/`focus`) fired the instant the `ASWebAuthenticationSession` modal closed and the WebView became visible again — before the native app had a chance to call `completeAuthInWebView` and navigate the WebView to `/auth/callback`. Because the WebView's `window.location.href` was still the `/login` URL at that instant, the component showed `LOGIN_START_ERROR_MESSAGE` ("로그인을 완료하지 못했습니다. 다시 시도해 주세요.") even when the underlying OAuth exchange was about to succeed. This is exactly the error visible in the user's screenshot 3 and matches Apple's "unable to complete signing up with Apple" report.
  - **Korean phone verification blocking Apple sign-up:** `app/auth/callback/route.ts` redirected any user without a `phone` on file to `/phone/verify` (Korean SMS OTP), with no exception for Apple users, even though `lib/services/vanpick.ts`'s `assertRequiredUserPhone` already exempts Apple-provider users at the profile-sync step. Apple App Review reviewers cannot complete Korean SMS verification, so even a successful Apple Sign In would dead-end here.
  - Kakao's "unusual login detected" OTP screen (screenshot 2) is a Kakao-side security control with no app/server-side bypass available; not fixed in code. Recommended replying to Apple's resolution center asking them to retest using Apple Sign In only (Kakao login is geo/device-restricted for unusual-login security reasons outside developer control).
- Fix applied in `../vanpick/components/auth/login-buttons.tsx`:
  - Wrapped the `resetLoadingWithError()` call inside `clearWhenPageReturns()` in a 600ms `setTimeout`, re-checking `pendingKeyRef.current` and `window.location.href === startHrefRef.current` after the delay. If the native app's `completeAuthInWebView` already remounted the WebView (destroying the JS context and its pending timers) within that window, the error never fires. If the user genuinely cancelled or the OAuth flow stalled, the error still shows after the short delay.
- Fix applied in `../vanpick/app/auth/callback/route.ts`:
  - Added `isAppleUser` check (`requestedProvider === "apple" || user.app_metadata?.provider === "apple"`) and added `&& !isAppleUser` to the phone-verification redirect condition (previously `!profile?.phone && !canBypassRequiredPhoneForReview(user)`). Apple Sign In users without a phone number on file now skip the `/phone/verify` redirect entirely at sign-up and proceed straight to the terms/agreements check (or directly to `next` if agreements are already on file).
  - Decision confirmed with user via AskUserQuestion: Apple users skip phone verification at signup only; `assertServicePhoneVerified` and other phone gates elsewhere in `lib/services/vanpick.ts` are unchanged, so phone is still required before Apple users can use phone-gated features (e.g. submitting a request, driver actions).
- Verification:
  - `(cd ../vanpick && npx tsc --noEmit -p tsconfig.json)` exited `0`, no type errors.
  - Did not run the Next.js dev server, lint, or any test suite in `../vanpick` (out of scope for this task; user only asked for the targeted bug fix).
  - Did not modify anything in `vanpick-app` (this native shell project) — no new EAS build is required for this round, only a `../vanpick` web deploy.
- Remaining unverified items:
  - Real-device end-to-end Apple Sign In retest (ideally on an iPad) after `../vanpick` is deployed was not performed in this environment.
  - Whether Apple's reviewer will accept "test with Apple Sign In only" as a resolution for the Kakao OTP issue is pending Apple's response; no further code-level mitigation exists for Kakao's own unusual-login security check.
  - `PHONE_BYPASS_EMAILS` env var (used by `canBypassRequiredPhoneForReview`) was not changed; not needed now that Apple users bypass phone verification by provider rather than by allow-listed email.
