import React, { useState, useEffect, useCallback } from 'react';
import { GAME_IMAGES } from '../../types/game';

interface DailyRewardProps {
  onClaimReward: (coins: number, lives: number, hints: number, powerUps?: { teleport?: number; wallbreak?: number; extramoves?: number }) => void;
}

// Streak multiplier thresholds
const STREAK_MULTIPLIERS = [
  { days: 30, multiplier: 5, label: '5X LEGENDARY' },
  { days: 14, multiplier: 3, label: '3X EPIC' },
  { days: 7, multiplier: 2, label: '2X SUPER' },
  { days: 0, multiplier: 1, label: '1X' },
];

// Special milestone days with rare rewards
const MILESTONE_DAYS = [7, 14, 21, 30];

// 30-day reward cycle with increasing rewards
const DAILY_REWARDS = [
  // Week 1 - Basic rewards
  { day: 1, coins: 50, lives: 1, hints: 0, special: null },
  { day: 2, coins: 75, lives: 0, hints: 1, special: null },
  { day: 3, coins: 100, lives: 1, hints: 1, special: null },
  { day: 4, coins: 125, lives: 2, hints: 0, special: null },
  { day: 5, coins: 150, lives: 0, hints: 2, special: null },
  { day: 6, coins: 175, lives: 2, hints: 1, special: null },
  { day: 7, coins: 500, lives: 5, hints: 3, special: { type: 'milestone', powerUp: 'teleport', amount: 2, label: 'Week 1 Bonus!' } },
  
  // Week 2 - Better rewards
  { day: 8, coins: 100, lives: 2, hints: 0, special: null },
  { day: 9, coins: 125, lives: 0, hints: 2, special: null },
  { day: 10, coins: 150, lives: 2, hints: 1, special: null },
  { day: 11, coins: 175, lives: 3, hints: 0, special: null },
  { day: 12, coins: 200, lives: 0, hints: 3, special: null },
  { day: 13, coins: 225, lives: 3, hints: 2, special: null },
  { day: 14, coins: 750, lives: 8, hints: 5, special: { type: 'milestone', powerUp: 'wallbreak', amount: 3, label: 'Week 2 Jackpot!' } },
  
  // Week 3 - Great rewards
  { day: 15, coins: 150, lives: 3, hints: 1, special: null },
  { day: 16, coins: 175, lives: 0, hints: 3, special: null },
  { day: 17, coins: 200, lives: 3, hints: 2, special: null },
  { day: 18, coins: 225, lives: 4, hints: 0, special: null },
  { day: 19, coins: 250, lives: 0, hints: 4, special: null },
  { day: 20, coins: 275, lives: 4, hints: 3, special: null },
  { day: 21, coins: 1000, lives: 10, hints: 7, special: { type: 'milestone', powerUp: 'extramoves', amount: 4, label: 'Week 3 Treasure!' } },
  
  // Week 4 - Amazing rewards
  { day: 22, coins: 200, lives: 4, hints: 2, special: null },
  { day: 23, coins: 225, lives: 0, hints: 4, special: null },
  { day: 24, coins: 250, lives: 4, hints: 3, special: null },
  { day: 25, coins: 275, lives: 5, hints: 0, special: null },
  { day: 26, coins: 300, lives: 0, hints: 5, special: null },
  { day: 27, coins: 350, lives: 5, hints: 4, special: null },
  { day: 28, coins: 400, lives: 6, hints: 5, special: null },
  { day: 29, coins: 500, lives: 7, hints: 6, special: null },
  { day: 30, coins: 2000, lives: 15, hints: 10, special: { type: 'legendary', powerUp: 'all', amount: 5, label: 'LEGENDARY REWARD!' } },
];

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysClaimed: number;
  lastClaimDate: string | null;
  claimedDays: number[]; // Days claimed in current cycle
  cycleStartDate: string | null;
}

const getDefaultStreakData = (): StreakData => ({
  currentStreak: 0,
  longestStreak: 0,
  totalDaysClaimed: 0,
  lastClaimDate: null,
  claimedDays: [],
  cycleStartDate: null,
});

