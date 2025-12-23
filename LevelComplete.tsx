import React, { useState, useEffect } from 'react';
import { Level, GAME_IMAGES } from '../../types/game';

interface LevelCompleteProps {
  level: Level;
  movesUsed: number;
  coinsEarned: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
  onBonusSpin?: () => void;
  onDoubleReward?: (cost: number) => boolean;
}

// Bonus spin chance based on stars
const SPIN_CHANCES = [0.3, 0.5, 0.8]; // 1 star: 30%, 2 stars: 50%, 3 stars: 80%

const LevelComplete: React.FC<LevelCompleteProps> = ({
  level,
  movesUsed,
  coinsEarned,
  onNextLevel,
  onReplay,
  onLevelSelect,
  onBonusSpin,
  onDoubleReward,
}) => {
  const movesLeft = level.moves - movesUsed;
  const stars = movesLeft >= level.moves * 0.5 ? 3 : 
                movesLeft >= level.moves * 0.25 ? 2 : 1;
  
  const [showBonusOffer, setShowBonusOffer] = useState(false);
  const [bonusCountdown, setBonusCountdown] = useState(10);
  const [showSpinOffer, setShowSpinOffer] = useState(false);
  const [animatedCoins, setAnimatedCoins] = useState(0);

  // Animate coin counter
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = coinsEarned / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= coinsEarned) {
        setAnimatedCoins(coinsEarned);
        clearInterval(timer);
      } else {
        setAnimatedCoins(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [coinsEarned]);

  // Show bonus offers after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Random chance for spin offer based on stars
      if (Math.random() < SPIN_CHANCES[stars - 1] && onBonusSpin) {
        setShowSpinOffer(true);
      }
      // Always show double reward offer
      setShowBonusOffer(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [stars, onBonusSpin]);

  // Countdown for bonus offer
  useEffect(() => {
    if (!showBonusOffer) return;
    
    const timer = setInterval(() => {
      setBonusCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowBonusOffer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showBonusOffer]);

  const handleDoubleReward = () => {
    if (onDoubleReward) {
      onDoubleReward(coinsEarned);
    }
    setShowBonusOffer(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-bounce-in">
        {/* Celebration Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20">
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#FBBF24', '#EC4899', '#8B5CF6', '#3B82F6'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
          
          <img 
            src={GAME_IMAGES.character} 
            alt="Blobby" 
            className="w-24 h-24 mx-auto rounded-full border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 animate-bounce"
          />
          
          <h2 className="mt-4 text-3xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Level Complete!
          </h2>
          
          <p className="text-gray-300 mt-2">Level {level.id} - {level.name}</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 py-4 bg-black/20">
          {Array.from({ length: 3 }).map((_, i) => (
            <svg
              key={i}
              className={`w-12 h-12 transition-all duration-500 ${
                i < stars 
                  ? 'text-yellow-400 drop-shadow-lg animate-pulse' 
                  : 'text-gray-600'
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-300">{movesUsed}</div>
            <div className="text-xs text-gray-400">Moves Used</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-300">{movesLeft}</div>
            <div className="text-xs text-gray-400">Moves Left</div>
          </div>
        </div>

        {/* Coins Earned - Animated */}
        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center gap-3">
          <img src={GAME_IMAGES.coin} alt="Coins" className="w-10 h-10 rounded-full animate-spin-slow" />
          <span className="text-2xl font-bold text-yellow-300">+{animatedCoins} Coins</span>
        </div>

        {/* Double Reward Offer */}
        {showBonusOffer && onDoubleReward && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-300 font-bold">DOUBLE YOUR COINS!</span>
              <span className="text-yellow-400 text-sm font-bold">{bonusCountdown}s</span>
            </div>
            <button
              onClick={handleDoubleReward}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Ad to Double (+{coinsEarned} more)
            </button>
          </div>
        )}

        {/* Bonus Spin Offer */}
        {showSpinOffer && onBonusSpin && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-spin-slow">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-purple-300 font-bold">Lucky Bonus Spin!</div>
                <div className="text-xs text-gray-400">You earned a free spin!</div>
              </div>
              <button
                onClick={onBonusSpin}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition-all"
              >
                SPIN
              </button>
            </div>
          </div>
        )}

        {/* Missed Rewards Teaser - Show what they could have earned */}
        {stars < 3 && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-gray-400 text-xs text-center">
              <span className="text-yellow-400">Tip:</span> Get 3 stars to earn{' '}
              <span className="text-yellow-300 font-bold">
                {Math.floor(coinsEarned * 1.5)} coins
              </span>{' '}
              next time!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <button
            onClick={onNextLevel}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30"
          >
            Next Level
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all text-sm"
            >
              {stars < 3 ? 'Replay for 3 Stars' : 'Replay'}
            </button>
            <button
              onClick={onLevelSelect}
              className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all text-sm"
            >
              Level Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelComplete;
