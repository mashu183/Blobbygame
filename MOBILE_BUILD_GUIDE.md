# Mobile Build Guide

This guide covers building the Puzzle Quest Rush mobile app for Android and iOS platforms, including local development builds and CI/CD automation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Unified Build Script](#unified-build-script)
- [CI/CD Pipeline](#cicd-pipeline)
- [Code Signing](#code-signing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Common Requirements

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+
- **Git**

### Android Requirements

- **Java JDK** 17+
- **Android Studio** (latest stable)
- **Android SDK** (API 33+)
- **Gradle** (bundled with Android Studio)

### iOS Requirements (macOS only)

- **macOS** 13+ (Ventura or later)
- **Xcode** 15+
- **CocoaPods** (`sudo gem install cocoapods`)
- **Apple Developer Account** (for distribution)

---

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Add platforms (first time only)
npx cap add android
npx cap add ios

# Sync changes
npx cap sync

# Open in IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

### Development Workflow

1. Make changes to the web app
2. Build: `npm run build`
3. Sync: `npx cap sync`
4. Test in IDE or device

---

## Unified Build Script

Use the `build.sh` script for streamlined builds:

### Usage

```bash
# Make executable (first time only)
chmod +x build.sh

# Build for Android
./build.sh android

# Build for iOS (macOS only)
./build.sh ios

# Build for both platforms
./build.sh all

# Show help
./build.sh --help
```

### Options

| Option | Description |
|--------|-------------|
| `android` | Build Android app only |
| `ios` | Build iOS app only |
| `all` | Build both platforms |
| `--skip-deps` | Skip npm install |
| `--no-open` | Don't open IDE after build |
| `-h, --help` | Show help message |
| `-v, --version` | Show version info |

### Examples

```bash
# Build Android without opening Android Studio
./build.sh android --no-open

# Build iOS, skip npm install
./build.sh ios --skip-deps

# Build both, skip deps, don't open IDEs
./build.sh all --skip-deps --no-open
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/mobile-build.yml`) automates the entire build process.

### Triggers

- **Push to `main` branch** - Automatically builds both platforms
- **Pull requests to `main`** - Builds for validation
- **Manual dispatch** - Build on-demand with platform selection

### Workflow Jobs

```
┌─────────────────┐
│  Setup & Test   │
│  (lint, types)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Web App  │
│  (npm run build)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Android│ │  iOS  │
│ Build │ │ Build │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│ Create Release  │
│ (GitHub Release)│
└─────────────────┘
```

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Mobile App Build** workflow
3. Click **Run workflow**
4. Choose platform: `all`, `android`, or `ios`
5. Optionally enable **Create GitHub Release**

### Artifacts

The workflow produces these artifacts:

| Artifact | Description | Retention |
|----------|-------------|-----------|
| `web-build` | Built web app (dist/) | 7 days |
| `android-builds` | APK and AAB files | 30 days |
| `ios-builds` | Simulator and IPA files | 30 days |

### Build Outputs

#### Android
- `puzzle-quest-rush-v{version}-build{number}-debug.apk` - Debug APK
- `puzzle-quest-rush-v{version}-build{number}-release.apk` - Signed release APK
- `puzzle-quest-rush-v{version}-build{number}-release.aab` - App Bundle for Play Store

#### iOS
- `puzzle-quest-rush-v{version}-build{number}-simulator.zip` - Simulator build
- `puzzle-quest-rush-v{version}-build{number}.ipa` - Signed IPA for App Store

---

## Code Signing

### Required Secrets

Configure these in **Settings > Secrets and variables > Actions**:

#### Android Signing

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE` | Base64-encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias name |
| `ANDROID_KEY_PASSWORD` | Key password |

**Generate keystore:**
```bash
keytool -genkey -v -keystore release.keystore \
  -alias puzzle-quest \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Convert to base64
base64 -i release.keystore | pbcopy  # macOS
base64 release.keystore | xclip      # Linux
```

#### iOS Signing

| Secret | Description |
|--------|-------------|
| `IOS_CERTIFICATE` | Base64-encoded .p12 certificate |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password |
| `IOS_PROVISION_PROFILE` | Base64-encoded provisioning profile |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `KEYCHAIN_PASSWORD` | Temporary keychain password |

**Export certificate:**
```bash
# Export from Keychain Access as .p12
# Then convert to base64
base64 -i Certificates.p12 | pbcopy
```

#### Optional Secrets

| Secret | Description |
|--------|-------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

---

## Troubleshooting

### Common Issues

#### "Command not found: cap"
```bash
npm install @capacitor/cli --save-dev
```

#### Android SDK not found
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### iOS build fails with signing error
- Ensure provisioning profile matches bundle ID
- Check certificate is not expired
- Verify Team ID is correct

#### Gradle build fails
```bash
# Clear Gradle cache
cd android && ./gradlew clean
rm -rf ~/.gradle/caches
```

#### CocoaPods issues
```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

### Build Logs

- **Local:** Check terminal output
- **CI/CD:** Check GitHub Actions logs
- **Android Studio:** Build > Build Output
- **Xcode:** Report Navigator (Cmd+9)

---

## Version Management

Version is read from `package.json`:
```json
{
  "version": "1.0.0"
}
```

Build number is automatically set from GitHub run number in CI/CD.

### Updating Version

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

---

## Release Process

### Automated (Recommended)

1. Update version in `package.json`
2. Commit and push to `main`
3. CI/CD builds and creates draft release
4. Review and publish release on GitHub

### Manual

1. Build locally: `./build.sh all`
2. Generate signed builds in IDE
3. Create release on GitHub
4. Upload artifacts

---

## Platform-Specific Notes

### Android

- Minimum SDK: 22 (Android 5.1)
- Target SDK: 34 (Android 14)
- App Bundle (AAB) required for Play Store

### iOS

- Minimum iOS: 13.0
- Built with Xcode 15+
- Requires Apple Developer Program for distribution

---
---

## Firebase Integration

The app includes Firebase Analytics and Crashlytics for monitoring and crash reporting.

### Important: Package Name Configuration

Your app uses the package name: **`com.puzzlequestgame.app`**

When setting up Firebase, ensure you use this exact package name. See `FIREBASE_SETUP_GUIDE.md` for detailed instructions if you encounter issues.

### Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing
   - Add Android app with package name `com.puzzlequestgame.app`
   - Add iOS app with bundle ID `com.puzzlequestgame.app`

2. **Download Configuration Files:**
   - **Android:** Download `google-services.json` and place in `android/app/`
   - **iOS:** Download `GoogleService-Info.plist` and place in `ios/App/App/`

3. **Environment Variables (for web):**
   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### Firebase Features Included

| Feature | Description |
|---------|-------------|
| Analytics | User behavior tracking, events, conversions |
| Crashlytics | Crash reporting and error tracking |
| Performance | App performance monitoring |
| Cloud Messaging | Push notifications |
| Remote Config | A/B testing and feature flags |

### Android Configuration

The `android/app/build.gradle` includes:
```gradle
apply plugin: 'com.google.gms.google-services'
apply plugin: 'com.google.firebase.crashlytics'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-crashlytics'
    implementation 'com.google.firebase:firebase-perf'
    implementation 'com.google.firebase:firebase-messaging'
}
```

### iOS Configuration

Add to `ios/App/Podfile`:
```ruby
pod 'Firebase/Analytics'
pod 'Firebase/Crashlytics'
pod 'Firebase/Performance'
pod 'Firebase/Messaging'
```

### Testing Crashlytics

The app includes a built-in admin dashboard at `/admin` where you can:
- View analytics events and crash reports
- Send test events
- Trigger test crashes
- Monitor session data

You can also test programmatically:
```typescript
import { CrashReporter, Analytics } from '@/lib/analytics';

// Log a custom event
Analytics.logEvent('button_click', { button_name: 'purchase' });

// Log a non-fatal error
CrashReporter.recordNonFatal('Payment failed', { reason: 'timeout' });

// Force a test crash (for testing only!)
CrashReporter.testCrash();
```

### Required GitHub Secrets for Firebase

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON for CI/CD |
| `GOOGLE_SERVICES_JSON` | Base64-encoded google-services.json |
| `GOOGLE_SERVICE_INFO_PLIST` | Base64-encoded GoogleService-Info.plist |

---

## Analytics Dashboard

The app includes a built-in analytics dashboard for monitoring:

### Accessing the Dashboard

1. Navigate to `/admin` in your browser
2. Enter the admin password (default: `admin123`)
3. View real-time analytics data

### Dashboard Features

- **Overview:** Total events, crashes, sessions, and average session duration
- **Events Tab:** List of all tracked events with parameters and timestamps
- **Crashes Tab:** Detailed crash reports with stack traces and device info
- **Sessions Tab:** Session history with duration and event counts

### Tracked Events

The app automatically tracks:
- `app_start` - When the app launches
- `screen_view` - Screen navigation
- `level_start` - When a level begins
- `level_complete` - When a level is completed (with stars, moves, time)
- `purchase` - In-app purchases
- `ad_watched` - Rewarded ad views

---

## Support

For issues with:
- **Build script:** Check this guide's troubleshooting section
- **Capacitor:** [Capacitor Docs](https://capacitorjs.com/docs)
- **GitHub Actions:** [Actions Documentation](https://docs.github.com/en/actions)
- **Firebase:** [Firebase Documentation](https://firebase.google.com/docs)
- **Firebase Setup Issues:** See `FIREBASE_SETUP_GUIDE.md`