const DailyReward: React.FC<DailyRewardProps> = ({ onClaimReward }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [streakData, setStreakData] = useState<StreakData>(getDefaultStreakData());
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [claimAnimation, setClaimAnimation] = useState(false);

  // Get current multiplier based on streak
  const getCurrentMultiplier = useCallback((streak: number) => {
    for (const tier of STREAK_MULTIPLIERS) {
      if (streak >= tier.days) {
        return tier;
      }
    }
    return STREAK_MULTIPLIERS[STREAK_MULTIPLIERS.length - 1];
  }, []);

  // Check if day is a milestone
  const isMilestoneDay = (day: number) => MILESTONE_DAYS.includes(day);

  // Get week number for a day
  const getWeekNumber = (day: number) => Math.floor((day - 1) / 7);

  useEffect(() => {
    const loadStreakData = () => {
      const saved = localStorage.getItem('blobby-streak-data');
      if (saved) {
        try {
          return JSON.parse(saved) as StreakData;
        } catch {
          return getDefaultStreakData();
        }
      }
      return getDefaultStreakData();
    };

    const data = loadStreakData();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (data.lastClaimDate) {
      const lastDate = new Date(data.lastClaimDate);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already claimed today
        setCanClaim(false);
        setCurrentDay(data.currentStreak % 30 || 30);
        setStreakData(data);
      } else if (diffDays === 1) {
        // Can claim, streak continues
        setCanClaim(true);
        const nextDay = (data.currentStreak % 30) + 1;
        setCurrentDay(nextDay);
        setStreakData(data);
        setSelectedWeek(getWeekNumber(nextDay));
        setIsOpen(true);
      } else {
        // Streak broken (more than 1 day gap)
        const newData: StreakData = {
          ...data,
          currentStreak: 0,
          claimedDays: [],
          cycleStartDate: today,
        };
        setStreakData(newData);
        setCurrentDay(1);
        setCanClaim(true);
        setSelectedWeek(0);
        setIsOpen(true);
      }
    } else {
      // First time player
      const newData: StreakData = {
        ...getDefaultStreakData(),
        cycleStartDate: today,
      };
      setStreakData(newData);
      setCurrentDay(1);
      setCanClaim(true);
      setIsOpen(true);
    }
  }, []);

  const handleClaim = () => {
    if (!canClaim || claimed) return;

    setClaimAnimation(true);
    
    const reward = DAILY_REWARDS[currentDay - 1];
    const multiplier = getCurrentMultiplier(streakData.currentStreak);
    
    // Calculate rewards with multiplier
    const finalCoins = Math.floor(reward.coins * multiplier.multiplier);
    const finalLives = Math.floor(reward.lives * multiplier.multiplier);
    const finalHints = Math.floor(reward.hints * multiplier.multiplier);
    
    // Handle power-up rewards
    let powerUps: { teleport?: number; wallbreak?: number; extramoves?: number } | undefined;
    if (reward.special) {
      if (reward.special.powerUp === 'all') {
        powerUps = {
          teleport: reward.special.amount,
          wallbreak: reward.special.amount,
          extramoves: reward.special.amount,
        };
      } else if (reward.special.powerUp === 'teleport') {
        powerUps = { teleport: reward.special.amount };
      } else if (reward.special.powerUp === 'wallbreak') {
        powerUps = { wallbreak: reward.special.amount };
      } else if (reward.special.powerUp === 'extramoves') {
        powerUps = { extramoves: reward.special.amount };
      }
    }

    // Call the reward callback
    onClaimReward(finalCoins, finalLives, finalHints, powerUps);

    // Update streak data
    const today = new Date().toISOString().split('T')[0];
    const newStreak = streakData.currentStreak + 1;
    const newData: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(streakData.longestStreak, newStreak),
      totalDaysClaimed: streakData.totalDaysClaimed + 1,
      lastClaimDate: today,
      claimedDays: [...streakData.claimedDays, currentDay],
      cycleStartDate: streakData.cycleStartDate || today,
    };

    // Reset cycle if completed 30 days
    if (newStreak >= 30 && currentDay === 30) {
      newData.claimedDays = [];
      newData.cycleStartDate = today;
    }

    localStorage.setItem('blobby-streak-data', JSON.stringify(newData));
    setStreakData(newData);
    setClaimed(true);

    // Show confetti for milestone days
    if (isMilestoneDay(currentDay)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setTimeout(() => {
      setClaimAnimation(false);
      setTimeout(() => setIsOpen(false), 1500);
    }, 1000);
  };

  const renderWeekCalendar = (weekIndex: number) => {
    const startDay = weekIndex * 7 + 1;
    const endDay = Math.min(startDay + 6, 30);
    const days = [];

    for (let day = startDay; day <= endDay; day++) {
      const reward = DAILY_REWARDS[day - 1];
      const isCurrentDay = day === currentDay;
      const isClaimed = streakData.claimedDays.includes(day) || (day < currentDay && streakData.currentStreak >= day);
      const isMilestone = isMilestoneDay(day);
      const isLocked = day > currentDay;

      days.push(
        <div
          key={day}
          className={`
            relative p-2 rounded-xl text-center transition-all duration-300 min-h-[90px] flex flex-col justify-between
            ${isCurrentDay && canClaim
              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 scale-105 shadow-lg shadow-orange-500/40 ring-2 ring-yellow-300 animate-pulse'
              : isClaimed
                ? 'bg-gradient-to-br from-green-600/40 to-emerald-600/40 border border-green-500/50'
                : isLocked
                  ? 'bg-white/5 border border-white/10 opacity-60'
                  : 'bg-white/10 border border-white/20'
            }
            ${isMilestone ? 'ring-2 ring-purple-500/50' : ''}
          `}
        >
          {/* Day number */}
          <div className={`text-xs font-bold ${isCurrentDay && canClaim ? 'text-black' : 'text-gray-400'}`}>
            Day {day}
          </div>

          {/* Reward preview */}
          <div className="flex flex-col items-center gap-1 my-1">
            {reward.coins > 0 && (
              <div className={`flex items-center gap-1 text-xs ${isCurrentDay && canClaim ? 'text-black' : 'text-yellow-300'}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>{reward.coins}</span>
              </div>
            )}
            {(reward.lives > 0 || reward.hints > 0) && (
              <div className={`flex items-center gap-2 text-xs ${isCurrentDay && canClaim ? 'text-black' : 'text-gray-300'}`}>
                {reward.lives > 0 && <span className="text-red-400">+{reward.lives}</span>}
                {reward.hints > 0 && <span className="text-blue-400">+{reward.hints}</span>}
              </div>
            )}
          </div>

          {/* Milestone badge */}
          {isMilestone && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}

          {/* Claimed checkmark */}
          {isClaimed && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Lock icon for future days */}
          {isLocked && !isClaimed && (
            <div className="absolute bottom-1 right-1">
              <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
              </svg>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderStreakProgress = () => {
    const multiplier = getCurrentMultiplier(streakData.currentStreak);
    const nextTier = STREAK_MULTIPLIERS.find(t => t.days > streakData.currentStreak);
    const daysToNextTier = nextTier ? nextTier.days - streakData.currentStreak : 0;

    return (
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c-4.97 0-9-2.582-9-7.75C3 9.393 9 3.25 9 3.25s.5 4.5 3 4.5 3-2.5 3-2.5 6 4.5 6 9c0 5.168-4.03 7.75-9 7.75z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{streakData.currentStreak} Day Streak</div>
              <div className="text-sm text-gray-400">Longest: {streakData.longestStreak} days</div>
            </div>
          </div>
          <div className={`
            px-4 py-2 rounded-lg font-bold text-lg
            ${multiplier.multiplier >= 5 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black animate-pulse' :
              multiplier.multiplier >= 3 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
              multiplier.multiplier >= 2 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
              'bg-white/20 text-white'}
          `}>
            {multiplier.label}
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Next: {nextTier.label}</span>
              <span>{daysToNextTier} days to go</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${((streakData.currentStreak - (STREAK_MULTIPLIERS.find(t => t.days < nextTier.days && t.days <= streakData.currentStreak)?.days || 0)) / (nextTier.days - (STREAK_MULTIPLIERS.find(t => t.days < nextTier.days && t.days <= streakData.currentStreak)?.days || 0))) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Multiplier benefits */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {STREAK_MULTIPLIERS.slice().reverse().map((tier) => (
            <div
              key={tier.days}
              className={`
                p-2 rounded-lg text-center text-xs transition-all
                ${streakData.currentStreak >= tier.days
                  ? 'bg-green-500/30 border border-green-500/50'
                  : 'bg-white/5 border border-white/10 opacity-50'}
              `}
            >
              <div className="font-bold text-white">{tier.label.split(' ')[0]}</div>
              <div className="text-gray-400">{tier.days}+ days</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTodayReward = () => {
    const reward = DAILY_REWARDS[currentDay - 1];
    const multiplier = getCurrentMultiplier(streakData.currentStreak);

    return (
      <div className={`
        bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 mb-4 border border-white/20
        ${claimAnimation ? 'animate-bounce' : ''}
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Day {currentDay} Reward</h3>
          {multiplier.multiplier > 1 && (
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-black text-sm font-bold">
              {multiplier.multiplier}X BONUS!
            </span>
          )}
        </div>

        {/* Main rewards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {reward.coins > 0 && (
            <div className="flex flex-col items-center p-3 bg-yellow-500/20 rounded-xl">
              <img src={GAME_IMAGES.coin} alt="Coins" className="w-10 h-10 rounded-full mb-2" />
              <span className="text-xl font-bold text-yellow-300">
                +{Math.floor(reward.coins * multiplier.multiplier)}
              </span>
              <span className="text-xs text-gray-400">Coins</span>
            </div>
          )}
          {reward.lives > 0 && (
            <div className="flex flex-col items-center p-3 bg-red-500/20 rounded-xl">
              <img src={GAME_IMAGES.heart} alt="Lives" className="w-10 h-10 rounded-full mb-2" />
              <span className="text-xl font-bold text-red-300">
                +{Math.floor(reward.lives * multiplier.multiplier)}
              </span>
              <span className="text-xs text-gray-400">Lives</span>
            </div>
          )}
          {reward.hints > 0 && (
            <div className="flex flex-col items-center p-3 bg-blue-500/20 rounded-xl">
              <img src={GAME_IMAGES.hint} alt="Hints" className="w-10 h-10 rounded-full mb-2" />
              <span className="text-xl font-bold text-blue-300">
                +{Math.floor(reward.hints * multiplier.multiplier)}
              </span>
              <span className="text-xs text-gray-400">Hints</span>
            </div>
          )}
        </div>

        {/* Special milestone reward */}
        {reward.special && (
          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-4 border border-purple-500/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                {reward.special.powerUp === 'teleport' && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {reward.special.powerUp === 'wallbreak' && (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 19h2V5H2v14zm4 0h2V5H6v14zm4 0h2V5h-2v14zm4 0h2V5h-2v14zm4 0h2V5h-2v14z" />
                  </svg>
                )}
                {reward.special.powerUp === 'extramoves' && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                {reward.special.powerUp === 'all' && (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{reward.special.label}</div>
                <div className="text-sm text-purple-300">
                  {reward.special.powerUp === 'all'
                    ? `+${reward.special.amount} of ALL Power-Ups!`
                    : `+${reward.special.amount} ${reward.special.powerUp.charAt(0).toUpperCase() + reward.special.powerUp.slice(1)} Power-Up${reward.special.amount > 1 ? 's' : ''}`
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Confetti effect for milestones */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-yellow-500/30 to-orange-500/30">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4 animate-pulse shadow-lg shadow-orange-500/50">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-1">Daily Rewards!</h2>
          <p className="text-yellow-200">Login every day for bigger rewards!</p>
        </div>

        <div className="p-6">
          {/* Streak Progress */}
          {renderStreakProgress()}

          {/* Today's Reward */}
          {renderTodayReward()}

          {/* Week Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[0, 1, 2, 3].map((week) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                  ${selectedWeek === week
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'}
                `}
              >
                Week {week + 1}
                {week === 3 && <span className="ml-1 text-yellow-400">+2</span>}
              </button>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {renderWeekCalendar(selectedWeek)}
          </div>

          {/* Milestone Legend */}
          <div className="flex items-center justify-center gap-6 mb-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span>Milestone Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/40 flex items-center justify-center">
                <svg className="w-2 h-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Claimed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500 animate-pulse" />
              <span>Today</span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!canClaim || claimed}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all
              ${claimed
                ? 'bg-green-500 text-white'
                : canClaim
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105 shadow-lg shadow-orange-500/30'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {claimed ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Claimed!
              </span>
            ) : canClaim ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Claim Day {currentDay} Reward
              </span>
            ) : (
              'Come Back Tomorrow!'
            )}
          </button>

          {/* Stats Footer */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{streakData.totalDaysClaimed}</div>
              <div className="text-xs text-gray-400">Total Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{streakData.currentStreak}</div>
              <div className="text-xs text-gray-400">Current Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{streakData.longestStreak}</div>
              <div className="text-xs text-gray-400">Best Streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReward;
