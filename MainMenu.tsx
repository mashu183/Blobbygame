import React, { useState, useEffect } from 'react';
import { GAME_IMAGES } from '../../types/game';
import { VIPTier } from '@/hooks/useVIP';
import { casinoSounds } from '../../lib/sounds';

interface MainMenuProps {
  onPlay: () => void;
  onStore: () => void;
  onLeaderboard: () => void;
  onAchievements: () => void;
  onDailyChallenges: () => void;
  onSocial: () => void;
  onTournament: () => void;
  onSeasonPass: () => void;
  onGuild: () => void;
  onLuckySpin: () => void;
  onMysteryBox: () => void;
  onSlotMachine: () => void;
  onScratchCard: () => void;
  onCoinFlip: () => void;
  onTreasureHunt: () => void;
  onJackpotSpin: () => void;
  onVIP: () => void;
  onSettings: () => void;
  onPowerUpShop: () => void;
  onReferral: () => void;
  onGacha: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  totalStars: number;
  completedLevels: number;
  totalLevels: number;
  username: string | null;
  displayName: string | null;
  avatarColor: string;
  achievementCount: { unlocked: number; total: number };
  dailyChallengeStats: { completed: number; total: number; streak: number };
  friendCount: number;
  pendingGifts: number;
  activeTournament: boolean;
  seasonLevel: number;
  seasonIsPremium: boolean;
  guildName: string | null;
  jackpotAmount: number;
  referralCount: number;
  gems: number;
  // VIP Props
  vipTier: VIPTier;
  vipProgress: number;
  vipPoints: number;
}




