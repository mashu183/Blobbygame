#!/bin/bash

# ============================================
# Unified Mobile Build Script
# ============================================
# Build for Android, iOS, or both platforms
# 
# Usage:
#   ./build.sh android     - Build for Android only
#   ./build.sh ios         - Build for iOS only
#   ./build.sh all         - Build for both platforms
#   ./build.sh --help      - Show help
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Platform flags
BUILD_ANDROID=false
BUILD_IOS=false

# ============================================
# Helper Functions
# ============================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Unified Mobile Build Script${NC}              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Build for Android & iOS                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_step() {
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_help() {
    print_banner
    echo "Usage: ./build.sh [PLATFORM] [OPTIONS]"
    echo ""
    echo "Platforms:"
    echo "  android          Build for Android only"
    echo "  ios              Build for iOS only (requires macOS)"
    echo "  all              Build for both Android and iOS"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -v, --version    Show script version"
    echo "  --skip-deps      Skip npm install step"
    echo "  --no-open        Don't open IDE after build"
    echo ""
    echo "Examples:"
    echo "  ./build.sh android           # Build Android only"
    echo "  ./build.sh ios               # Build iOS only"
    echo "  ./build.sh all               # Build both platforms"
    echo "  ./build.sh android --no-open # Build Android without opening Android Studio"
    echo ""
    echo "Requirements:"
    echo "  Android: Node.js, npm, Java JDK 17+, Android Studio"
    echo "  iOS:     Node.js, npm, macOS, Xcode, CocoaPods"
    echo ""
}

show_version() {
    echo "Unified Mobile Build Script v1.0.0"
}

# ============================================
# Prerequisite Checks
# ============================================

check_common_prerequisites() {
    print_step "Checking Common Prerequisites"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_status "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js first."
        echo "  Download from: https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_status "npm installed: v$NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

check_android_prerequisites() {
    print_step "Checking Android Prerequisites"
    
    # Check Java
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        print_status "Java installed: $JAVA_VERSION"
    else
        print_warning "Java not found in PATH."
        echo "  Android Studio may still work if JDK is configured internally."
        echo "  Recommended: Install JDK 17 or higher"
    fi

    # Check ANDROID_HOME
    if [ -n "$ANDROID_HOME" ]; then
        print_status "ANDROID_HOME is set: $ANDROID_HOME"
    else
        print_warning "ANDROID_HOME environment variable not set."
        echo "  This may cause issues with command-line builds."
    fi

    # Check for Android Studio (basic check)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/Android Studio.app" ]; then
            print_status "Android Studio found"
        else
            print_warning "Android Studio not found in /Applications"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v studio.sh &> /dev/null || [ -d "$HOME/android-studio" ]; then
            print_status "Android Studio appears to be installed"
        else
            print_warning "Android Studio not detected"
        fi
    fi
}

check_ios_prerequisites() {
    print_step "Checking iOS Prerequisites"
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds require macOS. Current OS: $OSTYPE"
        echo "  You cannot build iOS apps on Windows or Linux."
        return 1
    fi
    
    print_status "Running on macOS"

    # Check Xcode
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -n 1)
        print_status "Xcode installed: $XCODE_VERSION"
    else
        print_error "Xcode is not installed or xcodebuild not available."
        echo "  Install Xcode from the Mac App Store"
        echo "  Then run: sudo xcode-select --install"
        return 1
    fi

    # Check Xcode Command Line Tools
    if xcode-select -p &> /dev/null; then
        print_status "Xcode Command Line Tools installed"
    else
        print_warning "Xcode Command Line Tools may not be installed"
        echo "  Run: sudo xcode-select --install"
    fi

    # Check CocoaPods
    if command -v pod &> /dev/null; then
        POD_VERSION=$(pod --version)
        print_status "CocoaPods installed: v$POD_VERSION"
    else
        print_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
        if [ $? -eq 0 ]; then
            print_status "CocoaPods installed successfully"
        else
            print_error "Failed to install CocoaPods"
            echo "  Try: sudo gem install cocoapods"
            return 1
        fi
    fi

    return 0
}

# ============================================
# Build Steps
# ============================================

install_dependencies() {
    if [ "$SKIP_DEPS" = true ]; then
        print_info "Skipping dependency installation (--skip-deps)"
        return
    fi
    
    print_step "Installing Dependencies"
    npm install
    print_status "Dependencies installed"
}

build_web_app() {
    print_step "Building Web App"
    npm run build
    print_status "Web app built successfully"
}

