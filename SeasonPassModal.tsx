import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  Season,
  SeasonProgress,
  SeasonRewardClaimed,
  SEASON_REWARDS,
  XP_PER_LEVEL,
  MAX_SEASON_LEVEL,
  SeasonReward,
} from '../../types/game';

const stripePromise = loadStripe('pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ', {
  stripeAccount: 'acct_1SfLZCQfPNx6CLyO'
});

// PayPal Client ID
const PAYPAL_CLIENT_ID = 'AdnsweJ5kUo7nYTnLn4a5Ei_npthlulbAVIjSm3pdS8SNKvB8sLBLtwk-wQr4tsSN6wp-qy52IeZf3LN';

interface SeasonPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string | null;
  onClaimReward: (reward: { type: string; amount: number; color?: string }) => void;
  onPremiumPurchased: () => void;
}

type PaymentMethod = 'paypal' | 'stripe';

// Payment Form Component
const PaymentForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-success',
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay $9.99'}
        </button>
      </div>
    </form>
  );
};

// PayPal Payment Component
const PayPalPaymentForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
  playerId: string | null;
  seasonId: string;
}> = ({ onSuccess, onCancel, playerId, seasonId }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 45
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: 'Season Pass Premium Upgrade',
                  amount: {
                    currency_code: 'USD',
                    value: '9.99'
                  },
                  custom_id: JSON.stringify({
                    playerId,
                    seasonId,
                    type: 'season_pass_premium'
                  })
                }
              ]
            });
          }}
          onApprove={async (data, actions) => {
            try {
              const details = await actions.order?.capture();
              if (details?.status === 'COMPLETED') {
                // Store purchase in localStorage for tracking
                const purchases = JSON.parse(localStorage.getItem('paypal_season_purchases') || '[]');
                purchases.push({
                  orderId: data.orderID,
                  playerId,
                  seasonId,
                  type: 'season_pass_premium',
                  timestamp: Date.now()
                });
                localStorage.setItem('paypal_season_purchases', JSON.stringify(purchases));
                onSuccess();
              }
            } catch (err: any) {
              setError(err.message || 'Payment failed');
            }
          }}
          onError={(err) => {
            console.error('PayPal error:', err);
            setError('PayPal payment failed. Please try again.');
          }}
          onCancel={() => {
            setError('Payment was cancelled.');
          }}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

// Local storage keys for offline mode
const LOCAL_SEASON_PROGRESS_KEY = 'blobby-season-progress';
const LOCAL_CLAIMED_REWARDS_KEY = 'blobby-season-claimed-rewards';

// Default local season for offline mode
const getLocalSeason = (): Season => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30); // 30 days from now
  
  return {
    id: 'local-season-1',
    name: 'Season 1: New Beginnings',
    description: 'Complete levels and earn XP to unlock rewards!',
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    status: 'active',
    premium_price_cents: 999,
    created_at: now.toISOString(),
  };
};

