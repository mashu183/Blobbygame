import { useState, useEffect, useCallback } from 'react';

export interface VIPTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  bgGradient: string;
  icon: string;
  pointsMultiplier: number;
  oddsBonus: number; // percentage bonus to win rates
  spinDiscount: number; // percentage discount on spin costs
  dailyBonus: number;
  hasVIPMysteryBox: boolean;
  hasVIPJackpot: boolean;
  exclusiveDailyBonus: number;
}

export const VIP_TIERS: VIPTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    bgGradient: 'from-amber-700 to-amber-900',
    icon: '🥉',
    pointsMultiplier: 1,
    oddsBonus: 0,
    spinDiscount: 0,
    dailyBonus: 50,
    hasVIPMysteryBox: false,
    hasVIPJackpot: false,
    exclusiveDailyBonus: 0,
  },
  {
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    color: '#C0C0C0',
    bgGradient: 'from-gray-400 to-gray-600',
    icon: '🥈',
    pointsMultiplier: 1.2,
    oddsBonus: 1,
    spinDiscount: 5,
    dailyBonus: 100,
    hasVIPMysteryBox: false,
    hasVIPJackpot: false,
    exclusiveDailyBonus: 0,
  },
  {
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 19999,
    color: '#FFD700',
    bgGradient: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    pointsMultiplier: 1.5,
    oddsBonus: 2,
    spinDiscount: 10,
    dailyBonus: 200,
    hasVIPMysteryBox: true,
    hasVIPJackpot: false,
    exclusiveDailyBonus: 100,
  },
  {
    name: 'Platinum',
    minPoints: 20000,
    maxPoints: 49999,
    color: '#E5E4E2',
    bgGradient: 'from-slate-300 to-slate-500',
    icon: '💎',
    pointsMultiplier: 2,
    oddsBonus: 3,
    spinDiscount: 15,
    dailyBonus: 400,
    hasVIPMysteryBox: true,
    hasVIPJackpot: true,
    exclusiveDailyBonus: 250,
  },
  {
    name: 'Diamond',
    minPoints: 50000,
    maxPoints: Infinity,
    color: '#B9F2FF',
    bgGradient: 'from-cyan-300 to-blue-500',
    icon: '👑',
    pointsMultiplier: 3,
    oddsBonus: 5,
    spinDiscount: 25,
    dailyBonus: 750,
    hasVIPMysteryBox: true,
    hasVIPJackpot: true,
    exclusiveDailyBonus: 500,
  },
];

interface VIPState {
  totalPoints: number;
  lifetimePoints: number;
  currentTierIndex: number;
  lastDailyBonusClaim: string | null;
  lastVIPBonusClaim: string | null;
  lastMonthlyJackpotEntry: string | null;
  vipJackpotPool: number;
  monthlyJackpotContributions: number;
}

const INITIAL_STATE: VIPState = {
  totalPoints: 0,
  lifetimePoints: 0,
  currentTierIndex: 0,
  lastDailyBonusClaim: null,
  lastVIPBonusClaim: null,
  lastMonthlyJackpotEntry: null,
  vipJackpotPool: 5000,
  monthlyJackpotContributions: 0,
};

