import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Guild,
  GuildMember,
  GuildChatMessage,
  GuildJoinRequest,
  GuildGift,
  GuildTournament,
  GUILD_ICONS,
  GUILD_COLORS,
  GUILD_GIFT_OPTIONS,
} from '../../types/game';

interface GuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string | null;
  playerCoins: number;
  playerStars: number;
  onClaimGift: (gift: GuildGift) => void;
}

type Tab = 'overview' | 'chat' | 'members' | 'tournaments' | 'gifts' | 'leaderboard' | 'manage';

const GuildModal: React.FC<GuildModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerCoins,
  playerStars,
  onClaimGift,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [myMembership, setMyMembership] = useState<GuildMember | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [chatMessages, setChatMessages] = useState<GuildChatMessage[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildTournaments, setGuildTournaments] = useState<GuildTournament[]>([]);
  const [pendingGifts, setPendingGifts] = useState<GuildGift[]>([]);
  const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);
  
  // Create guild form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shield');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [isPublic, setIsPublic] = useState(true);
  
  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch player's guild
  const fetchMyGuild = useCallback(async () => {
    if (!playerId) return;
    
    try {
      // Check if player is in a guild
      const { data: membership } = await supabase
        .from('guild_members')
        .select('*, guilds(*)')
        .eq('player_id', playerId)
        .single();
      
      if (membership) {
        setMyMembership(membership);
        setMyGuild(membership.guilds as unknown as Guild);
        
        // Fetch guild members
        const { data: membersData } = await supabase
          .from('guild_members')
          .select('*, players(username, display_name, avatar_color, total_stars, levels_completed)')
          .eq('guild_id', membership.guild_id)
          .order('role', { ascending: true });
        
        if (membersData) {
          setMembers(membersData.map(m => ({
            ...m,
            player: m.players as any
          })));
        }
        
        // Fetch chat messages
        const { data: chatData } = await supabase
          .from('guild_chat')
          .select('*, players(username, display_name, avatar_color)')
          .eq('guild_id', membership.guild_id)
          .order('created_at', { ascending: true })
          .limit(100);
        
        if (chatData) {
          setChatMessages(chatData.map(c => ({
            ...c,
            player: c.players as any
          })));
        }
        
        // Fetch pending gifts for player
        const { data: giftsData } = await supabase
          .from('guild_gifts')
          .select('*, players!guild_gifts_sender_id_fkey(username, display_name, avatar_color)')
          .eq('guild_id', membership.guild_id)
          .eq('claimed', false)
          .or(`receiver_id.eq.${playerId},is_guild_wide.eq.true`);
        
        if (giftsData) {
          setPendingGifts(giftsData.map(g => ({
            ...g,
            sender: g.players as any
          })));
        }
        
        // Fetch join requests if leader/co-leader
        if (membership.role === 'leader' || membership.role === 'co_leader') {
          const { data: requestsData } = await supabase
            .from('guild_join_requests')
            .select('*, players(username, display_name, avatar_color, total_stars)')
            .eq('guild_id', membership.guild_id)
            .eq('status', 'pending');
          
          if (requestsData) {
            setJoinRequests(requestsData.map(r => ({
              ...r,
              player: r.players as any
            })));
          }
        }
        
        // Fetch guild tournaments
        const { data: tournamentsData } = await supabase
          .from('guild_tournaments')
          .select('*')
          .or(`guild_a_id.eq.${membership.guild_id},guild_b_id.eq.${membership.guild_id}`)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (tournamentsData) {
          setGuildTournaments(tournamentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching guild:', error);
    }
  }, [playerId]);

  // Fetch all guilds for browsing
  const fetchGuilds = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('guilds')
        .select('*, players!guilds_leader_id_fkey(username, display_name, avatar_color)')
        .eq('is_public', true)
        .order('total_stars', { ascending: false })
        .limit(50);
      
      if (data) {
        // Get member counts
        const guildsWithCounts = await Promise.all(
          data.map(async (guild) => {
            const { count } = await supabase
              .from('guild_members')
              .select('*', { count: 'exact', head: true })
              .eq('guild_id', guild.id);
            
            return {
              ...guild,
              leader: guild.players as any,
              member_count: count || 0
            };
          })
        );
        
        setGuilds(guildsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && playerId) {
      setLoading(true);
      Promise.all([fetchMyGuild(), fetchGuilds()]).finally(() => setLoading(false));
    }
  }, [isOpen, playerId, fetchMyGuild, fetchGuilds]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Create guild
  const handleCreateGuild = async () => {
    if (!playerId || !guildName.trim()) return;
    
    try {
      const { data: guild, error } = await supabase
        .from('guilds')
        .insert({
          name: guildName.trim(),
          description: guildDescription.trim() || null,
          icon: selectedIcon,
          icon_color: selectedColor,
          leader_id: playerId,
          is_public: isPublic,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add creator as leader member
      await supabase
        .from('guild_members')
        .insert({
          guild_id: guild.id,
          player_id: playerId,
          role: 'leader',
        });
      
      // Add system message
      await supabase
        .from('guild_chat')
        .insert({
          guild_id: guild.id,
          player_id: playerId,
          message: 'Guild created! Welcome everyone!',
          message_type: 'system',
        });
      
      setShowCreateForm(false);
      setGuildName('');
      setGuildDescription('');
      fetchMyGuild();
    } catch (error) {
      console.error('Error creating guild:', error);
    }
  };

  // Join guild
  const handleJoinGuild = async (guildId: string, isPublicGuild: boolean) => {
    if (!playerId) return;
    
    try {
      if (isPublicGuild) {
        // Direct join for public guilds
        await supabase
          .from('guild_members')
          .insert({
            guild_id: guildId,
            player_id: playerId,
            role: 'member',
          });
        
        fetchMyGuild();
      } else {
        // Send join request for private guilds
        await supabase
          .from('guild_join_requests')
          .insert({
            guild_id: guildId,
            player_id: playerId,
          });
      }
    } catch (error) {
      console.error('Error joining guild:', error);
    }
  };

  // Leave guild
  const handleLeaveGuild = async () => {
    if (!playerId || !myGuild) return;
    
    try {
      await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', myGuild.id)
        .eq('player_id', playerId);
      
      setMyGuild(null);
      setMyMembership(null);
      setMembers([]);
      setChatMessages([]);
    } catch (error) {
      console.error('Error leaving guild:', error);
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!playerId || !myGuild || !chatMessage.trim()) return;
    
    try {
      await supabase
        .from('guild_chat')
        .insert({
          guild_id: myGuild.id,
          player_id: playerId,
          message: chatMessage.trim(),
          message_type: 'text',
        });
      
      setChatMessage('');
      
      // Refetch messages
      const { data } = await supabase
        .from('guild_chat')
        .select('*, players(username, display_name, avatar_color)')
        .eq('guild_id', myGuild.id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data) {
        setChatMessages(data.map(c => ({
          ...c,
          player: c.players as any
        })));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Send gift
  const handleSendGift = async (giftType: 'coins' | 'hints' | 'lives', amount: number, receiverId?: string) => {
    if (!playerId || !myGuild) return;
    
    try {
      await supabase
        .from('guild_gifts')
        .insert({
          guild_id: myGuild.id,
          sender_id: playerId,
          receiver_id: receiverId || null,
          gift_type: giftType,
          amount,
          is_guild_wide: !receiverId,
        });
      
      // Add chat message
      await supabase
        .from('guild_chat')
        .insert({
          guild_id: myGuild.id,
          player_id: playerId,
          message: `sent a gift of ${amount} ${giftType} to ${receiverId ? 'a member' : 'the guild'}!`,
          message_type: 'gift',
        });
      
      // Update member stats
      await supabase
        .from('guild_members')
        .update({ gifts_sent: (myMembership?.gifts_sent || 0) + 1 })
        .eq('guild_id', myGuild.id)
        .eq('player_id', playerId);
      
      fetchMyGuild();
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  // Claim gift
  const handleClaimGift = async (gift: GuildGift) => {
    if (!playerId) return;
    
    try {
      await supabase
        .from('guild_gifts')
        .update({ claimed: true })
        .eq('id', gift.id);
      
      onClaimGift(gift);
      setPendingGifts(prev => prev.filter(g => g.id !== gift.id));
    } catch (error) {
      console.error('Error claiming gift:', error);
    }
  };

  // Handle join request
  const handleJoinRequest = async (requestId: string, accept: boolean) => {
    if (!myGuild) return;
    
    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;
      
      if (accept) {
        // Add member
        await supabase
          .from('guild_members')
          .insert({
            guild_id: myGuild.id,
            player_id: request.player_id,
            role: 'member',
          });
      }
      
      // Update request status
      await supabase
        .from('guild_join_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);
      
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      if (accept) fetchMyGuild();
    } catch (error) {
      console.error('Error handling join request:', error);
    }
  };

  // Promote/demote member
  const handleChangeMemberRole = async (memberId: string, newRole: GuildMember['role']) => {
    if (!myGuild) return;
    
    try {
      await supabase
        .from('guild_members')
        .update({ role: newRole })
        .eq('id', memberId);
      
      fetchMyGuild();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  // Kick member
  const handleKickMember = async (memberId: string) => {
    try {
      await supabase
        .from('guild_members')
        .delete()
        .eq('id', memberId);
      
      fetchMyGuild();
    } catch (error) {
      console.error('Error kicking member:', error);
    }
  };

  if (!isOpen) return null;

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManage = myMembership?.role === 'leader' || myMembership?.role === 'co_leader';

  const renderIcon = (iconId: string, color: string, size: number = 24) => {
    const icon = GUILD_ICONS.find(i => i.id === iconId);
    if (!icon) return null;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={icon.path} />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-indigo-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {myGuild ? myGuild.name : 'Guilds'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {myGuild ? `${members.length} members` : 'Join or create a guild'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : myGuild ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {(['overview', 'chat', 'members', 'tournaments', 'gifts', 'leaderboard', ...(canManage ? ['manage'] : [])] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-white/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'gifts' && pendingGifts.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs">
                      {pendingGifts.length}
                    </span>
                  )}
                  {tab === 'manage' && joinRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                      {joinRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Guild Banner */}
                  <div 
                    className="p-6 rounded-xl relative overflow-hidden"
                    style={{ backgroundColor: myGuild.banner_color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                    <div className="relative flex items-center gap-4">
                      <div 
                        className="w-20 h-20 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: myGuild.icon_color }}
                      >
                        {renderIcon(myGuild.icon, 'white', 40)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{myGuild.name}</h3>
                        <p className="text-gray-300">{myGuild.description || 'No description'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-yellow-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {myGuild.total_stars} stars
                          </span>
                          <span className="text-green-400">{myGuild.total_wins}W / {myGuild.total_losses}L</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-indigo-400">{members.length}</div>
                      <div className="text-sm text-gray-400">Members</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">{myGuild.total_stars}</div>
                      <div className="text-sm text-gray-400">Total Stars</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">{myGuild.total_wins}</div>
                      <div className="text-sm text-gray-400">Wins</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {myMembership?.contribution_points || 0}
                      </div>
                      <div className="text-sm text-gray-400">Your Contribution</div>
                    </div>
                  </div>

                  {/* Top Members */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Top Contributors</h4>
                    <div className="space-y-2">
                      {members
                        .sort((a, b) => (b.player?.total_stars || 0) - (a.player?.total_stars || 0))
                        .slice(0, 5)
                        .map((member, idx) => (
                          <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: member.player?.avatar_color || '#8B5CF6' }}
                            >
                              {(member.player?.display_name || member.player?.username || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">{member.player?.display_name || member.player?.username}</div>
                              <div className="text-xs text-gray-400 capitalize">{member.role.replace('_', ' ')}</div>
                            </div>
                            <div className="text-yellow-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {member.player?.total_stars || 0}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Leave Guild Button */}
                  {myMembership?.role !== 'leader' && (
                    <button
                      onClick={handleLeaveGuild}
                      className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-colors"
                    >
                      Leave Guild
                    </button>
                  )}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.player_id === playerId ? 'flex-row-reverse' : ''}`}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: msg.player?.avatar_color || '#8B5CF6' }}
                        >
                          {(msg.player?.display_name || '?')[0].toUpperCase()}
                        </div>
                        <div className={`max-w-[70%] ${msg.player_id === playerId ? 'text-right' : ''}`}>
                          <div className="text-xs text-gray-400 mb-1">
                            {msg.player?.display_name || 'Unknown'}
                          </div>
                          <div 
                            className={`px-4 py-2 rounded-2xl ${
                              msg.message_type === 'system' 
                                ? 'bg-indigo-500/20 text-indigo-300 italic'
                                : msg.message_type === 'gift'
                                ? 'bg-pink-500/20 text-pink-300'
                                : msg.player_id === playerId
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: member.player?.avatar_color || '#8B5CF6' }}
                      >
                        {(member.player?.display_name || member.player?.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {member.player?.display_name || member.player?.username}
                          {member.role === 'leader' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Leader</span>
                          )}
                          {member.role === 'co_leader' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">Co-Leader</span>
                          )}
                          {member.role === 'elder' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">Elder</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {member.player?.total_stars || 0} stars • {member.gifts_sent} gifts sent
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-indigo-400 font-semibold">{member.contribution_points} pts</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tournaments Tab */}
              {activeTab === 'tournaments' && (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <p className="text-lg font-medium">Guild vs Guild Tournaments</p>
                    <p className="text-sm mt-2">Challenge other guilds to compete for glory and prizes!</p>
                    <button className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold hover:from-yellow-400 hover:to-orange-500 transition-all">
                      Find Opponent
                    </button>
                  </div>
                  
                  {guildTournaments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white">Recent Battles</h4>
                      {guildTournaments.map((tournament) => (
                        <div key={tournament.id} className="p-4 bg-white/5 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">
                              {tournament.guild_a_id === myGuild?.id ? 'Your Guild' : 'Opponent'} vs {tournament.guild_b_id === myGuild?.id ? 'Your Guild' : 'Opponent'}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              tournament.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {tournament.status}
                            </span>
                          </div>
                          <div className="mt-2 text-2xl font-bold text-center">
                            <span className={tournament.guild_a_id === myGuild?.id ? 'text-indigo-400' : 'text-gray-400'}>
                              {tournament.guild_a_score}
                            </span>
                            <span className="text-gray-500 mx-4">-</span>
                            <span className={tournament.guild_b_id === myGuild?.id ? 'text-indigo-400' : 'text-gray-400'}>
                              {tournament.guild_b_score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gifts Tab */}
              {activeTab === 'gifts' && (
                <div className="space-y-6">
                  {/* Pending Gifts */}
                  {pendingGifts.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Pending Gifts</h4>
                      <div className="space-y-2">
                        {pendingGifts.map((gift) => (
                          <div key={gift.id} className="flex items-center gap-3 p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: gift.sender?.avatar_color || '#EC4899' }}
                            >
                              {(gift.sender?.display_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">
                                {gift.amount} {gift.gift_type}
                              </div>
                              <div className="text-sm text-gray-400">
                                From {gift.sender?.display_name || 'Unknown'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleClaimGift(gift)}
                              className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-400 text-white font-semibold transition-colors"
                            >
                              Claim
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Send Gift */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Send Gift to Guild</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {GUILD_GIFT_OPTIONS.map((option) => (
                        <button
                          key={`${option.type}-${option.amount}`}
                          onClick={() => handleSendGift(option.type, option.amount)}
                          className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-pink-500/50 transition-all text-center"
                        >
                          <div className="text-2xl mb-2">
                            {option.type === 'coins' && '🪙'}
                            {option.type === 'hints' && '💡'}
                            {option.type === 'lives' && '❤️'}
                          </div>
                          <div className="text-white font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Top Guilds</h4>
                  <div className="space-y-2">
                    {guilds
                      .sort((a, b) => b.total_stars - a.total_stars)
                      .slice(0, 20)
                      .map((guild, idx) => (
                        <div 
                          key={guild.id} 
                          className={`flex items-center gap-3 p-4 rounded-xl ${
                            guild.id === myGuild?.id ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-500 text-black' :
                            idx === 1 ? 'bg-gray-300 text-black' :
                            idx === 2 ? 'bg-amber-600 text-white' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: guild.icon_color }}
                          >
                            {renderIcon(guild.icon, 'white', 20)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{guild.name}</div>
                            <div className="text-xs text-gray-400">{guild.member_count} members</div>
                          </div>
                          <div className="text-yellow-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {guild.total_stars}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Manage Tab */}
              {activeTab === 'manage' && canManage && (
                <div className="space-y-6">
                  {/* Join Requests */}
                  {joinRequests.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Join Requests</h4>
                      <div className="space-y-2">
                        {joinRequests.map((request) => (
                          <div key={request.id} className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: request.player?.avatar_color || '#F59E0B' }}
                            >
                              {(request.player?.display_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{request.player?.display_name}</div>
                              <div className="text-sm text-gray-400">{request.player?.total_stars || 0} stars</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleJoinRequest(request.id, true)}
                                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleJoinRequest(request.id, false)}
                                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member Management */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Manage Members</h4>
                    <div className="space-y-2">
                      {members
                        .filter(m => m.player_id !== playerId)
                        .map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: member.player?.avatar_color || '#8B5CF6' }}
                            >
                              {(member.player?.display_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{member.player?.display_name}</div>
                              <div className="text-sm text-gray-400 capitalize">{member.role.replace('_', ' ')}</div>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeMemberRole(member.id, e.target.value as GuildMember['role'])}
                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                              >
                                <option value="member">Member</option>
                                <option value="elder">Elder</option>
                                {myMembership?.role === 'leader' && (
                                  <option value="co_leader">Co-Leader</option>
                                )}
                              </select>
                              <button
                                onClick={() => handleKickMember(member.id)}
                                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                              >
                                Kick
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Guild - Browse/Create */
          <div className="flex-1 overflow-y-auto p-4">
            {showCreateForm ? (
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-xl font-bold text-white text-center mb-6">Create Your Guild</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Guild Name</label>
                  <input
                    type="text"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    placeholder="Enter guild name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={guildDescription}
                    onChange={(e) => setGuildDescription(e.target.value)}
                    placeholder="Describe your guild..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {GUILD_ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => setSelectedIcon(icon.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedIcon === icon.id
                            ? 'border-indigo-400 bg-indigo-500/20'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {renderIcon(icon.id, selectedIcon === icon.id ? '#818CF8' : '#9CA3AF', 24)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {GUILD_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-indigo-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-gray-300">Public Guild (anyone can join)</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGuild}
                    disabled={!guildName.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-all disabled:opacity-50"
                  >
                    Create Guild
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Create Guild Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Guild
                </button>

                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guilds..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Guild List */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Browse Guilds</h4>
                  {filteredGuilds.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No guilds found. Be the first to create one!</p>
                    </div>
                  ) : (
                    filteredGuilds.map((guild) => (
                      <div key={guild.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: guild.icon_color }}
                        >
                          {renderIcon(guild.icon, 'white', 24)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{guild.name}</div>
                          <div className="text-sm text-gray-400">
                            {guild.member_count}/{guild.max_members} members • {guild.total_stars} stars
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinGuild(guild.id, guild.is_public)}
                          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors"
                        >
                          {guild.is_public ? 'Join' : 'Request'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuildModal;
