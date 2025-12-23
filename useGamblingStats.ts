import { useState, useCallback, useEffect } from 'react';

export type GameType = 'lucky_spin' | 'slot_machine' | 'scratch_card' | 'mystery_box' | 'coin_flip' | 'treasure_hunt' | 'jackpot';

export interface GameSession {
  id: string;
  gameType: GameType;
  timestamp: number;
  bet: number;
  won: boolean;
  winAmount: number;
  netResult: number; // winAmount - bet (can be negative)
}

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalBet: number;
  totalWon: number;
  netProfit: number;
  winRate: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number; // positive = winning streak, negative = losing streak
  longestWinStreak: number;
  longestLoseStreak: number;
  averageBet: number;
  averageWin: number;
}

export interface DailyStats {
  date: string;
  games: number;
  wins: number;
  losses: number;
  netProfit: number;
  totalBet: number;
  totalWon: number;
}

export interface GamblingStatsState {
  sessions: GameSession[];
  byGame: Record<GameType, GameStats>;
  overall: GameStats;
  dailyHistory: DailyStats[];
  favoriteGame: GameType | null;
}

const GAME_NAMES: Record<GameType, string> = {
  lucky_spin: 'Lucky Spin',
  slot_machine: 'Slot Machine',
  scratch_card: 'Scratch Cards',
  mystery_box: 'Mystery Box',
  coin_flip: 'Coin Flip',
  treasure_hunt: 'Treasure Hunt',
  jackpot: 'Jackpot Spin',
};

const INITIAL_GAME_STATS: GameStats = {
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  totalBet: 0,
  totalWon: 0,
  netProfit: 0,
  winRate: 0,
  biggestWin: 0,
  biggestLoss: 0,
  currentStreak: 0,
  longestWinStreak: 0,
  longestLoseStreak: 0,
  averageBet: 0,
  averageWin: 0,
};

const INITIAL_STATE: GamblingStatsState = {
  sessions: [],
  byGame: {
    lucky_spin: { ...INITIAL_GAME_STATS },
    slot_machine: { ...INITIAL_GAME_STATS },
    scratch_card: { ...INITIAL_GAME_STATS },
    mystery_box: { ...INITIAL_GAME_STATS },
    coin_flip: { ...INITIAL_GAME_STATS },
    treasure_hunt: { ...INITIAL_GAME_STATS },
    jackpot: { ...INITIAL_GAME_STATS },
  },
  overall: { ...INITIAL_GAME_STATS },
  dailyHistory: [],
  favoriteGame: null,
};

const STORAGE_KEY = 'blobby-gambling-stats';

