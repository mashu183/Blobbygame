import React, { useState, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useJackpot } from '../hooks/useJackpot';
import { useVIP } from '../hooks/useVIP';
import { useGamblingStats, GameType } from '../hooks/useGamblingStats';
import { GAME_IMAGES, DailyChallenge, Gift, GuildGift } from '../types/game';
import { GachaState, INITIAL_GACHA_STATE } from '../types/gacha';

import { supabase } from '@/lib/supabase';
import GameHeader from './game/GameHeader';
import GameGrid from './game/GameGrid';
import LevelSelect from './game/LevelSelect';
import StoreModal from './game/StoreModal';
import LevelComplete from './game/LevelComplete';
import GameOver from './game/GameOver';
import SettingsModal from './game/SettingsModal';
import AdBanner from './game/AdBanner';
import MainMenu from './game/MainMenu';
import PromoSection from './game/PromoSection';
import DailyReward from './game/DailyReward';
import WeeklyChestModal from './game/WeeklyChestModal';
import LeaderboardModal from './game/LeaderboardModal';
import AchievementsModal from './game/AchievementsModal';
import AchievementNotification from './game/AchievementNotification';
import DailyChallengesModal from './game/DailyChallengesModal';
import SocialModal from './game/SocialModal';
import TournamentModal from './game/TournamentModal';
import SeasonPassModal from './game/SeasonPassModal';
import GuildModal from './game/GuildModal';
import FacebookAdPage from './game/FacebookAdPage';
import LuckySpinModal from './game/LuckySpinModal';
import MysteryBoxModal from './game/MysteryBoxModal';
import SlotMachineModal from './game/SlotMachineModal';
import ScratchCardModal from './game/ScratchCardModal';
import CoinFlipModal from './game/CoinFlipModal';
import TreasureHuntModal from './game/TreasureHuntModal';
import JackpotSpinModal from './game/JackpotSpinModal';
import VIPModal from './game/VIPModal';
import StatsModal from './game/StatsModal';
import GachaModal from './game/GachaModal';

import CloudSyncModal from './game/CloudSyncModal';
import ReferralModal from './game/ReferralModal';


type Screen = 'menu' | 'levels' | 'game' | 'promo' | 'marketing' | 'facebook-ad';



