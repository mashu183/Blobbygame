import React, { useState, useEffect } from 'react';
import { Level, GAME_IMAGES } from '../../types/game';

interface GameOverProps {
  level: Level;
  lives: number;
  coins: number;
  movesUsed: number;
  onRetry: () => void;
  onBuyLives: () => void;
  onLevelSelect: () => void;
  onSkipLevel?: (levelId: number) => { success: boolean; message: string };
  onContinue?: (cost: number) => boolean;
  onWatchAd?: () => void;
  skipLevelCost?: number;
  continueCount?: number;
}

// Escalating continue costs
const CONTINUE_COSTS = [25, 50, 100, 200, 400];
const CONTINUE_MOVES = [3, 3, 5, 5, 7];

const GameOver: React.FC<GameOverProps> = ({
  level,
  lives,
  coins,
  movesUsed,
  onRetry,
  onBuyLives,
  onLevelSelect,
  onSkipLevel,
  onContinue,
  onWatchAd,
  skipLevelCost = 50,
  continueCount = 0,
}) => {
  const canRetry = lives > 0;
  const canSkip = coins >= skipLevelCost && level.id < 200;
  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [showContinueOffer, setShowContinueOffer] = useState(true);

  const currentCost = CONTINUE_COSTS[Math.min(continueCount, CONTINUE_COSTS.length - 1)];
  const movesGranted = CONTINUE_MOVES[Math.min(continueCount, CONTINUE_MOVES.length - 1)];
  const canAffordContinue = coins >= currentCost;
  const isMaxContinues = continueCount >= 5;

  // Calculate how close player was
  const progressPercent = Math.min(95, Math.floor((movesUsed / level.moves) * 100));
  const wasClose = progressPercent >= 60;

  // Countdown timer for urgency
  useEffect(() => {
    if (!showContinueOffer) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowContinueOffer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showContinueOffer]);

  const handleSkipLevel = () => {
    if (!onSkipLevel) return;
    
    const result = onSkipLevel(level.id);
    if (!result.success) {
      setSkipMessage(result.message);
      setTimeout(() => setSkipMessage(null), 3000);
    }
  };

  const handleContinue = () => {
    if (!onContinue || !canAffordContinue) return;
    onContinue(currentCost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-red-900/50 rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden">
        {/* Countdown Banner - Only show if continue is available */}
        {showContinueOffer && onContinue && !isMaxContinues && (
          <div className={`py-2 text-center font-bold ${countdown <= 5 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'} text-black`}>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>CONTINUE OFFER EXPIRES IN {countdown}s</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-red-500/20 to-orange-500/20">
          <img 
            src={GAME_IMAGES.character} 
            alt="Blobby" 
            className="w-24 h-24 mx-auto rounded-full border-4 border-red-400 shadow-lg opacity-50 grayscale"
          />
          
          <h2 className="mt-4 text-3xl font-black text-red-400">
            {wasClose ? "SO CLOSE!" : "Out of Moves!"}
          </h2>
          
          <p className="text-gray-400 mt-2">Level {level.id} - {level.name}</p>

          {/* Progress indicator - show how close they were */}
          {wasClose && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
              <p className="text-yellow-300 font-semibold text-sm">
                You were {progressPercent}% of the way there!
              </p>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Continue Offer - Primary CTA */}
        {showContinueOffer && onContinue && !isMaxContinues && (
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-y border-yellow-500/30">
            <button
              onClick={handleContinue}
              disabled={!canAffordContinue}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${canAffordContinue
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105 shadow-lg shadow-orange-500/30 animate-pulse'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>CONTINUE (+{movesGranted} Moves)</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded-lg">
                <img src={GAME_IMAGES.coin} alt="Coins" className="w-5 h-5 rounded-full" />
                {currentCost}
              </span>
            </button>
            
            {/* Watch Ad Option */}
            {onWatchAd && (
              <button
                onClick={onWatchAd}
                className="w-full mt-2 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Ad for +3 Moves
                <span className="text-xs bg-green-500/30 px-2 py-0.5 rounded-full">FREE</span>
              </button>
            )}
          </div>
        )}

        {/* Lives Status */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <img 
                key={i}
                src={GAME_IMAGES.heart} 
                alt="Life" 
                className={`w-7 h-7 rounded-full transition-all ${i < lives ? '' : 'grayscale opacity-30'}`}
              />
            ))}
          </div>
          
          {lives > 0 ? (
            <p className="text-gray-300 text-sm">
              <span className="text-red-400 font-bold">{lives}</span> {lives === 1 ? 'life' : 'lives'} remaining
            </p>
          ) : (
            <p className="text-red-400 font-semibold text-sm">
              No lives remaining! Buy more to continue.
            </p>
          )}
        </div>

        {/* Skip Message */}
        {skipMessage && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm text-center">
            {skipMessage}
          </div>
        )}

        {/* Skip Confirmation */}
        {showSkipConfirm && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50">
            <p className="text-white text-center mb-3">
              Skip Level {level.id} for <span className="text-yellow-300 font-bold">{skipLevelCost} coins</span>?
            </p>
            <p className="text-gray-400 text-xs text-center mb-4">
              You can always come back later to earn stars!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipLevel}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-bold transition-all"
              >
                Skip Level
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          {canRetry ? (
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <img src={GAME_IMAGES.heart} alt="Life" className="w-5 h-5 rounded-full" />
              Try Again (-1 Life)
            </button>
          ) : (
            <button
              onClick={onBuyLives}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              <img src={GAME_IMAGES.heart} alt="Life" className="w-5 h-5 rounded-full" />
              Buy More Lives
            </button>
          )}

          {/* Skip Level Button */}
          {onSkipLevel && !showSkipConfirm && level.id < 200 && (
            <button
              onClick={() => canSkip ? setShowSkipConfirm(true) : setSkipMessage(`Not enough coins! You need ${skipLevelCost} coins.`)}
              className={`w-full py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                canSkip 
                  ? 'bg-gradient-to-r from-orange-500/30 to-yellow-500/30 border border-orange-500/50 text-orange-300 hover:from-orange-500/40 hover:to-yellow-500/40'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Skip Level
              <span className="flex items-center gap-1">
                <img src={GAME_IMAGES.coin} alt="Coins" className="w-4 h-4 rounded-full" />
                <span className={canSkip ? 'text-yellow-300' : 'text-gray-500'}>{skipLevelCost}</span>
              </span>
            </button>
          )}
          
          <button
            onClick={onLevelSelect}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all text-sm"
          >
            Level Select
          </button>
        </div>

        {/* Coins Display */}
        <div className="p-3 bg-black/30 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={GAME_IMAGES.coin} alt="Coins" className="w-5 h-5 rounded-full" />
            <span className="text-yellow-300 font-semibold">{coins.toLocaleString()} coins</span>
          </div>
          {continueCount > 0 && (
            <span className="text-orange-400 text-xs">
              Continued {continueCount}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOver;
