import React, { useState, useEffect } from 'react';
import { Analytics, CrashReporter, analyticsStore, AnalyticsEvent, CrashReport } from '@/lib/analytics';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${
      active
        ? 'bg-purple-500 text-white'
        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const formatTimestamp = (ts: number): string => {
  const date = new Date(ts);
  return date.toLocaleString();
};

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'crashes' | 'sessions'>('overview');
  const [stats, setStats] = useState(analyticsStore.getStats());
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [crashes, setCrashes] = useState<CrashReport[]>([]);
  const [sessions, setSessions] = useState<ReturnType<typeof analyticsStore.getSessions>>([]);

  useEffect(() => {
    // Refresh data
    const refreshData = () => {
      setStats(analyticsStore.getStats());
      setEvents(analyticsStore.getEvents(100));
      setCrashes(analyticsStore.getCrashes(50));
      setSessions(analyticsStore.getSessions(20));
    };

    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analyticsStore.clearAll();
      setStats(analyticsStore.getStats());
      setEvents([]);
      setCrashes([]);
      setSessions([]);
    }
  };

  const handleTestCrash = () => {
    if (confirm('This will trigger a test crash. Continue?')) {
      try {
        CrashReporter.testCrash();
      } catch (e) {
        // Expected - the crash is caught by error boundary
      }
    }
  };

  const handleTestEvent = () => {
    Analytics.logEvent('test_event', {
      source: 'admin_dashboard',
      timestamp: Date.now(),
    });
    setStats(analyticsStore.getStats());
    setEvents(analyticsStore.getEvents(100));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'text-red-400 bg-red-500/20';
      case 'error': return 'text-orange-400 bg-orange-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Monitor app performance, crashes, and user behavior</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </Tab>
            <Tab active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
              Events ({stats.totalEvents})
            </Tab>
            <Tab active={activeTab === 'crashes'} onClick={() => setActiveTab('crashes')}>
              Crashes ({stats.totalCrashes})
            </Tab>
            <Tab active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')}>
              Sessions ({stats.totalSessions})
            </Tab>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Events"
                  value={stats.totalEvents}
                  subtitle={`${stats.eventsToday} today`}
                  icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Total Crashes"
                  value={stats.totalCrashes}
                  subtitle={`${stats.crashesToday} today`}
                  icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  color="bg-red-500"
                />
                <StatCard
                  title="Sessions"
                  value={stats.totalSessions}
                  subtitle={`${stats.sessionsToday} today`}
                  icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  color="bg-green-500"
                />
                <StatCard
                  title="Avg Session"
                  value={formatDuration(stats.avgSessionDuration)}
                  subtitle="duration"
                  icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  color="bg-purple-500"
                />
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Event Breakdown */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Event Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.eventBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([name, count]) => (
                        <div key={name} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300 font-mono">{name}</span>
                              <span className="text-gray-500">{count}</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    {Object.keys(stats.eventBreakdown).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No events recorded yet</p>
                    )}
                  </div>
                </div>

                {/* Crash Breakdown */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Crash Severity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(stats.crashBreakdown).map(([severity, count]) => (
                      <div
                        key={severity}
                        className={`p-4 rounded-lg ${getSeverityColor(severity)}`}
                      >
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm capitalize">{severity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleTestEvent}
                  className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Send Test Event
                </button>
                <button
                  onClick={handleTestCrash}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Test Crash
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Data
                </button>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Parameters</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {events.map((event, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-purple-400">{event.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded">
                            {event.params ? JSON.stringify(event.params) : '-'}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {event.timestamp ? formatTimestamp(event.timestamp) : '-'}
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No events recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Crashes Tab */}
          {activeTab === 'crashes' && (
            <div className="space-y-4">
              {crashes.map((crash) => (
                <div
                  key={crash.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(crash.severity)}`}>
                        {crash.severity.toUpperCase()}
                      </span>
                      <span className="text-white font-medium">{crash.error}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatTimestamp(crash.timestamp)}</span>
                  </div>
                  {crash.stack && (
                    <details className="p-4">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
                        Stack Trace
                      </summary>
                      <pre className="mt-3 text-xs text-gray-500 overflow-auto max-h-40 bg-gray-900/50 p-3 rounded">
                        {crash.stack}
                      </pre>
                    </details>
                  )}
                  {crash.deviceInfo && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400">
                        {crash.deviceInfo.platform}
                      </span>
                      <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400">
                        {crash.deviceInfo.screenWidth}x{crash.deviceInfo.screenHeight}
                      </span>
                      {crash.userId && (
                        <span className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400">
                          User: {crash.userId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {crashes.length === 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
                  <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">No crashes recorded - great job!</p>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Session ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Start Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Events</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.currentSession && (
                      <tr className="bg-green-500/10">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{stats.currentSession.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatTimestamp(stats.currentSession.startTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDuration(Date.now() - stats.currentSession.startTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{stats.currentSession.events}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            Active
                          </span>
                        </td>
                      </tr>
                    )}
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{session.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatTimestamp(session.startTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {session.endTime ? formatDuration(session.endTime - session.startTime) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{session.events}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-medium">
                            Ended
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sessions.length === 0 && !stats.currentSession && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No sessions recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Analytics data is stored locally. For production, connect to Firebase Analytics or Sentry.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
