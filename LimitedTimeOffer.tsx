import React, { useState, useEffect, useCallback } from 'react';
import { GAME_IMAGES } from '../../types/game';

interface LimitedTimeOfferProps {
  coins: number;
  onPurchase: (coins: number, cost: number, lives?: number, hints?: number) => void;
  onClose: () => void;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  coins: number;
  lives: number;
  hints: number;
  discount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

// Rotating offers with different values
const OFFER_POOL: Offer[] = [
  {
    id: 'starter-pack',
    title: 'Starter Pack',
    description: 'Perfect for new players!',
    originalPrice: 500,
    salePrice: 199,
    coins: 500,
    lives: 10,
    hints: 5,
    discount: 60,
    rarity: 'common',
    icon: 'gift',
  },
  {
    id: 'mega-bundle',
    title: 'MEGA Bundle',
    description: 'Best value ever!',
    originalPrice: 1500,
    salePrice: 499,
    coins: 1500,
    lives: 25,
    hints: 15,
    discount: 67,
    rarity: 'epic',
    icon: 'star',
  },
  {
    id: 'coin-rush',
    title: 'Coin Rush',
    description: 'Coins galore!',
    originalPrice: 800,
    salePrice: 299,
    coins: 1000,
    lives: 5,
    hints: 3,
    discount: 63,
    rarity: 'rare',
    icon: 'coins',
  },
  {
    id: 'survival-kit',
    title: 'Survival Kit',
    description: 'Never run out of lives!',
    originalPrice: 600,
    salePrice: 249,
    coins: 300,
    lives: 30,
    hints: 10,
    discount: 58,
    rarity: 'rare',
    icon: 'heart',
  },
  {
    id: 'legendary-chest',
    title: 'LEGENDARY Chest',
    description: 'Once in a lifetime deal!',
    originalPrice: 3000,
    salePrice: 799,
    coins: 3000,
    lives: 50,
    hints: 30,
    discount: 73,
    rarity: 'legendary',
    icon: 'crown',
  },
  {
    id: 'hint-master',
    title: 'Hint Master Pack',
    description: 'Stuck? Not anymore!',
    originalPrice: 400,
    salePrice: 149,
    coins: 200,
    lives: 5,
    hints: 25,
    discount: 63,
    rarity: 'common',
    icon: 'lightbulb',
  },
];

const LimitedTimeOffer: React.FC<LimitedTimeOfferProps> = ({
  coins,
  onPurchase,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [purchased, setPurchased] = useState(false);

  // Generate a random offer duration (15-45 minutes)
  const generateOfferDuration = () => Math.floor(Math.random() * 30 + 15) * 60;

  // Select a random offer
  const selectRandomOffer = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * OFFER_POOL.length);
    return OFFER_POOL[randomIndex];
  }, []);

  // Check and load offer from storage
  useEffect(() => {
    const savedOffer = localStorage.getItem('blobby-limited-offer');
    
    if (savedOffer) {
      try {
        const parsed = JSON.parse(savedOffer);
        const endTime = new Date(parsed.endTime).getTime();
        const now = Date.now();
        
        if (endTime > now) {
          // Offer still valid
          setOffer(parsed.offer);
          setTimeLeft(Math.floor((endTime - now) / 1000));
          setIsVisible(true);
        } else {
          // Offer expired, maybe generate new one (30% chance)
          if (Math.random() < 0.3) {
            createNewOffer();
          }
        }
      } catch {
        localStorage.removeItem('blobby-limited-offer');
      }
    } else {
      // No saved offer, 20% chance to show one
      if (Math.random() < 0.2) {
        createNewOffer();
      }
    }
  }, []);

  const createNewOffer = () => {
    const newOffer = selectRandomOffer();
    const duration = generateOfferDuration();
    const endTime = new Date(Date.now() + duration * 1000).toISOString();
    
    localStorage.setItem('blobby-limited-offer', JSON.stringify({
      offer: newOffer,
      endTime,
    }));
    
    setOffer(newOffer);
    setTimeLeft(duration);
    setIsVisible(true);
  };

  // Countdown timer
  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('blobby-limited-offer');
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchase = () => {
    if (!offer || coins < offer.salePrice) return;
    
    onPurchase(offer.coins, offer.salePrice, offer.lives, offer.hints);
    setPurchased(true);
    localStorage.removeItem('blobby-limited-offer');
    
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || !offer) return null;

  const canAfford = coins >= offer.salePrice;
  const isUrgent = timeLeft < 300; // Less than 5 minutes

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'from-yellow-500 via-orange-500 to-red-500',
          border: 'border-yellow-400',
          text: 'text-yellow-300',
          glow: 'shadow-yellow-500/50',
        };
      case 'epic':
        return {
          bg: 'from-purple-500 via-pink-500 to-purple-600',
          border: 'border-purple-400',
          text: 'text-purple-300',
          glow: 'shadow-purple-500/50',
        };
      case 'rare':
        return {
          bg: 'from-blue-500 via-cyan-500 to-blue-600',
          border: 'border-blue-400',
          text: 'text-blue-300',
          glow: 'shadow-blue-500/50',
        };
      default:
        return {
          bg: 'from-green-500 via-emerald-500 to-green-600',
          border: 'border-green-400',
          text: 'text-green-300',
          glow: 'shadow-green-500/50',
        };
    }
  };

  const colors = getRarityColors(offer.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className={`w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 ${colors.border} shadow-2xl ${colors.glow} overflow-hidden ${isUrgent ? 'animate-pulse' : ''}`}>
        {/* Urgency Banner */}
        <div className={`py-2 text-center font-bold bg-gradient-to-r ${colors.bg} text-white`}>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={isUrgent ? 'animate-pulse' : ''}>
              {isUrgent ? 'HURRY! ' : ''}OFFER ENDS IN {formatTime(timeLeft)}
            </span>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-12 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative p-6 text-center">
          {/* Discount Badge */}
          <div className="absolute top-4 left-4">
            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors.bg} text-white font-bold text-lg animate-bounce`}>
              -{offer.discount}%
            </div>
          </div>

          {/* Rarity Badge */}
          <div className="absolute top-4 right-12">
            <div className={`px-2 py-0.5 rounded-full bg-black/50 ${colors.text} text-xs font-bold uppercase`}>
              {offer.rarity}
            </div>
          </div>

          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-4 shadow-lg ${colors.glow}`}>
            {offer.icon === 'gift' && (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            )}
            {offer.icon === 'star' && (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {offer.icon === 'coins' && (
              <img src={GAME_IMAGES.coin} alt="Coins" className="w-12 h-12 rounded-full" />
            )}
            {offer.icon === 'heart' && (
              <img src={GAME_IMAGES.heart} alt="Lives" className="w-12 h-12 rounded-full" />
            )}
            {offer.icon === 'crown' && (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
              </svg>
            )}
            {offer.icon === 'lightbulb' && (
              <img src={GAME_IMAGES.hint} alt="Hints" className="w-12 h-12 rounded-full" />
            )}
          </div>

          <h2 className={`text-2xl font-black ${colors.text} mb-1`}>
            {offer.title}
          </h2>
          <p className="text-gray-400">{offer.description}</p>
        </div>

        {/* Contents */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-yellow-500/20 rounded-xl p-3 text-center border border-yellow-500/30">
              <img src={GAME_IMAGES.coin} alt="Coins" className="w-8 h-8 mx-auto rounded-full mb-1" />
              <div className="text-lg font-bold text-yellow-300">+{offer.coins.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Coins</div>
            </div>
            <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-500/30">
              <img src={GAME_IMAGES.heart} alt="Lives" className="w-8 h-8 mx-auto rounded-full mb-1" />
              <div className="text-lg font-bold text-red-300">+{offer.lives}</div>
              <div className="text-xs text-gray-400">Lives</div>
            </div>
            <div className="bg-blue-500/20 rounded-xl p-3 text-center border border-blue-500/30">
              <img src={GAME_IMAGES.hint} alt="Hints" className="w-8 h-8 mx-auto rounded-full mb-1" />
              <div className="text-lg font-bold text-blue-300">+{offer.hints}</div>
              <div className="text-xs text-gray-400">Hints</div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-gray-500 line-through text-lg">
              {offer.originalPrice} coins
            </span>
            <span className={`text-3xl font-black ${colors.text}`}>
              {offer.salePrice} coins
            </span>
          </div>

          {/* Purchase Button */}
          {purchased ? (
            <div className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-lg text-center">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Purchased!
              </span>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={!canAfford}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                ${canAfford
                  ? `bg-gradient-to-r ${colors.bg} text-white hover:scale-105 shadow-lg ${colors.glow}`
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {canAfford ? (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  BUY NOW!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Not Enough Coins
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/30 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <img src={GAME_IMAGES.coin} alt="Coins" className="w-4 h-4 rounded-full" />
              <span>Your balance: {coins.toLocaleString()}</span>
            </div>
            {!canAfford && (
              <span className="text-red-400 text-xs">
                Need {(offer.salePrice - coins).toLocaleString()} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitedTimeOffer;
