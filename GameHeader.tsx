import React, { useState, useEffect } from 'react';
import { GAME_IMAGES } from '../../types/game';
import { casinoSounds } from '../../lib/sounds';

interface GameHeaderProps {
  coins: number;
  lives: number;
  hints: number;
  onOpenStore: () => void;
  onOpenSettings: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  coins,
  lives,
  hints,
  onOpenStore,
  onOpenSettings,
}) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(casinoSounds.isMusicEnabled());
  const [isSoundMuted, setIsSoundMuted] = useState(casinoSounds.getMuted());

  // Sync state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMusicPlaying(casinoSounds.isMusicEnabled());
      setIsSoundMuted(casinoSounds.getMuted());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleMusicToggle = () => {
    const newState = casinoSounds.toggleMusic();
    setIsMusicPlaying(newState);
    casinoSounds.buttonClick();
  };

  const handleSoundToggle = () => {
    const newState = casinoSounds.toggleMute();
    setIsSoundMuted(newState);
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-blue-900/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={GAME_IMAGES.character} 
            alt="Blobby" 
            className="w-10 h-10 rounded-full border-2 border-yellow-400 shadow-lg shadow-yellow-400/30"
          />
          <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            BLOBBY
          </h1>
        </div>

        {/* Resources */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Coins */}
          <button 
            onClick={onOpenStore}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-full px-3 md:px-4 py-2 transition-all hover:scale-105"
          >
            <img src={GAME_IMAGES.coin} alt="Coins" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
            <span className="font-bold text-yellow-300 text-sm md:text-base">{coins.toLocaleString()}</span>
            <svg className="w-4 h-4 text-yellow-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Lives */}
          <div className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-full px-3 md:px-4 py-2">
            <img src={GAME_IMAGES.heart} alt="Lives" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
            <span className="font-bold text-red-300 text-sm md:text-base">{lives}</span>
          </div>

          {/* Hints */}
          <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-4 py-2">
            <img src={GAME_IMAGES.hint} alt="Hints" className="w-6 h-6 rounded-full" />
            <span className="font-bold text-blue-300">{hints}</span>
          </div>

          {/* Sound Toggle */}
          <button 
            onClick={handleSoundToggle}
            className={`p-2 rounded-full transition-all ${
              isSoundMuted 
                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isSoundMuted ? (
              <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Music Toggle */}
          <button 
            onClick={handleMusicToggle}
            className={`p-2 rounded-full transition-all relative ${
              isMusicPlaying 
                ? 'bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isMusicPlaying ? 'Stop music' : 'Play music'}
          >
            {isMusicPlaying ? (
              <>
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {/* Animated music bars */}
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-purple-400 rounded-full animate-pulse"
                      style={{
                        height: `${4 + Math.random() * 4}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.4s'
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            )}
          </button>

          {/* Settings */}
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
