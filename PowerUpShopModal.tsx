import React, { useState } from 'react';
import { X, Zap, Shield, Clock, Eye, Shuffle, Target, Sparkles, Flame, Star, Gift } from 'lucide-react';
import { casinoSounds } from '@/lib/sounds';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
  duration?: number; // in seconds, undefined means single use
  color: string;
  effect: string;
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    description: 'Freeze the timer for 10 seconds during puzzles',
    icon: <Clock className="w-6 h-6" />,
    cost: 50,
    duration: 10,
    color: 'from-blue-500 to-cyan-500',
    effect: 'freeze_timer',
  },
  {
    id: 'hint_master',
    name: 'Hint Master',
    description: 'Reveal the correct answer for any puzzle',
    icon: <Eye className="w-6 h-6" />,
    cost: 75,
    color: 'from-purple-500 to-pink-500',
    effect: 'reveal_answer',
  },
  {
    id: 'skip_hurdle',
    name: 'Skip Hurdle',
    description: 'Skip any puzzle challenge without penalty',
    icon: <Shuffle className="w-6 h-6" />,
    cost: 100,
    color: 'from-orange-500 to-red-500',
    effect: 'skip_puzzle',
  },
  {
    id: 'double_points',
    name: 'Double Points',
    description: '2x points for the next 5 puzzles solved',
    icon: <Star className="w-6 h-6" />,
    cost: 150,
    duration: 5,
    color: 'from-yellow-500 to-amber-500',
    effect: 'double_points',
  },
  {
    id: 'shield',
    name: 'Protection Shield',
    description: 'Protect against one wrong answer',
    icon: <Shield className="w-6 h-6" />,
    cost: 80,
    color: 'from-green-500 to-emerald-500',
    effect: 'shield',
  },
  {
    id: 'extra_time',
    name: 'Extra Time',
    description: '+15 seconds added to puzzle timer',
    icon: <Zap className="w-6 h-6" />,
    cost: 40,
    color: 'from-indigo-500 to-violet-500',
    effect: 'extra_time',
  },
  {
    id: 'eliminate_two',
    name: 'Eliminate Two',
    description: 'Remove 2 wrong answers from multiple choice',
    icon: <Target className="w-6 h-6" />,
    cost: 60,
    color: 'from-rose-500 to-pink-500',
    effect: 'eliminate_options',
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Increase coin win chance in mini-games',
    icon: <Sparkles className="w-6 h-6" />,
    cost: 200,
    duration: 10,
    color: 'from-fuchsia-500 to-purple-500',
    effect: 'luck_boost',
  },
  {
    id: 'fire_streak',
    name: 'Fire Streak',
    description: '3x points for next 3 correct answers in a row',
    icon: <Flame className="w-6 h-6" />,
    cost: 175,
    duration: 3,
    color: 'from-red-500 to-orange-500',
    effect: 'streak_bonus',
  },
  {
    id: 'mystery_box',
    name: 'Mystery Power',
    description: 'Random power-up at 50% discount!',
    icon: <Gift className="w-6 h-6" />,
    cost: 100,
    color: 'from-gray-500 to-gray-600',
    effect: 'mystery',
  },
];

interface PowerUpShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onPurchase: (powerUp: PowerUp) => boolean;
  ownedPowerUps: { [key: string]: number };
}

const PowerUpShopModal: React.FC<PowerUpShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  onPurchase,
  ownedPowerUps,
}) => {
  const [purchaseMessage, setPurchaseMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'puzzle' | 'bonus'>('all');

  if (!isOpen) return null;

  const handlePurchase = (powerUp: PowerUp) => {
    if (coins < powerUp.cost) {
      casinoSounds.lose();
      setPurchaseMessage({ text: 'Not enough coins!', success: false });
      setTimeout(() => setPurchaseMessage(null), 2000);
      return;
    }

    const success = onPurchase(powerUp);
    if (success) {
      casinoSounds.coinCollect();
      casinoSounds.winSmall();
      setPurchaseMessage({ text: `${powerUp.name} purchased!`, success: true });
    } else {
      casinoSounds.lose();
      setPurchaseMessage({ text: 'Purchase failed!', success: false });
    }
    setTimeout(() => setPurchaseMessage(null), 2000);
  };

  const filteredPowerUps = POWER_UPS.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'puzzle') return ['time_freeze', 'hint_master', 'skip_hurdle', 'extra_time', 'eliminate_two', 'shield'].includes(p.id);
    if (selectedCategory === 'bonus') return ['double_points', 'lucky_charm', 'fire_streak', 'mystery_box'].includes(p.id);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 via-indigo-900/50 to-purple-900/30 rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-purple-500/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Power-Up Shop</h2>
              <div className="flex items-center gap-2 text-yellow-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="font-bold">{coins.toLocaleString()} coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-purple-500/30 flex-shrink-0">
          {[
            { id: 'all', label: 'All Power-Ups' },
            { id: 'puzzle', label: 'Puzzle Helpers' },
            { id: 'bonus', label: 'Bonus Boosters' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
              className={`flex-1 py-3 font-semibold transition-all text-sm ${
                selectedCategory === tab.id
                  ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Purchase Message */}
        {purchaseMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg border text-center font-semibold animate-pulse flex-shrink-0 ${
            purchaseMessage.success
              ? 'bg-green-500/20 border-green-500/50 text-green-300'
              : 'bg-red-500/20 border-red-500/50 text-red-300'
          }`}>
            {purchaseMessage.text}
          </div>
        )}

        {/* Power-Ups Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            {filteredPowerUps.map((powerUp) => {
              const owned = ownedPowerUps[powerUp.id] || 0;
              const canAfford = coins >= powerUp.cost;
              
              return (
                <div
                  key={powerUp.id}
                  className={`relative p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    canAfford
                      ? 'bg-white/5 border-white/10 hover:border-purple-400/50'
                      : 'bg-gray-800/50 border-gray-700/50 opacity-60'
                  }`}
                >
                  {/* Owned Badge */}
                  {owned > 0 && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      x{owned}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${powerUp.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {powerUp.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{powerUp.name}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{powerUp.description}</div>
                    </div>
                  </div>
                  
                  {powerUp.duration && (
                    <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {powerUp.effect === 'double_points' || powerUp.effect === 'streak_bonus' 
                          ? `${powerUp.duration} uses` 
                          : `${powerUp.duration}s duration`}
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handlePurchase(powerUp)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                      canAfford
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {powerUp.cost}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/30 border-t border-purple-500/30 flex-shrink-0">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Power-ups help you in puzzles
            </span>
            <span>•</span>
            <span>Use wisely!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerUpShopModal;
