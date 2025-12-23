import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ReferralStats {
  totalReferrals: number;
  coinsEarned: number;
  powerUpsEarned: number;
}

interface TopReferrer {
  username: string;
  display_name: string;
  avatar_color: string;
  referral_count: number;
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string | null;
  username: string | null;
  displayName: string | null;
  avatarColor: string;
  onRewardClaimed: (coins: number, powerUps?: { teleport?: number; wallbreak?: number; extramoves?: number }) => void;
}

// Referral rewards configuration
const REFERRER_REWARDS = {
  coins: 100,
  powerUps: { teleport: 1 }
};

const REFERRED_REWARDS = {
  coins: 50,
  hints: 1
};

const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  playerId,
  username,
  displayName,
  avatarColor,
  onRewardClaimed,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'leaderboard'>('share');
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, coinsEarned: 0, powerUpsEarned: 0 });
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState<{ username: string; created_at: string }[]>([]);

  // Generate referral code from username
  const generateReferralCode = useCallback((uname: string): string => {
    if (!uname) return '';
    const base = uname.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const hash = Math.abs(uname.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 1000);
    return `${base}${hash.toString().padStart(3, '0')}`;
  }, []);

  // Fetch referral stats
  const fetchStats = useCallback(async () => {
    if (!playerId || !username) return;
    
    setLoading(true);
    try {
      const code = generateReferralCode(username);
      setReferralCode(code);

      // Get referral count
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('id, referred_username, created_at')
        .eq('referrer_id', playerId);

      if (error) throw error;

      const totalReferrals = referrals?.length || 0;
      setStats({
        totalReferrals,
        coinsEarned: totalReferrals * REFERRER_REWARDS.coins,
        powerUpsEarned: totalReferrals * (REFERRER_REWARDS.powerUps.teleport || 0),
      });

      // Get recent referrals
      setRecentReferrals(
        (referrals || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(r => ({ username: r.referred_username, created_at: r.created_at }))
      );
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  }, [playerId, username, generateReferralCode]);

  // Fetch top referrers leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      // Get referral counts grouped by referrer
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('referrer_id, referrer_username');

      if (error) throw error;

      // Count referrals per user
      const counts: Record<string, { username: string; count: number }> = {};
      (referrals || []).forEach(r => {
        if (!counts[r.referrer_id]) {
          counts[r.referrer_id] = { username: r.referrer_username, count: 0 };
        }
        counts[r.referrer_id].count++;
      });

      // Get player details for top referrers
      const topIds = Object.entries(counts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('id, username, display_name, avatar_color')
          .in('id', topIds);

        const leaderboard: TopReferrer[] = topIds.map(id => {
          const player = players?.find(p => p.id === id);
          return {
            username: player?.username || counts[id].username,
            display_name: player?.display_name || counts[id].username,
            avatar_color: player?.avatar_color || '#8B5CF6',
            referral_count: counts[id].count,
          };
        });

        setTopReferrers(leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      fetchLeaderboard();
    }
  }, [isOpen, fetchStats, fetchLeaderboard]);

  // Copy referral code to clipboard
  const copyCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Share referral link
  const shareReferral = async (platform: string) => {
    const text = `Join me on BLOBBY! Use my referral code ${referralCode} to get 50 bonus coins when you sign up! 🎮✨`;
    const url = window.location.origin;

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Invite Friends</h2>
              <p className="text-green-200">Earn rewards for every friend who joins!</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-4 font-semibold transition-all ${
              activeTab === 'share'
                ? 'bg-white/10 text-white border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Share & Earn
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-4 font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white/10 text-white border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Top Referrers
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!playerId ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-400 mb-4">Create a profile to get your referral code</p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors"
              >
                Set Up Profile
              </button>
            </div>
          ) : (
            <>
              {/* Share Tab */}
              {activeTab === 'share' && (
                <div className="space-y-6">
                  {/* Rewards Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <div className="text-sm text-green-300 mb-1">You Get</div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        <span className="text-xl font-bold text-white">{REFERRER_REWARDS.coins}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">+ 1 Teleport Power-up</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                      <div className="text-sm text-blue-300 mb-1">Friend Gets</div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        <span className="text-xl font-bold text-white">{REFERRED_REWARDS.coins}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">+ 1 Hint</div>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 rounded-lg bg-black/30 border border-white/20 font-mono text-2xl text-center text-green-400 tracking-widest">
                        {referralCode || '------'}
                      </div>
                      <button
                        onClick={copyCode}
                        className={`p-3 rounded-lg transition-all ${
                          copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {copied ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div>
                    <div className="text-sm text-gray-400 mb-3">Share with friends</div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => shareReferral('twitter')}
                        className="p-3 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] transition-colors flex flex-col items-center gap-1"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        <span className="text-xs">Twitter</span>
                      </button>
                      <button
                        onClick={() => shareReferral('facebook')}
                        className="p-3 rounded-xl bg-[#4267B2]/20 hover:bg-[#4267B2]/30 text-[#4267B2] transition-colors flex flex-col items-center gap-1"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="text-xs">Facebook</span>
                      </button>
                      <button
                        onClick={() => shareReferral('whatsapp')}
                        className="p-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] transition-colors flex flex-col items-center gap-1"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-xs">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => shareReferral('copy')}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex flex-col items-center gap-1"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-xs">Copy Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Your Stats */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                    <div className="text-sm text-yellow-300 mb-3">Your Referral Stats</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
                        <div className="text-xs text-gray-400">Friends Joined</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">{stats.coinsEarned}</div>
                        <div className="text-xs text-gray-400">Coins Earned</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-cyan-400">{stats.powerUpsEarned}</div>
                        <div className="text-xs text-gray-400">Power-ups</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Referrals */}
                  {recentReferrals.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Recent Referrals</div>
                      <div className="space-y-2">
                        {recentReferrals.map((ref, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                            <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{ref.username}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(ref.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-xs text-green-400">+{REFERRER_REWARDS.coins} coins</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-400">Top referrers this month</div>
                    <div className="text-xs text-green-400">Invite more friends to climb the ranks!</div>
                  </div>

                  {topReferrers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No referrals yet</p>
                      <p className="text-sm mt-2">Be the first to invite friends!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topReferrers.map((referrer, index) => {
                        const isCurrentUser = referrer.username === username;
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                              isCurrentUser 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-500 text-black' :
                              'bg-white/10 text-gray-400'
                            }`}>
                              {index + 1}
                            </div>

                            {/* Avatar */}
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: referrer.avatar_color }}
                            >
                              {referrer.display_name[0].toUpperCase()}
                            </div>

                            {/* Name */}
                            <div className="flex-1">
                              <div className="font-semibold text-white flex items-center gap-2">
                                {referrer.display_name}
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-green-500/30 text-green-400">You</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">@{referrer.username}</div>
                            </div>

                            {/* Referral Count */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">{referrer.referral_count}</div>
                              <div className="text-xs text-gray-400">referrals</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Current User Position (if not in top 10) */}
                  {username && !topReferrers.find(r => r.username === username) && stats.totalReferrals > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-2">Your Position</div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-bold text-sm">
                          --
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {(displayName || username || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{displayName || username}</div>
                          <div className="text-xs text-gray-400">@{username}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{stats.totalReferrals}</div>
                          <div className="text-xs text-gray-400">referrals</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;

// Export helper function to validate and process referral codes
export const processReferralCode = async (
  referralCode: string,
  newPlayerId: string,
  newPlayerUsername: string
): Promise<{ success: boolean; referrerId?: string; error?: string }> => {
  if (!referralCode || referralCode.length < 4) {
    return { success: false, error: 'Invalid referral code' };
  }

  try {
    // Find the referrer by their code
    // The code format is: USERNAME_PREFIX + HASH
    // We need to find a player whose generated code matches
    const { data: players } = await supabase
      .from('players')
      .select('id, username');

    if (!players || players.length === 0) {
      return { success: false, error: 'Referral code not found' };
    }

    // Generate codes for all players and find match
    const generateCode = (uname: string): string => {
      const base = uname.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const hash = Math.abs(uname.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 1000);
      return `${base}${hash.toString().padStart(3, '0')}`;
    };

    const referrer = players.find(p => generateCode(p.username) === referralCode.toUpperCase());

    if (!referrer) {
      return { success: false, error: 'Referral code not found' };
    }

    if (referrer.id === newPlayerId) {
      return { success: false, error: 'Cannot use your own referral code' };
    }

    // Check if this new player already used a referral code
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newPlayerId)
      .limit(1);

    if (existingReferral && existingReferral.length > 0) {
      return { success: false, error: 'You have already used a referral code' };
    }

    // Create the referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referrer_username: referrer.username,
        referred_id: newPlayerId,
        referred_username: newPlayerUsername,
        referral_code: referralCode.toUpperCase(),
      });

    if (insertError) {
      console.error('Error creating referral:', insertError);
      return { success: false, error: 'Failed to process referral' };
    }

    return { success: true, referrerId: referrer.id };
  } catch (error) {
    console.error('Error processing referral:', error);
    return { success: false, error: 'Failed to process referral' };
  }
};
