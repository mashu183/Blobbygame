#!/bin/bash

# ============================================
# Android Build Script
# ============================================
# This script automates the Android build process
# Run with: ./build-android.sh
# ============================================

set -e  # Exit on any error

echo "============================================"
echo "🚀 Android Build Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_status "Java installed: $JAVA_VERSION"
else
    print_warning "Java not found in PATH. Android Studio may still work if JDK is configured there."
fi

echo ""
echo "============================================"
echo "Step 1: Installing dependencies..."
echo "============================================"
npm install
print_status "Dependencies installed"

echo ""
echo "============================================"
echo "Step 2: Building the web app..."
echo "============================================"
npm run build
print_status "Web app built successfully"

echo ""
echo "============================================"
echo "Step 3: Adding Android platform..."
echo "============================================"
if [ -d "android" ]; then
    print_warning "Android platform already exists, skipping add..."
else
    npx cap add android
    print_status "Android platform added"
fi

echo ""
echo "============================================"
echo "Step 4: Syncing with Capacitor..."
echo "============================================"
npx cap sync android
print_status "Capacitor sync complete"

echo ""
echo "============================================"
echo "Step 5: Opening Android Studio..."
echo "============================================"
echo ""
print_warning "Android Studio will now open."
echo ""
echo "To generate a signed APK/AAB:"
echo "  1. Go to Build > Generate Signed Bundle / APK"
echo "  2. Choose 'Android App Bundle' (for Play Store) or 'APK'"
echo "  3. Create or select your keystore file"
echo "  4. Select 'release' build variant"
echo "  5. Click 'Finish'"
echo ""
echo "Your build will be in: android/app/release/"
echo ""

npx cap open android

echo ""
echo "============================================"
print_status "Build script completed!"
echo "============================================"