// Username Setup Modal Component
const UsernameModal: React.FC<{
  isOpen: boolean;
  onSubmit: (username: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}> = ({ isOpen, onSubmit, onClose }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers, and underscores'); return; }
    setLoading(true);
    setError('');
    const result = await onSubmit(username.trim(), displayName.trim() || username.trim());
    if (!result.success) { setError(result.error || 'Failed to set username'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Join the Leaderboard!</h2>
          <p className="text-gray-300">Create your player profile</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter a unique username" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400" maxLength={20} />

          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How others will see you" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400" maxLength={30} />
          </div>
          {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">Maybe Later</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold transition-all disabled:opacity-50">{loading ? 'Creating...' : 'Create Profile'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { state, getCurrentLevel, startLevel, movePlayer, useHint, purchaseWithCoins, addCoins, addLives, addHints, resetProgress, exitLevel, skipLevel, getSkipLevelCost, setUsername, getPlayerStats, getAchievementStats, getDailyChallengeStats, currentNotification, dismissNotification, claimDailyChallengeReward, claimDailyBonus, addPowerUp } = useGameState();


  
  // Jackpot system
  const { 
    jackpotAmount, 
    contributeToJackpot, 
    attemptJackpotWin, 
    simulateGrowth,
    JACKPOT_SPIN_COST,
    JACKPOT_WIN_CHANCE 
  } = useJackpot();

  // VIP system
  const {
    totalPoints: vipPoints,
    lifetimePoints: vipLifetimePoints,
    currentTier: vipTier,
    nextTier: vipNextTier,
    progressToNextTier: vipProgress,
    pointsToNextTier: vipPointsToNextTier,
    vipJackpotPool,
    addGamblingPoints,
    addPurchasePoints,
    getDiscountedCost,
    getOddsBonus,
    canClaimDailyBonus: canClaimVIPDailyBonus,
    claimDailyBonus: claimVIPDailyBonus,
    canClaimVIPBonus,
    claimVIPBonus,
    canEnterMonthlyJackpot,
    attemptVIPJackpot,
    contributeToVIPJackpot,
  } = useVIP();

  // Gambling stats tracking
  const {
    state: gamblingStats,
    recordSession,
    getFilteredStats,
    getChartData,
  } = useGamblingStats();

  const [screen, setScreen] = useState<Screen>('menu');
  const [showStore, setShowStore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showLuckySpin, setShowLuckySpin] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [showTreasureHunt, setShowTreasureHunt] = useState(false);
  const [showJackpotSpin, setShowJackpotSpin] = useState(false);
  const [showVIP, setShowVIP] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [showWeeklyChest, setShowWeeklyChest] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  
  // Gacha state with localStorage persistence
  const [gachaState, setGachaState] = useState<GachaState>(() => {
    const saved = localStorage.getItem('blobby-gacha-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_GACHA_STATE;
      }
    }
    return INITIAL_GACHA_STATE;
  });
  
  // Save gacha state to localStorage
  useEffect(() => {
    localStorage.setItem('blobby-gacha-state', JSON.stringify(gachaState));
  }, [gachaState]);


  const [lastCompletedLevel, setLastCompletedLevel] = useState<number | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [pendingGifts, setPendingGifts] = useState(0);
  const [activeTournament, setActiveTournament] = useState(false);
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [seasonLevel, setSeasonLevel] = useState(1);
  const [seasonIsPremium, setSeasonIsPremium] = useState(false);
  const [guildName, setGuildName] = useState<string | null>(null);
  
  // Cloud sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudUsername, setCloudUsername] = useState<string | null>(null);


  // Simulate jackpot growth periodically
  useEffect(() => {
    const interval = setInterval(() => {
      simulateGrowth();
    }, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [simulateGrowth]);


  const currentLevel = getCurrentLevel();
  const totalStars = state.levels.reduce((acc, l) => acc + l.stars, 0);
  const completedLevels = state.levels.filter(l => l.completed).length;
  const achievementStats = getAchievementStats();
  const dailyChallengeStats = getDailyChallengeStats();

  const fetchSocialStats = useCallback(async () => {
    if (!state.playerId) { setFriendCount(0); setPendingGifts(0); return; }
    try {
      const { count: friendsCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).or(`player_id.eq.${state.playerId},friend_id.eq.${state.playerId}`).eq('status', 'accepted');
      setFriendCount(friendsCount || 0);
      const { count: giftsCount } = await supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('receiver_id', state.playerId).eq('claimed', false);
      setPendingGifts(giftsCount || 0);
    } catch (error) { console.error('Error fetching social stats:', error); }
  }, [state.playerId]);

  const checkActiveTournament = useCallback(async () => {
    try {
      const { data } = await supabase.from('tournaments').select('id').eq('status', 'active').limit(1);
      setActiveTournament(data && data.length > 0);
    } catch (error) { console.error('Error checking tournaments:', error); }
  }, []);

  // Fetch referral count
  const fetchReferralCount = useCallback(async () => {
    if (!state.playerId) { setReferralCount(0); return; }
    try {
      const { count } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', state.playerId);
      setReferralCount(count || 0);
    } catch (error) { console.error('Error fetching referral count:', error); }
  }, [state.playerId]);

  useEffect(() => { fetchSocialStats(); checkActiveTournament(); fetchReferralCount(); }, [fetchSocialStats, checkActiveTournament, fetchReferralCount]);


  useEffect(() => {
    if (!state.isPlaying && currentLevel && screen === 'game') {
      const isGoalReached = state.playerPos.row === currentLevel.goalPos.row && state.playerPos.col === currentLevel.goalPos.col;
      if (isGoalReached) { setLastCompletedLevel(currentLevel.id); setShowLevelComplete(true); }
      else if (state.movesUsed >= currentLevel.moves) { setShowGameOver(true); }
    }
  }, [state.isPlaying, currentLevel, state.playerPos, state.movesUsed, screen]);

  const handlePlay = () => setScreen('levels');
  const handleSelectLevel = (levelId: number) => { startLevel(levelId); setScreen('game'); setShowLevelComplete(false); setShowGameOver(false); };
  const handleNextLevel = () => { if (lastCompletedLevel && lastCompletedLevel < state.levels.length) { handleSelectLevel(lastCompletedLevel + 1); } else { setShowLevelComplete(false); setScreen('levels'); } };
  const handleReplay = () => { if (currentLevel) handleSelectLevel(currentLevel.id); };
  const handleRetry = () => { if (state.lives > 0 && currentLevel) { addLives(-1); handleSelectLevel(currentLevel.id); } };
  const handleExitGame = () => { exitLevel(); setScreen('levels'); setShowLevelComplete(false); setShowGameOver(false); setCurrentTournamentId(null); };
  const handleWatchAd = () => addCoins(25);
  const handleClaimDailyReward = (coins: number, lives: number, hints: number, powerUps?: { teleport?: number; wallbreak?: number; extramoves?: number }) => { 
    if (coins > 0) addCoins(coins); 
    if (lives > 0) addLives(lives); 
    if (hints > 0) addHints(hints); 
    // Handle power-up rewards from milestone days
    if (powerUps) {
      if (powerUps.teleport) addPowerUp('teleport', powerUps.teleport);
      if (powerUps.wallbreak) addPowerUp('wallbreak', powerUps.wallbreak);
      if (powerUps.extramoves) addPowerUp('extramoves', powerUps.extramoves);
    }
  };

  const handleOpenLeaderboard = () => { if (!state.playerId) setShowUsernameModal(true); else setShowLeaderboard(true); };
  const handleSetUsername = async (username: string, displayName: string) => { const result = await setUsername(username, displayName); if (result.success) { setShowUsernameModal(false); setShowLeaderboard(true); } return result; };
  const handleOpenAchievements = () => setShowAchievements(true);
  const handleOpenDailyChallenges = () => setShowDailyChallenges(true);
  const handleOpenSocial = () => { if (!state.playerId) setShowUsernameModal(true); else setShowSocial(true); };
  const handleOpenTournament = () => { if (!state.playerId) setShowUsernameModal(true); else setShowTournament(true); };
  const handleOpenGuild = () => { if (!state.playerId) setShowUsernameModal(true); else setShowGuild(true); };
  const handleOpenLuckySpin = () => setShowLuckySpin(true);
  const handleOpenMysteryBox = () => setShowMysteryBox(true);
  const handleOpenSlotMachine = () => setShowSlotMachine(true);
  const handleOpenScratchCard = () => setShowScratchCard(true);
  const handleOpenCoinFlip = () => setShowCoinFlip(true);
  const handleOpenTreasureHunt = () => setShowTreasureHunt(true);
  const handleOpenJackpotSpin = () => setShowJackpotSpin(true);
  const handleOpenCloudSync = () => setShowCloudSync(true);
  const handleClaimChallengeReward = (challenge: DailyChallenge) => claimDailyChallengeReward(challenge);
  const handleClaimDailyBonus = () => claimDailyBonus();
  
  // Cloud sync handlers
  const handleCloudLogin = async (username: string, cloudData?: any) => {
    setCloudUsername(username);
    if (cloudData) {
      // Apply cloud data to local state - this would need to be implemented in useGameState
      // For now, we just store the username
      setLastSyncedAt(cloudData.lastSyncedAt || new Date().toISOString());
    }
  };
  
  const handleCloudSync = async () => {
    if (!cloudUsername) return;
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloud-sync', {
        body: {
          action: 'save',
          username: cloudUsername,
          gameState: {
            coins: state.coins,
            lives: state.lives,
            hints: state.hints,
            currentLevel: state.currentLevel,
            totalCoinsEarned: state.totalCoinsEarned,
            levels: state.levels,
            achievements: state.achievements,
            powerUpInventory: state.powerUpInventory,
            dailyChallenges: state.dailyChallenges,
            dailyStats: state.dailyStats,
            fastestLevelTime: state.fastestLevelTime,
            displayName: state.displayName,
            avatarColor: state.avatarColor,
          }
        }
      });
      
      if (error) throw error;
      
      setLastSyncedAt(data.lastSyncedAt || new Date().toISOString());
    } catch (err) {
      console.error('Cloud sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Auto-sync on level completion
  useEffect(() => {
    if (cloudUsername && lastCompletedLevel) {
      handleCloudSync();
    }
  }, [lastCompletedLevel, cloudUsername]);


  const handleClaimGift = (gift: Gift) => { switch (gift.gift_type) { case 'coins': addCoins(gift.amount); break; case 'hints': addHints(gift.amount); break; case 'lives': addLives(gift.amount); break; } fetchSocialStats(); };
  const handleClaimGuildGift = (gift: GuildGift) => { switch (gift.gift_type) { case 'coins': addCoins(gift.amount); break; case 'hints': addHints(gift.amount); break; case 'lives': addLives(gift.amount); break; } };
  const handleStartChallenge = (levelId: number) => { setShowSocial(false); handleSelectLevel(levelId); };
  const handleSpendCoins = (amount: number): boolean => {
    if (state.coins >= amount) {
      addCoins(-amount);
      return true;
    }
    return false;
  };
  
  // Jackpot contribution handler
  const handleContributeToJackpot = (lossAmount: number) => {
    contributeToJackpot(lossAmount);
  };
  
  // Jackpot win attempt handler
  const handleAttemptJackpotWin = (playerName: string) => {
    return attemptJackpotWin(playerName);
  };

  // Gambling session recording wrapper
  const recordGamblingSession = useCallback((gameType: GameType, bet: number, winAmount: number, won: boolean) => {
    recordSession(gameType, bet, winAmount, won);
  }, [recordSession]);
  
  const handleEnterTournament = async (tournamentId: string, entryFee: number): Promise<boolean> => {
    if (!state.playerId || state.coins < entryFee) return false;
    try {
      addCoins(-entryFee);
      const { error } = await supabase.from('tournament_entries').insert({ tournament_id: tournamentId, player_id: state.playerId, score: 0, stars_earned: 0 });
      if (error) { addCoins(entryFee); return false; }
      return true;
    } catch (error) { addCoins(entryFee); return false; }
  };
  const handlePlayTournament = (levelId: number, tournamentId: string) => { setCurrentTournamentId(tournamentId); setShowTournament(false); handleSelectLevel(levelId); };

  // Show Facebook Ad page
  if (screen === 'facebook-ad') {
    return <FacebookAdPage onBack={() => setScreen('menu')} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" style={{ backgroundImage: `url(${GAME_IMAGES.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="min-h-screen bg-gradient-to-b from-purple-900/90 via-gray-900/95 to-blue-900/90">
        <AchievementNotification achievement={currentNotification} onDismiss={dismissNotification} />
        <DailyReward onClaimReward={handleClaimDailyReward} />

        {screen !== 'menu' && screen !== 'facebook-ad' && <GameHeader coins={state.coins} lives={state.lives} hints={state.hints} onOpenStore={() => setShowStore(true)} onOpenSettings={() => setShowSettings(true)} />}
        {screen !== 'menu' && screen !== 'facebook-ad' && <AdBanner position="top" onWatchAd={handleWatchAd} />}

        <main className="flex-1">
          {screen === 'menu' && (
            <>
              <MainMenu 
                onPlay={handlePlay} 
                onStore={() => setShowStore(true)} 
                onLeaderboard={handleOpenLeaderboard} 
                onAchievements={handleOpenAchievements} 
                onDailyChallenges={handleOpenDailyChallenges} 
                onSocial={handleOpenSocial} 
                onTournament={handleOpenTournament} 
                onSeasonPass={() => setShowSeasonPass(true)} 
                onGuild={handleOpenGuild} 
                onLuckySpin={handleOpenLuckySpin}
                onMysteryBox={handleOpenMysteryBox}
                onSlotMachine={handleOpenSlotMachine}
                onScratchCard={handleOpenScratchCard}
                onCoinFlip={handleOpenCoinFlip}
                onTreasureHunt={handleOpenTreasureHunt}
                onJackpotSpin={handleOpenJackpotSpin}
                onVIP={() => setShowVIP(true)}
                onSettings={() => setShowSettings(true)}
                onPowerUpShop={() => {}}
                onReferral={() => {
                  if (!state.playerId) setShowUsernameModal(true);
                  else setShowReferral(true);
                }}
                onGacha={() => setShowGacha(true)}
                onSignIn={() => setShowUsernameModal(true)}
                onSignOut={() => {
                  localStorage.removeItem('blobby-player-id');
                  localStorage.removeItem('blobby-username');
                  window.location.reload();
                }}
                totalStars={totalStars} 
                completedLevels={completedLevels} 
                totalLevels={state.levels.length} 
                username={state.username || null} 
                displayName={state.displayName || null} 
                avatarColor={state.avatarColor || '#8B5CF6'} 
                achievementCount={achievementStats} 
                dailyChallengeStats={dailyChallengeStats} 
                friendCount={friendCount} 
                pendingGifts={pendingGifts} 
                activeTournament={activeTournament} 
                seasonLevel={seasonLevel} 
                seasonIsPremium={seasonIsPremium} 
                guildName={guildName}
                jackpotAmount={jackpotAmount}
                vipTier={vipTier}
                vipProgress={vipProgress}
                vipPoints={vipLifetimePoints}
                referralCount={referralCount}
                gems={gachaState.gems}
              />




              {/* Stats Button */}
              <div className="max-w-lg mx-auto px-4 pb-2">
                <button
                  onClick={() => setShowStats(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-500/30 text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Statistics
                  {gamblingStats.overall.totalGames > 0 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      gamblingStats.overall.netProfit >= 0 ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
                    }`}>
                      {gamblingStats.overall.netProfit >= 0 ? '+' : ''}{gamblingStats.overall.netProfit}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Cloud Sync Button */}
              <div className="max-w-lg mx-auto px-4 pb-2">
                <button
                  onClick={handleOpenCloudSync}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/30 text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  {cloudUsername ? 'Cloud Sync' : 'Enable Cloud Save'}
                  {cloudUsername && lastSyncedAt && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/30 text-green-400">
                      Synced
                    </span>
                  )}
                </button>
              </div>
              
              {/* Referral Button */}

              <div className="max-w-lg mx-auto px-4 pb-2">
                <button
                  onClick={() => {
                    if (!state.playerId) setShowUsernameModal(true);
                    else setShowReferral(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-600/30 to-emerald-600/30 hover:from-green-600/40 hover:to-emerald-600/40 border border-green-500/30 text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Invite Friends & Earn
                  {referralCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/30 text-green-400">
                      {referralCount} referrals
                    </span>
                  )}
                </button>
              </div>
              
              {/* Weekly Chest Button */}
              <div className="max-w-lg mx-auto px-4 pb-2">
                <button
                  onClick={() => setShowWeeklyChest(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-600/40 hover:to-yellow-600/40 border border-amber-500/30 text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 4h14a2 2 0 012 2v2H3V6a2 2 0 012-2zm-2 6h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm8 2v2h2v-2h-2zm0 4v2h2v-2h-2z" />
                  </svg>
                  Weekly Bonus Chest
                  {new Date().getDay() === 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/30 text-green-400 animate-pulse">
                      AVAILABLE!
                    </span>
                  )}
                </button>
              </div>

              
              {/* Facebook Ad Button */}
              <div className="max-w-lg mx-auto px-4 py-2">
                <button
                  onClick={() => setScreen('facebook-ad')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  View Facebook Ad Creative
                </button>
              </div>
              
              <PromoSection />

            </>
          )}


          {screen === 'levels' && <LevelSelect levels={state.levels} onSelectLevel={handleSelectLevel} onClose={() => setScreen('menu')} />}
          {screen === 'game' && currentLevel && (
            <div className="py-8 px-4">
              {currentTournamentId && (
                <div className="max-w-md mx-auto mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 flex items-center gap-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  <div className="flex-1"><div className="text-sm font-semibold text-yellow-300">Tournament Mode</div><div className="text-xs text-gray-400">Your best score will be submitted!</div></div>
                </div>
              )}
              <GameGrid 
                level={currentLevel} 
                playerPos={state.playerPos} 
                movesUsed={state.movesUsed} 
                showHint={state.showHint} 
                onMove={movePlayer} 
                onUseHint={useHint} 
                onExit={handleExitGame} 
                hints={state.hints}
                coins={state.coins}
                onSkipLevel={skipLevel}
                skipLevelCost={getSkipLevelCost()}
              />
            </div>
          )}


        </main>



        <StoreModal isOpen={showStore} onClose={() => setShowStore(false)} coins={state.coins} onPurchaseWithCoins={purchaseWithCoins} onPurchaseCoins={addCoins} onAddVIPPoints={addPurchasePoints} vipPointsMultiplier={vipTier.pointsMultiplier} vipTierName={vipTier.name} />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onResetProgress={resetProgress} />
        <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} currentPlayerId={state.playerId || null} playerStats={getPlayerStats()} />
        <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} achievementProgress={state.achievements} />
        <DailyChallengesModal isOpen={showDailyChallenges} onClose={() => setShowDailyChallenges(false)} dailyChallenges={state.dailyChallenges} onClaimReward={handleClaimChallengeReward} onClaimBonus={handleClaimDailyBonus} />
        <SocialModal isOpen={showSocial} onClose={() => { setShowSocial(false); fetchSocialStats(); }} playerId={state.playerId || null} username={state.username || null} displayName={state.displayName || null} avatarColor={state.avatarColor || '#8B5CF6'} achievements={state.achievements} playerStats={getPlayerStats()} onClaimGift={handleClaimGift} onStartChallenge={handleStartChallenge} />
        <TournamentModal isOpen={showTournament} onClose={() => setShowTournament(false)} playerId={state.playerId || null} playerCoins={state.coins} onEnterTournament={handleEnterTournament} onPlayTournament={handlePlayTournament} />
        <SeasonPassModal 
          isOpen={showSeasonPass} 
          onClose={() => setShowSeasonPass(false)} 
          playerId={state.playerId || null} 
          onClaimReward={(reward) => {
            switch (reward.type) {
              case 'coins': addCoins(reward.amount); break;
              case 'hints': addHints(reward.amount); break;
              case 'lives': addLives(reward.amount); break;
            }
          }}
          onPremiumPurchased={() => {
            setSeasonIsPremium(true);
          }}
        />

        <GuildModal isOpen={showGuild} onClose={() => setShowGuild(false)} playerId={state.playerId || null} playerCoins={state.coins} playerStars={totalStars} onClaimGift={handleClaimGuildGift} />
        
        {/* Gambling Modals with Jackpot Integration and Stats Tracking */}
        <LuckySpinModal 
          isOpen={showLuckySpin} 
          onClose={() => setShowLuckySpin(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onAddHints={addHints} 
          onAddLives={addLives} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('lucky_spin', bet, winAmount, won)}
        />
        <MysteryBoxModal 
          isOpen={showMysteryBox} 
          onClose={() => setShowMysteryBox(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onAddHints={addHints} 
          onAddLives={addLives} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('mystery_box', bet, winAmount, won)}
        />
        <SlotMachineModal 
          isOpen={showSlotMachine} 
          onClose={() => setShowSlotMachine(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onAddHints={addHints} 
          onAddLives={addLives} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onAddVIPPoints={addGamblingPoints}
          vipOddsBonus={vipTier.oddsBonus}
          vipSpinDiscount={vipTier.spinDiscount}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('slot_machine', bet, winAmount, won)}
        />
        <ScratchCardModal 
          isOpen={showScratchCard} 
          onClose={() => setShowScratchCard(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onAddHints={addHints} 
          onAddLives={addLives} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('scratch_card', bet, winAmount, won)}
        />
        <CoinFlipModal 
          isOpen={showCoinFlip} 
          onClose={() => setShowCoinFlip(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('coin_flip', bet, winAmount, won)}
        />
        <TreasureHuntModal 
          isOpen={showTreasureHunt} 
          onClose={() => setShowTreasureHunt(false)} 
          coins={state.coins} 
          onAddCoins={addCoins} 
          onAddHints={addHints} 
          onAddLives={addLives} 
          onSpendCoins={handleSpendCoins}
          onContributeToJackpot={handleContributeToJackpot}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('treasure_hunt', bet, winAmount, won)}
        />
        
        {/* Jackpot Spin Modal */}
        <JackpotSpinModal
          isOpen={showJackpotSpin}
          onClose={() => setShowJackpotSpin(false)}
          coins={state.coins}
          jackpotAmount={jackpotAmount}
          spinCost={JACKPOT_SPIN_COST}
          winChance={JACKPOT_WIN_CHANCE}
          onSpendCoins={handleSpendCoins}
          onAttemptWin={handleAttemptJackpotWin}
          onAddCoins={addCoins}
          playerName={state.displayName || state.username || 'Anonymous'}
          onRecordSession={(bet, winAmount, won) => recordGamblingSession('jackpot', bet, winAmount, won)}
        />
        
        {/* VIP Modal */}
        <VIPModal
          isOpen={showVIP}
          onClose={() => setShowVIP(false)}
          currentTier={vipTier}
          nextTier={vipNextTier}
          totalPoints={vipPoints}
          lifetimePoints={vipLifetimePoints}
          progressToNextTier={vipProgress}
          pointsToNextTier={vipPointsToNextTier}
          vipJackpotPool={vipJackpotPool}
          canClaimDailyBonus={canClaimVIPDailyBonus}
          canClaimVIPBonus={canClaimVIPBonus}
          canEnterMonthlyJackpot={canEnterMonthlyJackpot}
          onClaimDailyBonus={() => {
            const bonus = claimVIPDailyBonus();
            if (bonus > 0) addCoins(bonus);
          }}
          onClaimVIPBonus={() => {
            const bonus = claimVIPBonus();
            if (bonus > 0) addCoins(bonus);
          }}
          onAttemptVIPJackpot={() => {
            const result = attemptVIPJackpot();
            if (result.won) {
              addCoins(result.amount);
            }
          }}
          onOpenVIPMysteryBox={() => {
            // VIP Mystery box gives better rewards
            setShowVIP(false);
            setShowMysteryBox(true);
          }}
        />

        {/* Stats Modal */}
        <StatsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          overall={gamblingStats.overall}
          byGame={gamblingStats.byGame}
          favoriteGame={gamblingStats.favoriteGame}
          getChartData={getChartData}
          getFilteredStats={getFilteredStats}
        />
        
        {/* Cloud Sync Modal */}
        <CloudSyncModal
          isOpen={showCloudSync}
          onClose={() => setShowCloudSync(false)}
          currentUsername={cloudUsername}
          onLogin={handleCloudLogin}
          onSync={handleCloudSync}
          lastSyncedAt={lastSyncedAt}
          isSyncing={isSyncing}
          gameState={state}
        />
        
        {/* Weekly Chest Modal */}
        <WeeklyChestModal
          isOpen={showWeeklyChest}
          onClose={() => setShowWeeklyChest(false)}
          onClaimReward={handleClaimDailyReward}
        />
        
        {/* Referral Modal */}
        <ReferralModal
          isOpen={showReferral}
          onClose={() => setShowReferral(false)}
          playerId={state.playerId || null}
          username={state.username || null}
          displayName={state.displayName || null}
          avatarColor={state.avatarColor || '#8B5CF6'}
          onRewardClaimed={(coins, powerUps) => {
            if (coins > 0) addCoins(coins);
            if (powerUps) {
              if (powerUps.teleport) addPowerUp('teleport', powerUps.teleport);
              if (powerUps.wallbreak) addPowerUp('wallbreak', powerUps.wallbreak);
              if (powerUps.extramoves) addPowerUp('extramoves', powerUps.extramoves);
            }
          }}
        />
        
        {/* Gacha Modal */}
        <GachaModal
          isOpen={showGacha}
          onClose={() => setShowGacha(false)}
          gachaState={gachaState}
          onUpdateGachaState={setGachaState}
          onPurchaseGems={(packageId) => {
            // Handle gem purchase - in real app this would go through payment
            console.log('Purchase gems:', packageId);
          }}
        />
        
        <UsernameModal isOpen={showUsernameModal} onSubmit={handleSetUsername} onClose={() => setShowUsernameModal(false)} />




        
        {showLevelComplete && currentLevel && <LevelComplete level={currentLevel} movesUsed={state.movesUsed} coinsEarned={25} onNextLevel={handleNextLevel} onReplay={handleReplay} onLevelSelect={handleExitGame} />}

        {showGameOver && currentLevel && (
          <GameOver 
            level={currentLevel} 
            lives={state.lives} 
            coins={state.coins} 
            onRetry={handleRetry} 
            onBuyLives={() => { setShowGameOver(false); setShowStore(true); }} 
            onLevelSelect={handleExitGame}
            onSkipLevel={skipLevel}
            skipLevelCost={getSkipLevelCost()}
          />
        )}



        {screen === 'menu' && (
          <footer className="bg-gray-900 border-t border-white/10 py-12 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={GAME_IMAGES.character} alt="Blobby" className="w-10 h-10 rounded-full" />
                <span className="text-xl font-bold text-purple-300">BLOBBY</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">The most addictive puzzle game of 2024. Guide Blobby through challenging levels!</p>
              <p className="text-gray-500 text-sm">© 2024 Blobby Games. All rights reserved.</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
