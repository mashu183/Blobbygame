import React, { useState, useCallback, useEffect, useRef } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface SlotMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onAddCoins: (amount: number) => void;
  onAddHints: (amount: number) => void;
  onAddLives: (amount: number) => void;
  onSpendCoins: (amount: number) => boolean;
  onContributeToJackpot?: (amount: number) => void;
  onAddVIPPoints?: (coinsWagered: number) => number;
  vipOddsBonus?: number;
  vipSpinDiscount?: number;
  onRecordSession?: (bet: number, winAmount: number, won: boolean) => void;
}


interface Symbol {
  id: string;
  icon: React.ReactNode;
  color: string;
  multiplier: number;
}

const SYMBOLS: Symbol[] = [
  { id: 'cherry', icon: <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="8" cy="16" r="4" /><circle cx="16" cy="16" r="4" /><path d="M12 4c-2 0-4 2-4 6M12 4c2 0 4 2 4 6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>, color: '#EF4444', multiplier: 2 },
  { id: 'lemon', icon: <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="10" /></svg>, color: '#FCD34D', multiplier: 3 },
  { id: 'orange', icon: <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>, color: '#F97316', multiplier: 4 },
  { id: 'grape', icon: <svg className="w-10 h-10 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" /><circle cx="8" cy="14" r="3" /><circle cx="16" cy="14" r="3" /><circle cx="12" cy="18" r="3" /></svg>, color: '#8B5CF6', multiplier: 5 },
  { id: 'bell', icon: <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>, color: '#FBBF24', multiplier: 8 },
  { id: 'seven', icon: <span className="text-4xl font-black text-red-500">7</span>, color: '#EF4444', multiplier: 15 },
  { id: 'diamond', icon: <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 9l10 13 10-13L12 2z" /></svg>, color: '#3B82F6', multiplier: 25 },
  { id: 'star', icon: <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>, color: '#FCD34D', multiplier: 50 },
];

const BET_OPTIONS = [5, 10, 25, 50, 100];

const SlotMachineModal: React.FC<SlotMachineModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onSpendCoins,
  onContributeToJackpot,
  onAddVIPPoints,
  vipOddsBonus = 0,
  vipSpinDiscount = 0,
}) => {
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState<{ win: boolean; amount: number; message: string; vipPoints?: number } | null>(null);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play modal open sound
  useEffect(() => {
    if (isOpen) {
      casinoSounds.modalOpen();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  // Calculate discounted bet cost
  const getDiscountedCost = (baseBet: number): number => {
    const discount = vipSpinDiscount / 100;
    return Math.floor(baseBet * (1 - discount));
  };

  const getRandomSymbol = useCallback(() => {
    const baseWeights = [30, 25, 20, 12, 7, 4, 1.5, 0.5];
    
    const adjustedWeights = baseWeights.map((w, i) => {
      if (i >= 4) {
        return w + (vipOddsBonus * 0.3);
      }
      return w - (vipOddsBonus * 0.15);
    });
    
    const total = adjustedWeights.reduce((a, b) => a + b, 0);
    const random = Math.random() * total;
    let cumulative = 0;

    for (let i = 0; i < adjustedWeights.length; i++) {
      cumulative += adjustedWeights[i];
      if (random <= cumulative) {
        return i;
      }
    }
    return 0;
  }, [vipOddsBonus]);

  const calculateWin = useCallback((finalReels: number[], betAmount: number): { win: boolean; amount: number; message: string } => {
    const [r1, r2, r3] = finalReels;

    if (r1 === r2 && r2 === r3) {
      const symbol = SYMBOLS[r1];
      const winAmount = betAmount * symbol.multiplier;
      return {
        win: true,
        amount: winAmount,
        message: `JACKPOT! Triple match! ${symbol.multiplier}x!`,
      };
    }

    if (r1 === r2 || r2 === r3 || r1 === r3) {
      const matchIndex = r1 === r2 ? r1 : (r2 === r3 ? r2 : r1);
      const symbol = SYMBOLS[matchIndex];
      const winAmount = Math.floor(betAmount * (symbol.multiplier / 3));
      return {
        win: winAmount > 0,
        amount: winAmount,
        message: winAmount > 0 ? `Two match! Small win!` : 'Almost! Try again!',
      };
    }

    if (finalReels.includes(0)) {
      return {
        win: true,
        amount: Math.floor(betAmount * 0.25),
        message: 'Cherry bonus! Quarter bet back!',
      };
    }

    return {
      win: false,
      amount: 0,
      message: 'No match. Try again!',
    };
  }, []);

  const spin = useCallback(() => {
    const actualCost = getDiscountedCost(bet);
    if (isSpinning || coins < actualCost) return;

    const success = onSpendCoins(actualCost);
    if (!success) return;

    // Play lever pull sound
    casinoSounds.slotPull();

    let vipPointsEarned = 0;
    if (onAddVIPPoints) {
      vipPointsEarned = onAddVIPPoints(bet);
    }

    setIsSpinning(true);
    setResult(null);
    setSpinningReels([true, true, true]);

    // Play reel spin sound
    casinoSounds.slotReelSpin();

    // Play tick sounds during spin
    spinIntervalRef.current = setInterval(() => {
      casinoSounds.slotReelTick();
    }, 100);

    const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

    // Stop reel 1
    setTimeout(() => {
      casinoSounds.slotReelStop(0);
      setReels(prev => [finalReels[0], prev[1], prev[2]]);
      setSpinningReels([false, true, true]);
    }, 1000);

    // Stop reel 2
    setTimeout(() => {
      casinoSounds.slotReelStop(1);
      setReels(prev => [prev[0], finalReels[1], prev[2]]);
      setSpinningReels([false, false, true]);
    }, 1500);

    // Stop reel 3 and show result
    setTimeout(() => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
      
      casinoSounds.slotReelStop(2);
      setReels(finalReels);
      setSpinningReels([false, false, false]);
      setIsSpinning(false);

      const winResult = calculateWin(finalReels, bet);
      setResult({ ...winResult, vipPoints: vipPointsEarned });

      // Play win/lose sound
      if (winResult.win && winResult.amount > 0) {
        onAddCoins(winResult.amount);
        if (winResult.amount >= bet * 10) {
          casinoSounds.jackpot();
        } else if (winResult.amount >= bet * 3) {
          casinoSounds.winBig();
        } else {
          casinoSounds.winSmall();
        }
        casinoSounds.coinCollect();
      } else {
        casinoSounds.lose();
        if (onContributeToJackpot) {
          onContributeToJackpot(actualCost);
        }
      }
    }, 2000);
  }, [isSpinning, coins, bet, onSpendCoins, getRandomSymbol, calculateWin, onAddCoins, onContributeToJackpot, onAddVIPPoints, vipSpinDiscount]);

  if (!isOpen) return null;

  const actualCost = getDiscountedCost(bet);
  const hasDiscount = vipSpinDiscount > 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-red-900 to-purple-900 rounded-3xl max-w-md w-full p-6 relative border-4 border-yellow-500 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 z-10"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black text-yellow-400 drop-shadow-lg">
            MEGA SLOTS
          </h2>
          <div className="flex justify-center gap-1 mt-1">
            {[0, 6, 5, 6, 0].map((idx, i) => (
              <span key={i} className="text-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                {SYMBOLS[idx].icon}
              </span>
            ))}
          </div>
          
          {/* VIP Bonus Indicator */}
          {(vipOddsBonus > 0 || vipSpinDiscount > 0) && (
            <div className="mt-2 flex justify-center gap-2">
              {vipOddsBonus > 0 && (
                <span className="px-2 py-1 rounded-full bg-purple-500/30 border border-purple-500/50 text-xs text-purple-300">
                  +{vipOddsBonus}% Win Odds
                </span>
              )}
              {vipSpinDiscount > 0 && (
                <span className="px-2 py-1 rounded-full bg-green-500/30 border border-green-500/50 text-xs text-green-300">
                  -{vipSpinDiscount}% Cost
                </span>
              )}
            </div>
          )}
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 mb-4 border-4 border-yellow-600 shadow-inner">
          {/* Reels Container */}
          <div className="flex justify-center gap-2 mb-4">
            {reels.map((symbolIndex, reelIndex) => (
              <div
                key={reelIndex}
                className="w-20 h-24 bg-white rounded-lg overflow-hidden border-4 border-gray-600 shadow-inner relative"
              >
                {spinningReels[reelIndex] ? (
                  <div className="absolute inset-0 flex flex-col animate-slot-spin">
                    {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((symbol, i) => (
                      <div key={i} className="w-full h-24 flex items-center justify-center flex-shrink-0">
                        {symbol.icon}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
                    {SYMBOLS[symbolIndex].icon}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Win Line Indicator */}
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded" />
            <span className="text-yellow-400 text-xs font-bold">WIN LINE</span>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded" />
          </div>

          {/* Result Display */}
          <div className={`h-20 flex items-center justify-center rounded-lg ${result?.win ? 'bg-green-500/30 border border-green-500' : result ? 'bg-red-500/20 border border-red-500/50' : 'bg-gray-700/50'}`}>
            {result ? (
              <div className="text-center">
                <p className={`font-bold ${result.win ? 'text-green-400' : 'text-gray-400'}`}>
                  {result.message}
                </p>
                {result.win && result.amount > 0 && (
                  <span className="text-yellow-400 text-lg font-bold">+{result.amount} coins!</span>
                )}
                {!result.win && (
                  <span className="text-yellow-400/60 text-xs">Loss adds to JACKPOT!</span>
                )}
                {result.vipPoints && result.vipPoints > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-purple-300 text-xs">+{result.vipPoints} VIP</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Spin to play!</p>
            )}
          </div>
        </div>

        {/* Bet Selection */}
        <div className="mb-4">
          <p className="text-center text-gray-400 text-sm mb-2">Select Bet Amount</p>
          <div className="flex justify-center gap-2">
            {BET_OPTIONS.map((amount) => {
              const discountedAmount = getDiscountedCost(amount);
              return (
                <button
                  key={amount}
                  onClick={() => {
                    casinoSounds.buttonClick();
                    setBet(amount);
                  }}
                  disabled={isSpinning}
                  className={`px-3 py-2 rounded-lg font-bold transition-all relative ${
                    bet === amount
                      ? 'bg-yellow-500 text-black scale-110'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  {hasDiscount && discountedAmount < amount ? (
                    <div className="flex flex-col items-center">
                      <span className="line-through text-xs opacity-50">{amount}</span>
                      <span>{discountedAmount}</span>
                    </div>
                  ) : (
                    amount
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={isSpinning || coins < actualCost}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 hover:from-red-400 hover:via-yellow-400 hover:to-red-400 text-black font-black text-2xl transition-all hover:scale-105 shadow-xl disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine" />
          {isSpinning ? 'SPINNING...' : 'SPIN!'}
        </button>

        {/* Coins Display */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-yellow-300 font-bold">{coins}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Current Bet</p>
            <div className="flex items-center gap-2">
              {hasDiscount && actualCost < bet && (
                <span className="text-gray-500 line-through text-sm">{bet}</span>
              )}
              <p className="text-yellow-400 font-bold">{actualCost} coins</p>
            </div>
          </div>
        </div>

        {/* Paytable */}
        <div className="mt-4 bg-black/30 rounded-xl p-3">
          <p className="text-center text-xs text-gray-400 mb-2">PAYTABLE (3 matching)</p>
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            {SYMBOLS.slice(0, 8).map((symbol) => (
              <div key={symbol.id} className="flex flex-col items-center">
                <span className="text-lg">{symbol.icon}</span>
                <span className="text-yellow-400 font-bold">{symbol.multiplier}x</span>
              </div>
            ))}
          </div>
        </div>

        {coins < actualCost && (
          <p className="text-center text-red-400 text-sm mt-3">
            Not enough coins! Need at least {actualCost} coins.
          </p>
        )}
      </div>

      <style>{`
        @keyframes slot-spin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-66.67%); }
        }
        .animate-slot-spin {
          animation: slot-spin 0.1s linear infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SlotMachineModal;
