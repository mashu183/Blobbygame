import React, { useState, useEffect } from 'react';
import { DailyChallenge, DailyChallengesState, DAILY_BONUS_REWARD, getTodayDateString } from '../../types/game';

interface DailyChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyChallenges: DailyChallengesState;
  onClaimReward: (challenge: DailyChallenge) => void;
  onClaimBonus: () => void;
}

const DailyChallengesModal: React.FC<DailyChallengesModalProps> = ({
  isOpen,
  onClose,
  dailyChallenges,
  onClaimReward,
  onClaimBonus,
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Calculate time until midnight reset
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const completedCount = dailyChallenges.challenges.filter(c => c.completed).length;
  const allCompleted = completedCount === dailyChallenges.challenges.length;
  const canClaimBonus = allCompleted && !dailyChallenges.bonusClaimed;

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'complete_levels':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'collect_coins':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">$</text>
          </svg>
        );
      case 'get_stars':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'perfect_level':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'use_hints':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
          </svg>
        );
      case 'fast_complete':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getProgressColor = (progress: number, requirement: number) => {
    const percent = (progress / requirement) * 100;
    if (percent >= 100) return 'from-green-500 to-emerald-500';
    if (percent >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600/30 via-yellow-600/30 to-orange-600/30 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Challenges</h2>
                <p className="text-orange-200 text-sm">Complete all for bonus rewards!</p>
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

          {/* Timer and Streak */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-mono font-bold">{timeUntilReset}</span>
              <span className="text-gray-400 text-sm">until reset</span>
            </div>
            
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-yellow-300 font-bold">{dailyChallenges.streak}</span>
              <span className="text-gray-400 text-sm">day streak</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-3 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Daily Progress</span>
            <span className="text-sm font-bold text-white">{completedCount}/{dailyChallenges.challenges.length}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${(completedCount / dailyChallenges.challenges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dailyChallenges.challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`rounded-xl border transition-all ${
                challenge.completed
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    challenge.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400'
                  }`}>
                    {challenge.completed ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    ) : (
                      getChallengeIcon(challenge.type)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${challenge.completed ? 'text-green-300' : 'text-white'}`}>
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">{challenge.description}</p>
                    
                    {/* Progress */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className={challenge.completed ? 'text-green-400' : 'text-white'}>
                          {Math.min(challenge.progress, challenge.requirement)}/{challenge.requirement}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getProgressColor(challenge.progress, challenge.requirement)} transition-all duration-300`}
                          style={{ width: `${Math.min((challenge.progress / challenge.requirement) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <span className="text-sm font-bold">+{challenge.reward.coins}</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      {challenge.reward.hints && (
                        <div className="flex items-center gap-1 text-blue-400 text-xs">
                          <span>+{challenge.reward.hints}</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                          </svg>
                        </div>
                      )}
                      {challenge.reward.lives && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                          <span>+{challenge.reward.lives}</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bonus Section */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-yellow-900/20 via-orange-900/20 to-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                canClaimBonus
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse'
                  : dailyChallenges.bonusClaimed
                    ? 'bg-green-500/20'
                    : 'bg-gray-700'
              }`}>
                <svg className={`w-6 h-6 ${canClaimBonus ? 'text-white' : dailyChallenges.bonusClaimed ? 'text-green-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-bold ${canClaimBonus ? 'text-yellow-300' : dailyChallenges.bonusClaimed ? 'text-green-300' : 'text-gray-400'}`}>
                  {dailyChallenges.bonusClaimed ? 'Bonus Claimed!' : 'Daily Bonus'}
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-yellow-400">+{DAILY_BONUS_REWARD.coins} coins</span>
                  <span className="text-red-400">+{DAILY_BONUS_REWARD.lives} lives</span>
                  <span className="text-blue-400">+{DAILY_BONUS_REWARD.hints} hints</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClaimBonus}
              disabled={!canClaimBonus}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                canClaimBonus
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-lg shadow-orange-500/30 hover:scale-105'
                  : dailyChallenges.bonusClaimed
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {dailyChallenges.bonusClaimed ? 'Claimed' : canClaimBonus ? 'Claim!' : `${completedCount}/3`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengesModal;
