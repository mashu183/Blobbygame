import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, TournamentEntry, TournamentWinner, TOURNAMENT_PRIZE_DISTRIBUTION } from '../../types/game';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string | null;
  playerCoins: number;
  onEnterTournament: (tournamentId: string, entryFee: number) => Promise<boolean>;
  onPlayTournament: (levelId: number, tournamentId: string) => void;
}

type Tab = 'active' | 'upcoming' | 'history';

interface TournamentWithDetails extends Tournament {
  entries: (TournamentEntry & { player?: { username: string; display_name: string; avatar_color: string } })[];
  winners?: (TournamentWinner & { player?: { username: string; display_name: string; avatar_color: string } })[];
  player_entry?: TournamentEntry | null;
  participant_count: number;
}

const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerCoins,
  onEnterTournament,
  onPlayTournament,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [tournaments, setTournaments] = useState<TournamentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<TournamentWithDetails | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [entering, setEntering] = useState(false);

  // Fetch tournaments
  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tournaments')
        .select('*')
        .order('end_time', { ascending: true });

      if (activeTab === 'active') {
        query = query.eq('status', 'active');
      } else if (activeTab === 'upcoming') {
        query = query.eq('status', 'upcoming');
      } else {
        query = query.eq('status', 'completed').order('end_time', { ascending: false }).limit(10);
      }

      const { data: tournamentsData, error } = await query;

      if (error) throw error;

      // Fetch entries and winners for each tournament
      const tournamentsWithDetails: TournamentWithDetails[] = await Promise.all(
        (tournamentsData || []).map(async (tournament) => {
          // Get entries with player info
          const { data: entries } = await supabase
            .from('tournament_entries')
            .select(`
              *,
              player:players(username, display_name, avatar_color)
            `)
            .eq('tournament_id', tournament.id)
            .order('score', { ascending: false })
            .limit(50);

          // Get winners if completed
          let winners: (TournamentWinner & { player?: { username: string; display_name: string; avatar_color: string } })[] = [];
          if (tournament.status === 'completed') {
            const { data: winnersData } = await supabase
              .from('tournament_winners')
              .select(`
                *,
                player:players(username, display_name, avatar_color)
              `)
              .eq('tournament_id', tournament.id)
              .order('rank', { ascending: true });
            winners = winnersData || [];
          }

          // Check if current player has entered
          let playerEntry = null;
          if (playerId) {
            const entry = entries?.find(e => e.player_id === playerId);
            playerEntry = entry || null;
          }

          return {
            ...tournament,
            entries: entries || [],
            winners,
            player_entry: playerEntry,
            participant_count: entries?.length || 0,
          };
        })
      );

      setTournaments(tournamentsWithDetails);
      
      // Auto-select first tournament if none selected
      if (tournamentsWithDetails.length > 0 && !selectedTournament) {
        setSelectedTournament(tournamentsWithDetails[0]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, playerId, selectedTournament]);

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen, activeTab, fetchTournaments]);

  // Countdown timer
  useEffect(() => {
    if (!selectedTournament || selectedTournament.status !== 'active') {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const endTime = new Date(selectedTournament.end_time).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setCountdown('Tournament Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedTournament]);

  const handleEnterTournament = async () => {
    if (!selectedTournament || !playerId) return;
    
    setEntering(true);
    const success = await onEnterTournament(selectedTournament.id, selectedTournament.entry_fee);
    
    if (success) {
      // Refresh tournaments to show updated entry
      await fetchTournaments();
    }
    setEntering(false);
  };

  const handlePlayTournament = () => {
    if (!selectedTournament) return;
    onPlayTournament(selectedTournament.featured_level, selectedTournament.id);
    onClose();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
            </svg>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-400/30">
            <span className="text-white font-bold">2</span>
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/30">
            <span className="text-white font-bold">3</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-300 font-bold text-sm">{rank}</span>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600/30 via-yellow-600/30 to-orange-600/30 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Weekly Tournaments</h2>
                <p className="text-yellow-200/80">Compete for glory and prizes!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['active', 'upcoming', 'history'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedTournament(null);
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'active' && 'Active'}
              {tab === 'upcoming' && 'Upcoming'}
              {tab === 'history' && 'History'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full" />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <p>No {activeTab} tournaments</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tournament List */}
              <div className="w-1/3 border-r border-white/10 overflow-y-auto">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => setSelectedTournament(tournament)}
                    className={`w-full p-4 text-left border-b border-white/5 transition-colors ${
                      selectedTournament?.id === tournament.id
                        ? 'bg-yellow-500/20 border-l-4 border-l-yellow-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-white truncate">{tournament.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Level {tournament.featured_level}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        {tournament.prize_pool} coins
                      </span>
                      <span className="text-xs text-gray-500">
                        {tournament.participant_count} players
                      </span>
                    </div>
                    {tournament.player_entry && (
                      <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Entered
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Tournament Details */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedTournament ? (
                  <div className="space-y-6">
                    {/* Tournament Info */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-2">{selectedTournament.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{selectedTournament.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Featured Level</div>
                          <div className="text-lg font-bold text-purple-400">Level {selectedTournament.featured_level}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Entry Fee</div>
                          <div className="text-lg font-bold text-yellow-400 flex items-center gap-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            {selectedTournament.entry_fee}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Prize Pool</div>
                          <div className="text-lg font-bold text-green-400 flex items-center gap-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            {selectedTournament.prize_pool}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Participants</div>
                          <div className="text-lg font-bold text-blue-400">{selectedTournament.participant_count}</div>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      {selectedTournament.status === 'active' && countdown && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-300 text-sm">Time Remaining</span>
                            </div>
                            <span className="text-xl font-bold text-white font-mono">{countdown}</span>
                          </div>
                        </div>
                      )}

                      {/* Prize Distribution */}
                      <div className="mt-4">
                        <div className="text-sm text-gray-400 mb-2">Prize Distribution</div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-yellow-500/20 rounded-lg p-2 text-center border border-yellow-500/30">
                            <div className="text-xs text-yellow-400">1st Place</div>
                            <div className="font-bold text-yellow-300">
                              {Math.floor(selectedTournament.prize_pool * TOURNAMENT_PRIZE_DISTRIBUTION[1])}
                            </div>
                          </div>
                          <div className="flex-1 bg-gray-400/20 rounded-lg p-2 text-center border border-gray-400/30">
                            <div className="text-xs text-gray-400">2nd Place</div>
                            <div className="font-bold text-gray-300">
                              {Math.floor(selectedTournament.prize_pool * TOURNAMENT_PRIZE_DISTRIBUTION[2])}
                            </div>
                          </div>
                          <div className="flex-1 bg-amber-600/20 rounded-lg p-2 text-center border border-amber-600/30">
                            <div className="text-xs text-amber-400">3rd Place</div>
                            <div className="font-bold text-amber-300">
                              {Math.floor(selectedTournament.prize_pool * TOURNAMENT_PRIZE_DISTRIBUTION[3])}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {selectedTournament.status === 'active' && playerId && (
                        <div className="mt-4">
                          {selectedTournament.player_entry ? (
                            <button
                              onClick={handlePlayTournament}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Play Tournament Level
                            </button>
                          ) : (
                            <button
                              onClick={handleEnterTournament}
                              disabled={entering || playerCoins < selectedTournament.entry_fee}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {entering ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  Enter Tournament ({selectedTournament.entry_fee} coins)
                                </>
                              )}
                            </button>
                          )}
                          {playerCoins < selectedTournament.entry_fee && !selectedTournament.player_entry && (
                            <p className="text-center text-red-400 text-sm mt-2">
                              Not enough coins! You have {playerCoins} coins.
                            </p>
                          )}
                        </div>
                      )}

                      {!playerId && selectedTournament.status === 'active' && (
                        <div className="mt-4 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-center">
                          <p className="text-blue-300 text-sm">Create a profile to enter tournaments!</p>
                        </div>
                      )}
                    </div>

                    {/* Leaderboard / Winners */}
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-white/5">
                        <h4 className="font-bold text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          {selectedTournament.status === 'completed' ? 'Winners' : 'Leaderboard'}
                        </h4>
                      </div>

                      {selectedTournament.status === 'completed' && selectedTournament.winners && selectedTournament.winners.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {selectedTournament.winners.map((winner) => (
                            <div
                              key={winner.id}
                              className={`flex items-center gap-3 p-4 ${
                                winner.rank === 1 ? 'bg-yellow-500/10' : ''
                              }`}
                            >
                              {getRankIcon(winner.rank)}
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: winner.player?.avatar_color || '#8B5CF6' }}
                              >
                                {(winner.player?.display_name || 'P')[0].toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-white">
                                  {winner.player?.display_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-400">
                                  Score: {winner.score}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-400 font-bold flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  {winner.prize_amount}
                                </div>
                                <div className="text-xs text-gray-500">Prize</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : selectedTournament.entries.length > 0 ? (
                        <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                          {selectedTournament.entries.map((entry, index) => (
                            <div
                              key={entry.id}
                              className={`flex items-center gap-3 p-4 ${
                                entry.player_id === playerId ? 'bg-purple-500/20' : ''
                              } ${index < 3 ? 'bg-yellow-500/5' : ''}`}
                            >
                              {getRankIcon(index + 1)}
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: entry.player?.avatar_color || '#8B5CF6' }}
                              >
                                {(entry.player?.display_name || 'P')[0].toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-white flex items-center gap-2">
                                  {entry.player?.display_name || 'Unknown'}
                                  {entry.player_id === playerId && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">You</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">
                                  @{entry.player?.username || 'unknown'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-bold">{entry.score}</div>
                                <div className="text-xs text-gray-500">
                                  {entry.stars_earned > 0 && (
                                    <span className="flex items-center gap-0.5 justify-end">
                                      {Array.from({ length: entry.stars_earned }).map((_, i) => (
                                        <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                      ))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>No participants yet</p>
                          <p className="text-sm mt-1">Be the first to enter!</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <p>Select a tournament to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentModal;
