/**
 * Analytics and Crash Reporting Service
 * Integrates with Firebase Analytics, Crashlytics, and Sentry
 */

// Safe Capacitor check for web builds
const getCapacitor = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor;
    }
    return null;
  } catch {
    return null;
  }
};

const isNativePlatform = () => {
  try {
    const cap = getCapacitor();
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
};

const getPlatform = () => {
  try {
    const cap = getCapacitor();
    return cap?.getPlatform?.() ?? 'web';
  } catch {
    return 'web';
  }
};

// Types for analytics events
export interface AnalyticsEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface CrashReport {
  id: string;
  error: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  deviceInfo?: DeviceInfo;
  customData?: Record<string, unknown>;
  severity: 'fatal' | 'error' | 'warning' | 'info';
}

export interface DeviceInfo {
  platform: string;
  version?: string;
  model?: string;
  manufacturer?: string;
  isNative: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export interface UserProperties {
  userId?: string;
  username?: string;
  level?: number;
  isPremium?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// In-memory storage for analytics (for demo/admin dashboard)
class AnalyticsStore {
  private events: AnalyticsEvent[] = [];
  private crashes: CrashReport[] = [];
  private sessions: { id: string; startTime: number; endTime?: number; events: number }[] = [];
  private currentSession: { id: string; startTime: number; events: number } | null = null;
  private userProperties: UserProperties = {};

  constructor() {
    this.loadFromStorage();
    this.startSession();
  }

  private loadFromStorage() {
    try {
      const storedEvents = localStorage.getItem('analytics_events');
      const storedCrashes = localStorage.getItem('analytics_crashes');
      const storedSessions = localStorage.getItem('analytics_sessions');
      
      if (storedEvents) this.events = JSON.parse(storedEvents);
      if (storedCrashes) this.crashes = JSON.parse(storedCrashes);
      if (storedSessions) this.sessions = JSON.parse(storedSessions);
    } catch (e) {
      console.warn('Failed to load analytics from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      // Keep only last 1000 events and 100 crashes
      const recentEvents = this.events.slice(-1000);
      const recentCrashes = this.crashes.slice(-100);
      const recentSessions = this.sessions.slice(-50);
      
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
      localStorage.setItem('analytics_crashes', JSON.stringify(recentCrashes));
      localStorage.setItem('analytics_sessions', JSON.stringify(recentSessions));
    } catch (e) {
      console.warn('Failed to save analytics to storage:', e);
    }
  }

  startSession() {
    if (this.currentSession) {
      this.endSession();
    }
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      events: 0,
    };
  }

  endSession() {
    if (this.currentSession) {
      this.sessions.push({
        ...this.currentSession,
        endTime: Date.now(),
      });
      this.currentSession = null;
      this.saveToStorage();
    }
  }

  addEvent(event: AnalyticsEvent) {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };
    this.events.push(eventWithTimestamp);
    if (this.currentSession) {
      this.currentSession.events++;
    }
    this.saveToStorage();
  }

  addCrash(crash: CrashReport) {
    this.crashes.push(crash);
    this.saveToStorage();
  }

  setUserProperties(props: UserProperties) {
    this.userProperties = { ...this.userProperties, ...props };
  }

  getUserProperties(): UserProperties {
    return this.userProperties;
  }

  getEvents(limit?: number): AnalyticsEvent[] {
    const events = [...this.events].reverse();
    return limit ? events.slice(0, limit) : events;
  }

  getCrashes(limit?: number): CrashReport[] {
    const crashes = [...this.crashes].reverse();
    return limit ? crashes.slice(0, limit) : crashes;
  }

  getSessions(limit?: number): typeof this.sessions {
    const sessions = [...this.sessions].reverse();
    return limit ? sessions.slice(0, limit) : sessions;
  }

  getStats() {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const eventsToday = this.events.filter(e => (e.timestamp || 0) > dayAgo).length;
    const eventsThisWeek = this.events.filter(e => (e.timestamp || 0) > weekAgo).length;
    const crashesToday = this.crashes.filter(c => c.timestamp > dayAgo).length;
    const crashesThisWeek = this.crashes.filter(c => c.timestamp > weekAgo).length;
    const sessionsToday = this.sessions.filter(s => s.startTime > dayAgo).length;
    const sessionsThisWeek = this.sessions.filter(s => s.startTime > weekAgo).length;

    // Calculate average session duration
    const completedSessions = this.sessions.filter(s => s.endTime);
    const avgSessionDuration = completedSessions.length > 0
      ? completedSessions.reduce((acc, s) => acc + ((s.endTime || 0) - s.startTime), 0) / completedSessions.length
      : 0;

    // Event breakdown by type
    const eventBreakdown: Record<string, number> = {};
    this.events.forEach(e => {
      eventBreakdown[e.name] = (eventBreakdown[e.name] || 0) + 1;
    });

    // Crash breakdown by severity
    const crashBreakdown: Record<string, number> = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
    };
    this.crashes.forEach(c => {
      crashBreakdown[c.severity]++;
    });

    return {
      totalEvents: this.events.length,
      totalCrashes: this.crashes.length,
      totalSessions: this.sessions.length,
      eventsToday,
      eventsThisWeek,
      crashesToday,
      crashesThisWeek,
      sessionsToday,
      sessionsThisWeek,
      avgSessionDuration,
      eventBreakdown,
      crashBreakdown,
      currentSession: this.currentSession,
    };
  }

  clearAll() {
    this.events = [];
    this.crashes = [];
    this.sessions = [];
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_crashes');
    localStorage.removeItem('analytics_sessions');
  }
}

// Singleton instance
const analyticsStore = new AnalyticsStore();

// Get device info
function getDeviceInfo(): DeviceInfo {
  return {
    platform: getPlatform(),
    isNative: isNativePlatform(),
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

// Generate unique crash ID
function generateCrashId(): string {
  return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Analytics Service - Main API
 */
export const Analytics = {
  /**
   * Initialize analytics
   */
  init() {
    console.log('[Analytics] Initialized');
    
    // Track app start
    this.logEvent('app_start', {
      platform: getPlatform(),
      isNative: isNativePlatform(),
    });

    // Setup visibility change listener for session tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          analyticsStore.endSession();
        } else {
          analyticsStore.startSession();
        }
      });
    }

    // Setup beforeunload for session end
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        analyticsStore.endSession();
      });
    }
  },

  /**
   * Log a custom event
   */
  logEvent(name: string, params?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = { name, params };
    analyticsStore.addEvent(event);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics Event]', name, params);
    }

    // Send to Firebase Analytics if available (native)
    if (isNativePlatform()) {
      // Firebase Analytics will be handled by native plugin
      // @ts-ignore - FirebaseAnalytics plugin
      if (typeof window !== 'undefined' && (window as any).FirebaseAnalytics) {
        // @ts-ignore
        (window as any).FirebaseAnalytics.logEvent({ name, params });
      }
    }
  },

  /**
   * Set user properties
   */
  setUserProperties(props: UserProperties) {
    analyticsStore.setUserProperties(props);
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User properties set:', props);
    }
  },

  /**
   * Set user ID
   */
  setUserId(userId: string) {
    analyticsStore.setUserProperties({ userId });
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User ID set:', userId);
    }
  },

  /**
   * Log screen view
   */
  logScreenView(screenName: string, screenClass?: string) {
    this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  },

  /**
   * Log level start
   */
  logLevelStart(levelId: number, levelName?: string) {
    this.logEvent('level_start', {
      level_id: levelId,
      level_name: levelName || `Level ${levelId}`,
    });
  },

  /**
   * Log level complete
   */
  logLevelComplete(levelId: number, stars: number, moves: number, timeSpent?: number) {
    this.logEvent('level_complete', {
      level_id: levelId,
      stars,
      moves,
      time_spent: timeSpent || 0,
    });
  },

  /**
   * Log purchase
   */
  logPurchase(itemId: string, itemName: string, price: number, currency: string = 'USD') {
    this.logEvent('purchase', {
      item_id: itemId,
      item_name: itemName,
      price,
      currency,
    });
  },

  /**
   * Log ad watched
   */
  logAdWatched(adType: string, reward?: string) {
    this.logEvent('ad_watched', {
      ad_type: adType,
      reward: reward || 'none',
    });
  },

  /**
   * Get analytics store for admin dashboard
   */
  getStore() {
    return analyticsStore;
  },
};

