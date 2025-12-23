import React, { useState, useEffect } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface MysteryBoxModalProps {
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


interface BoxTier {
  id: string;
  name: string;
  cost: number;
  color: string;
  gradient: string;
  rewards: { type: 'coins' | 'hints' | 'lives' | 'jackpot' | 'nothing'; min: number; max: number; chance: number }[];
  jackpotMultiplier: number;
}

const BOX_TIERS: BoxTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Box',
    cost: 15,
    color: '#CD7F32',
    gradient: 'from-amber-700 to-amber-900',
    rewards: [
      { type: 'coins', min: 5, max: 12, chance: 38 },
      { type: 'hints', min: 1, max: 1, chance: 12 },
      { type: 'lives', min: 1, max: 1, chance: 8 },
      { type: 'jackpot', min: 50, max: 50, chance: 2 },
      { type: 'nothing', min: 0, max: 0, chance: 40 },
    ],
    jackpotMultiplier: 3,
  },
  {
    id: 'silver',
    name: 'Silver Box',
    cost: 40,
    color: '#C0C0C0',
    gradient: 'from-gray-400 to-gray-600',
    rewards: [
      { type: 'coins', min: 15, max: 40, chance: 35 },
      { type: 'hints', min: 1, max: 2, chance: 12 },
      { type: 'lives', min: 1, max: 2, chance: 10 },
      { type: 'jackpot', min: 150, max: 150, chance: 3 },
      { type: 'nothing', min: 0, max: 0, chance: 40 },
    ],
    jackpotMultiplier: 4,
  },
  {
    id: 'gold',
    name: 'Gold Box',
    cost: 100,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    rewards: [
      { type: 'coins', min: 40, max: 100, chance: 32 },
      { type: 'hints', min: 2, max: 3, chance: 12 },
      { type: 'lives', min: 2, max: 3, chance: 10 },
      { type: 'jackpot', min: 500, max: 500, chance: 4 },
      { type: 'nothing', min: 0, max: 0, chance: 42 },
    ],
    jackpotMultiplier: 5,
  },
  {
    id: 'diamond',
    name: 'Diamond Box',
    cost: 250,
    color: '#B9F2FF',
    gradient: 'from-cyan-300 to-blue-500',
    rewards: [
      { type: 'coins', min: 100, max: 280, chance: 30 },
      { type: 'hints', min: 3, max: 5, chance: 12 },
      { type: 'lives', min: 3, max: 5, chance: 10 },
      { type: 'jackpot', min: 1500, max: 1500, chance: 5 },
      { type: 'nothing', min: 0, max: 0, chance: 43 },
    ],
    jackpotMultiplier: 6,
  },
];


