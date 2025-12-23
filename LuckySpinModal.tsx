import React, { useState, useEffect, useCallback, useRef } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface LuckySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onAddCoins: (amount: number) => void;
  onAddHints: (amount: number) => void;
  onAddLives: (amount: number) => void;
  onSpendCoins: (amount: number) => boolean;
  onContributeToJackpot?: (amount: number) => void;
  onRecordSession?: (bet: number, winAmount: number, won: boolean) => void;
}

interface Prize {
  id: string;
  label: string;
  shortLabel: string;
  type: 'coins' | 'hint' | 'life' | 'nothing';
  value: number;
  color: string;
  probability: number; // Higher = more likely
}

const PRIZES: Prize[] = [
  { id: 'coins5', label: '5 Coins', shortLabel: '5', type: 'coins', value: 5, color: '#F59E0B', probability: 18 },
  { id: 'tryagain1', label: 'Try Again', shortLabel: 'X', type: 'nothing', value: 0, color: '#6B7280', probability: 28 },
  { id: 'coins10', label: '10 Coins', shortLabel: '10', type: 'coins', value: 10, color: '#F59E0B', probability: 14 },
  { id: 'hint', label: '1 Hint', shortLabel: '?', type: 'hint', value: 1, color: '#3B82F6', probability: 6 },
  { id: 'coins20', label: '20 Coins', shortLabel: '20', type: 'coins', value: 20, color: '#F59E0B', probability: 8 },
  { id: 'tryagain2', label: 'Try Again', shortLabel: 'X', type: 'nothing', value: 0, color: '#6B7280', probability: 24 },
  { id: 'life', label: '1 Life', shortLabel: '♥', type: 'life', value: 1, color: '#EF4444', probability: 4 },
  { id: 'coins50', label: '50 Coins!', shortLabel: '50', type: 'coins', value: 50, color: '#10B981', probability: 3 },
];


const SPIN_COST = 25;
const SEGMENT_ANGLE = 360 / PRIZES.length;

