import React, { useState, useEffect } from 'react';
import { Level, GAME_IMAGES } from '../../types/game';

interface ContinueModalProps {
  isOpen: boolean;
  level: Level;
  movesUsed: number;
  coins: number;
  continueCount: number; // How many times player has continued on this level
  onContinue: (cost: number) => void;
  onWatchAd: () => void;
  onGiveUp: () => void;
}

// Escalating continue costs - gets more expensive each time
const CONTINUE_COSTS = [25, 50, 100, 200, 400];
const CONTINUE_MOVES = [3, 3, 5, 5, 7]; // Moves granted per continue

const ContinueModal: React.FC<ContinueModalProps> = ({
  isOpen,
  level,
  movesUsed,
  coins,
  continueCount,
  onContinue,
  onWatchAd,
  onGiveUp,
}) => {
  const [countdown, setCountdown] = useState(10);
  const [showUrgency, setShowUrgency] = useState(false);

  const currentCost = CONTINUE_COSTS[Math.min(continueCount, CONTINUE_COSTS.length - 1)];
  const movesGranted = CONTINUE_MOVES[Math.min(continueCount, CONTINUE_MOVES.length - 1)];
  const canAfford = coins >= currentCost;
  const isMaxContinues = continueCount >= 5;

  // Countdown timer - creates urgency
  useEffect(() => {
    if (!isOpen) {
      setCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onGiveUp();
          return 0;
        }
        if (prev <= 5) {
          setShowUrgency(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onGiveUp]);

  if (!isOpen) return null;

  // Calculate how close player was to winning
  const progressPercent = Math.min(95, Math.floor((movesUsed / level.moves) * 100));
  const wasClose = progressPercent >= 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className={`w-full max-w-md bg-gradient-to-br from-gray-900 to-purple-900/80 rounded-2xl border-2 ${showUrgency ? 'border-red-500 animate-pulse' : 'border-yellow-500/50'} shadow-2xl overflow-hidden`}>
        {/* Countdown Timer */}
        <div className={`py-2 text-center font-bold ${showUrgency ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500 text-black'}`}>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>OFFER EXPIRES IN {countdown}s</span>
          </div>
        </div>

        {/* Header */}
        <div className="relative p-6 text-center">
          <img 
            src={GAME_IMAGES.character} 
            alt="Blobby" 
            className="w-20 h-20 mx-auto rounded-full border-4 border-yellow-400 shadow-lg mb-4"
          />
          
          <h2 className="text-2xl font-black text-white mb-2">
            {wasClose ? "SO CLOSE!" : "Out of Moves!"}
          </h2>
          
          {wasClose && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50">
              <p className="text-yellow-300 font-semibold">
                You were {progressPercent}% of the way there!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Just a few more moves and you would have won!
              </p>
            </div>
          )}

          {/* Progress visualization */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Start</span>
              <span>Goal</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Level {level.id} - {level.name}
            </p>
          </div>
        </div>

        {/* Continue Options */}
        <div className="p-6 pt-0 space-y-3">
          {/* Primary: Continue with Coins */}
          {!isMaxContinues && (
            <button
              onClick={() => canAfford && onContinue(currentCost)}
              disabled={!canAfford}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${canAfford
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105 shadow-lg shadow-orange-500/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Continue (+{movesGranted} Moves)</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded-lg">
                <img src={GAME_IMAGES.coin} alt="Coins" className="w-5 h-5 rounded-full" />
                {currentCost}
              </span>
            </button>
          )}

          {/* Secondary: Watch Ad */}
          <button
            onClick={onWatchAd}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-500/50 text-green-300 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Watch Ad for +3 Moves</span>
            <span className="text-xs bg-green-500/30 px-2 py-0.5 rounded-full">FREE</span>
          </button>

          {/* Give Up */}
          <button
            onClick={onGiveUp}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-medium transition-all"
          >
            Give Up
          </button>
        </div>

        {/* Footer - Show what they'll lose */}
        <div className="p-4 bg-black/30 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <img src={GAME_IMAGES.coin} alt="Coins" className="w-4 h-4 rounded-full" />
              <span>{coins.toLocaleString()} coins</span>
            </div>
            {continueCount > 0 && (
              <span className="text-orange-400 text-xs">
                Continued {continueCount}x this level
              </span>
            )}
          </div>
          
          {/* Urgency message */}
          {wasClose && (
            <p className="text-center text-xs text-yellow-400 mt-2 animate-pulse">
              Don't lose your progress! You were almost there!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContinueModal;
