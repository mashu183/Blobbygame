import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, RefreshCw, Download, Upload, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CloudSavePreview {
  username: string;
  displayName: string;
  avatarColor: string;
  coins: number;
  currentLevel: number;
  lastSyncedAt: string;
}

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string | null;
  onLogin: (username: string, cloudData?: any) => void;
  onSync: () => Promise<void>;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  gameState: any;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onLogin,
  onSync,
  lastSyncedAt,
  isSyncing,
  gameState,
}) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cloudPreview, setCloudPreview] = useState<CloudSavePreview | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingCloudData, setPendingCloudData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setCloudPreview(null);
      setShowConflictDialog(false);
      setPendingCloudData(null);
    }
  }, [isOpen]);

  const checkUsername = async (name: string) => {
    if (name.length < 3) {
      setCloudPreview(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('cloud-sync', {
        body: { action: 'check', username: name },
      });

      if (error) throw error;
      
      if (data.exists) {
        setCloudPreview(data.preview);
      } else {
        setCloudPreview(null);
      }
    } catch (err) {
      console.error('Error checking username:', err);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(value);
    setError(null);
    
    // Debounce the check
    const timeoutId = setTimeout(() => checkUsername(value), 500);
    return () => clearTimeout(timeoutId);
  };


  const handleLogin = async () => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if cloud save exists
      const { data, error } = await supabase.functions.invoke('cloud-sync', {
        body: { action: 'load', username },
      });

      if (error) throw error;

      if (data.exists) {
        // Cloud save exists - check for conflicts
        const cloudLevel = data.cloudSave.currentLevel || 1;
        const localLevel = gameState.currentLevel || 1;
        const cloudCoins = data.cloudSave.coins || 0;
        const localCoins = gameState.coins || 0;

        // If local progress is significantly different, show conflict dialog
        if (localLevel > 5 && (localLevel > cloudLevel + 5 || localCoins > cloudCoins + 100)) {
          setPendingCloudData(data.cloudSave);
          setShowConflictDialog(true);
          setIsLoading(false);
          return;
        }

        // Load cloud data
        onLogin(username, data.cloudSave);
        setSuccess('Cloud save loaded successfully!');
      } else {
        // No cloud save - create new account and save current progress
        const { data: saveData, error: saveError } = await supabase.functions.invoke('cloud-sync', {
          body: { 
            action: 'save', 
            username,
            gameState: {
              ...gameState,
              displayName: username,
            }
          },
        });

        if (saveError) throw saveError;

        onLogin(username);
        setSuccess('New cloud account created! Your progress has been saved.');
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConflictChoice = (useCloud: boolean) => {
    if (useCloud && pendingCloudData) {
      onLogin(username, pendingCloudData);
      setSuccess('Cloud save loaded!');
    } else {
      // Keep local and upload to cloud
      onLogin(username);
      onSync();
      setSuccess('Local progress saved to cloud!');
    }
    setShowConflictDialog(false);
    setTimeout(() => onClose(), 1500);
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cloud Sync</h2>
              <p className="text-xs text-gray-400">Save & sync across devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Conflict Dialog */}
          {showConflictDialog && pendingCloudData && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-500">Save Conflict Detected</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Your local progress differs from your cloud save. Which would you like to keep?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Cloud Save Option */}
                <button
                  onClick={() => handleConflictChoice(true)}
                  className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Use Cloud</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Level: {pendingCloudData.currentLevel}</p>
                    <p>Coins: {pendingCloudData.coins}</p>
                  </div>
                </button>

                {/* Local Save Option */}
                <button
                  onClick={() => handleConflictChoice(false)}
                  className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Keep Local</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Level: {gameState.currentLevel}</p>
                    <p>Coins: {gameState.coins}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Already logged in */}
          {currentUsername && !showConflictDialog && (
            <>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: gameState.avatarColor || '#8B5CF6' }}
                  >
                    {currentUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-green-400 font-medium">Logged in as</p>
                    <p className="text-white font-bold">{gameState.displayName || currentUsername}</p>
                    <p className="text-xs text-gray-400">@{currentUsername}</p>
                  </div>
                  <Check className="w-6 h-6 text-green-500 ml-auto" />
                </div>
              </div>

              {/* Sync Status */}
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Last synced</span>
                  <span className="text-sm text-white">{formatLastSync(lastSyncedAt)}</span>
                </div>

                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Sync Now
                    </>
                  )}
                </button>
              </div>

              {/* Current Progress Summary */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Current Progress</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{gameState.coins}</p>
                    <p className="text-xs text-gray-500">Coins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{gameState.currentLevel}</p>
                    <p className="text-xs text-gray-500">Level</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">
                      {gameState.levels?.filter((l: any) => l.completed).length || 0}
                    </p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Login Form */}
          {!currentUsername && !showConflictDialog && (
            <>
              <div className="text-center py-2">
                <CloudOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  Login to sync your progress across all your devices
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      maxLength={20}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Letters, numbers, and underscores only
                  </p>
                </div>

                {/* Cloud Preview */}
                {cloudPreview && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-400 font-medium">Existing save found!</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Level: {cloudPreview.currentLevel} • Coins: {cloudPreview.coins}</p>
                      <p>Last played: {formatLastSync(cloudPreview.lastSyncedAt)}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-400">{success}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={isLoading || username.length < 3}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : cloudPreview ? (
                    <>
                      <Download className="w-5 h-5" />
                      Load Cloud Save
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      Create & Sync
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="bg-gray-800/30 rounded-xl p-3 space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Why sync?</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Play on any device with the same progress</li>
                  <li>• Never lose your coins, levels, or achievements</li>
                  <li>• Automatic sync when you complete levels</li>
                  <li>• Compete on global leaderboards</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudSyncModal;