build_android() {
    print_step "Building for Android"
    
    # Add Android platform if not exists
    if [ -d "android" ]; then
        print_info "Android platform already exists"
    else
        print_info "Adding Android platform..."
        npx cap add android
        print_status "Android platform added"
    fi

    # Sync with Capacitor
    print_info "Syncing with Capacitor..."
    npx cap sync android
    print_status "Android sync complete"

    # Open Android Studio
    if [ "$NO_OPEN" = true ]; then
        print_info "Skipping Android Studio launch (--no-open)"
    else
        print_step "Opening Android Studio"
        echo ""
        echo -e "${CYAN}Android Studio Instructions:${NC}"
        echo "  1. Wait for Gradle sync to complete"
        echo "  2. Go to Build > Generate Signed Bundle / APK"
        echo "  3. Choose 'Android App Bundle' (for Play Store) or 'APK'"
        echo "  4. Create or select your keystore file"
        echo "  5. Select 'release' build variant"
        echo "  6. Click 'Finish'"
        echo ""
        echo "  Output location: android/app/release/"
        echo ""
        npx cap open android
    fi
    
    print_status "Android build preparation complete"
}

build_ios() {
    print_step "Building for iOS"
    
    # Add iOS platform if not exists
    if [ -d "ios" ]; then
        print_info "iOS platform already exists"
    else
        print_info "Adding iOS platform..."
        npx cap add ios
        print_status "iOS platform added"
    fi

    # Sync with Capacitor
    print_info "Syncing with Capacitor..."
    npx cap sync ios
    print_status "iOS sync complete"

    # Install CocoaPods dependencies
    print_info "Installing CocoaPods dependencies..."
    cd ios/App
    pod install
    cd ../..
    print_status "CocoaPods dependencies installed"

    # Open Xcode
    if [ "$NO_OPEN" = true ]; then
        print_info "Skipping Xcode launch (--no-open)"
    else
        print_step "Opening Xcode"
        echo ""
        echo -e "${CYAN}Xcode Instructions:${NC}"
        echo "  1. Select your development team in Signing & Capabilities"
        echo "  2. Update the Bundle Identifier if needed"
        echo "  3. Select a target device or 'Any iOS Device'"
        echo "  4. Go to Product > Archive (for App Store)"
        echo "  5. Or Product > Build for distribution"
        echo ""
        echo "  For TestFlight:"
        echo "    - Archive > Distribute App > App Store Connect"
        echo ""
        echo "  For Ad Hoc distribution:"
        echo "    - Archive > Distribute App > Ad Hoc"
        echo ""
        npx cap open ios
    fi
    
    print_status "iOS build preparation complete"
}

# ============================================
# Summary
# ============================================

print_summary() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Build Complete!${NC}                          ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ "$BUILD_ANDROID" = true ]; then
        echo -e "${GREEN}Android:${NC} Ready for build in Android Studio"
        echo "  Project: ./android"
        echo "  Output:  ./android/app/release/"
        echo ""
    fi
    
    if [ "$BUILD_IOS" = true ]; then
        echo -e "${GREEN}iOS:${NC} Ready for build in Xcode"
        echo "  Project: ./ios/App/App.xcworkspace"
        echo "  Output:  Via Xcode Archive"
        echo ""
    fi
    
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Complete the build in the opened IDE"
    echo "  2. Sign your app with appropriate certificates"
    echo "  3. Test on real devices before publishing"
    echo "  4. Submit to App Store / Play Store"
    echo ""
}

# ============================================
# Main Script
# ============================================

# Parse command line arguments
SKIP_DEPS=false
NO_OPEN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        android)
            BUILD_ANDROID=true
            shift
            ;;
        ios)
            BUILD_IOS=true
            shift
            ;;
        all)
            BUILD_ANDROID=true
            BUILD_IOS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            show_version
            exit 0
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --no-open)
            NO_OPEN=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help if no platform specified
if [ "$BUILD_ANDROID" = false ] && [ "$BUILD_IOS" = false ]; then
    show_help
    exit 0
fi

# Start build process
print_banner

echo -e "${BOLD}Build Configuration:${NC}"
echo "  Android: $([ "$BUILD_ANDROID" = true ] && echo "Yes" || echo "No")"
echo "  iOS:     $([ "$BUILD_IOS" = true ] && echo "Yes" || echo "No")"
echo "  Skip Dependencies: $([ "$SKIP_DEPS" = true ] && echo "Yes" || echo "No")"
echo "  Open IDE: $([ "$NO_OPEN" = true ] && echo "No" || echo "Yes")"

# Check common prerequisites
check_common_prerequisites

# Check platform-specific prerequisites
if [ "$BUILD_ANDROID" = true ]; then
    check_android_prerequisites
fi

if [ "$BUILD_IOS" = true ]; then
    if ! check_ios_prerequisites; then
        if [ "$BUILD_ANDROID" = true ]; then
            print_warning "iOS prerequisites not met. Continuing with Android only."
            BUILD_IOS=false
        else
            print_error "iOS prerequisites not met. Cannot continue."
            exit 1
        fi
    fi
fi

# Install dependencies
install_dependencies

# Build web app
build_web_app

# Build for selected platforms
if [ "$BUILD_ANDROID" = true ]; then
    build_android
fi

if [ "$BUILD_IOS" = true ]; then
    build_ios
fi

# Print summary
print_summary

exit 0