export const useGamblingStats = () => {
  const [state, setState] = useState<GamblingStatsState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Record a gambling session
  const recordSession = useCallback((
    gameType: GameType,
    bet: number,
    winAmount: number,
    won: boolean
  ) => {
    const session: GameSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameType,
      timestamp: Date.now(),
      bet,
      won,
      winAmount,
      netResult: winAmount - bet,
    };

    setState(prev => {
      const newSessions = [...prev.sessions, session];
      
      // Update game-specific stats
      const gameStats = { ...prev.byGame[gameType] };
      gameStats.totalGames++;
      gameStats.totalBet += bet;
      gameStats.totalWon += winAmount;
      gameStats.netProfit = gameStats.totalWon - gameStats.totalBet;
      
      if (won) {
        gameStats.totalWins++;
        if (gameStats.currentStreak >= 0) {
          gameStats.currentStreak++;
        } else {
          gameStats.currentStreak = 1;
        }
        gameStats.longestWinStreak = Math.max(gameStats.longestWinStreak, gameStats.currentStreak);
        if (winAmount > gameStats.biggestWin) {
          gameStats.biggestWin = winAmount;
        }
      } else {
        gameStats.totalLosses++;
        if (gameStats.currentStreak <= 0) {
          gameStats.currentStreak--;
        } else {
          gameStats.currentStreak = -1;
        }
        gameStats.longestLoseStreak = Math.max(gameStats.longestLoseStreak, Math.abs(gameStats.currentStreak));
        if (bet > gameStats.biggestLoss) {
          gameStats.biggestLoss = bet;
        }
      }
      
      gameStats.winRate = gameStats.totalGames > 0 
        ? (gameStats.totalWins / gameStats.totalGames) * 100 
        : 0;
      gameStats.averageBet = gameStats.totalGames > 0 
        ? gameStats.totalBet / gameStats.totalGames 
        : 0;
      gameStats.averageWin = gameStats.totalWins > 0 
        ? gameStats.totalWon / gameStats.totalWins 
        : 0;

      const newByGame = { ...prev.byGame, [gameType]: gameStats };

      // Update overall stats
      const overall = calculateOverallStats(newByGame);

      // Update daily history
      const today = new Date().toISOString().split('T')[0];
      const dailyHistory = [...prev.dailyHistory];
      const todayIndex = dailyHistory.findIndex(d => d.date === today);
      
      if (todayIndex >= 0) {
        dailyHistory[todayIndex] = {
          ...dailyHistory[todayIndex],
          games: dailyHistory[todayIndex].games + 1,
          wins: dailyHistory[todayIndex].wins + (won ? 1 : 0),
          losses: dailyHistory[todayIndex].losses + (won ? 0 : 1),
          netProfit: dailyHistory[todayIndex].netProfit + (winAmount - bet),
          totalBet: dailyHistory[todayIndex].totalBet + bet,
          totalWon: dailyHistory[todayIndex].totalWon + winAmount,
        };
      } else {
        dailyHistory.push({
          date: today,
          games: 1,
          wins: won ? 1 : 0,
          losses: won ? 0 : 1,
          netProfit: winAmount - bet,
          totalBet: bet,
          totalWon: winAmount,
        });
      }

      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filteredHistory = dailyHistory.filter(d => new Date(d.date) >= thirtyDaysAgo);

      // Find favorite game
      const favoriteGame = Object.entries(newByGame)
        .sort((a, b) => b[1].totalGames - a[1].totalGames)[0];

      return {
        sessions: newSessions.slice(-1000), // Keep last 1000 sessions
        byGame: newByGame,
        overall,
        dailyHistory: filteredHistory,
        favoriteGame: favoriteGame[1].totalGames > 0 ? favoriteGame[0] as GameType : null,
      };
    });
  }, []);

  // Get stats filtered by date range
  const getFilteredStats = useCallback((
    startDate?: Date,
    endDate?: Date,
    gameType?: GameType
  ) => {
    let filteredSessions = state.sessions;

    if (startDate) {
      filteredSessions = filteredSessions.filter(s => s.timestamp >= startDate.getTime());
    }
    if (endDate) {
      filteredSessions = filteredSessions.filter(s => s.timestamp <= endDate.getTime());
    }
    if (gameType) {
      filteredSessions = filteredSessions.filter(s => s.gameType === gameType);
    }

    // Calculate stats from filtered sessions
    const stats: GameStats = { ...INITIAL_GAME_STATS };
    let currentStreak = 0;

    filteredSessions.forEach(session => {
      stats.totalGames++;
      stats.totalBet += session.bet;
      stats.totalWon += session.winAmount;

      if (session.won) {
        stats.totalWins++;
        if (currentStreak >= 0) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        stats.longestWinStreak = Math.max(stats.longestWinStreak, currentStreak);
        stats.biggestWin = Math.max(stats.biggestWin, session.winAmount);
      } else {
        stats.totalLosses++;
        if (currentStreak <= 0) {
          currentStreak--;
        } else {
          currentStreak = -1;
        }
        stats.longestLoseStreak = Math.max(stats.longestLoseStreak, Math.abs(currentStreak));
        stats.biggestLoss = Math.max(stats.biggestLoss, session.bet);
      }
    });

    stats.currentStreak = currentStreak;
    stats.netProfit = stats.totalWon - stats.totalBet;
    stats.winRate = stats.totalGames > 0 ? (stats.totalWins / stats.totalGames) * 100 : 0;
    stats.averageBet = stats.totalGames > 0 ? stats.totalBet / stats.totalGames : 0;
    stats.averageWin = stats.totalWins > 0 ? stats.totalWon / stats.totalWins : 0;

    return { stats, sessions: filteredSessions };
  }, [state.sessions]);

  // Get chart data for performance over time
  const getChartData = useCallback((days: number = 7, gameType?: GameType) => {
    const data: { date: string; profit: number; games: number; winRate: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = state.sessions.filter(s => {
        const sessionDate = new Date(s.timestamp).toISOString().split('T')[0];
        return sessionDate === dateStr && (!gameType || s.gameType === gameType);
      });

      const dayProfit = daySessions.reduce((sum, s) => sum + s.netResult, 0);
      const dayWins = daySessions.filter(s => s.won).length;
      const dayWinRate = daySessions.length > 0 ? (dayWins / daySessions.length) * 100 : 0;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: dayProfit,
        games: daySessions.length,
        winRate: Math.round(dayWinRate),
      });
    }

    return data;
  }, [state.sessions]);

  // Reset all stats
  const resetStats = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state,
    recordSession,
    getFilteredStats,
    getChartData,
    resetStats,
    GAME_NAMES,
  };
};

// Helper function to calculate overall stats from all games
function calculateOverallStats(byGame: Record<GameType, GameStats>): GameStats {
  const overall: GameStats = { ...INITIAL_GAME_STATS };

  Object.values(byGame).forEach(gameStats => {
    overall.totalGames += gameStats.totalGames;
    overall.totalWins += gameStats.totalWins;
    overall.totalLosses += gameStats.totalLosses;
    overall.totalBet += gameStats.totalBet;
    overall.totalWon += gameStats.totalWon;
    overall.biggestWin = Math.max(overall.biggestWin, gameStats.biggestWin);
    overall.biggestLoss = Math.max(overall.biggestLoss, gameStats.biggestLoss);
    overall.longestWinStreak = Math.max(overall.longestWinStreak, gameStats.longestWinStreak);
    overall.longestLoseStreak = Math.max(overall.longestLoseStreak, gameStats.longestLoseStreak);
  });

  overall.netProfit = overall.totalWon - overall.totalBet;
  overall.winRate = overall.totalGames > 0 ? (overall.totalWins / overall.totalGames) * 100 : 0;
  overall.averageBet = overall.totalGames > 0 ? overall.totalBet / overall.totalGames : 0;
  overall.averageWin = overall.totalWins > 0 ? overall.totalWon / overall.totalWins : 0;

  return overall;
}

export { GAME_NAMES };