const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onStore,
  onLeaderboard,
  onAchievements,
  onDailyChallenges,
  onSocial,
  onTournament,
  onSeasonPass,
  onGuild,
  onLuckySpin,
  onMysteryBox,
  onSlotMachine,
  onScratchCard,
  onCoinFlip,
  onTreasureHunt,
  onJackpotSpin,
  onVIP,
  onSettings,
  onPowerUpShop,
  onReferral,
  onGacha,
  onSignIn,
  onSignOut,
  totalStars,
  completedLevels,
  totalLevels,
  username,
  displayName,
  avatarColor,
  achievementCount,
  dailyChallengeStats,
  friendCount,
  pendingGifts,
  activeTournament,
  seasonLevel,
  seasonIsPremium,
  guildName,
  jackpotAmount,
  referralCount,
  gems,
  // VIP Props
  vipTier,
  vipProgress,
  vipPoints,
}) => {




  // Check if free spin is available
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(false);
  const [freeScratchAvailable, setFreeScratchAvailable] = useState(false);
  const [displayedJackpot, setDisplayedJackpot] = useState(jackpotAmount);
  const [isMusicPlaying, setIsMusicPlaying] = useState(casinoSounds.isMusicEnabled());
  const [isSoundMuted, setIsSoundMuted] = useState(casinoSounds.getMuted());
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  useEffect(() => {
    const lastFreeSpinDate = localStorage.getItem('blobby-last-free-spin');
    const lastFreeScratch = localStorage.getItem('blobby-last-free-scratch');
    const today = new Date().toDateString();
    setFreeSpinAvailable(lastFreeSpinDate !== today);
    setFreeScratchAvailable(lastFreeScratch !== today);
  }, []);


  // Animate jackpot counter with constant growth simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedJackpot(prev => {
        // Simulate growth by adding small random amounts
        const growth = Math.floor(Math.random() * 3) + 1;
        return prev + growth;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Sync with actual jackpot when it changes significantly
  useEffect(() => {
    if (Math.abs(displayedJackpot - jackpotAmount) > 100) {
      setDisplayedJackpot(jackpotAmount);
    }
  }, [jackpotAmount]);

  // Sync music state
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

  const freeGamesCount = (freeSpinAvailable ? 1 : 0) + (freeScratchAvailable ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${GAME_IMAGES.background})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-pink-900/60 to-blue-900/80" />
        
        {/* Floating Shapes */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5],
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Top Bar - Sound & Music Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Sound Toggle */}
        <button 
          onClick={handleSoundToggle}
          className={`p-2.5 rounded-xl transition-all ${
            isSoundMuted 
              ? 'bg-red-500/30 hover:bg-red-500/40 border border-red-500/50' 
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
          title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isSoundMuted ? (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Music Toggle */}
        <button 
          onClick={handleMusicToggle}
          className={`p-2.5 rounded-xl transition-all relative ${
            isMusicPlaying 
              ? 'bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50' 
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
          title={isMusicPlaying ? 'Stop music' : 'Play music'}
        >
          {isMusicPlaying ? (
            <>
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              {/* Animated music bars */}
              <div className="absolute -top-1 -right-1 flex gap-0.5 bg-purple-900/80 rounded px-0.5 py-0.5">
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
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </button>

        {/* Settings */}
        <button 
          onClick={onSettings}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
          title="Settings"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Player Profile Card (if logged in) or Sign In Button */}
        {username ? (
          <div className="mb-6 mx-auto max-w-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: avatarColor }}
              >
                {(displayName || username)[0].toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-white truncate">
                  {displayName || username}
                </div>
                <div className="text-xs text-gray-400">@{username}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-yellow-300 font-bold">{totalStars}</span>
                </div>
                {onSignOut && (
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all"
                    title="Sign Out"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 mx-auto max-w-xs">
            <button
              onClick={onSignIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border border-blue-500/30 hover:border-blue-400/50 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="font-semibold text-white">Sign In / Create Account</span>
            </button>
          </div>
        )}

        {/* Sign Out Confirmation Modal */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sign Out?</h3>
                <p className="text-gray-400 text-sm mb-6">Your progress is saved locally. You can sign back in anytime.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSignOutConfirm(false);
                      onSignOut?.();
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Logo & Character */}
        <div className="mb-6">
          <img 
            src={GAME_IMAGES.character} 
            alt="Blobby" 
            className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-2xl shadow-yellow-400/30 animate-bounce"
            style={{ animationDuration: '2s' }}
          />
          <h1 className="mt-4 text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
            BLOBBY
          </h1>
          <p className="mt-1 text-lg text-gray-300 font-medium">
            The Ultimate Puzzle Adventure
          </p>
        </div>

        {/* Stats Row - Now with clickable buttons */}
        <div className="flex justify-center gap-3 mb-4 flex-wrap">
          <button
            onClick={onPlay}
            className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20 hover:border-yellow-400/50 transition-all group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-lg font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors">{totalStars}</span>
            </div>
            <p className="text-xs text-gray-400">Stars</p>
          </button>
          <button
            onClick={onPlay}
            className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20 hover:border-green-400/50 transition-all group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-bold text-green-300 group-hover:text-green-200 transition-colors">{completedLevels}/{totalLevels}</span>
            </div>
            <p className="text-xs text-gray-400">Levels</p>
          </button>
          <button
            onClick={onAchievements}
            className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20 hover:border-yellow-400/50 transition-all group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-lg font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors">
                {achievementCount.unlocked}/{achievementCount.total}
              </span>
            </div>
            <p className="text-xs text-gray-400">Trophies</p>
          </button>
        </div>


        {/* PROGRESSIVE JACKPOT BANNER - NEW! */}
        <button
          onClick={onJackpotSpin}
          className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-600/30 via-amber-500/30 to-orange-600/30 border-2 border-yellow-500/50 relative overflow-hidden group hover:border-yellow-400 transition-all hover:scale-[1.02]"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-jackpot-shine" />
          
          {/* Sparkles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-twinkle"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pulse">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-yellow-400/80 font-semibold uppercase tracking-wider">Progressive Jackpot</div>
                <div className="text-sm text-gray-400">Win it all! 100 coins per spin</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-400 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 tabular-nums animate-pulse">
                  {displayedJackpot.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-green-400 animate-pulse">Growing!</div>
            </div>
          </div>
          
          {/* Click indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* CASINO GAMES SECTION */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-purple-500/10 border border-yellow-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine" />
          
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-400 to-purple-400">
              LUCKY GAMES
            </h3>
            {freeGamesCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold animate-pulse">
                {freeGamesCount} FREE!
              </span>
            )}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Lucky Spin */}
            <button
              onClick={onLuckySpin}
              className="relative p-3 rounded-xl bg-gradient-to-br from-pink-500/30 to-red-500/30 hover:from-pink-500/40 hover:to-red-500/40 border border-pink-500/30 transition-all hover:scale-105 group"
            >
              {freeSpinAvailable && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
              )}
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center animate-spin-slow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Spin</p>
              <p className="text-[10px] text-gray-400">{freeSpinAvailable ? 'FREE!' : '25c'}</p>
            </button>

            {/* Slot Machine */}
            <button
              onClick={onSlotMachine}
              className="p-3 rounded-xl bg-gradient-to-br from-red-500/30 to-yellow-500/30 hover:from-red-500/40 hover:to-yellow-500/40 border border-red-500/30 transition-all hover:scale-105"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Slots</p>
              <p className="text-[10px] text-gray-400">5-100c</p>
            </button>

            {/* Scratch Cards */}
            <button
              onClick={onScratchCard}
              className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 hover:from-emerald-500/40 hover:to-teal-500/40 border border-emerald-500/30 transition-all hover:scale-105"
            >
              {freeScratchAvailable && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
              )}
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Scratch</p>
              <p className="text-[10px] text-gray-400">{freeScratchAvailable ? 'FREE!' : '20c'}</p>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Mystery Box */}
            <button
              onClick={onMysteryBox}
              className="p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/30 transition-all hover:scale-105"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Boxes</p>
              <p className="text-[10px] text-gray-400">15-250c</p>
            </button>

            {/* Coin Flip */}
            <button
              onClick={onCoinFlip}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-500/30 transition-all hover:scale-105"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Flip</p>
              <p className="text-[10px] text-gray-400">2x Win</p>
            </button>

            {/* Treasure Hunt */}
            <button
              onClick={onTreasureHunt}
              className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/30 hover:from-yellow-500/40 hover:to-amber-500/40 border border-yellow-500/30 transition-all hover:scale-105"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-white">Hunt</p>
              <p className="text-[10px] text-gray-400">30c</p>
            </button>
          </div>
        </div>

        {/* VIP STATUS BANNER */}
        <button
          onClick={onVIP}
          className={`w-full mb-3 p-3 rounded-2xl bg-gradient-to-r ${vipTier.bgGradient} border border-white/20 relative overflow-hidden group hover:scale-[1.02] transition-all`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="relative flex items-center gap-3">
            <div className="text-3xl">{vipTier.icon}</div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{vipTier.name} VIP</span>
                {vipTier.oddsBonus > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-green-500/30 text-green-300">
                    +{vipTier.oddsBonus}% Odds
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/70 rounded-full transition-all"
                    style={{ width: `${vipProgress}%` }}
                  />
                </div>
                <span className="text-xs text-white/70">{vipPoints.toLocaleString()} pts</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Season Pass Button */}
        <button
          onClick={onSeasonPass}
          className="w-full mb-3 py-3 rounded-2xl bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-red-500/20 hover:from-purple-600/30 hover:via-pink-500/30 hover:to-red-500/30 border border-purple-500/30 hover:border-purple-400/50 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="flex items-center justify-center gap-3 relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                Season Pass
                {seasonIsPremium && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 font-bold">PREMIUM</span>
                )}
              </div>
              <div className="text-xs text-gray-400">Level {seasonLevel}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>


        {/* INVITE FRIENDS BANNER */}
        <button
          onClick={onReferral}
          className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-green-600/20 via-emerald-500/20 to-teal-500/20 hover:from-green-600/30 hover:via-emerald-500/30 hover:to-teal-500/30 border border-green-500/30 hover:border-green-400/50 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                Invite Friends
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 font-bold">+100 Coins</span>
              </div>
              <div className="text-xs text-gray-400">
                {referralCount > 0 ? `${referralCount} friends joined!` : 'Earn rewards for each friend'}
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Quick Access Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={onTournament}
            className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 transition-all relative"
          >
            {activeTournament && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
            <svg className="w-6 h-6 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-[10px] text-gray-400 mt-1">Tourney</p>
          </button>

          <button
            onClick={onGuild}
            className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 border border-indigo-500/30 transition-all"
          >
            <svg className="w-6 h-6 mx-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[10px] text-gray-400 mt-1">Guild</p>
          </button>

          <button
            onClick={onSocial}
            className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 transition-all relative"
          >
            {pendingGifts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {pendingGifts}
              </span>
            )}
            <svg className="w-6 h-6 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[10px] text-gray-400 mt-1">Friends</p>
          </button>

          <button
            onClick={onDailyChallenges}
            className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30 border border-orange-500/30 transition-all relative"
          >
            {dailyChallengeStats.completed < dailyChallengeStats.total && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            )}
            <svg className="w-6 h-6 mx-auto text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[10px] text-gray-400 mt-1">Daily</p>
          </button>
        </div>

        {/* GACHA SUMMON BANNER */}
        <button
          onClick={onGacha}
          className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-cyan-500/30 border-2 border-purple-500/50 relative overflow-hidden group hover:border-purple-400 transition-all hover:scale-[1.02]"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-jackpot-shine" />
          
          {/* Sparkles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full animate-twinkle"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-purple-400/80 font-semibold uppercase tracking-wider flex items-center gap-2">
                  Gacha Summon
                  <span className="px-1.5 py-0.5 bg-pink-500/30 text-pink-300 rounded text-[10px] animate-pulse">NEW!</span>
                </div>
                <div className="text-sm text-gray-400">Collect rare Blobbies!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-cyan-400">
                  {gems} Gems
                </span>
              </div>
              <div className="text-xs text-purple-400">Pull for characters!</div>
            </div>
          </div>
          
          {/* Click indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>


        {/* Main Buttons */}
        <div className="space-y-3">
          <button
            onClick={onPlay}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-2xl transition-all hover:scale-105 shadow-2xl shadow-green-500/40 flex items-center justify-center gap-3"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            PLAY
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onLeaderboard}
              className="py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-yellow-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              RANKS
            </button>

            <button
              onClick={onStore}
              className="py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              STORE
            </button>
          </div>
        </div>

        {/* Download Badges */}
        <div className="mt-8">
          <p className="text-gray-400 text-sm mb-3">Available on all platforms</p>
          <div className="flex justify-center gap-3">
            <button className="bg-black hover:bg-gray-900 rounded-xl px-3 py-2 flex items-center gap-2 transition-colors border border-white/20">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-400">Download on the</div>
                <div className="text-xs font-semibold text-white">App Store</div>
              </div>
            </button>
            <button className="bg-black hover:bg-gray-900 rounded-xl px-3 py-2 flex items-center gap-2 transition-colors border border-white/20">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-400">GET IT ON</div>
                <div className="text-xs font-semibold text-white">Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="absolute bottom-4 text-gray-500 text-xs">
        v1.0.0 | © 2024 Blobby Games
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
        @keyframes jackpot-shine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-jackpot-shine {
          animation: jackpot-shine 2s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MainMenu;