const getLocalProgress = (): SeasonProgress => {
  const saved = localStorage.getItem(LOCAL_SEASON_PROGRESS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fall through to default
    }
  }
  return {
    id: 'local-progress',
    player_id: 'local',
    season_id: 'local-season-1',
    xp: 0,
    level: 1,
    is_premium: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const saveLocalProgress = (progress: SeasonProgress) => {
  localStorage.setItem(LOCAL_SEASON_PROGRESS_KEY, JSON.stringify(progress));
};

const getLocalClaimedRewards = (): SeasonRewardClaimed[] => {
  const saved = localStorage.getItem(LOCAL_CLAIMED_REWARDS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveLocalClaimedRewards = (rewards: SeasonRewardClaimed[]) => {
  localStorage.setItem(LOCAL_CLAIMED_REWARDS_KEY, JSON.stringify(rewards));
};

const SeasonPassModal: React.FC<SeasonPassModalProps> = ({
  isOpen,
  onClose,
  playerId,
  onClaimReward,
  onPremiumPurchased,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<SeasonRewardClaimed[]>([]);
  const [pastSeasons, setPastSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [showPremiumConfirm, setShowPremiumConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const rewardsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch season data
  const fetchSeasonData = useCallback(async () => {
    setLoading(true);
    
    // Try to fetch from database first
    if (playerId && !playerId.startsWith('local_')) {
      try {
        // Get active season
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('*')
          .eq('status', 'active')
          .single();

        if (!seasonError && seasonData) {
          setActiveSeason(seasonData);
          setIsLocalMode(false);

          // Get or create progress
          let { data: progressData } = await supabase
            .from('season_progress')
            .select('*')
            .eq('player_id', playerId)
            .eq('season_id', seasonData.id)
            .single();

          if (!progressData) {
            const { data: newProgress } = await supabase
              .from('season_progress')
              .insert({
                player_id: playerId,
                season_id: seasonData.id,
                xp: 0,
                level: 1,
                is_premium: false,
              })
              .select()
              .single();
            progressData = newProgress;
          }

          setProgress(progressData);

          // Get claimed rewards
          const { data: claimedData } = await supabase
            .from('season_rewards_claimed')
            .select('*')
            .eq('player_id', playerId)
            .eq('season_id', seasonData.id);

          setClaimedRewards(claimedData || []);

          // Get past seasons
          const { data: pastData } = await supabase
            .from('seasons')
            .select('*')
            .eq('status', 'completed')
            .order('end_date', { ascending: false });

          setPastSeasons(pastData || []);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Database not available, using local mode:', error);
      }
    }

    // Fall back to local mode
    setIsLocalMode(true);
    setActiveSeason(getLocalSeason());
    setProgress(getLocalProgress());
    setClaimedRewards(getLocalClaimedRewards());
    setPastSeasons([]);
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    if (isOpen) {
      fetchSeasonData();
    }
  }, [isOpen, fetchSeasonData]);

  // Countdown timer
  useEffect(() => {
    if (!activeSeason) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(activeSeason.end_date).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Season Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [activeSeason]);

  // Check if reward is claimed
  const isRewardClaimed = (level: number, isPremium: boolean) => {
    return claimedRewards.some(
      (r) => r.reward_level === level && r.is_premium_reward === isPremium
    );
  };

  // Claim reward - works in both online and local mode
  const handleClaimReward = async (reward: SeasonReward, isPremium: boolean) => {
    if (!activeSeason || !progress) return;

    const rewardData = isPremium ? reward.premium : reward.free;

    // Check if can claim
    if (progress.level < reward.level) return;
    if (isPremium && !progress.is_premium) return;
    if (isRewardClaimed(reward.level, isPremium)) return;

    const newClaimedReward: SeasonRewardClaimed = {
      id: `claimed-${Date.now()}`,
      player_id: playerId || 'local',
      season_id: activeSeason.id,
      reward_level: reward.level,
      is_premium_reward: isPremium,
      claimed_at: new Date().toISOString(),
    };

    if (isLocalMode) {
      // Local mode - save to localStorage
      const updatedClaimed = [...claimedRewards, newClaimedReward];
      setClaimedRewards(updatedClaimed);
      saveLocalClaimedRewards(updatedClaimed);
    } else {
      // Online mode - save to database
      try {
        await supabase.from('season_rewards_claimed').insert({
          player_id: playerId,
          season_id: activeSeason.id,
          reward_level: reward.level,
          is_premium_reward: isPremium,
        });
        setClaimedRewards([...claimedRewards, newClaimedReward]);
      } catch (error) {
        console.error('Error claiming reward:', error);
        return;
      }
    }

    // Call parent handler to add reward
    onClaimReward({
      type: rewardData.type,
      amount: rewardData.amount,
      color: rewardData.color,
    });
  };

  // Handle local premium upgrade (simulated)
  const handleLocalPremiumUpgrade = () => {
    if (!progress) return;
    
    const updatedProgress = {
      ...progress,
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
    };
    
    setProgress(updatedProgress);
    saveLocalProgress(updatedProgress);
    setShowPremiumConfirm(false);
    setShowPayment(false);
    onPremiumPurchased();
  };

  // Start premium purchase
  const handleBuyPremium = async () => {
    if (!activeSeason) return;

    if (isLocalMode) {
      // Show payment modal with PayPal option
      setShowPayment(true);
      return;
    }

    if (!playerId) return;

    // Show payment modal
    setShowPayment(true);

    if (paymentMethod === 'stripe') {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: activeSeason.premium_price_cents,
            currency: 'usd',
            itemType: 'season_pass',
            itemId: activeSeason.id,
            metadata: {
              playerId,
              seasonId: activeSeason.id,
              type: 'season_pass_premium',
            },
          },
        });

        if (error) throw error;
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
      }
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    if (!activeSeason) return;

    if (isLocalMode || !playerId) {
      handleLocalPremiumUpgrade();
      return;
    }

    try {
      await supabase
        .from('season_progress')
        .update({
          is_premium: true,
          premium_purchased_at: new Date().toISOString(),
        })
        .eq('player_id', playerId)
        .eq('season_id', activeSeason.id);

      setProgress((prev) => (prev ? { ...prev, is_premium: true } : null));
      setShowPayment(false);
      setClientSecret(null);
      onPremiumPurchased();
    } catch (error) {
      console.error('Error updating premium status:', error);
      // Still mark as premium locally
      handleLocalPremiumUpgrade();
    }
  };

  // Add XP to progress (for testing/local mode)
  const addXP = (amount: number) => {
    if (!progress) return;
    
    let newXP = progress.xp + amount;
    let newLevel = progress.level;
    
    // Level up if enough XP
    while (newXP >= XP_PER_LEVEL && newLevel < MAX_SEASON_LEVEL) {
      newXP -= XP_PER_LEVEL;
      newLevel++;
    }
    
    const updatedProgress = {
      ...progress,
      xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    };
    
    setProgress(updatedProgress);
    
    if (isLocalMode) {
      saveLocalProgress(updatedProgress);
    }
  };

  // Get reward icon
  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'hints':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'lives':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'avatar_color':
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <PayPalScriptProvider options={{ 
      clientId: PAYPAL_CLIENT_ID,
      currency: 'USD',
      intent: 'capture'
    }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-red-600/30 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Season Pass</h2>
                  <p className="text-gray-300">
                    {activeSeason?.name || 'No Active Season'}
                    {isLocalMode && <span className="ml-2 text-xs text-yellow-400">(Offline Mode)</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'current'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Current Season
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === 'current' ? (
              <>
                {!activeSeason ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-400">No Active Season</h3>
                    <p className="text-gray-500 mt-2">Check back soon for the next season!</p>
                  </div>
                ) : (
                  <>
                    {/* Season Info & Progress */}
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{activeSeason.name}</h3>
                          <p className="text-sm text-gray-400">{activeSeason.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {timeRemaining}
                            </div>
                            <div className="text-xs text-gray-400">Time Remaining</div>
                          </div>
                          {progress?.is_premium ? (
                            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="font-bold text-yellow-300">PREMIUM</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handleBuyPremium}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold transition-all flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              Upgrade - $9.99
                            </button>
                          )}
                        </div>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">
                            Level {progress?.level || 1}
                          </span>
                          <span className="text-gray-400">
                            {progress?.xp || 0} / {XP_PER_LEVEL} XP
                          </span>
                        </div>
                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{
                              width: `${((progress?.xp || 0) / XP_PER_LEVEL) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Complete levels and challenges to earn XP!
                        </div>
                        {/* Debug/Test XP button for local mode */}
                        {isLocalMode && (
                          <button
                            onClick={() => addXP(50)}
                            className="text-xs px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors"
                          >
                            +50 XP (Test)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Premium Benefits Banner */}
                    {!progress?.is_premium && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                        <h4 className="font-bold text-yellow-300 mb-2">Premium Benefits</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            2x Rewards
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Exclusive Colors
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Bonus Items
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            10 Avatar Colors
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rewards Track */}
                    <div className="space-y-2" ref={rewardsContainerRef}>
                      <h4 className="font-bold text-white mb-3">Rewards Track</h4>
                      {SEASON_REWARDS.map((reward) => {
                        const isUnlocked = (progress?.level || 1) >= reward.level;
                        const freeClaimable = isUnlocked && !isRewardClaimed(reward.level, false);
                        const premiumClaimable =
                          isUnlocked &&
                          progress?.is_premium &&
                          !isRewardClaimed(reward.level, true);

                        return (
                          <div
                            key={reward.level}
                            className={`p-3 rounded-xl border transition-all ${
                              isUnlocked
                                ? 'bg-white/10 border-white/20'
                                : 'bg-white/5 border-white/5 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Level indicator */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                  isUnlocked
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                    : 'bg-gray-700 text-gray-400'
                                }`}
                              >
                                {reward.level}
                              </div>

                              {/* Free Reward */}
                              <div className="flex-1">
                                <div className="text-xs text-gray-400 mb-1">FREE</div>
                                <div className="flex items-center gap-2">
                                  {getRewardIcon(reward.free.type)}
                                  <span className="text-white text-sm">{reward.free.label}</span>
                                  {reward.free.type === 'avatar_color' && reward.free.color && (
                                    <div
                                      className="w-4 h-4 rounded-full border border-white/30"
                                      style={{ backgroundColor: reward.free.color }}
                                    />
                                  )}
                                </div>
                                {isRewardClaimed(reward.level, false) ? (
                                  <span className="text-xs text-green-400">Claimed</span>
                                ) : freeClaimable ? (
                                  <button
                                    onClick={() => handleClaimReward(reward, false)}
                                    className="mt-1 px-3 py-1 text-xs rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                  >
                                    Claim
                                  </button>
                                ) : null}
                              </div>

                              {/* Premium Reward */}
                              <div className="flex-1 pl-4 border-l border-white/10">
                                <div className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  PREMIUM
                                </div>
                                <div className="flex items-center gap-2">
                                  {getRewardIcon(reward.premium.type)}
                                  <span className="text-white text-sm">{reward.premium.label}</span>
                                  {reward.premium.type === 'avatar_color' && reward.premium.color && (
                                    <div
                                      className="w-4 h-4 rounded-full border border-white/30"
                                      style={{ backgroundColor: reward.premium.color }}
                                    />
                                  )}
                                </div>
                                {!progress?.is_premium ? (
                                  <span className="text-xs text-gray-500">Premium Only</span>
                                ) : isRewardClaimed(reward.level, true) ? (
                                  <span className="text-xs text-green-400">Claimed</span>
                                ) : premiumClaimable ? (
                                  <button
                                    onClick={() => handleClaimReward(reward, true)}
                                    className="mt-1 px-3 py-1 text-xs rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                  >
                                    Claim
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              // History Tab
              <div className="space-y-4">
                {pastSeasons.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-400">No Past Seasons</h3>
                    <p className="text-gray-500 mt-2">Complete seasons will appear here</p>
                  </div>
                ) : (
                  pastSeasons.map((season) => (
                    <div
                      key={season.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white">{season.name}</h4>
                          <p className="text-sm text-gray-400">{season.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(season.start_date).toLocaleDateString()} -{' '}
                            {new Date(season.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm">
                          Completed
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-10">
              <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">Upgrade to Premium</h3>
                <p className="text-gray-400 mb-4">
                  Unlock all premium rewards and exclusive avatar colors!
                </p>

                {/* Payment Method Selector */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Select payment method:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* PayPal Option */}
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === 'paypal'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#00457C">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                      </svg>
                      <span className={`text-sm font-semibold ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-gray-300'}`}>
                        PayPal
                      </span>
                    </button>

                    {/* Stripe Option */}
                    <button
                      onClick={() => {
                        setPaymentMethod('stripe');
                        // Create payment intent when switching to Stripe
                        if (activeSeason && playerId && !isLocalMode) {
                          supabase.functions.invoke('create-payment-intent', {
                            body: {
                              amount: activeSeason.premium_price_cents,
                              currency: 'usd',
                              itemType: 'season_pass',
                              itemId: activeSeason.id,
                              metadata: {
                                playerId,
                                seasonId: activeSeason.id,
                                type: 'season_pass_premium',
                              },
                            },
                          }).then(({ data }) => {
                            if (data?.clientSecret) {
                              setClientSecret(data.clientSecret);
                            }
                          });
                        }
                      }}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === 'stripe'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#635BFF">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                      <span className={`text-sm font-semibold ${paymentMethod === 'stripe' ? 'text-purple-400' : 'text-gray-300'}`}>
                        Card
                      </span>
                    </button>
                  </div>
                </div>

                {/* Premium Benefits */}
                <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-6">
                  <h4 className="font-bold text-yellow-300 mb-2">You'll Get:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All premium track rewards
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Exclusive avatar colors
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      2x coin rewards
                    </li>
                  </ul>
                </div>

                {/* PayPal Payment */}
                {paymentMethod === 'paypal' && (
                  <PayPalPaymentForm
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                      setShowPayment(false);
                      setClientSecret(null);
                    }}
                    playerId={playerId}
                    seasonId={activeSeason?.id || ''}
                  />
                )}

                {/* Stripe Payment */}
                {paymentMethod === 'stripe' && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => {
                        setShowPayment(false);
                        setClientSecret(null);
                      }}
                    />
                  </Elements>
                )}

                {/* Stripe loading state */}
                {paymentMethod === 'stripe' && !clientSecret && !isLocalMode && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <p className="text-gray-400">Loading payment form...</p>
                  </div>
                )}

                {/* Local mode fallback for Stripe */}
                {paymentMethod === 'stripe' && isLocalMode && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400 text-center">
                      Card payments require online mode. Use PayPal or activate premium locally for testing.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowPayment(false);
                          setClientSecret(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLocalPremiumUpgrade}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold transition-all"
                      >
                        Activate Premium (Test)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default SeasonPassModal;