/**
 * Crash Reporting Service
 */

// Error patterns to ignore (from browser extensions, external tools, etc.)
const IGNORED_ERROR_PATTERNS = [
  'AI generation error',
  'fetch failed',
  'Extension context invalidated',
  'ResizeObserver loop',
  'Script error',
  'Non-Error promise rejection',
];

export const CrashReporter = {
  /**
   * Initialize crash reporting
   */
  init() {
    console.log('[CrashReporter] Initialized');
    
    if (typeof window === 'undefined') return;
    
    // Setup global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = String(message);
      // Skip external/suppressed errors
      const shouldIgnore = IGNORED_ERROR_PATTERNS.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      if (shouldIgnore) {
        return true; // Prevent default handling
      }
      
      this.recordError(error || new Error(String(message)), {
        source,
        lineno,
        colno,
      });
      return false; // Let the error propagate
    };

    // Setup unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      const errorMessage = String(event.reason);
      // Skip external/suppressed errors
      const shouldIgnore = IGNORED_ERROR_PATTERNS.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      if (shouldIgnore) {
        event.preventDefault();
        return;
      }
      
      this.recordError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandled_promise_rejection' }
      );
    };
  },


  /**
   * Record an error/crash
   */
  recordError(
    error: Error,
    customData?: Record<string, unknown>,
    severity: CrashReport['severity'] = 'error'
  ) {
    const crash: CrashReport = {
      id: generateCrashId(),
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userId: analyticsStore.getUserProperties().userId,
      deviceInfo: getDeviceInfo(),
      customData,
      severity,
    };

    analyticsStore.addCrash(crash);

    // Log to console
    console.error('[CrashReporter]', severity.toUpperCase(), error.message, customData);

    // Send to Firebase Crashlytics if available (native)
    if (isNativePlatform()) {
      // @ts-ignore - FirebaseCrashlytics plugin
      if (typeof window !== 'undefined' && (window as any).FirebaseCrashlytics) {
        // @ts-ignore
        (window as any).FirebaseCrashlytics.recordException({
          message: error.message,
          stackTrace: error.stack,
        });
      }
    }

    // Send to Sentry if configured
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
      this.sendToSentry(crash, sentryDsn);
    }
  },

  /**
   * Record a non-fatal error
   */
  recordNonFatal(message: string, customData?: Record<string, unknown>) {
    this.recordError(new Error(message), customData, 'warning');
  },

  /**
   * Log a message (breadcrumb)
   */
  log(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    const crash: CrashReport = {
      id: generateCrashId(),
      error: message,
      timestamp: Date.now(),
      userId: analyticsStore.getUserProperties().userId,
      deviceInfo: getDeviceInfo(),
      severity: level,
    };

    analyticsStore.addCrash(crash);

    if (import.meta.env.DEV) {
      console.log(`[CrashReporter ${level.toUpperCase()}]`, message);
    }
  },

  /**
   * Set custom key-value for crash reports
   */
  setCustomKey(key: string, value: string | number | boolean) {
    // Store for future crash reports
    if (import.meta.env.DEV) {
      console.log('[CrashReporter] Custom key set:', key, value);
    }
  },

  /**
   * Force a test crash (for testing Crashlytics)
   */
  testCrash() {
    this.recordError(new Error('Test crash from CrashReporter.testCrash()'), {
      isTestCrash: true,
    }, 'fatal');
    
    // Actually throw to test native crash reporting
    throw new Error('Test crash - this is intentional');
  },

  /**
   * Send crash to Sentry
   */
  sendToSentry(crash: CrashReport, dsn: string) {
    try {
      const envelope = {
        event_id: crash.id.replace('crash_', ''),
        timestamp: crash.timestamp / 1000,
        platform: 'javascript',
        level: crash.severity === 'fatal' ? 'fatal' : crash.severity,
        message: crash.error,
        stacktrace: crash.stack ? { frames: [{ filename: 'app', function: crash.stack }] } : undefined,
        user: crash.userId ? { id: crash.userId } : undefined,
        contexts: { device: crash.deviceInfo },
        extra: crash.customData,
      };

      const dsnMatch = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
      if (dsnMatch) {
        const [, publicKey, host, projectId] = dsnMatch;
        const endpoint = `https://${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
        }).catch(e => console.warn('Failed to send to Sentry:', e));
      }
    } catch (e) {
      console.warn('Failed to send to Sentry:', e);
    }
  },

};

// Export store for admin dashboard
export { analyticsStore };