const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onAddHints,
  onAddLives,
  onSpendCoins,
  onContributeToJackpot,
}) => {
  const [selectedBox, setSelectedBox] = useState<BoxTier | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<{ type: string; amount: number; isJackpot: boolean; isNothing: boolean } | null>(null);
  const [showReward, setShowReward] = useState(false);

  // Play modal open sound
  useEffect(() => {
    if (isOpen) {
      casinoSounds.modalOpen();
    }
  }, [isOpen]);

  const selectReward = (box: BoxTier): { type: string; amount: number; isJackpot: boolean; isNothing: boolean } => {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const r of box.rewards) {
      cumulative += r.chance;
      if (random <= cumulative) {
        const amount = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
        return {
          type: r.type === 'jackpot' ? 'coins' : r.type,
          amount: r.type === 'jackpot' ? amount : amount,
          isJackpot: r.type === 'jackpot',
          isNothing: r.type === 'nothing',
        };
      }
    }

    return { type: 'coins', amount: box.rewards[0].min, isJackpot: false, isNothing: false };
  };

  const openBox = (box: BoxTier) => {
    if (coins < box.cost || isOpening) return;

    const success = onSpendCoins(box.cost);
    if (!success) return;

    // Play box shake sound
    casinoSounds.boxShake();

    setSelectedBox(box);
    setIsOpening(true);
    setShowReward(false);

    // Play suspense sound
    setTimeout(() => casinoSounds.suspense(), 500);

    // Simulate opening animation
    setTimeout(() => {
      // Play box open sound
      casinoSounds.boxOpen();
      
      const result = selectReward(box);
      setReward(result);

      // Play reveal sound
      setTimeout(() => {
        casinoSounds.boxReveal();
        
        // Award the prize and play appropriate sound
        if (result.isNothing) {
          casinoSounds.lose();
          if (onContributeToJackpot) {
            onContributeToJackpot(box.cost);
          }
        } else if (result.isJackpot) {
          casinoSounds.jackpot();
          onAddCoins(result.amount);
        } else if (result.type === 'coins') {
          if (result.amount >= 100) {
            casinoSounds.winBig();
          } else if (result.amount >= 30) {
            casinoSounds.winMedium();
          } else {
            casinoSounds.winSmall();
          }
          casinoSounds.coinCollect();
          onAddCoins(result.amount);
        } else if (result.type === 'hints') {
          casinoSounds.winMedium();
          onAddHints(result.amount);
        } else if (result.type === 'lives') {
          casinoSounds.winBig();
          onAddLives(result.amount);
        }
      }, 300);

      setIsOpening(false);
      setShowReward(true);
    }, 2000);
  };

  const closeReward = () => {
    casinoSounds.buttonClick();
    setShowReward(false);
    setReward(null);
    setSelectedBox(null);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl max-w-lg w-full p-6 relative border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isOpening}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Mystery Boxes
          </h2>
          <p className="text-gray-400 mt-1">Open boxes for random rewards!</p>
        </div>

        {/* Coins Display */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-yellow-300 font-bold">{coins}</span>
            <span className="text-gray-400">coins</span>
          </div>
        </div>

        {/* Box Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {BOX_TIERS.map((box) => (
            <button
              key={box.id}
              onClick={() => openBox(box)}
              disabled={coins < box.cost || isOpening}
              className={`relative p-4 rounded-2xl bg-gradient-to-br ${box.gradient} border-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 group overflow-hidden`}
              style={{ borderColor: box.color }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {/* Box Icon */}
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
                    {/* Box body */}
                    <rect x="8" y="24" width="48" height="32" rx="4" fill={box.color} />
                    {/* Box lid */}
                    <rect x="4" y="16" width="56" height="12" rx="3" fill={box.color} />
                    {/* Ribbon vertical */}
                    <rect x="28" y="16" width="8" height="40" fill="#fff" opacity="0.3" />
                    {/* Ribbon horizontal */}
                    <rect x="4" y="28" width="56" height="8" fill="#fff" opacity="0.3" />
                    {/* Bow */}
                    <circle cx="32" cy="20" r="6" fill="#fff" opacity="0.5" />
                  </svg>
                  {/* Question mark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white/80">?</span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm mb-1">{box.name}</h3>
                <div className="flex items-center justify-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-yellow-300 font-bold">{box.cost}</span>
                </div>

                {/* Jackpot chance badge */}
                <div className="mt-2 text-xs text-white/70">
                  {box.rewards.find(r => r.type === 'jackpot')?.chance}% Jackpot!
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-400">
          <h4 className="font-semibold text-white mb-2">Possible Rewards:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Coins</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Hints</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>Lives</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Empty (feeds Jackpot)</span>
            </div>
          </div>
        </div>

        {/* Opening Animation */}
        {isOpening && selectedBox && (
          <div className="absolute inset-0 bg-black/90 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className={`w-32 h-32 mx-auto mb-4 bg-gradient-to-br ${selectedBox.gradient} rounded-2xl animate-bounce shadow-2xl flex items-center justify-center`}>
                <div className="animate-spin">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold text-white animate-pulse">Opening {selectedBox.name}...</p>
            </div>
          </div>
        )}

        {/* Reward Display */}
        {showReward && reward && selectedBox && (
          <div className="absolute inset-0 bg-black/90 rounded-3xl flex items-center justify-center">
            <div className="text-center animate-bounce-in">
              {reward.isNothing ? (
                <>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-600 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">Empty Box!</h3>
                  <p className="text-gray-500 mb-2">Better luck next time!</p>
                  <p className="text-yellow-400 text-sm mb-6">Your loss contributes to the JACKPOT!</p>
                </>
              ) : (
                <>
                  {reward.isJackpot && (
                    <div className="mb-4">
                      <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 animate-pulse">
                        JACKPOT!
                      </div>
                      <div className="flex justify-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDelay: `${i * 0.1}s` }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${reward.isJackpot ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse' : 'bg-gradient-to-br ' + selectedBox.gradient}`}
                  >
                    {reward.type === 'coins' && (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    {reward.type === 'hints' && (
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {reward.type === 'lives' && (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-white mb-2">You Won!</h3>
                  <p className="text-2xl font-bold text-yellow-400 mb-6">
                    {reward.amount} {reward.type === 'coins' ? 'Coins' : reward.type === 'hints' ? 'Hints' : 'Lives'}!
                  </p>
                </>
              )}

              <button
                onClick={closeReward}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold transition-all hover:scale-105"
              >
                {reward.isNothing ? 'Try Again' : 'Awesome!'}
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
      `}</style>
    </div>
  );
};

export default MysteryBoxModal;
