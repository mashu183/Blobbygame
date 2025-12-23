import React, { useState, useCallback, useRef, useEffect } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface CoinFlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onAddCoins: (amount: number) => void;
  onSpendCoins: (amount: number) => boolean;
  onContributeToJackpot?: (amount: number) => void;
}

const BET_OPTIONS = [10, 25, 50, 100, 250];

const CoinFlipModal: React.FC<CoinFlipModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onSpendCoins,
  onContributeToJackpot,
}) => {
  const [bet, setBet] = useState(25);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [won, setWon] = useState(false);
  const [streak, setStreak] = useState(0);
  const [currentWinnings, setCurrentWinnings] = useState(0);
  const [coinRotation, setCoinRotation] = useState(0);
  const coinRef = useRef<HTMLDivElement>(null);

  // Reset coin rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoinRotation(0);
      setResult(null);
      casinoSounds.modalOpen();
    }
  }, [isOpen]);

  const flip = useCallback(() => {
    if (!choice || isFlipping || coins < bet) return;

    const success = onSpendCoins(bet);
    if (!success) return;

    setIsFlipping(true);
    setShowResult(false);
    setResult(null);

    // Play flip sound
    casinoSounds.coinFlip();

    // Determine result first (house edge - 42% win rate)
    const playerWins = Math.random() < 0.42;
    const flipResult: 'heads' | 'tails' = playerWins ? choice : (choice === 'heads' ? 'tails' : 'heads');

    // Calculate rotation to land on the correct side
    // Heads = 0 degrees (or multiples of 360)
    // Tails = 180 degrees (or 180 + multiples of 360)
    const baseSpins = 5; // Number of full rotations for visual effect
    const targetDegrees = flipResult === 'heads' ? 0 : 180;
    const finalRotation = (baseSpins * 360) + targetDegrees;
    
    setCoinRotation(finalRotation);

    // Play spinning sound
    setTimeout(() => casinoSounds.coinSpin(), 200);

    setTimeout(() => {
      // Play landing sound
      casinoSounds.coinLand();
      
      setResult(flipResult);
      setIsFlipping(false);
      setShowResult(true);

      const didWin = flipResult === choice;
      setWon(didWin);

      if (didWin) {
        const winAmount = bet * 2;
        onAddCoins(winAmount);
        setStreak(prev => prev + 1);
        setCurrentWinnings(prev => prev + bet);
        // Play win sound
        casinoSounds.winSmall();
        casinoSounds.coinCollect();
      } else {
        setStreak(0);
        setCurrentWinnings(0);
        // Play lose sound
        casinoSounds.lose();
        // Contribute to jackpot on loss
        if (onContributeToJackpot) {
          onContributeToJackpot(bet);
        }
      }
    }, 2000);
  }, [choice, isFlipping, coins, bet, onSpendCoins, onAddCoins, onContributeToJackpot]);


  const doubleOrNothing = useCallback(() => {
    if (currentWinnings <= 0 || isFlipping) return;

    setIsFlipping(true);
    setShowResult(false);

    // Play flip sound
    casinoSounds.coinFlip();
    casinoSounds.suspense();

    // Higher risk for double or nothing (38% win rate)
    const playerWins = Math.random() < 0.38;
    const flipResult: 'heads' | 'tails' = playerWins ? (choice || 'heads') : ((choice === 'heads' ? 'tails' : 'heads'));

    // Calculate rotation
    const baseSpins = 5;
    const currentBase = coinRotation % 360;
    const targetDegrees = flipResult === 'heads' ? 0 : 180;
    const additionalRotation = (baseSpins * 360) + targetDegrees - currentBase;
    
    setCoinRotation(prev => prev + additionalRotation);

    // Play spinning sound
    setTimeout(() => casinoSounds.coinSpin(), 200);

    setTimeout(() => {
      // Play landing sound
      casinoSounds.coinLand();
      
      setResult(flipResult);
      setIsFlipping(false);
      setShowResult(true);

      const didWin = flipResult === choice;
      setWon(didWin);

      if (didWin) {
        const doubleWin = currentWinnings;
        onAddCoins(doubleWin);
        setStreak(prev => prev + 1);
        setCurrentWinnings(prev => prev * 2);
        // Play big win sound for double or nothing
        casinoSounds.winBig();
        casinoSounds.coinCollect();
      } else {
        // Lose all accumulated winnings
        onAddCoins(-currentWinnings);
        setStreak(0);
        // Contribute all lost winnings to jackpot
        if (onContributeToJackpot) {
          onContributeToJackpot(currentWinnings);
        }
        setCurrentWinnings(0);
        // Play lose sound
        casinoSounds.lose();
      }
    }, 2000);
  }, [currentWinnings, isFlipping, choice, coinRotation, onAddCoins, onContributeToJackpot]);

  const collectWinnings = () => {
    casinoSounds.coinCollect();
    setCurrentWinnings(0);
    setShowResult(false);
    setChoice(null);
  };

  const resetGame = () => {
    casinoSounds.buttonClick();
    setShowResult(false);
    setResult(null);
    setChoice(null);
    setCoinRotation(0);
  };


  if (!isOpen) return null;

  // Determine which side is currently showing based on rotation
  const currentRotationMod = coinRotation % 360;
  const showingTails = currentRotationMod >= 90 && currentRotationMod < 270;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-amber-900 to-orange-900 rounded-3xl max-w-md w-full p-6 relative border border-amber-500/30 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isFlipping}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Coin Flip
          </h2>
          <p className="text-gray-400 mt-1">Double or nothing!</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
            <p className="text-xs text-gray-400">Your Coins</p>
            <p className="text-yellow-400 font-bold text-lg">{coins}</p>
          </div>
          <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
            <p className="text-xs text-gray-400">Win Streak</p>
            <p className="text-green-400 font-bold text-lg">{streak}</p>
          </div>
          {currentWinnings > 0 && (
            <div className="text-center px-4 py-2 bg-green-500/20 rounded-xl border border-green-500/50">
              <p className="text-xs text-green-400">Winnings</p>
              <p className="text-green-300 font-bold text-lg">+{currentWinnings}</p>
            </div>
          )}
        </div>

        {/* Coin - 3D Flip */}
        <div className="flex justify-center mb-6" style={{ perspective: '1000px' }}>
          <div
            ref={coinRef}
            className="w-32 h-32 relative"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `rotateY(${coinRotation}deg)`,
              transition: isFlipping ? 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
            }}
          >
            {/* Heads side (front) */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-300 shadow-xl"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)'
              }}
            >
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-900">H</div>
                <div className="text-xs text-yellow-800 font-bold">HEADS</div>
              </div>
            </div>
            {/* Tails side (back) */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center border-4 border-amber-400 shadow-xl"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-center">
                <div className="text-4xl font-black text-amber-900">T</div>
                <div className="text-xs text-amber-800 font-bold">TAILS</div>
              </div>
            </div>
          </div>
        </div>

        {!showResult ? (
          <>
            {/* Choice Selection */}
            <div className="mb-4">
              <p className="text-center text-gray-400 text-sm mb-2">Choose your side</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setChoice('heads')}
                  disabled={isFlipping}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    choice === 'heads'
                      ? 'bg-yellow-500 text-black scale-110'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  HEADS
                </button>
                <button
                  onClick={() => setChoice('tails')}
                  disabled={isFlipping}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    choice === 'tails'
                      ? 'bg-amber-500 text-black scale-110'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  TAILS
                </button>
              </div>
            </div>

            {/* Bet Selection */}
            <div className="mb-4">
              <p className="text-center text-gray-400 text-sm mb-2">Bet Amount</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {BET_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBet(amount)}
                    disabled={isFlipping || coins < amount}
                    className={`px-3 py-2 rounded-lg font-bold transition-all ${
                      bet === amount
                        ? 'bg-yellow-500 text-black scale-110'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Flip Button */}
            <button
              onClick={flip}
              disabled={!choice || isFlipping || coins < bet}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-xl transition-all hover:scale-105 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {isFlipping ? 'FLIPPING...' : `FLIP FOR ${bet} COINS`}
            </button>

            {/* Potential Win */}
            <p className="text-center text-gray-400 text-sm mt-3">
              Win: <span className="text-green-400 font-bold">{bet * 2} coins</span> (2x)
            </p>
          </>
        ) : (
          <>
            {/* Result Display */}
            <div className={`text-center mb-6 p-4 rounded-xl ${won ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
              <h3 className={`text-2xl font-black ${won ? 'text-green-400' : 'text-red-400'}`}>
                {result?.toUpperCase()}!
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                You chose: <span className="font-bold text-white">{choice?.toUpperCase()}</span>
              </p>
              <p className={`text-lg mt-2 ${won ? 'text-green-300' : 'text-red-300'}`}>
                {won ? `You won ${bet * 2} coins!` : 'Better luck next time!'}
              </p>
              {!won && (
                <p className="text-yellow-400 text-xs mt-1">Your loss contributes to the JACKPOT!</p>
              )}
            </div>

            {/* Double or Nothing / Collect */}
            {won && currentWinnings > 0 ? (
              <div className="space-y-3">
                <button
                  onClick={doubleOrNothing}
                  disabled={isFlipping}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-black text-lg transition-all hover:scale-105 shadow-xl disabled:opacity-50"
                >
                  DOUBLE OR NOTHING ({currentWinnings * 2} coins)
                </button>
                <button
                  onClick={collectWinnings}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold transition-all hover:scale-105"
                >
                  COLLECT {currentWinnings} COINS
                </button>
              </div>
            ) : (
              <button
                onClick={resetGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-lg transition-all hover:scale-105"
              >
                PLAY AGAIN
              </button>
            )}
          </>
        )}

        {coins < bet && !showResult && (
          <p className="text-center text-red-400 text-sm mt-3">
            Not enough coins! Need at least {bet} coins.
          </p>
        )}

        {/* Odds Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>50/50 chance • 2x payout • Losses feed JACKPOT</p>
        </div>
      </div>
    </div>
  );
};

export default CoinFlipModal;
