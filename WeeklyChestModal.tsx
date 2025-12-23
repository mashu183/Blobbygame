import React, { useState, useEffect, useCallback } from 'react';
import { GAME_IMAGES } from '../../types/game';

interface WeeklyChestReward {
  type: 'coins' | 'lives' | 'hints' | 'powerup' | 'cosmetic';
  name: string;
  amount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  powerUpType?: 'teleport' | 'wallbreak' | 'extramoves' | 'timeboost' | 'colorblast';
  cosmeticType?: 'avatar' | 'theme' | 'trail' | 'badge';
}

interface WeeklyChestProps {
  onClaimReward: (
    coins: number,
    lives: number,
    hints: number,
    powerUps?: { teleport?: number; wallbreak?: number; extramoves?: number }
  ) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Potential rewards pool
const REWARD_POOL: WeeklyChestReward[] = [
  // Common rewards (40% chance)
  { type: 'coins', name: 'Coin Bundle', amount: 500, rarity: 'common' },
  { type: 'coins', name: 'Coin Pouch', amount: 750, rarity: 'common' },
  { type: 'lives', name: 'Life Pack', amount: 5, rarity: 'common' },
  { type: 'hints', name: 'Hint Bundle', amount: 5, rarity: 'common' },
  
  // Rare rewards (30% chance)
  { type: 'coins', name: 'Gold Stash', amount: 1500, rarity: 'rare' },
  { type: 'coins', name: 'Silver Chest', amount: 2000, rarity: 'rare' },
  { type: 'lives', name: 'Heart Chest', amount: 10, rarity: 'rare' },
  { type: 'hints', name: 'Wisdom Pack', amount: 10, rarity: 'rare' },
  { type: 'powerup', name: 'Teleport Pack', amount: 3, rarity: 'rare', powerUpType: 'teleport' },
  { type: 'powerup', name: 'Wall Breaker Pack', amount: 3, rarity: 'rare', powerUpType: 'wallbreak' },
  
  // Epic rewards (20% chance)
  { type: 'coins', name: 'Treasure Trove', amount: 5000, rarity: 'epic' },
  { type: 'coins', name: 'Golden Hoard', amount: 7500, rarity: 'epic' },
  { type: 'lives', name: 'Immortal Hearts', amount: 20, rarity: 'epic' },
  { type: 'hints', name: 'Oracle\'s Gift', amount: 20, rarity: 'epic' },
  { type: 'powerup', name: 'Power Bundle', amount: 5, rarity: 'epic', powerUpType: 'teleport' },
  { type: 'powerup', name: 'Destroyer Pack', amount: 5, rarity: 'epic', powerUpType: 'wallbreak' },
  { type: 'powerup', name: 'Extra Moves Pack', amount: 5, rarity: 'epic', powerUpType: 'extramoves' },
  { type: 'cosmetic', name: 'Flame Trail', amount: 1, rarity: 'epic', cosmeticType: 'trail' },
  { type: 'cosmetic', name: 'Neon Theme', amount: 1, rarity: 'epic', cosmeticType: 'theme' },
  
  // Legendary rewards (10% chance)
  { type: 'coins', name: 'Dragon\'s Fortune', amount: 15000, rarity: 'legendary' },
  { type: 'coins', name: 'King\'s Ransom', amount: 25000, rarity: 'legendary' },
  { type: 'lives', name: 'Eternal Life', amount: 50, rarity: 'legendary' },
  { type: 'hints', name: 'All-Seeing Eye', amount: 50, rarity: 'legendary' },
  { type: 'powerup', name: 'Ultimate Power Pack', amount: 10, rarity: 'legendary', powerUpType: 'teleport' },
  { type: 'powerup', name: 'Mega Destroyer', amount: 10, rarity: 'legendary', powerUpType: 'wallbreak' },
  { type: 'cosmetic', name: 'Golden Avatar Frame', amount: 1, rarity: 'legendary', cosmeticType: 'avatar' },
  { type: 'cosmetic', name: 'Champion Badge', amount: 1, rarity: 'legendary', cosmeticType: 'badge' },
  { type: 'cosmetic', name: 'Rainbow Trail', amount: 1, rarity: 'legendary', cosmeticType: 'trail' },
];

interface WeeklyChestData {
  lastOpenedDate: string | null;
  weeklyLogins: string[]; // Array of date strings for this week
  weekStartDate: string | null;
  totalChestsOpened: number;
  bestReward: string | null;
}

const getDefaultChestData = (): WeeklyChestData => ({
  lastOpenedDate: null,
  weeklyLogins: [],
  weekStartDate: null,
  totalChestsOpened: 0,
  bestReward: null,
});

const WeeklyChestModal: React.FC<WeeklyChestProps> = ({ onClaimReward, onClose, isOpen }) => {
  const [chestData, setChestData] = useState<WeeklyChestData>(getDefaultChestData());
  const [canOpen, setCanOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [openingStage, setOpeningStage] = useState(0);
  const [rewards, setRewards] = useState<WeeklyChestReward[]>([]);
  const [revealedRewards, setRevealedRewards] = useState<number[]>([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isSunday, setIsSunday] = useState(false);
  const [alreadyOpened, setAlreadyOpened] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get the start of the current week (Monday)
  const getWeekStart = useCallback((date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get next Sunday midnight
  const getNextSunday = useCallback((date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Check if it's Sunday
  const checkIsSunday = useCallback(() => {
    return new Date().getDay() === 0;
  }, []);

  // Calculate countdown to next Sunday
  const calculateCountdown = useCallback(() => {
    const now = new Date();
    let nextSunday = getNextSunday(now);
    
    // If it's Sunday and chest is already opened, show countdown to next Sunday
    if (now.getDay() === 0 && alreadyOpened) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    
    const diff = nextSunday.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, [getNextSunday, alreadyOpened]);

  // Load chest data and check eligibility
  useEffect(() => {
    const loadChestData = () => {
      const saved = localStorage.getItem('blobby-weekly-chest-data');
      if (saved) {
        try {
          return JSON.parse(saved) as WeeklyChestData;
        } catch {
          return getDefaultChestData();
        }
      }
      return getDefaultChestData();
    };

    const data = loadChestData();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = getWeekStart(now);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const sunday = checkIsSunday();
    
    setIsSunday(sunday);

    // Reset weekly logins if new week
    if (data.weekStartDate !== weekStartStr) {
      data.weeklyLogins = [];
      data.weekStartDate = weekStartStr;
    }

    // Add today's login if not already added
    if (!data.weeklyLogins.includes(today)) {
      data.weeklyLogins.push(today);
    }

    // Check if already opened this Sunday
    if (sunday && data.lastOpenedDate === today) {
      setAlreadyOpened(true);
      setCanOpen(false);
    } else if (sunday && data.weeklyLogins.length >= 5) {
      setCanOpen(true);
      setAlreadyOpened(false);
    } else {
      setCanOpen(false);
      setAlreadyOpened(false);
    }

    localStorage.setItem('blobby-weekly-chest-data', JSON.stringify(data));
    setChestData(data);
  }, [getWeekStart, checkIsSunday]);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateCountdown]);

  // Generate random rewards based on rarity
  const generateRewards = useCallback((): WeeklyChestReward[] => {
    const numRewards = 3;
    const selectedRewards: WeeklyChestReward[] = [];
    
    for (let i = 0; i < numRewards; i++) {
      const roll = Math.random() * 100;
      let rarity: 'common' | 'rare' | 'epic' | 'legendary';
      
      if (roll < 10) {
        rarity = 'legendary';
      } else if (roll < 30) {
        rarity = 'epic';
      } else if (roll < 60) {
        rarity = 'rare';
      } else {
        rarity = 'common';
      }
      
      const rarityPool = REWARD_POOL.filter(r => r.rarity === rarity);
      const reward = rarityPool[Math.floor(Math.random() * rarityPool.length)];
      selectedRewards.push(reward);
    }
    
    return selectedRewards;
  }, []);

  // Handle chest opening
  const handleOpenChest = () => {
    if (!canOpen || isOpening) return;
    
    setIsOpening(true);
    setOpeningStage(1);
    
    // Generate rewards
    const newRewards = generateRewards();
    setRewards(newRewards);
    
    // Chest shake animation
    setTimeout(() => setOpeningStage(2), 500);
    
    // Chest opens
    setTimeout(() => setOpeningStage(3), 1500);
    
    // Show rewards one by one
    setTimeout(() => {
      setOpeningStage(4);
      setRevealedRewards([0]);
      
      // Check for legendary reward
      if (newRewards.some(r => r.rarity === 'legendary')) {
        setShowConfetti(true);
      }
    }, 2500);
    
    setTimeout(() => setRevealedRewards([0, 1]), 3200);
    setTimeout(() => setRevealedRewards([0, 1, 2]), 3900);
    
    // Apply rewards
    setTimeout(() => {
      let totalCoins = 0;
      let totalLives = 0;
      let totalHints = 0;
      const powerUps: { teleport?: number; wallbreak?: number; extramoves?: number } = {};
      
      newRewards.forEach(reward => {
        switch (reward.type) {
          case 'coins':
            totalCoins += reward.amount;
            break;
          case 'lives':
            totalLives += reward.amount;
            break;
          case 'hints':
            totalHints += reward.amount;
            break;
          case 'powerup':
            if (reward.powerUpType === 'teleport') {
              powerUps.teleport = (powerUps.teleport || 0) + reward.amount;
            } else if (reward.powerUpType === 'wallbreak') {
              powerUps.wallbreak = (powerUps.wallbreak || 0) + reward.amount;
            } else if (reward.powerUpType === 'extramoves') {
              powerUps.extramoves = (powerUps.extramoves || 0) + reward.amount;
            }
            break;
        }
      });
      
      onClaimReward(totalCoins, totalLives, totalHints, Object.keys(powerUps).length > 0 ? powerUps : undefined);
      
      // Update chest data
      const today = new Date().toISOString().split('T')[0];
      const bestReward = newRewards.find(r => r.rarity === 'legendary')?.name || 
                        newRewards.find(r => r.rarity === 'epic')?.name ||
                        chestData.bestReward;
      
      const newData: WeeklyChestData = {
        ...chestData,
        lastOpenedDate: today,
        totalChestsOpened: chestData.totalChestsOpened + 1,
        bestReward,
      };
      
      localStorage.setItem('blobby-weekly-chest-data', JSON.stringify(newData));
      setChestData(newData);
      setCanOpen(false);
      setAlreadyOpened(true);
      
      setTimeout(() => setShowConfetti(false), 5000);
    }, 4500);
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-500/50';
      case 'epic': return 'border-purple-500 shadow-purple-500/50';
      case 'rare': return 'border-blue-400 shadow-blue-500/50';
      default: return 'border-gray-400';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-lg shadow-yellow-500/50 animate-pulse';
      case 'epic': return 'shadow-lg shadow-purple-500/40';
      case 'rare': return 'shadow-md shadow-blue-500/30';
      default: return '';
    }
  };

  // Render reward icon
  const renderRewardIcon = (reward: WeeklyChestReward) => {
    switch (reward.type) {
      case 'coins':
        return <img src={GAME_IMAGES.coin} alt="Coins" className="w-12 h-12 rounded-full" />;
      case 'lives':
        return <img src={GAME_IMAGES.heart} alt="Lives" className="w-12 h-12 rounded-full" />;
      case 'hints':
        return <img src={GAME_IMAGES.hint} alt="Hints" className="w-12 h-12 rounded-full" />;
      case 'powerup':
        return (
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(reward.rarity)} flex items-center justify-center`}>
            {reward.powerUpType === 'teleport' && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {reward.powerUpType === 'wallbreak' && (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 19h2V5H2v14zm4 0h2V5H6v14zm4 0h2V5h-2v14zm4 0h2V5h-2v14zm4 0h2V5h-2v14z" />
              </svg>
            )}
            {reward.powerUpType === 'extramoves' && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </div>
        );
      case 'cosmetic':
        return (
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(reward.rarity)} flex items-center justify-center`}>
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Render potential rewards preview
  const renderRewardsPreview = () => {
    const previewRewards = [
      { rarity: 'legendary', examples: ['25,000 Coins', 'Ultimate Power Pack', 'Rainbow Trail'] },
      { rarity: 'epic', examples: ['7,500 Coins', 'Power Bundle x5', 'Neon Theme'] },
      { rarity: 'rare', examples: ['2,000 Coins', 'Teleport Pack x3', '10 Lives'] },
      { rarity: 'common', examples: ['750 Coins', '5 Lives', '5 Hints'] },
    ];

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 text-center">Potential Rewards</h4>
        <div className="grid grid-cols-2 gap-2">
          {previewRewards.map((tier) => (
            <div
              key={tier.rarity}
              className={`p-3 rounded-xl bg-gradient-to-br ${getRarityColor(tier.rarity)} bg-opacity-20 border ${getRarityBorder(tier.rarity)}`}
            >
              <div className="text-xs font-bold text-white uppercase mb-1">{tier.rarity}</div>
              <div className="text-xs text-gray-200 space-y-0.5">
                {tier.examples.map((ex, i) => (
                  <div key={i} className="truncate">{ex}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render weekly progress
  const renderWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const loginCount = chestData.weeklyLogins.length;
    const requiredLogins = 5;

    return (
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300">Weekly Logins</h4>
          <span className={`text-sm font-bold ${loginCount >= requiredLogins ? 'text-green-400' : 'text-gray-400'}`}>
            {loginCount}/{requiredLogins} required
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-3">
          {days.map((day, index) => {
            const now = new Date();
            const weekStart = getWeekStart(now);
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + index);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isLoggedIn = chestData.weeklyLogins.includes(dateStr);
            const isToday = dateStr === now.toISOString().split('T')[0];
            const isPast = dayDate < now && !isToday;
            
            return (
              <div
                key={day}
                className={`
                  p-2 rounded-lg text-center text-xs font-medium transition-all
                  ${isLoggedIn 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                    : isToday
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-black'
                      : isPast
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/10 text-gray-400'
                  }
                `}
              >
                <div>{day}</div>
                {isLoggedIn && (
                  <svg className="w-3 h-3 mx-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              loginCount >= requiredLogins 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}
            style={{ width: `${Math.min((loginCount / requiredLogins) * 100, 100)}%` }}
          />
        </div>
        
        {loginCount < requiredLogins && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Login {requiredLogins - loginCount} more day{requiredLogins - loginCount > 1 ? 's' : ''} to unlock the chest!
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'][Math.floor(Math.random() * 7)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-lg bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-amber-500/30 to-yellow-500/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Chest Icon */}
          <div className={`
            w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/50
            ${openingStage === 1 ? 'animate-pulse' : ''}
            ${openingStage === 2 ? 'animate-bounce' : ''}
            ${openingStage >= 3 ? 'scale-110' : ''}
            transition-all duration-500
          `}>
            {openingStage < 3 ? (
              <svg className="w-14 h-14 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 4h14a2 2 0 012 2v2H3V6a2 2 0 012-2zm-2 6h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm8 2v2h2v-2h-2zm0 4v2h2v-2h-2z" />
              </svg>
            ) : (
              <svg className="w-14 h-14 text-amber-900 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 4h14a2 2 0 012 2v2H3V6a2 2 0 012-2zm-2 6h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm6-4l3-3 3 3" />
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" className="text-yellow-300" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Weekly Bonus Chest</h2>
          <p className="text-amber-200">
            {isSunday ? 'Sunday Special!' : 'Available Every Sunday'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Countdown Timer */}
          {(!isSunday || alreadyOpened) && (
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-300 text-center mb-3">
                {alreadyOpened ? 'Next Chest In' : 'Chest Unlocks In'}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Mins' },
                  { value: countdown.seconds, label: 'Secs' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-2xl font-bold text-white font-mono">
                        {String(item.value).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Progress */}
          {renderWeeklyProgress()}

          {/* Rewards Display (when opening) */}
          {openingStage >= 4 && rewards.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-white text-center">Your Rewards!</h4>
              <div className="grid grid-cols-3 gap-3">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border-2 text-center
                      transition-all duration-500 transform
                      ${revealedRewards.includes(index) 
                        ? `opacity-100 scale-100 ${getRarityBorder(reward.rarity)} ${getRarityGlow(reward.rarity)}` 
                        : 'opacity-0 scale-50'
                      }
                    `}
                  >
                    <div className="flex justify-center mb-2">
                      {renderRewardIcon(reward)}
                    </div>
                    <div className={`text-xs font-bold uppercase bg-gradient-to-r ${getRarityColor(reward.rarity)} bg-clip-text text-transparent`}>
                      {reward.rarity}
                    </div>
                    <div className="text-sm font-semibold text-white truncate">{reward.name}</div>
                    <div className="text-lg font-bold text-white">
                      {reward.type === 'cosmetic' ? 'x1' : `+${reward.amount.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Potential Rewards Preview (before opening) */}
          {openingStage === 0 && !alreadyOpened && renderRewardsPreview()}

          {/* Open Button */}
          {!alreadyOpened && openingStage === 0 && (
            <button
              onClick={handleOpenChest}
              disabled={!canOpen || isOpening}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all
                ${canOpen
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:scale-105 shadow-lg shadow-amber-500/30'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {canOpen ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 4h14a2 2 0 012 2v2H3V6a2 2 0 012-2zm-2 6h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z" />
                  </svg>
                  Open Weekly Chest!
                </span>
              ) : isSunday ? (
                `Need ${5 - chestData.weeklyLogins.length} More Login${5 - chestData.weeklyLogins.length > 1 ? 's' : ''}`
              ) : (
                'Come Back Sunday!'
              )}
            </button>
          )}

          {/* Close Button (after opening) */}
          {(alreadyOpened || openingStage >= 4) && (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
            >
              {alreadyOpened && openingStage === 0 ? 'Already Claimed - See You Next Week!' : 'Awesome!'}
            </button>
          )}

          {/* Stats Footer */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-amber-400">{chestData.totalChestsOpened}</div>
              <div className="text-xs text-gray-400">Chests Opened</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-400 truncate">
                {chestData.bestReward || 'None yet'}
              </div>
              <div className="text-xs text-gray-400">Best Reward</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChestModal;
