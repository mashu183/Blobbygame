import React, { useState, useEffect } from 'react';
import { GAME_IMAGES } from '../../types/game';
import { casinoSounds } from '../../lib/sounds';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetProgress,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(!casinoSounds.getMuted());
  const [musicEnabled, setMusicEnabled] = useState(casinoSounds.isMusicEnabled());
  const [sfxVolume, setSfxVolume] = useState(casinoSounds.getSfxVolume() * 100);
  const [musicVolume, setMusicVolume] = useState(casinoSounds.getMusicVolume() * 100);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSoundEnabled(!casinoSounds.getMuted());
      setMusicEnabled(casinoSounds.isMusicEnabled());
      setSfxVolume(casinoSounds.getSfxVolume() * 100);
      setMusicVolume(casinoSounds.getMusicVolume() * 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    casinoSounds.setMuted(!newState);
    if (newState) {
      casinoSounds.buttonClick();
    }
  };

  const handleMusicToggle = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    if (newState) {
      casinoSounds.startMusic();
    } else {
      casinoSounds.stopMusic();
    }
    casinoSounds.buttonClick();
  };

  const handleSfxVolumeChange = (value: number) => {
    setSfxVolume(value);
    casinoSounds.setSfxVolume(value / 100);
  };

  const handleMusicVolumeChange = (value: number) => {
    setMusicVolume(value);
    casinoSounds.setMusicVolume(value / 100);
  };

  const handleReset = () => {
    onResetProgress();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-gray-400">Customize your experience</p>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="p-6 space-y-4">
          {/* Sound Effects Toggle */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">Sound Effects</span>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`w-14 h-8 rounded-full transition-all ${soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {/* SFX Volume Slider */}
            {soundEnabled && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Volume</span>
                  <span className="text-blue-400 font-medium">{Math.round(sfxVolume)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sfxVolume}%, #374151 ${sfxVolume}%, #374151 100%)`
                  }}
                />
              </div>
            )}
          </div>

          {/* Background Music Toggle */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-white">Background Music</span>
                  <p className="text-xs text-gray-500">Ambient casino atmosphere</p>
                </div>
              </div>
              <button
                onClick={handleMusicToggle}
                className={`w-14 h-8 rounded-full transition-all ${musicEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform ${musicEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {/* Music Volume Slider */}
            {musicEnabled && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Volume</span>
                  <span className="text-purple-400 font-medium">{Math.round(musicVolume)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${musicVolume}%, #374151 ${musicVolume}%, #374151 100%)`
                  }}
                />
              </div>
            )}
            
            {/* Music Info */}
            {musicEnabled && (
              <div className="mt-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-purple-400 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 12}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.5s'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-purple-300">Now playing: Casino Lounge</span>
                </div>
              </div>
            )}
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-white">Vibration</span>
            </div>
            <button
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              className={`w-14 h-8 rounded-full transition-all ${vibrationEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform ${vibrationEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Audio Ducking Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Smart Audio Ducking</h4>
                <p className="text-xs text-gray-400">
                  Background music automatically lowers during game actions like spins, flips, and wins for a better experience.
                </p>
              </div>
            </div>
          </div>

          {/* Reset Progress */}
          <div className="pt-4 border-t border-white/10">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
              >
                Reset Progress
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50">
                <p className="text-red-300 text-sm mb-3">Are you sure? This will delete all your progress!</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-400 transition-colors"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/30 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={GAME_IMAGES.character} alt="Blobby" className="w-6 h-6 rounded-full" />
            <span className="font-bold text-purple-300">BLOBBY</span>
          </div>
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
