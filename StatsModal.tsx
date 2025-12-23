import React, { useState, useMemo } from 'react';
import { GameType, GameStats, GAME_NAMES } from '@/hooks/useGamblingStats';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  overall: GameStats;
  byGame: Record<GameType, GameStats>;
  favoriteGame: GameType | null;
  getChartData: (days: number, gameType?: GameType) => { date: string; profit: number; games: number; winRate: number }[];
  getFilteredStats: (startDate?: Date, endDate?: Date, gameType?: GameType) => { stats: GameStats };
}

type DateRange = '7d' | '14d' | '30d' | 'all';

const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  overall,
  byGame,
  favoriteGame,
  getChartData,
  getFilteredStats,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'history'>('overview');

  const chartData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    return getChartData(days, selectedGame === 'all' ? undefined : selectedGame);
  }, [dateRange, selectedGame, getChartData]);

  const filteredStats = useMemo(() => {
    if (dateRange === 'all') {
      return selectedGame === 'all' ? overall : byGame[selectedGame];
    }
    
    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return getFilteredStats(startDate, undefined, selectedGame === 'all' ? undefined : selectedGame).stats;
  }, [dateRange, selectedGame, overall, byGame, getFilteredStats]);

  // Calculate max value for chart scaling
  const maxProfit = Math.max(...chartData.map(d => Math.abs(d.profit)), 1);
  const maxGames = Math.max(...chartData.map(d => d.games), 1);

  if (!isOpen) return null;

  const gameTypes: GameType[] = ['lucky_spin', 'slot_machine', 'scratch_card', 'mystery_box', 'coin_flip', 'treasure_hunt', 'jackpot'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-indigo-900/50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-indigo-500/30 shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Statistics Dashboard
              </h2>
              <p className="text-gray-400 mt-1">Track your gambling performance</p>
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
            {(['overview', 'games', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Game Type</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as GameType | 'all')}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-indigo-400"
              >
                <option value="all">All Games</option>
                {gameTypes.map(type => (
                  <option key={type} value={type}>{GAME_NAMES[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date Range</label>
              <div className="flex gap-1">
                {(['7d', '14d', '30d', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      dateRange === range
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Total Games"
                  value={filteredStats.totalGames.toString()}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  color="blue"
                />
                <StatCard
                  label="Win Rate"
                  value={`${filteredStats.winRate.toFixed(1)}%`}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  color={filteredStats.winRate >= 50 ? 'green' : 'red'}
                />
                <StatCard
                  label="Net Profit"
                  value={`${filteredStats.netProfit >= 0 ? '+' : ''}${filteredStats.netProfit}`}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                  color={filteredStats.netProfit >= 0 ? 'green' : 'red'}
                />
                <StatCard
                  label="Biggest Win"
                  value={filteredStats.biggestWin.toString()}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
                  color="yellow"
                />
              </div>

              {/* Streaks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Current Streak"
                  value={`${filteredStats.currentStreak > 0 ? '+' : ''}${filteredStats.currentStreak}`}
                  subtext={filteredStats.currentStreak > 0 ? 'Wins' : filteredStats.currentStreak < 0 ? 'Losses' : 'None'}
                  color={filteredStats.currentStreak > 0 ? 'green' : filteredStats.currentStreak < 0 ? 'red' : 'gray'}
                />
                <StatCard
                  label="Best Win Streak"
                  value={filteredStats.longestWinStreak.toString()}
                  subtext="Consecutive wins"
                  color="green"
                />
                <StatCard
                  label="Worst Lose Streak"
                  value={filteredStats.longestLoseStreak.toString()}
                  subtext="Consecutive losses"
                  color="red"
                />
                <StatCard
                  label="Average Bet"
                  value={filteredStats.averageBet.toFixed(0)}
                  subtext="Coins per game"
                  color="purple"
                />
              </div>

              {/* Performance Chart */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Profit Over Time</h3>
                <div className="h-48 flex items-end gap-1">
                  {chartData.map((day, i) => {
                    const height = Math.abs(day.profit) / maxProfit * 100;
                    const isPositive = day.profit >= 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col justify-end h-32">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isPositive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.profit >= 0 ? '+' : ''}${day.profit}`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 truncate w-full text-center">
                          {day.date.split(' ')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Profit/Loss per day</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded" /> Profit
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded" /> Loss
                    </span>
                  </div>
                </div>
              </div>

              {/* Games Activity Chart */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Games Played</h3>
                <div className="h-32 flex items-end gap-1">
                  {chartData.map((day, i) => {
                    const height = (day.games / maxGames) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col justify-end h-24">
                          <div
                            className="w-full bg-indigo-500 rounded-t transition-all"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.games} games (${day.winRate}% win rate)`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">{day.games}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'games' && (
            <div className="space-y-4">
              {/* Favorite Game */}
              {favoriteGame && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-400">Favorite Game</p>
                      <p className="text-xl font-bold text-white">{GAME_NAMES[favoriteGame]}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold text-yellow-300">{byGame[favoriteGame].totalGames}</p>
                      <p className="text-sm text-gray-400">games played</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Game-by-Game Stats */}
              <div className="grid gap-4">
                {gameTypes.map(type => {
                  const stats = byGame[type];
                  if (stats.totalGames === 0) return null;
                  
                  return (
                    <div key={type} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white">{GAME_NAMES[type]}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          stats.netProfit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Games</p>
                          <p className="font-bold text-white">{stats.totalGames}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Win Rate</p>
                          <p className={`font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.winRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Best Win</p>
                          <p className="font-bold text-yellow-400">{stats.biggestWin}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Win Streak</p>
                          <p className="font-bold text-green-400">{stats.longestWinStreak}</p>
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${stats.winRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 text-center">
                  <p className="text-3xl font-black text-green-400">{overall.totalWins}</p>
                  <p className="text-sm text-gray-400">Total Wins</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 text-center">
                  <p className="text-3xl font-black text-red-400">{overall.totalLosses}</p>
                  <p className="text-sm text-gray-400">Total Losses</p>
                </div>
                <div className={`${overall.netProfit >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} rounded-xl p-4 border text-center`}>
                  <p className={`text-3xl font-black ${overall.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {overall.netProfit >= 0 ? '+' : ''}{overall.netProfit}
                  </p>
                  <p className="text-sm text-gray-400">Net Profit</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-bold text-white mb-4">All-Time Statistics</h4>
                <div className="space-y-3">
                  <StatRow label="Total Amount Bet" value={`${overall.totalBet} coins`} />
                  <StatRow label="Total Amount Won" value={`${overall.totalWon} coins`} />
                  <StatRow label="Average Bet Size" value={`${overall.averageBet.toFixed(1)} coins`} />
                  <StatRow label="Average Win Amount" value={`${overall.averageWin.toFixed(1)} coins`} />
                  <StatRow label="Biggest Single Win" value={`${overall.biggestWin} coins`} highlight="green" />
                  <StatRow label="Biggest Single Loss" value={`${overall.biggestLoss} coins`} highlight="red" />
                  <StatRow label="Longest Win Streak" value={`${overall.longestWinStreak} games`} highlight="green" />
                  <StatRow label="Longest Lose Streak" value={`${overall.longestLoseStreak} games`} highlight="red" />
                </div>
              </div>

              {/* Win Rate Breakdown */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-bold text-white mb-4">Win Rate by Game</h4>
                <div className="space-y-3">
                  {gameTypes
                    .filter(type => byGame[type].totalGames > 0)
                    .sort((a, b) => byGame[b].winRate - byGame[a].winRate)
                    .map(type => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-28">{GAME_NAMES[type]}</span>
                        <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              byGame[type].winRate >= 50 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${byGame[type].winRate}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-12 text-right ${
                          byGame[type].winRate >= 50 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {byGame[type].winRate.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
  subtext?: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}> = ({ label, value, icon, subtext, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    gray: 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={colorClasses[color].split(' ').pop()}>{icon}</span>}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-2xl font-black ${colorClasses[color].split(' ').pop()}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
};

const StatRow: React.FC<{
  label: string;
  value: string;
  highlight?: 'green' | 'red';
}> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
    <span className="text-gray-400">{label}</span>
    <span className={`font-bold ${
      highlight === 'green' ? 'text-green-400' : 
      highlight === 'red' ? 'text-red-400' : 
      'text-white'
    }`}>{value}</span>
  </div>
);

export default StatsModal;
