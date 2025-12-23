import React, { useState } from 'react';
import { X, Crown, Star, Gift, Zap, Percent, Trophy, Sparkles, Lock, Check, ChevronRight } from 'lucide-react';
import { VIPTier, VIP_TIERS } from '@/hooks/useVIP';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: VIPTier;
  nextTier: VIPTier | null;
  totalPoints: number;
  lifetimePoints: number;
  progressToNextTier: number;
  pointsToNextTier: number;
  vipJackpotPool: number;
  canClaimDailyBonus: boolean;
  canClaimVIPBonus: boolean;
  canEnterMonthlyJackpot: boolean;
  onClaimDailyBonus: () => void;
  onClaimVIPBonus: () => void;
  onAttemptVIPJackpot: () => void;
  onOpenVIPMysteryBox: () => void;
}

export default function VIPModal({
  isOpen,
  onClose,
  currentTier,
  nextTier,
  totalPoints,
  lifetimePoints,
  progressToNextTier,
  pointsToNextTier,
  vipJackpotPool,
  canClaimDailyBonus,
  canClaimVIPBonus,
  canEnterMonthlyJackpot,
  onClaimDailyBonus,
  onClaimVIPBonus,
  onAttemptVIPJackpot,
  onOpenVIPMysteryBox,
}: VIPModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'tiers' | 'rewards'>('status');
  const [showJackpotSpin, setShowJackpotSpin] = useState(false);

  if (!isOpen) return null;

  const currentTierIndex = VIP_TIERS.findIndex(t => t.name === currentTier.name);

  const handleVIPJackpot = () => {
    setShowJackpotSpin(true);
    setTimeout(() => {
      setShowJackpotSpin(false);
      onAttemptVIPJackpot();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentTier.bgGradient} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-white/30 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  width: `${8 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>
          
          {/* Back/Close Button - Fixed */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center z-10 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
          
          {/* Back Button on Left */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 z-10 transition-colors text-white font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="relative z-10 flex items-center gap-4 mt-8">
            <div className="text-5xl">{currentTier.icon}</div>
            <div>
              <div className="text-white/80 text-sm font-medium">Your VIP Status</div>
              <div className="text-3xl font-bold text-white">{currentTier.name} Member</div>
              <div className="text-white/70 text-sm mt-1">
                {lifetimePoints.toLocaleString()} Lifetime Points
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="relative z-10 mt-4">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>{currentTier.name}</span>
                <span>{pointsToNextTier.toLocaleString()} points to {nextTier.name}</span>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-white/50 to-white rounded-full transition-all duration-500 relative"
                  style={{ width: `${progressToNextTier}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { id: 'status', label: 'My Status', icon: Crown },
            { id: 'tiers', label: 'VIP Tiers', icon: Star },
            { id: 'rewards', label: 'Rewards', icon: Gift },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Current Benefits */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20} />
                  Your Current Benefits
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-2xl font-bold text-green-400">{currentTier.pointsMultiplier}x</div>
                    <div className="text-xs text-gray-400">Points Multiplier</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-2xl font-bold text-blue-400">+{currentTier.oddsBonus}%</div>
                    <div className="text-xs text-gray-400">Win Rate Bonus</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-2xl font-bold text-purple-400">{currentTier.spinDiscount}%</div>
                    <div className="text-xs text-gray-400">Spin Discount</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-2xl font-bold text-yellow-400">{currentTier.dailyBonus}</div>
                    <div className="text-xs text-gray-400">Daily Bonus Coins</div>
                  </div>
                </div>
              </div>

              {/* Available Points */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-200/80">Spendable VIP Points</div>
                    <div className="text-3xl font-bold text-yellow-400">{totalPoints.toLocaleString()}</div>
                  </div>
                  <div className="text-5xl">💰</div>
                </div>
              </div>

              {/* VIP Jackpot (Platinum+) */}
              {currentTier.hasVIPJackpot && (
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-purple-400" size={20} />
                      <span className="text-purple-200 font-semibold">Monthly VIP Jackpot</span>
                    </div>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                      {vipJackpotPool.toLocaleString()} Coins
                    </div>
                    <button
                      onClick={handleVIPJackpot}
                      disabled={!canEnterMonthlyJackpot || showJackpotSpin}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        canEnterMonthlyJackpot && !showJackpotSpin
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {showJackpotSpin ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Spinning...
                        </span>
                      ) : canEnterMonthlyJackpot ? (
                        `Try Your Luck (${currentTier.name === 'Diamond' ? '2%' : '1%'} Chance)`
                      ) : (
                        'Already Entered Today'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-4">
              {VIP_TIERS.map((tier, index) => {
                const isCurrentTier = tier.name === currentTier.name;
                const isUnlocked = index <= currentTierIndex;
                
                return (
                  <div
                    key={tier.name}
                    className={`rounded-xl p-4 border transition-all ${
                      isCurrentTier
                        ? `bg-gradient-to-r ${tier.bgGradient} border-white/30`
                        : isUnlocked
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-900/50 border-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{tier.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${isCurrentTier ? 'text-white' : 'text-gray-200'}`}>
                            {tier.name}
                          </span>
                          {isCurrentTier && (
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                              Current
                            </span>
                          )}
                          {!isUnlocked && <Lock size={14} className="text-gray-500" />}
                        </div>
                        <div className={`text-sm ${isCurrentTier ? 'text-white/70' : 'text-gray-400'}`}>
                          {tier.minPoints.toLocaleString()}+ points
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                        <Check size={12} className="text-green-400" />
                        {tier.pointsMultiplier}x Points
                      </div>
                      <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                        <Check size={12} className="text-green-400" />
                        +{tier.oddsBonus}% Win Rate
                      </div>
                      <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                        <Check size={12} className="text-green-400" />
                        {tier.spinDiscount}% Discount
                      </div>
                      <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                        <Check size={12} className="text-green-400" />
                        {tier.dailyBonus} Daily Coins
                      </div>
                      {tier.hasVIPMysteryBox && (
                        <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                          <Gift size={12} className="text-purple-400" />
                          VIP Mystery Box
                        </div>
                      )}
                      {tier.hasVIPJackpot && (
                        <div className={`flex items-center gap-1 ${isCurrentTier ? 'text-white/80' : 'text-gray-400'}`}>
                          <Trophy size={12} className="text-yellow-400" />
                          VIP Jackpot Access
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              {/* Daily VIP Bonus */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Gift className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Daily VIP Bonus</div>
                      <div className="text-sm text-gray-400">{currentTier.dailyBonus} coins</div>
                    </div>
                  </div>
                  <button
                    onClick={onClaimDailyBonus}
                    disabled={!canClaimDailyBonus}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      canClaimDailyBonus
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canClaimDailyBonus ? 'Claim' : 'Claimed'}
                  </button>
                </div>
              </div>

              {/* Exclusive VIP Bonus (Gold+) */}
              <div className={`rounded-xl p-4 border ${
                currentTier.exclusiveDailyBonus > 0
                  ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30'
                  : 'bg-gray-800/30 border-gray-700/50 opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentTier.exclusiveDailyBonus > 0
                        ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                        : 'bg-gray-700'
                    }`}>
                      <Crown className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        Exclusive VIP Bonus
                        {currentTier.exclusiveDailyBonus === 0 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Gold+
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {currentTier.exclusiveDailyBonus > 0
                          ? `${currentTier.exclusiveDailyBonus} bonus coins`
                          : 'Unlock at Gold tier'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClaimVIPBonus}
                    disabled={!canClaimVIPBonus || currentTier.exclusiveDailyBonus === 0}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      canClaimVIPBonus && currentTier.exclusiveDailyBonus > 0
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {currentTier.exclusiveDailyBonus === 0 ? (
                      <Lock size={16} />
                    ) : canClaimVIPBonus ? (
                      'Claim'
                    ) : (
                      'Claimed'
                    )}
                  </button>
                </div>
              </div>

              {/* VIP Mystery Box (Gold+) */}
              <div className={`rounded-xl p-4 border ${
                currentTier.hasVIPMysteryBox
                  ? 'bg-gradient-to-r from-indigo-900/30 to-blue-900/30 border-indigo-500/30'
                  : 'bg-gray-800/30 border-gray-700/50 opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentTier.hasVIPMysteryBox
                        ? 'bg-gradient-to-br from-indigo-400 to-blue-500'
                        : 'bg-gray-700'
                    }`}>
                      <span className="text-2xl">🎁</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        VIP Mystery Box
                        {!currentTier.hasVIPMysteryBox && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Gold+
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {currentTier.hasVIPMysteryBox
                          ? 'Exclusive rewards inside!'
                          : 'Unlock at Gold tier'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onOpenVIPMysteryBox}
                    disabled={!currentTier.hasVIPMysteryBox}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      currentTier.hasVIPMysteryBox
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {currentTier.hasVIPMysteryBox ? (
                      <>
                        Open <ChevronRight size={16} />
                      </>
                    ) : (
                      <Lock size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* How to Earn Points */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Percent size={16} className="text-green-400" />
                  How to Earn VIP Points
                </h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Coin Purchases</span>
                    <span className="text-green-400">10 points per $1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gambling Activity</span>
                    <span className="text-green-400">1 point per 10 coins wagered</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Multiplier</span>
                    <span className="text-yellow-400">{currentTier.pointsMultiplier}x</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
