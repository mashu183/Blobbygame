import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GAME_IMAGES } from '../../types/game';

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  total_stars: number;
  levels_completed: number;
  fastest_level_time: number | null;
  total_coins: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerId: string | null;
  playerStats: {
    totalStars: number;
    levelsCompleted: number;
    fastestTime: number | null;
  };
}

type TabType = 'stars' | 'levels' | 'speed';
type PeriodType = 'weekly' | 'monthly' | 'alltime';

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayerId,
  playerStats,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('stars');
  const [period, setPeriod] = useState<PeriodType>('alltime');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, activeTab, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('players')
        .select('id, username, display_name, avatar_color, total_stars, levels_completed, fastest_level_time, total_coins');

      // Apply period filter
      if (period === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('updated_at', weekAgo.toISOString());
      } else if (period === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('updated_at', monthAgo.toISOString());
      }

      // Sort by active tab
      if (activeTab === 'stars') {
        query = query.order('total_stars', { ascending: false });
      } else if (activeTab === 'levels') {
        query = query.order('levels_completed', { ascending: false });
      } else if (activeTab === 'speed') {
        query = query.order('fastest_level_time', { ascending: true, nullsFirst: false });
      }

      query = query.limit(100);

      const { data, error } = await query;

      if (error) throw error;

      setLeaderboard(data || []);

      // Find current player's rank
      if (currentPlayerId && data) {
        const rank = data.findIndex(p => p.id === currentPlayerId);
        setPlayerRank(rank >= 0 ? rank + 1 : null);
        const player = data.find(p => p.id === currentPlayerId);
        setCurrentPlayer(player || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'stars':
        return entry.total_stars;
      case 'levels':
        return entry.levels_completed;
      case 'speed':
        return formatTime(entry.fastest_level_time);
      default:
        return 0;
    }
  };

  const getScoreLabel = () => {
    switch (activeTab) {
      case 'stars':
        return 'Stars';
      case 'levels':
        return 'Levels';
      case 'speed':
        return 'Best Time';
      default:
        return 'Score';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
              <p className="text-yellow-200">Compete with players worldwide!</p>
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex border-b border-white/10 bg-black/20">
          {[
            { id: 'weekly', label: 'This Week' },
            { id: 'monthly', label: 'This Month' },
            { id: 'alltime', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodType)}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                period === p.id
                  ? 'bg-purple-500/30 text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'stars', label: 'Most Stars', icon: '⭐' },
            { id: 'levels', label: 'Levels Done', icon: '🎮' },
            { id: 'speed', label: 'Fastest', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Your Rank Card */}
        {currentPlayer && playerRank && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: currentPlayer.avatar_color }}>
                  {currentPlayer.display_name?.[0] || currentPlayer.username[0]}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {currentPlayer.display_name || currentPlayer.username}
                  </div>
                  <div className="text-sm text-gray-400">Your Rank: #{playerRank}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-300">
                  {getScoreValue(currentPlayer)}
                </div>
                <div className="text-xs text-gray-400">{getScoreLabel()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const isCurrentPlayer = entry.id === currentPlayerId;
                const rank = index + 1;
                const isTopThree = rank <= 3;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrentPlayer
                        ? 'bg-purple-500/30 border border-purple-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                      rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                      rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {isTopThree ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ) : rank}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: entry.avatar_color }}
                    >
                      {entry.display_name?.[0] || entry.username[0]}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isCurrentPlayer ? 'text-purple-200' : 'text-white'}`}>
                        {entry.display_name || entry.username}
                        {isCurrentPlayer && <span className="text-purple-400 ml-2">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-500">@{entry.username}</div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        rank === 1 ? 'text-yellow-400' :
                        rank === 2 ? 'text-gray-300' :
                        rank === 3 ? 'text-orange-400' :
                        'text-white'
                      }`}>
                        {getScoreValue(entry)}
                      </div>
                      <div className="text-xs text-gray-500">{getScoreLabel()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/30 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            Leaderboard updates in real-time. Keep playing to climb the ranks!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
