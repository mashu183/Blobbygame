import React, { useState, useRef, useEffect } from 'react';
import { casinoSounds } from '@/lib/sounds';

interface ScratchCardModalProps {
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


interface CardTier {
  id: string;
  name: string;
  cost: number;
  gradient: string;
  prizes: { value: number; type: 'coins' | 'hints' | 'lives' | 'nothing'; chance: number }[];
}
// Adjusted win rates - much higher "nothing" chance (house edge ~80-85%)
// Reduced coin amounts significantly



const CARD_TIERS: CardTier[] = [
  {
    id: 'basic',
    name: 'Basic Card',
    cost: 20,
    gradient: 'from-gray-500 to-gray-700',
    prizes: [
      { value: 0, type: 'nothing', chance: 78 }, // Increased from 65% to 78%
      { value: 2, type: 'coins', chance: 10 },   // Reduced from 5 to 2
      { value: 5, type: 'coins', chance: 5 },    // Reduced from 10 to 5
      { value: 10, type: 'coins', chance: 2 },   // Reduced from 25 to 10
      { value: 20, type: 'coins', chance: 0.5 }, // Reduced from 50 to 20
      { value: 1, type: 'hints', chance: 2.5 },
      { value: 1, type: 'lives', chance: 2 },
    ],
  },
  {
    id: 'premium',
    name: 'Premium Card',
    cost: 50,
    gradient: 'from-purple-500 to-pink-600',
    prizes: [
      { value: 0, type: 'nothing', chance: 76 }, // Increased from 62% to 76%
      { value: 5, type: 'coins', chance: 10 },   // Reduced from 20 to 5
      { value: 15, type: 'coins', chance: 6 },   // Reduced from 40 to 15
      { value: 30, type: 'coins', chance: 2.5 }, // Reduced from 75 to 30
      { value: 60, type: 'coins', chance: 0.5 }, // Reduced from 150 to 60
      { value: 1, type: 'hints', chance: 3 },
      { value: 1, type: 'lives', chance: 2 },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Card',
    cost: 100,
    gradient: 'from-yellow-400 to-orange-500',
    prizes: [
      { value: 0, type: 'nothing', chance: 74 }, // Increased from 60% to 74%
      { value: 15, type: 'coins', chance: 10 },  // Reduced from 50 to 15
      { value: 40, type: 'coins', chance: 6 },   // Reduced from 100 to 40
      { value: 80, type: 'coins', chance: 3 },   // Reduced from 200 to 80
      { value: 150, type: 'coins', chance: 0.5 },// Reduced from 500 to 150
      { value: 2, type: 'hints', chance: 4 },
      { value: 2, type: 'lives', chance: 2.5 },
    ],
  },
];






const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onAddHints,
  onAddLives,
  onSpendCoins,
  onContributeToJackpot,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardTier | null>(null);
  const [prizes, setPrizes] = useState<{ value: number; type: string }[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false, false, false]);
  const [scratchProgress, setScratchProgress] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [isScratching, setIsScratching] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [totalWin, setTotalWin] = useState(0);
  const [freeCardAvailable, setFreeCardAvailable] = useState(false);
  const [cardCost, setCardCost] = useState(0);
  const [wasFreeSpin, setWasFreeSpin] = useState(false);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const lastScratchSoundTime = useRef(0);

  // Play modal open sound
  useEffect(() => {
    if (isOpen) {
      casinoSounds.modalOpen();
    }
  }, [isOpen]);

  useEffect(() => {
    const lastFreeCard = localStorage.getItem('blobby-last-free-scratch');
    const today = new Date().toDateString();
    setFreeCardAvailable(lastFreeCard !== today);
  }, [isOpen]);

