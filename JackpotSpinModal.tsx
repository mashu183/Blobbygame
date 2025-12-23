import React, { useState, useEffect, useRef } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface JackpotSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  jackpotAmount: number;
  spinCost: number;
  onSpendCoins: (amount: number) => boolean;
  onAttemptWin: (playerName: string) => { won: boolean; amount: number; isJackpot?: boolean };
  onAddCoins: (amount: number) => void;
  playerName: string;
  onRecordSession?: (bet: number, winAmount: number, won: boolean) => void;
}


const JackpotSpinModal: React.FC<JackpotSpinModalProps> = ({
  isOpen,
  onClose,
  coins,
  jackpotAmount,
  spinCost,
  onSpendCoins,
  onAttemptWin,
  onAddCoins,
  playerName,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ won: boolean; amount: number; isJackpot?: boolean } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [displayedJackpot, setDisplayedJackpot] = useState(jackpotAmount);
  const confettiRef = useRef<HTMLDivElement>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Play modal open sound
  useEffect(() => {
    if (isOpen) {
      casinoSounds.modalOpen();
      setResult(null);
      setShowCelebration(false);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  // Animate jackpot counter
  useEffect(() => {
    if (displayedJackpot < jackpotAmount) {
      const timer = setTimeout(() => {
        setDisplayedJackpot(prev => Math.min(prev + Math.ceil((jackpotAmount - prev) / 10), jackpotAmount));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayedJackpot, jackpotAmount]);

  useEffect(() => {
    setDisplayedJackpot(jackpotAmount);
  }, [isOpen, jackpotAmount]);

  const handleSpin = () => {
    if (coins < spinCost || isSpinning) return;
    
    if (!onSpendCoins(spinCost)) return;
    
    setIsSpinning(true);
    setResult(null);
    
    // Play wheel start and drum roll
    casinoSounds.wheelStart();
    casinoSounds.drumRoll(3.5);
    
    // Play tick sounds during spin
    let tickCount = 0;
    const totalTicks = 35;
    tickIntervalRef.current = setInterval(() => {
      tickCount++;
      casinoSounds.wheelSlowDown(tickCount, totalTicks);
      if (tickCount >= totalTicks) {
        if (tickIntervalRef.current) {
          clearInterval(tickIntervalRef.current);
        }
      }
    }, 110);
    
    // Calculate spin - multiple full rotations plus random final position
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const newRotation = rotation + (spins * 360);
    setRotation(newRotation);
    
    // Determine result after animation
    setTimeout(() => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
      
      casinoSounds.wheelStop();
      
      const spinResult = onAttemptWin(playerName);
      setResult(spinResult);
      setIsSpinning(false);
      
      if (spinResult.won) {
        setShowCelebration(true);
        onAddCoins(spinResult.amount);
        // Play appropriate celebration sound
        if (spinResult.isJackpot) {
          casinoSounds.jackpot();
        } else if (spinResult.amount >= 200) {
          casinoSounds.winBig();
        } else if (spinResult.amount >= 50) {
          casinoSounds.winMedium();
        } else {
          casinoSounds.winSmall();
        }
        // Create confetti explosion for big wins
        if (spinResult.isJackpot || spinResult.amount >= 100) {
          createConfetti();
        }
      } else {
        casinoSounds.lose();
      }
    }, 4000);
  };

  const createConfetti = () => {
    if (!confettiRef.current) return;
    
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const container = confettiRef.current;
    
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 50%;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s ease-out forwards;
        animation-delay: ${Math.random() * 0.5}s;
        --x: ${(Math.random() - 0.5) * 400}px;
        --y: ${-Math.random() * 500 - 100}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      `;
      container.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 4000);
    }
  };

  const resetAndClose = () => {
    casinoSounds.buttonClick();
    if (result?.won) {
      casinoSounds.coinCollect();
    }
    setResult(null);
    setShowCelebration(false);
    onClose();
  };

  if (!isOpen) return null;

  // Wheel segments - 12 segments with various prizes
  const segments = [
    { label: 'JACKPOT', color: 'from-yellow-400 to-amber-500', isWin: true, isJackpot: true },
    { label: '+25', color: 'from-green-500 to-emerald-600', isWin: true, coins: 25 },
    { label: 'MISS', color: 'from-gray-600 to-gray-700', isWin: false },
    { label: '+50', color: 'from-blue-500 to-cyan-600', isWin: true, coins: 50 },
    { label: 'TRY AGAIN', color: 'from-slate-600 to-slate-700', isWin: false },
    { label: '+100', color: 'from-purple-500 to-pink-600', isWin: true, coins: 100 },
    { label: 'MISS', color: 'from-gray-600 to-gray-700', isWin: false },
    { label: '+25', color: 'from-green-500 to-emerald-600', isWin: true, coins: 25 },
    { label: 'TRY AGAIN', color: 'from-slate-600 to-slate-700', isWin: false },
    { label: '+200', color: 'from-orange-500 to-red-600', isWin: true, coins: 200 },
    { label: 'MISS', color: 'from-gray-600 to-gray-700', isWin: false },
    { label: '+50', color: 'from-blue-500 to-cyan-600', isWin: true, coins: 50 },
  ];

  const segmentAngle = 360 / segments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
      
      <div className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-purple-900/50 to-yellow-900/30 rounded-3xl border-2 border-yellow-500/50 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)] animate-pulse" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-yellow-600/40 via-amber-500/40 to-orange-600/40 border-b border-yellow-500/30">
          {/* Back Button */}
          <button
            onClick={resetAndClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white text-sm font-medium pr-1">Back</span>
          </button>
          
          {/* Close Button */}
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-8 h-8 text-yellow-400 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
                MEGA JACKPOT
              </h2>
              <svg className="w-8 h-8 text-yellow-400 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-yellow-200/80 text-sm">Spin to win coins or the JACKPOT!</p>
          </div>
        </div>

        {/* Jackpot Display */}
        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-inner">
              <div className="text-center">
                <p className="text-yellow-400/80 text-sm font-semibold mb-2 uppercase tracking-widest">Current Jackpot</p>
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 tabular-nums">
                    {displayedJackpot.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-2">Growing every second!</p>
              </div>
            </div>
          </div>

          {/* Jackpot Wheel - 12 segments */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/30 blur-xl animate-pulse" />
            
            {/* Wheel container */}
            <div className="absolute inset-0 rounded-full border-8 border-yellow-500/50 shadow-2xl overflow-hidden bg-gray-900">
              {/* Spinning wheel */}
              <div 
                ref={wheelRef}
                className="absolute inset-0 transition-transform ease-out"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? '4000ms' : '0ms',
                }}
              >
                {/* Wheel segments */}
                {segments.map((segment, i) => {
                  const angle = (i * segmentAngle) - (segmentAngle / 2);
                  const startAngle = i * segmentAngle;
                  const endAngle = (i + 1) * segmentAngle;
                  
                  return (
                    <div
                      key={i}
                      className={`absolute inset-0 bg-gradient-to-br ${segment.color}`}
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`,
                      }}
                    >
                      {/* Segment label */}
                      <div 
                        className="absolute text-[7px] font-bold whitespace-nowrap"
                        style={{
                          left: `${50 + 35 * Math.cos((angle - 90 + segmentAngle/2) * Math.PI / 180)}%`,
                          top: `${50 + 35 * Math.sin((angle - 90 + segmentAngle/2) * Math.PI / 180)}%`,
                          transform: `translate(-50%, -50%) rotate(${angle + segmentAngle/2}deg)`,
                          color: segment.isJackpot ? '#FCD34D' : segment.isWin ? '#FFFFFF' : '#9CA3AF',
                          textShadow: segment.isJackpot ? '0 0 10px rgba(252, 211, 77, 0.8)' : 'none',
                        }}
                      >
                        {segment.isJackpot ? '★ JACKPOT ★' : segment.label}
                      </div>
                    </div>
                  );
                })}
                
                {/* Center circle */}
                <div className="absolute inset-1/4 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg border-4 border-yellow-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>
          </div>

          {/* Prize Legend */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/50">
            <p className="text-gray-400 text-xs text-center mb-3 uppercase tracking-wide">Possible Prizes</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-500/20 rounded-lg p-2 border border-green-500/30">
                <span className="text-green-400 font-bold text-sm">+25</span>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-2 border border-blue-500/30">
                <span className="text-blue-400 font-bold text-sm">+50</span>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-2 border border-purple-500/30">
                <span className="text-purple-400 font-bold text-sm">+100</span>
              </div>
              <div className="bg-orange-500/20 rounded-lg p-2 border border-orange-500/30">
                <span className="text-orange-400 font-bold text-sm">+200</span>
              </div>
              <div className="bg-red-500/20 rounded-lg p-2 border border-red-500/30">
                <span className="text-red-400 font-bold text-sm">+500</span>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-2 border border-yellow-500/30">
                <span className="text-yellow-400 font-bold text-sm">JACKPOT!</span>
              </div>
            </div>
          </div>

          {/* Result Display */}
          {result && !showCelebration && !result.won && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-gray-600/50 text-center">
              <p className="text-gray-300 text-lg">Better luck next time!</p>
              <p className="text-gray-400 text-sm mt-1">The jackpot keeps growing...</p>
            </div>
          )}

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={coins < spinCost || isSpinning}
            className={`w-full py-5 rounded-2xl font-bold text-xl transition-all relative overflow-hidden ${
              coins < spinCost || isSpinning
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 text-black shadow-2xl shadow-yellow-500/40 hover:scale-105'
            }`}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                SPINNING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                SPIN FOR {spinCost} COINS
              </span>
            )}
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
          </button>

          {/* Your Coins */}
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
            <span>Your coins:</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="font-bold text-yellow-300">{coins}</span>
            </div>
          </div>
        </div>

        {/* Win Celebration */}
        {showCelebration && result && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
            <div className="text-center p-8 animate-jackpot-win">
              <div className="text-6xl mb-4 animate-bounce">
                <svg className={`w-20 h-20 mx-auto ${result.isJackpot ? 'text-yellow-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text mb-4 animate-pulse ${
                result.isJackpot 
                  ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400' 
                  : 'bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400'
              }`}>
                {result.isJackpot ? 'JACKPOT!!!' : 'YOU WON!'}
              </h2>
              <p className="text-2xl text-yellow-200 mb-2">You won</p>
              <div className="flex items-center justify-center gap-3 mb-6">
                <svg className="w-12 h-12 text-yellow-400 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="text-6xl font-black text-yellow-400">{result.amount.toLocaleString()}</span>
              </div>
              {result.isJackpot && (
                <p className="text-gray-400 mb-6">The jackpot has been reset!</p>
              )}
              <button
                onClick={resetAndClose}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-lg transition-all hover:scale-105"
              >
                COLLECT WINNINGS
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes jackpot-win {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-jackpot-win {
          animation: jackpot-win 0.5s ease-out forwards;
        }
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), calc(var(--y) + 600px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default JackpotSpinModal;
