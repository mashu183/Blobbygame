# Firebase Setup Guide for Puzzle Quest Rush

## 🚨 Important: Package Name Issue

Your Firebase project was created with an **invalid package name**: `Www.blobbygame.com`

Android package names must:
- Be lowercase
- Use reverse domain notation (e.g., `com.example.app`)
- Not start with numbers or contain special characters

Your app's correct package name is: **`com.puzzlequestgame.app`**

---

## Step 1: Fix Firebase Android App Configuration

### Option A: Delete and Recreate the Android App (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. Find the Android app with package name `Www.blobbygame.com`
6. Click the **three dots** (⋮) menu → **Remove this app**
7. Confirm deletion

### Option B: Add a New Android App with Correct Package Name

1. In Firebase Console, go to **Project settings**
2. Click **Add app** → Select **Android** icon
3. Enter the following details:

| Field | Value |
|-------|-------|
| **Android package name** | `com.puzzlequestgame.app` |
| **App nickname** | Puzzle Quest Rush |
| **Debug signing certificate SHA-1** | (Optional, add later for Google Sign-In) |

4. Click **Register app**

---

## Step 2: Download google-services.json

After registering your app with the correct package name:

1. Click **Download google-services.json**
2. Save the file to your project in: `android/app/google-services.json`

Your file structure should look like:
```
your-project/
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   ├── google-services.json  ← Place file here
│   │   └── src/
│   └── build.gradle
├── capacitor.config.ts
└── ...
```

---

## Step 3: Verify google-services.json Contents

Your `google-services.json` should contain the correct package name. Open it and verify:

```json
{
  "project_info": {
    "project_number": "750245400056",
    "project_id": "your-project-id",
    "storage_bucket": "your-project-id.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:750245400056:android:xxxxxxxxxxxx",
        "android_client_info": {
          "package_name": "com.puzzlequestgame.app"  // ← Must match this!
        }
      },
      ...
    }
  ]
}
```

⚠️ **The `package_name` MUST be `com.puzzlequestgame.app`**

---

## Step 4: Enable Firebase Services

### Enable Analytics
1. In Firebase Console, go to **Analytics** → **Dashboard**
2. Analytics is enabled by default when you add an Android app

### Enable Crashlytics
1. Go to **Crashlytics** in the left menu
2. Click **Enable Crashlytics**
3. You'll see "Waiting for your app to communicate" - this is normal until you run the app

### Enable Performance Monitoring (Optional)
1. Go to **Performance** in the left menu
2. Click **Get started**

---

## Step 5: Build and Test

### Build the Android App
```bash
# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Test Firebase Connection
1. Run the app on a device or emulator
2. Navigate through the app to generate analytics events
3. Check Firebase Console → Analytics → Realtime to see events

### Test Crashlytics
1. In the app, you can trigger a test crash (we'll add this feature)
2. Or add this code temporarily to test:
```javascript
// In any component, add a button that crashes:
<button onClick={() => { throw new Error('Test Crashlytics'); }}>
  Test Crash
</button>
```
3. Run the app, trigger the crash, then reopen the app
4. Check Firebase Console → Crashlytics to see the crash report

---

## Step 6: Configure for CI/CD (GitHub Actions)

### Add google-services.json to GitHub Secrets

1. Base64 encode your google-services.json:
```bash
# On Mac/Linux
base64 -i android/app/google-services.json | tr -d '\n'

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android/app/google-services.json"))
```

2. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

3. Add a new secret:
   - Name: `GOOGLE_SERVICES_JSON`
   - Value: (paste the base64 encoded string)

---

## Troubleshooting

### "No data received in past 48 hours"
- Ensure `google-services.json` has the correct package name
- Make sure you've run the app at least once after configuration
- Check that Firebase Analytics is enabled in your project
- Wait up to 24 hours for data to appear in the dashboard

### Build Errors
```
File google-services.json is missing
```
- Download `google-services.json` from Firebase Console
- Place it in `android/app/` directory

```
No matching client found for package name
```
- The package name in `google-services.json` doesn't match your app
- Re-register your Android app with package name `com.puzzlequestgame.app`

### Crashlytics Not Receiving Reports
1. Make sure the app crashed and was reopened (crashes are sent on next launch)
2. Check that Crashlytics is enabled in Firebase Console
3. Verify the google-services.json is correctly placed

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Package Name** | `com.puzzlequestgame.app` |
| **App Name** | Puzzle Quest Rush |
| **Min SDK** | 22 |
| **Target SDK** | 34 |
| **google-services.json location** | `android/app/google-services.json` |

---

## Firebase Services Included

| Service | Status | Description |
|---------|--------|-------------|
| Analytics | ✅ Configured | Track user behavior and app usage |
| Crashlytics | ✅ Configured | Crash reporting and analysis |
| Performance | ✅ Configured | Monitor app performance |
| Cloud Messaging | ✅ Configured | Push notifications |
| Remote Config | ✅ Configured | Dynamic app configuration |

---

## Need More Help?

- [Firebase Android Setup Guide](https://firebase.google.com/docs/android/setup)
- [Crashlytics Setup Guide](https://firebase.google.com/docs/crashlytics/get-started?platform=android)
- [Analytics Setup Guide](https://firebase.google.com/docs/analytics/get-started?platform=android)