  const generatePrizes = (card: CardTier) => {
    const result: { value: number; type: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const prize of card.prizes) {
        cumulative += prize.chance;
        if (random <= cumulative) {
          result.push({ value: prize.value, type: prize.type });
          break;
        }
      }
    }
    return result;
  };

  const buyCard = (card: CardTier, isFree: boolean = false) => {
    if (!isFree && coins < card.cost) return;

    if (!isFree) {
      const success = onSpendCoins(card.cost);
      if (!success) return;
    } else {
      localStorage.setItem('blobby-last-free-scratch', new Date().toDateString());
      setFreeCardAvailable(false);
    }

    // Play card purchase sound
    casinoSounds.buttonClick();

    setSelectedCard(card);
    setCardCost(card.cost);
    setWasFreeSpin(isFree);
    setPrizes(generatePrizes(card));
    setRevealed([false, false, false, false, false, false]);
    setScratchProgress([0, 0, 0, 0, 0, 0]);
    setAllRevealed(false);
    setTotalWin(0);

    // Initialize canvas for each scratch area
    setTimeout(() => {
      canvasRefs.current.forEach((canvas, index) => {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#6B7280';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Add scratch pattern
            ctx.fillStyle = '#9CA3AF';
            for (let i = 0; i < 20; i++) {
              ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 10 + 5,
                Math.random() * 3 + 1
              );
            }
          }
        }
      });
    }, 100);
  };

  const handleScratch = (index: number, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (revealed[index] || !selectedCard) return;

    const canvas = canvasRefs.current[index];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsScratching(true);

    // Play scratch sound (throttled)
    const now = Date.now();
    if (now - lastScratchSoundTime.current > 80) {
      casinoSounds.scratch();
      lastScratchSoundTime.current = now;
    }

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const progress = (transparent / (imageData.data.length / 4)) * 100;

    setScratchProgress(prev => {
      const newProgress = [...prev];
      newProgress[index] = progress;
      return newProgress;
    });

    // Auto-reveal if scratched enough
    if (progress > 50 && !revealed[index]) {
      // Play reveal sound
      casinoSounds.scratchReveal();
      
      setRevealed(prev => {
        const newRevealed = [...prev];
        newRevealed[index] = true;
        return newRevealed;
      });
    }
  };

  const handleScratchEnd = () => {
    setIsScratching(false);
  };

  // Check if all revealed and calculate total
  useEffect(() => {
    if (selectedCard && revealed.every(r => r) && !allRevealed) {
      setAllRevealed(true);
      
      // Mark scratch complete for audio ducking
      casinoSounds.scratchComplete();
      
      // Calculate winnings
      let coinWin = 0;
      let hintWin = 0;
      let lifeWin = 0;
      let nothingCount = 0;

      prizes.forEach(prize => {
        if (prize.type === 'coins') coinWin += prize.value;
        else if (prize.type === 'hints') hintWin += prize.value;
        else if (prize.type === 'lives') lifeWin += prize.value;
        else if (prize.type === 'nothing') nothingCount++;
      });

      setTotalWin(coinWin);
      
      // Play appropriate sound
      if (coinWin > 0 || hintWin > 0 || lifeWin > 0) {
        if (coinWin >= 100) {
          casinoSounds.winBig();
        } else if (coinWin >= 25 || hintWin > 0 || lifeWin > 0) {
          casinoSounds.winMedium();
        } else {
          casinoSounds.winSmall();
        }
        if (coinWin > 0) casinoSounds.coinCollect();
      } else {
        casinoSounds.lose();
      }
      
      if (coinWin > 0) onAddCoins(coinWin);
      if (hintWin > 0) onAddHints(hintWin);
      if (lifeWin > 0) onAddLives(lifeWin);
      
      // If mostly nothing, contribute to jackpot
      if (nothingCount >= 3 && !wasFreeSpin && onContributeToJackpot) {
        onContributeToJackpot(cardCost);
      }
    }
  }, [revealed, selectedCard, allRevealed, prizes, onAddCoins, onAddHints, onAddLives, onContributeToJackpot, cardCost, wasFreeSpin]);


  const revealAll = () => {
    casinoSounds.buttonClick();
    setRevealed([true, true, true, true, true, true]);
  };

  const backToSelection = () => {
    casinoSounds.buttonClick();
    setSelectedCard(null);
    setPrizes([]);
    setRevealed([false, false, false, false, false, false]);
    setScratchProgress([0, 0, 0, 0, 0, 0]);
    setAllRevealed(false);
    setTotalWin(0);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-emerald-900 to-teal-900 rounded-3xl max-w-md w-full p-6 relative border border-emerald-500/30 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!selectedCard ? (
          <>
            {/* Card Selection */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-green-400 to-emerald-400 bg-clip-text text-transparent">
                Scratch Cards
              </h2>
              <p className="text-gray-400 mt-1">Scratch to reveal your prizes!</p>
            </div>

            {/* Coins Display */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="text-yellow-300 font-bold">{coins}</span>
              </div>
            </div>

            {/* Free Card */}
            {freeCardAvailable && (
              <button
                onClick={() => buyCard(CARD_TIERS[0], true)}
                className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all hover:scale-105 border-2 border-green-400"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="font-bold text-white text-lg">FREE Daily Card!</h3>
                    <p className="text-green-200 text-sm">Claim your free scratch card</p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white font-bold animate-pulse">
                    FREE
                  </span>
                </div>
              </button>
            )}

            {/* Card Options */}
            <div className="space-y-3">
              {CARD_TIERS.map((card) => (
                <button
                  key={card.id}
                  onClick={() => buyCard(card)}
                  disabled={coins < card.cost}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-r ${card.gradient} hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 border border-white/20`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-bold text-white text-lg">{card.name}</h3>
                      <p className="text-white/70 text-sm">6 scratch spots</p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-black/30 rounded-full">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="text-yellow-300 font-bold">{card.cost}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Jackpot Info */}
            <p className="text-center text-yellow-400/60 text-xs mt-4">
              Bad cards contribute to the JACKPOT!
            </p>
          </>
        ) : (
          <>
            {/* Scratch Card Game */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-white">{selectedCard.name}</h2>
              <p className="text-gray-400 text-sm">Scratch all spots to reveal prizes!</p>
            </div>

            {/* Scratch Grid */}
            <div className={`bg-gradient-to-br ${selectedCard.gradient} rounded-2xl p-4 mb-4 border-4 border-yellow-500`}>
              <div className="grid grid-cols-3 gap-3">
                {prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-square bg-white rounded-xl overflow-hidden"
                  >
                    {/* Prize underneath */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
                      {prize.type === 'coins' && (
                        <>
                          <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          <span className="text-yellow-700 font-bold text-sm">{prize.value}</span>
                        </>
                      )}
                      {prize.type === 'hints' && (
                        <>
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-blue-700 font-bold text-sm">{prize.value}</span>
                        </>
                      )}
                      {prize.type === 'lives' && (
                        <>
                          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="text-red-700 font-bold text-sm">{prize.value}</span>
                        </>
                      )}
                      {prize.type === 'nothing' && (
                        <>
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-500 font-bold text-xs">Empty</span>
                        </>
                      )}
                    </div>

                    {/* Scratch overlay */}
                    {!revealed[index] && (
                      <canvas
                        ref={(el) => (canvasRefs.current[index] = el)}
                        width={100}
                        height={100}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        onMouseMove={(e) => isScratching && handleScratch(index, e)}
                        onMouseDown={(e) => { setIsScratching(true); handleScratch(index, e); }}
                        onMouseUp={handleScratchEnd}
                        onMouseLeave={handleScratchEnd}
                        onTouchMove={(e) => handleScratch(index, e)}
                        onTouchStart={(e) => { setIsScratching(true); handleScratch(index, e); }}
                        onTouchEnd={handleScratchEnd}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progress</span>
                <span>{revealed.filter(r => r).length}/6 revealed</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                  style={{ width: `${(revealed.filter(r => r).length / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Reveal All Button */}
            {!allRevealed && (
              <button
                onClick={revealAll}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors mb-4"
              >
                Reveal All
              </button>
            )}

            {/* Results */}
            {allRevealed && (
              <div className="text-center mb-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                <h3 className="text-xl font-bold text-white mb-2">Card Complete!</h3>
                <div className="flex justify-center gap-4">
                  {prizes.filter(p => p.type === 'coins').length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="text-yellow-300 font-bold">
                        +{prizes.filter(p => p.type === 'coins').reduce((a, b) => a + b.value, 0)}
                      </span>
                    </div>
                  )}
                  {prizes.filter(p => p.type === 'hints').length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-blue-300 font-bold">
                        +{prizes.filter(p => p.type === 'hints').reduce((a, b) => a + b.value, 0)}
                      </span>
                    </div>
                  )}
                  {prizes.filter(p => p.type === 'lives').length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="text-red-300 font-bold">
                        +{prizes.filter(p => p.type === 'lives').reduce((a, b) => a + b.value, 0)}
                      </span>
                    </div>
                  )}
                </div>
                {prizes.filter(p => p.type === 'nothing').length >= 3 && !wasFreeSpin && (
                  <p className="text-yellow-400 text-xs mt-2">Bad luck! Your loss feeds the JACKPOT!</p>
                )}
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={backToSelection}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold transition-all hover:scale-105"
            >
              {allRevealed ? 'Buy Another Card' : 'Back to Cards'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScratchCardModal;