export function useVIP() {
  const [state, setState] = useState<VIPState>(() => {
    const saved = localStorage.getItem('vipState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('vipState', JSON.stringify(state));
  }, [state]);

  // Get current tier based on lifetime points
  const getCurrentTier = useCallback((): VIPTier => {
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (state.lifetimePoints >= VIP_TIERS[i].minPoints) {
        return VIP_TIERS[i];
      }
    }
    return VIP_TIERS[0];
  }, [state.lifetimePoints]);

  const currentTier = getCurrentTier();

  // Get next tier
  const getNextTier = useCallback((): VIPTier | null => {
    const currentIndex = VIP_TIERS.findIndex(t => t.name === currentTier.name);
    if (currentIndex < VIP_TIERS.length - 1) {
      return VIP_TIERS[currentIndex + 1];
    }
    return null;
  }, [currentTier]);

  const nextTier = getNextTier();

  // Calculate progress to next tier
  const getProgressToNextTier = useCallback((): number => {
    if (!nextTier) return 100;
    const pointsInCurrentTier = state.lifetimePoints - currentTier.minPoints;
    const pointsNeededForNextTier = nextTier.minPoints - currentTier.minPoints;
    return Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100);
  }, [state.lifetimePoints, currentTier, nextTier]);

  // Add VIP points
  const addPoints = useCallback((basePoints: number, source: 'purchase' | 'gambling' | 'bonus') => {
    const multiplier = currentTier.pointsMultiplier;
    const actualPoints = Math.floor(basePoints * multiplier);
    
    setState(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + actualPoints,
      lifetimePoints: prev.lifetimePoints + actualPoints,
    }));

    return actualPoints;
  }, [currentTier]);

  // Add points from coin purchase (10 points per dollar spent)
  const addPurchasePoints = useCallback((dollarAmount: number) => {
    const basePoints = Math.floor(dollarAmount * 10);
    return addPoints(basePoints, 'purchase');
  }, [addPoints]);

  // Add points from gambling (1 point per 10 coins wagered)
  const addGamblingPoints = useCallback((coinsWagered: number) => {
    const basePoints = Math.floor(coinsWagered / 10);
    return addPoints(basePoints, 'gambling');
  }, [addPoints]);

  // Get discounted spin cost
  const getDiscountedCost = useCallback((baseCost: number): number => {
    const discount = currentTier.spinDiscount / 100;
    return Math.floor(baseCost * (1 - discount));
  }, [currentTier]);

  // Get improved odds (returns the bonus percentage to add)
  const getOddsBonus = useCallback((): number => {
    return currentTier.oddsBonus;
  }, [currentTier]);

  // Check if daily bonus is available
  const canClaimDailyBonus = useCallback((): boolean => {
    if (!state.lastDailyBonusClaim) return true;
    const lastClaim = new Date(state.lastDailyBonusClaim);
    const now = new Date();
    return lastClaim.toDateString() !== now.toDateString();
  }, [state.lastDailyBonusClaim]);

  // Claim daily VIP bonus
  const claimDailyBonus = useCallback((): number => {
    if (!canClaimDailyBonus()) return 0;
    
    const bonus = currentTier.dailyBonus;
    setState(prev => ({
      ...prev,
      lastDailyBonusClaim: new Date().toISOString(),
    }));
    
    return bonus;
  }, [canClaimDailyBonus, currentTier]);

  // Check if exclusive VIP bonus is available (Gold+)
  const canClaimVIPBonus = useCallback((): boolean => {
    if (currentTier.exclusiveDailyBonus === 0) return false;
    if (!state.lastVIPBonusClaim) return true;
    const lastClaim = new Date(state.lastVIPBonusClaim);
    const now = new Date();
    return lastClaim.toDateString() !== now.toDateString();
  }, [state.lastVIPBonusClaim, currentTier]);

  // Claim exclusive VIP bonus
  const claimVIPBonus = useCallback((): number => {
    if (!canClaimVIPBonus()) return 0;
    
    const bonus = currentTier.exclusiveDailyBonus;
    setState(prev => ({
      ...prev,
      lastVIPBonusClaim: new Date().toISOString(),
    }));
    
    return bonus;
  }, [canClaimVIPBonus, currentTier]);

  // Contribute to VIP jackpot
  const contributeToVIPJackpot = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      vipJackpotPool: prev.vipJackpotPool + amount,
      monthlyJackpotContributions: prev.monthlyJackpotContributions + amount,
    }));
  }, []);

  // Check if can enter monthly VIP jackpot
  const canEnterMonthlyJackpot = useCallback((): boolean => {
    if (!currentTier.hasVIPJackpot) return false;
    if (!state.lastMonthlyJackpotEntry) return true;
    const lastEntry = new Date(state.lastMonthlyJackpotEntry);
    const now = new Date();
    // Can enter once per day
    return lastEntry.toDateString() !== now.toDateString();
  }, [state.lastMonthlyJackpotEntry, currentTier]);

  // Attempt VIP jackpot (1% chance for Platinum, 2% for Diamond)
  const attemptVIPJackpot = useCallback((): { won: boolean; amount: number } => {
    if (!canEnterMonthlyJackpot()) return { won: false, amount: 0 };
    
    const winChance = currentTier.name === 'Diamond' ? 0.02 : 0.01;
    const won = Math.random() < winChance;
    
    setState(prev => ({
      ...prev,
      lastMonthlyJackpotEntry: new Date().toISOString(),
      vipJackpotPool: won ? 5000 : prev.vipJackpotPool,
      monthlyJackpotContributions: won ? 0 : prev.monthlyJackpotContributions,
    }));

    return {
      won,
      amount: won ? state.vipJackpotPool : 0,
    };
  }, [canEnterMonthlyJackpot, currentTier, state.vipJackpotPool]);

  // Spend VIP points (for special rewards)
  const spendPoints = useCallback((amount: number): boolean => {
    if (state.totalPoints < amount) return false;
    setState(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - amount,
    }));
    return true;
  }, [state.totalPoints]);

  return {
    // State
    totalPoints: state.totalPoints,
    lifetimePoints: state.lifetimePoints,
    vipJackpotPool: state.vipJackpotPool,
    
    // Tier info
    currentTier,
    nextTier,
    allTiers: VIP_TIERS,
    progressToNextTier: getProgressToNextTier(),
    pointsToNextTier: nextTier ? nextTier.minPoints - state.lifetimePoints : 0,
    
    // Actions
    addPoints,
    addPurchasePoints,
    addGamblingPoints,
    getDiscountedCost,
    getOddsBonus,
    spendPoints,
    
    // Daily bonuses
    canClaimDailyBonus: canClaimDailyBonus(),
    claimDailyBonus,
    canClaimVIPBonus: canClaimVIPBonus(),
    claimVIPBonus,
    
    // VIP Jackpot
    canEnterMonthlyJackpot: canEnterMonthlyJackpot(),
    attemptVIPJackpot,
    contributeToVIPJackpot,
  };
}