const LuckySpinModal: React.FC<LuckySpinModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onAddHints,
  onAddLives,
  onSpendCoins,
  onContributeToJackpot,
  onRecordSession,
}) => {

  const [isSpinning, setIsSpinning] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(false);
  const [timeUntilFreeSpin, setTimeUntilFreeSpin] = useState('');
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play modal open sound
  useEffect(() => {
    if (isOpen) {
      casinoSounds.modalOpen();
    }
  }, [isOpen]);

  // Check if free spin is available
  useEffect(() => {
    const checkFreeSpin = () => {
      const lastFreeSpinDate = localStorage.getItem('blobby-last-free-spin');
      const today = new Date().toDateString();
      
      if (lastFreeSpinDate !== today) {
        setFreeSpinAvailable(true);
        setTimeUntilFreeSpin('');
      } else {
        setFreeSpinAvailable(false);
        // Calculate time until midnight
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilFreeSpin(`${hours}h ${minutes}m`);
      }
    };

    checkFreeSpin();
    const interval = setInterval(checkFreeSpin, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isOpen]);

  // Weighted random selection
  const selectPrize = useCallback((): number => {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < PRIZES.length; i++) {
      random -= PRIZES[i].probability;
      if (random <= 0) {
        return i;
      }
    }
    return 0;
  }, []);

  const spin = useCallback((isFree: boolean) => {
    if (isSpinning) return;
    
    if (!isFree) {
      if (coins < SPIN_COST) return;
      const success = onSpendCoins(SPIN_COST);
      if (!success) return;
    } else {
      // Mark free spin as used
      localStorage.setItem('blobby-last-free-spin', new Date().toDateString());
      setFreeSpinAvailable(false);
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Play wheel start sound
    casinoSounds.wheelStart();

    // Select winning prize
    const winningIndex = selectPrize();
    const prize = PRIZES[winningIndex];

    // Calculate rotation to land on the winning segment
    const targetRotationMod360 = (337.5 - winningIndex * SEGMENT_ANGLE + 360) % 360;
    
    // Calculate how much more we need to rotate from current position
    const currentMod360 = ((rotation % 360) + 360) % 360;
    let additionalRotation = targetRotationMod360 - currentMod360;
    if (additionalRotation < 0) additionalRotation += 360;
    
    // Add full spins (5-7 rotations) for visual effect
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    
    // Add some randomness within the segment (±30% of segment width)
    const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
    
    const finalRotation = rotation + fullSpins * 360 + additionalRotation + randomOffset;

    setRotation(finalRotation);

    // Play tick sounds during spin
    let tickCount = 0;
    const totalTicks = 40;
    tickIntervalRef.current = setInterval(() => {
      tickCount++;
      casinoSounds.wheelSlowDown(tickCount, totalTicks);
      if (tickCount >= totalTicks) {
        if (tickIntervalRef.current) {
          clearInterval(tickIntervalRef.current);
        }
      }
    }, 100);

    // Show result after spin completes
    setTimeout(() => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
      
      // Play wheel stop sound
      casinoSounds.wheelStop();
      
      setIsSpinning(false);
      setResult(prize);
      setShowResult(true);

      // Award prize and play appropriate sound
      if (prize.type === 'coins') {
        onAddCoins(prize.value);
        if (prize.value >= 50) {
          casinoSounds.winBig();
        } else if (prize.value >= 20) {
          casinoSounds.winMedium();
        } else {
          casinoSounds.winSmall();
        }
        casinoSounds.coinCollect();
      } else if (prize.type === 'hint') {
        onAddHints(prize.value);
        casinoSounds.winMedium();
      } else if (prize.type === 'life') {
        onAddLives(prize.value);
        casinoSounds.winBig();
      } else if (prize.type === 'nothing') {
        casinoSounds.lose();
        if (!isFree && onContributeToJackpot) {
          onContributeToJackpot(SPIN_COST);
        }
      }
    }, 4000);
  }, [isSpinning, coins, rotation, selectPrize, onSpendCoins, onAddCoins, onAddHints, onAddLives, onContributeToJackpot]);

  // Cleanup tick interval on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  const closeResult = () => {
    casinoSounds.buttonClick();
    setShowResult(false);
    setResult(null);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl max-w-md w-full p-6 relative border border-purple-500/30 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Lucky Spin!
          </h2>
          <p className="text-gray-400 mt-1">Spin to win amazing prizes!</p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-72 h-72 mx-auto mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>

          {/* Outer Ring Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse opacity-50 blur-md" />

          {/* Wheel */}
          <div
            className="absolute inset-2 rounded-full overflow-hidden shadow-2xl transition-transform ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {PRIZES.map((prize, index) => {
                const startAngle = index * SEGMENT_ANGLE - 90;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);
                const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

                // Calculate text position
                const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
                const textX = 100 + 65 * Math.cos(midAngle);
                const textY = 100 + 65 * Math.sin(midAngle);
                const textRotation = (startAngle + endAngle) / 2 + 90;

                return (
                  <g key={prize.id}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="#1F2937"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize={prize.type === 'nothing' ? '24' : '18'}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {prize.shortLabel}
                    </text>
                  </g>
                );
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="20" fill="#1F2937" stroke="#374151" strokeWidth="3" />
              <circle cx="100" cy="100" r="12" fill="#4B5563" />
            </svg>
          </div>

          {/* Sparkle effects when spinning */}
          {isSpinning && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    left: `${50 + 45 * Math.cos((i * 45 * Math.PI) / 180)}%`,
                    top: `${50 + 45 * Math.sin((i * 45 * Math.PI) / 180)}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Prize Legend */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: '5-50', icon: <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>, color: 'text-yellow-400' },
            { label: 'Hint', icon: <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, color: 'text-blue-400' },
            { label: 'Life', icon: <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>, color: 'text-red-400' },
            { label: 'Retry', icon: <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>, color: 'text-gray-400' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center">{item.icon}</div>
              <div className={`text-xs ${item.color}`}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Spin Buttons */}
        <div className="space-y-3">
          {/* Free Spin Button */}
          {freeSpinAvailable ? (
            <button
              onClick={() => spin(true)}
              disabled={isSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xl transition-all hover:scale-105 shadow-xl shadow-green-500/30 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              <svg className="w-7 h-7 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              FREE SPIN!
              <span className="px-2 py-1 bg-white/20 rounded-lg text-sm">Daily</span>
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-gray-700/50 text-gray-400 font-bold text-center border border-gray-600">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free spin in: {timeUntilFreeSpin}
              </div>
            </div>
          )}

          {/* Paid Spin Button */}
          <button
            onClick={() => spin(false)}
            disabled={isSpinning || coins < SPIN_COST}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            SPIN AGAIN
            <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {SPIN_COST}
            </span>
          </button>

          {coins < SPIN_COST && !freeSpinAvailable && (
            <p className="text-center text-red-400 text-sm">
              Not enough coins! You need {SPIN_COST} coins to spin.
            </p>
          )}
        </div>

        {/* Current Coins Display */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-yellow-300 font-bold">{coins}</span>
            <span className="text-gray-400">coins</span>
          </div>
        </div>

        {/* Result Modal */}
        {showResult && result && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <div className="text-center p-8 animate-bounce-in">
              {result.type === 'nothing' ? (
                <>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-600 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">Try Again!</h3>
                  <p className="text-gray-500 mb-2">Better luck next time!</p>
                  <p className="text-yellow-400 text-sm mb-6">Your loss contributes to the JACKPOT!</p>
                </>
              ) : (
                <>
                  <div 
                    className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse"
                    style={{ backgroundColor: result.color }}
                  >
                    {result.type === 'coins' && (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    {result.type === 'hint' && (
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {result.type === 'life' && (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2">You Won!</h3>
                  <p className="text-2xl font-bold mb-6" style={{ color: result.color }}>
                    {result.label}
                  </p>
                </>
              )}
              <button
                onClick={closeResult}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold transition-all hover:scale-105"
              >
                {result.type === 'nothing' ? 'Spin Again?' : 'Awesome!'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LuckySpinModal;
