import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Friend, Gift, Challenge, GIFT_OPTIONS, ACHIEVEMENTS, AchievementProgress } from '../../types/game';

interface SocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string | null;
  username: string | null;
  displayName: string | null;
  avatarColor: string;
  achievements: AchievementProgress[];
  playerStats: {
    totalStars: number;
    levelsCompleted: number;
    fastestTime: number | null;
  };
  onClaimGift: (gift: Gift) => void;
  onStartChallenge: (levelId: number) => void;
}

type TabType = 'friends' | 'gifts' | 'challenges' | 'leaderboard';

const SocialModal: React.FC<SocialModalProps> = ({
  isOpen,
  onClose,
  playerId,
  username,
  displayName,
  avatarColor,
  achievements,
  playerStats,
  onClaimGift,
  onStartChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingGifts, setPendingGifts] = useState<Gift[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      // Get friends where current player is either sender or receiver
      const { data: sentRequests } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          friend:friend_id (id, username, display_name, avatar_color, total_stars, levels_completed)
        `)
        .eq('player_id', playerId);

      const { data: receivedRequests } = await supabase
        .from('friends')
        .select(`
          id,
          status,
          friend:player_id (id, username, display_name, avatar_color, total_stars, levels_completed)
        `)
        .eq('friend_id', playerId);

      const allFriends: Friend[] = [];

      sentRequests?.forEach((req: any) => {
        if (req.friend) {
          allFriends.push({
            id: req.friend.id,
            username: req.friend.username,
            display_name: req.friend.display_name,
            avatar_color: req.friend.avatar_color,
            total_stars: req.friend.total_stars || 0,
            levels_completed: req.friend.levels_completed || 0,
            status: req.status,
            is_sender: true,
          });
        }
      });

      receivedRequests?.forEach((req: any) => {
        if (req.friend && !allFriends.find(f => f.id === req.friend.id)) {
          allFriends.push({
            id: req.friend.id,
            username: req.friend.username,
            display_name: req.friend.display_name,
            avatar_color: req.friend.avatar_color,
            total_stars: req.friend.total_stars || 0,
            levels_completed: req.friend.levels_completed || 0,
            status: req.status,
            is_sender: false,
          });
        }
      });

      setFriends(allFriends);
      setFriendsLeaderboard(
        allFriends
          .filter(f => f.status === 'accepted')
          .sort((a, b) => b.total_stars - a.total_stars)
      );
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const fetchGifts = useCallback(async () => {
    if (!playerId) return;
    try {
      const { data } = await supabase
        .from('gifts')
        .select(`
          id,
          sender_id,
          gift_type,
          amount,
          created_at,
          sender:sender_id (display_name, avatar_color)
        `)
        .eq('receiver_id', playerId)
        .eq('claimed', false)
        .order('created_at', { ascending: false });

      const gifts: Gift[] = (data || []).map((g: any) => ({
        id: g.id,
        sender_id: g.sender_id,
        sender_name: g.sender?.display_name || 'Unknown',
        sender_avatar_color: g.sender?.avatar_color || '#8B5CF6',
        gift_type: g.gift_type,
        amount: g.amount,
        created_at: g.created_at,
      }));

      setPendingGifts(gifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  }, [playerId]);

  const fetchChallenges = useCallback(async () => {
    if (!playerId) return;
    try {
      const { data } = await supabase
        .from('challenges')
        .select(`
          id,
          challenger_id,
          challenged_id,
          level_id,
          challenger_score,
          challenged_score,
          status,
          created_at,
          expires_at,
          challenger:challenger_id (display_name, avatar_color),
          challenged:challenged_id (display_name, avatar_color)
        `)
        .or(`challenger_id.eq.${playerId},challenged_id.eq.${playerId}`)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      const challenges: Challenge[] = (data || []).map((c: any) => ({
        id: c.id,
        challenger_id: c.challenger_id,
        challenger_name: c.challenger?.display_name || 'Unknown',
        challenger_avatar_color: c.challenger?.avatar_color || '#8B5CF6',
        challenged_id: c.challenged_id,
        challenged_name: c.challenged?.display_name || 'Unknown',
        level_id: c.level_id,
        challenger_score: c.challenger_score,
        challenged_score: c.challenged_score,
        status: c.status,
        created_at: c.created_at,
        expires_at: c.expires_at,
      }));

      setPendingChallenges(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, [playerId]);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchFriends();
      fetchGifts();
      fetchChallenges();
    }
  }, [isOpen, playerId, fetchFriends, fetchGifts, fetchChallenges]);

  const searchPlayers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('players')
        .select('id, username, display_name, avatar_color, total_stars')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', playerId)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!playerId) return;
    try {
      await supabase.from('friends').insert({
        player_id: playerId,
        friend_id: friendId,
        status: 'pending',
      });
      fetchFriends();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!playerId) return;
    try {
      await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('player_id', friendId)
        .eq('friend_id', playerId);
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!playerId) return;
    try {
      await supabase
        .from('friends')
        .delete()
        .or(`and(player_id.eq.${playerId},friend_id.eq.${friendId}),and(player_id.eq.${friendId},friend_id.eq.${playerId})`);
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const sendGift = async (friendId: string, giftType: 'coins' | 'hints' | 'lives', amount: number) => {
    if (!playerId) return;
    try {
      await supabase.from('gifts').insert({
        sender_id: playerId,
        receiver_id: friendId,
        gift_type: giftType,
        amount: amount,
      });
      setShowGiftModal(false);
      setSelectedFriend(null);
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const claimGift = async (gift: Gift) => {
    try {
      await supabase
        .from('gifts')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', gift.id);
      onClaimGift(gift);
      fetchGifts();
    } catch (error) {
      console.error('Error claiming gift:', error);
    }
  };

  const sendChallenge = async (friendId: string, levelId: number, score: number) => {
    if (!playerId) return;
    try {
      await supabase.from('challenges').insert({
        challenger_id: playerId,
        challenged_id: friendId,
        level_id: levelId,
        challenger_score: score,
      });
      setShowChallengeModal(false);
      setSelectedFriend(null);
      fetchChallenges();
    } catch (error) {
      console.error('Error sending challenge:', error);
    }
  };

  const acceptChallenge = async (challenge: Challenge) => {
    onStartChallenge(challenge.level_id);
    onClose();
  };

  const shareAchievement = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    const text = `I just unlocked "${achievement.name}" in BLOBBY! 🎮✨ ${achievement.description}`;
    const url = window.location.origin;

    setSelectedAchievement(achievementId);
    setShowShareModal(true);
  };

  const shareToSocial = (platform: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === selectedAchievement);
    if (!achievement) return;

    const text = encodeURIComponent(`I just unlocked "${achievement.name}" in BLOBBY! 🎮✨ ${achievement.description}`);
    const url = encodeURIComponent(window.location.origin);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${decodeURIComponent(text)} ${decodeURIComponent(url)}`);
        setShowShareModal(false);
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  if (!isOpen) return null;

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending' && !f.is_sender);
  const sentRequests = friends.filter(f => f.status === 'pending' && f.is_sender);
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Social Hub</h2>
              <p className="text-blue-200">Connect with friends & compete!</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'friends', label: 'Friends', icon: 'users', count: acceptedFriends.length },
            { id: 'gifts', label: 'Gifts', icon: 'gift', count: pendingGifts.length },
            { id: 'challenges', label: 'Challenges', icon: 'trophy', count: pendingChallenges.length },
            { id: 'leaderboard', label: 'Rankings', icon: 'chart' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.id === 'users' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              {tab.id === 'gift' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              )}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!playerId ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-400 mb-4">Create a profile to use social features</p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold transition-colors"
              >
                Set Up Profile
              </button>
            </div>
          ) : (
            <>
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
                      placeholder="Search by username..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={searchPlayers}
                      disabled={searching}
                      className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {searching ? '...' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 space-y-2">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Search Results</h4>
                      {searchResults.map((player) => (
                        <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: player.avatar_color }}
                          >
                            {player.display_name?.[0] || player.username[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{player.display_name || player.username}</div>
                            <div className="text-xs text-gray-400">@{player.username}</div>
                          </div>
                          {friends.find(f => f.id === player.id) ? (
                            <span className="text-xs text-gray-400">Already added</span>
                          ) : (
                            <button
                              onClick={() => sendFriendRequest(player.id)}
                              className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">Friend Requests ({pendingRequests.length})</h4>
                      <div className="space-y-2">
                        {pendingRequests.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: friend.avatar_color }}
                            >
                              {friend.display_name?.[0] || friend.username[0]}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{friend.display_name}</div>
                              <div className="text-xs text-gray-400">@{friend.username}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptFriendRequest(friend.id)}
                                className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-400 text-white text-sm font-semibold transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => removeFriend(friend.id)}
                                className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends List */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Friends ({acceptedFriends.length})</h4>
                    {acceptedFriends.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No friends yet. Search for players to add!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {acceptedFriends.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: friend.avatar_color }}
                            >
                              {friend.display_name?.[0] || friend.username[0]}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{friend.display_name}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-2">
                                <span>@{friend.username}</span>
                                <span className="text-yellow-400">{friend.total_stars} stars</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedFriend(friend); setShowGiftModal(true); }}
                                className="p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
                                title="Send Gift"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { setSelectedFriend(friend); setShowChallengeModal(true); }}
                                className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
                                title="Challenge"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeFriend(friend.id)}
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                title="Remove"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent Requests */}
                  {sentRequests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Sent Requests ({sentRequests.length})</h4>
                      <div className="space-y-2">
                        {sentRequests.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: friend.avatar_color }}
                            >
                              {friend.display_name?.[0] || friend.username[0]}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{friend.display_name}</div>
                              <div className="text-xs text-gray-400">@{friend.username}</div>
                            </div>
                            <span className="text-xs text-gray-500">Pending...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gifts Tab */}
              {activeTab === 'gifts' && (
                <div className="space-y-4">
                  {pendingGifts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <p>No pending gifts</p>
                      <p className="text-sm mt-2">Send gifts to friends from the Friends tab!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingGifts.map((gift) => (
                        <div key={gift.id} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: gift.sender_avatar_color }}
                          >
                            {gift.sender_name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">Gift from {gift.sender_name}</div>
                            <div className="text-sm text-pink-300">
                              {gift.amount} {gift.gift_type === 'coins' ? 'Coins' : gift.gift_type === 'hints' ? 'Hints' : 'Lives'}
                            </div>
                          </div>
                          <button
                            onClick={() => claimGift(gift)}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold transition-all"
                          >
                            Claim
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Share Achievements Section */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Share Your Achievements</h4>
                    {unlockedAchievements.length === 0 ? (
                      <p className="text-gray-500 text-sm">Unlock achievements to share them!</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {unlockedAchievements.slice(0, 6).map((progress) => {
                          const achievement = ACHIEVEMENTS.find(a => a.id === progress.id);
                          if (!achievement) return null;
                          return (
                            <button
                              key={progress.id}
                              onClick={() => shareAchievement(progress.id)}
                              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors group"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">{achievement.name}</div>
                                  <div className="text-xs text-gray-400">Tap to share</div>
                                </div>
                                <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div className="space-y-4">
                  {pendingChallenges.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p>No active challenges</p>
                      <p className="text-sm mt-2">Challenge friends from the Friends tab!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingChallenges.map((challenge) => {
                        const isChallenger = challenge.challenger_id === playerId;
                        const opponent = isChallenger ? challenge.challenged_name : challenge.challenger_name;
                        const opponentColor = isChallenger ? '#8B5CF6' : challenge.challenger_avatar_color;

                        return (
                          <div key={challenge.id} className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: opponentColor }}
                                >
                                  {opponent[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">
                                    {isChallenger ? `Challenge to ${opponent}` : `${opponent} challenges you!`}
                                  </div>
                                  <div className="text-sm text-orange-300">Level {challenge.level_id}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-yellow-400">{challenge.challenger_score} stars</div>
                                <div className="text-xs text-gray-400">to beat</div>
                              </div>
                            </div>
                            {!isChallenger && challenge.status === 'pending' && (
                              <button
                                onClick={() => acceptChallenge(challenge)}
                                className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold transition-all"
                              >
                                Accept Challenge
                              </button>
                            )}
                            {isChallenger && (
                              <div className="text-center text-sm text-gray-400">
                                Waiting for {opponent} to respond...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Friends Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-400">Friends Leaderboard</h4>
                  
                  {/* Current Player */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        You
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {(displayName || username || 'U')[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{displayName || username}</div>
                        <div className="text-xs text-gray-400">{playerStats.levelsCompleted} levels</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400">{playerStats.totalStars}</div>
                        <div className="text-xs text-gray-400">stars</div>
                      </div>
                    </div>
                  </div>

                  {friendsLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Add friends to see them here!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friendsLeaderboard.map((friend, index) => (
                        <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: friend.avatar_color }}
                          >
                            {friend.display_name?.[0] || friend.username[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{friend.display_name}</div>
                            <div className="text-xs text-gray-400">{friend.levels_completed} levels</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-400">{friend.total_stars}</div>
                            <div className="text-xs text-gray-400">stars</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && selectedFriend && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Send Gift to {selectedFriend.display_name}</h3>
            <div className="space-y-2">
              {GIFT_OPTIONS.map((option, index) => (
                <button
                  key={index}
                  onClick={() => sendGift(selectedFriend.id, option.type, option.amount)}
                  className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    {option.type === 'coins' && (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    {option.type === 'hints' && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                      </svg>
                    )}
                    {option.type === 'lives' && (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-white">{option.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowGiftModal(false); setSelectedFriend(null); }}
              className="w-full mt-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && selectedFriend && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Challenge {selectedFriend.display_name}</h3>
            <p className="text-gray-400 mb-4">Select a level you've completed to challenge your friend:</p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((levelId) => (
                <button
                  key={levelId}
                  onClick={() => sendChallenge(selectedFriend.id, levelId, 3)}
                  className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-white">Level {levelId}</span>
                  <span className="text-yellow-400">3 stars</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowChallengeModal(false); setSelectedFriend(null); }}
              className="w-full mt-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedAchievement && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Share Achievement</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareToSocial('twitter')}
                className="p-4 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('facebook')}
                className="p-4 rounded-xl bg-[#4267B2]/20 hover:bg-[#4267B2]/30 text-[#4267B2] font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="p-4 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={() => shareToSocial('copy')}
                className="p-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialModal;
