// Capacitor utilities - Web-safe version
// All Capacitor functionality is accessed via window.Capacitor to avoid build issues

// Safe check for Capacitor availability
const getCapacitor = (): any => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor;
    }
    return null;
  } catch {
    return null;
  }
};

// Get Capacitor plugins from window
const getPlugins = (): any => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins) {
      return (window as any).Capacitor.Plugins;
    }
    return {};
  } catch {
    return {};
  }
};

// Check if running on native platform
export const isNative = (() => {
  try {
    const cap = getCapacitor();
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
})();

export const platform = (() => {
  try {
    const cap = getCapacitor();
    return cap?.getPlatform?.() ?? 'web';
  } catch {
    return 'web';
  }
})();

// Initialize native features
export const initializeApp = async () => {
  if (!isNative) return;

  try {
    const plugins = getPlugins();
    
    // Hide splash screen after app loads
    if (plugins.SplashScreen) {
      await plugins.SplashScreen.hide();
    }

    // Set status bar style
    if (plugins.StatusBar) {
      await plugins.StatusBar.setStyle({ style: 'Dark' });
      
      if (platform === 'android') {
        await plugins.StatusBar.setBackgroundColor({ color: '#1a1a2e' });
      }
    }
  } catch (error) {
    console.log('Native initialization error:', error);
  }
};

// Haptic feedback for game interactions
export const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isNative) return;

  try {
    const plugins = getPlugins();
    if (plugins.Haptics) {
      const styles: Record<string, string> = {
        light: 'Light',
        medium: 'Medium',
        heavy: 'Heavy'
      };
      await plugins.Haptics.impact({ style: styles[type] });
    }
  } catch (error) {
    console.log('Haptic feedback error:', error);
  }
};

// Handle back button on Android
export const setupBackButton = (callback: () => void) => {
  if (!isNative) return;

  try {
    const plugins = getPlugins();
    if (plugins.App) {
      plugins.App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        if (!canGoBack) {
          plugins.App.exitApp();
        } else {
          callback();
        }
      });
    }
  } catch (error) {
    console.log('Back button setup error:', error);
  }
};

// Handle app state changes (background/foreground)
export const setupAppStateListener = (
  onResume: () => void,
  onPause: () => void
) => {
  if (!isNative) return;

  try {
    const plugins = getPlugins();
    if (plugins.App) {
      plugins.App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive) {
          onResume();
        } else {
          onPause();
        }
      });
    }
  } catch (error) {
    console.log('App state listener error:', error);
  }
};

// Get app info
export const getAppInfo = async () => {
  if (!isNative) {
    return { name: 'Puzzle Quest Rush', version: '1.0.0', build: '1' };
  }

  try {
    const plugins = getPlugins();
    if (plugins.App) {
      const info = await plugins.App.getInfo();
      return {
        name: info.name,
        version: info.version,
        build: info.build
      };
    }
    return { name: 'Puzzle Quest Rush', version: '1.0.0', build: '1' };
  } catch (error) {
    return { name: 'Puzzle Quest Rush', version: '1.0.0', build: '1' };
  }
};
