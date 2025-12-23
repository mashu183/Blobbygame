import { useState, useEffect, useCallback } from 'react';

const JACKPOT_STORAGE_KEY = 'blobby-progressive-jackpot';
const JACKPOT_BASE_AMOUNT = 1000; // Starting jackpot amount
const JACKPOT_CONTRIBUTION_RATE = 0.20; // 20% of losses go to jackpot
const JACKPOT_WIN_CHANCE = 0.005; // 0.5% chance to win jackpot
const JACKPOT_SPIN_COST = 50; // Reduced from 100 to 50

// Coin prize tiers for non-jackpot wins
const COIN_PRIZES = [
  { amount: 25, chance: 0.15 },   // 15% chance for 25 coins
  { amount: 50, chance: 0.10 },   // 10% chance for 50 coins
  { amount: 100, chance: 0.05 },  // 5% chance for 100 coins
  { amount: 200, chance: 0.02 },  // 2% chance for 200 coins
  { amount: 500, chance: 0.005 }, // 0.5% chance for 500 coins
];

interface JackpotState {
  amount: number;
  lastWinner: string | null;
  lastWinAmount: number;
  lastWinTime: string | null;
  totalContributed: number;
  timesWon: number;
}

const getInitialState = (): JackpotState => {
  const saved = localStorage.getItem(JACKPOT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fall through to default
    }
  }
  return {
    amount: JACKPOT_BASE_AMOUNT,
    lastWinner: null,
    lastWinAmount: 0,
    lastWinTime: null,
    totalContributed: 0,
    timesWon: 0,
  };
};

export const useJackpot = () => {
  const [jackpotState, setJackpotState] = useState<JackpotState>(getInitialState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(JACKPOT_STORAGE_KEY, JSON.stringify(jackpotState));
  }, [jackpotState]);

  // Contribute to the jackpot (called when player loses in gambling games)
  const contributeToJackpot = useCallback((lossAmount: number) => {
    const contribution = Math.floor(lossAmount * JACKPOT_CONTRIBUTION_RATE);
    if (contribution > 0) {
      setJackpotState(prev => ({
        ...prev,
        amount: prev.amount + contribution,
        totalContributed: prev.totalContributed + contribution,
      }));
    }
    return contribution;
  }, []);

  // Attempt to win the jackpot or coin prizes
  const attemptJackpotWin = useCallback((playerName: string): { won: boolean; amount: number; isJackpot: boolean } => {
    const roll = Math.random();
    
    // Check for jackpot win first
    if (roll < JACKPOT_WIN_CHANCE) {
      const winAmount = jackpotState.amount;
      setJackpotState(prev => ({
        ...prev,
        amount: JACKPOT_BASE_AMOUNT,
        lastWinner: playerName,
        lastWinAmount: winAmount,
        lastWinTime: new Date().toISOString(),
        timesWon: prev.timesWon + 1,
      }));
      return { won: true, amount: winAmount, isJackpot: true };
    }
    
    // Check for coin prize wins
    let cumulativeChance = JACKPOT_WIN_CHANCE;
    for (const prize of COIN_PRIZES) {
      cumulativeChance += prize.chance;
      if (roll < cumulativeChance) {
        // Won a coin prize!
        return { won: true, amount: prize.amount, isJackpot: false };
      }
    }
    
    // If didn't win anything, the spin cost contributes to jackpot
    const contribution = Math.floor(JACKPOT_SPIN_COST * 0.5); // 50% of spin cost goes to jackpot
    setJackpotState(prev => ({
      ...prev,
      amount: prev.amount + contribution,
      totalContributed: prev.totalContributed + contribution,
    }));
    
    return { won: false, amount: 0, isJackpot: false };
  }, [jackpotState.amount]);

  // Simulate jackpot growth (for visual effect)
  const simulateGrowth = useCallback(() => {
    // Add small random amount to simulate other players contributing
    const randomGrowth = Math.floor(Math.random() * 3) + 1;
    setJackpotState(prev => ({
      ...prev,
      amount: prev.amount + randomGrowth,
    }));
  }, []);

  return {
    jackpotAmount: jackpotState.amount,
    lastWinner: jackpotState.lastWinner,
    lastWinAmount: jackpotState.lastWinAmount,
    lastWinTime: jackpotState.lastWinTime,
    totalContributed: jackpotState.totalContributed,
    timesWon: jackpotState.timesWon,
    contributeToJackpot,
    attemptJackpotWin,
    simulateGrowth,
    JACKPOT_SPIN_COST,
    JACKPOT_WIN_CHANCE,
    JACKPOT_BASE_AMOUNT,
    COIN_PRIZES,
  };
};
