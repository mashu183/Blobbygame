// Game Types and Constants for BLOBBY

export type TileType = 'empty' | 'path' | 'obstacle' | 'start' | 'goal' | 'coin' | 'hint' | 'life' | 'powerup_teleport' | 'powerup_wallbreak' | 'powerup_extramoves' | 'hurdle';


export type PowerUpType = 'teleport' | 'wallbreak' | 'extramoves';

export interface PowerUpInventory {
  teleport: number;
  wallbreak: number;
  extramoves: number;
}

export interface Tile {
  type: TileType;
  color: string;
  collected?: boolean;
}


export interface Position {
  row: number;
  col: number;
}

export interface Level {
  id: number;
  name: string;
  grid: Tile[][];
  startPos: Position;
  goalPos: Position;
  moves: number;
  stars: number; // 1-3 stars based on performance
  unlocked: boolean;
  completed: boolean;
}

export interface GameState {
  coins: number;
  lives: number;
  hints: number;
  currentLevel: number;
  levels: Level[];
  playerPos: Position;
  movesUsed: number;
  isPlaying: boolean;
  showHint: boolean;
  playerId?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarColor?: string;
  levelStartTime?: number | null;
  fastestLevelTime?: number | null;
}


export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'coins' | 'lives' | 'hints';
  amount: number;
  icon: string;
  popular?: boolean;
  limitedTime?: boolean;
  discount?: number;
}

// MONETIZATION CONSTANTS - Designed for maximum revenue while keeping players engaged
export const MONETIZATION = {
  // Lives System
  MAX_LIVES: 5,
  LIFE_REGEN_MINUTES: 30, // 1 life every 30 minutes
  LIFE_COST_COINS: 75, // Cost to buy 1 life with coins
  
  // Continue System (escalating costs)
  CONTINUE_COSTS: [25, 50, 100, 200, 400],
  CONTINUE_MOVES: [3, 3, 5, 5, 7],
  MAX_CONTINUES: 5,
  
  // Skip Level
  SKIP_LEVEL_COST: 50,
  
  // Hint System
  HINT_COST_COINS: 50,
  HINT_DURATION_MS: 4000,
  
  // Rewards (intentionally low to encourage spending)
  COIN_PICKUP_VALUE: 3,
  LEVEL_COMPLETE_BASE: 10,
  LEVEL_COMPLETE_PER_STAR: 5,
  
  // Ad Rewards
  AD_REWARD_COINS: 15,
  AD_REWARD_MOVES: 3,
  AD_REWARD_LIVES: 1,
  AD_COOLDOWN_MINUTES: 5,
  
  // Low Resource Thresholds (trigger purchase prompts)
  LOW_COINS_THRESHOLD: 30,
  LOW_LIVES_THRESHOLD: 1,
  LOW_HINTS_THRESHOLD: 0,
  
  // Flash Sale Settings
  FLASH_SALE_CHANCE: 0.2, // 20% chance to show on menu open
  FLASH_SALE_DURATION_MINUTES: 30,
  FLASH_SALE_DISCOUNT: 0.5, // 50% off
};

export const STORE_ITEMS: StoreItem[] = [
  // Coin Packs (Real Money)
  { id: 'coins-100', name: '100 Coins', description: 'A small pouch of coins', price: 0.99, type: 'coins', amount: 100, icon: 'coins' },
  { id: 'coins-500', name: '500 Coins', description: 'A bag of coins', price: 3.99, type: 'coins', amount: 500, icon: 'coins', popular: true },
  { id: 'coins-1000', name: '1000 Coins', description: 'A chest of coins', price: 6.99, type: 'coins', amount: 1000, icon: 'coins' },
  { id: 'coins-5000', name: '5000 Coins', description: 'A treasure trove!', price: 24.99, type: 'coins', amount: 5000, icon: 'coins' },
  
  // Lives (Coin Purchase) - Expensive to encourage real money
  { id: 'lives-5', name: '5 Lives', description: 'Keep playing!', price: 100, type: 'lives', amount: 5, icon: 'heart' },
  { id: 'lives-10', name: '10 Lives', description: 'Never stop!', price: 175, type: 'lives', amount: 10, icon: 'heart', popular: true },
  { id: 'lives-25', name: '25 Lives', description: 'Marathon mode!', price: 400, type: 'lives', amount: 25, icon: 'heart' },
  
  // Hints (Coin Purchase) - Also expensive
  { id: 'hints-3', name: '3 Hints', description: 'Get unstuck', price: 75, type: 'hints', amount: 3, icon: 'hint' },
  { id: 'hints-10', name: '10 Hints', description: 'Master helper', price: 200, type: 'hints', amount: 10, icon: 'hint', popular: true },
  { id: 'hints-25', name: '25 Hints', description: 'Puzzle master!', price: 450, type: 'hints', amount: 25, icon: 'hint' },
];

// Special Bundle Offers (shown during limited time)
export const BUNDLE_OFFERS = [
  {
    id: 'starter-bundle',
    name: 'Starter Bundle',
    description: 'Perfect for new players!',
    originalPrice: 500,
    salePrice: 199,
    coins: 500,
    lives: 10,
    hints: 5,
    discount: 60,
  },
  {
    id: 'mega-bundle',
    name: 'MEGA Bundle',
    description: 'Best value ever!',
    originalPrice: 1500,
    salePrice: 499,
    coins: 1500,
    lives: 25,
    hints: 15,
    discount: 67,
  },
  {
    id: 'survival-kit',
    name: 'Survival Kit',
    description: 'Never run out of lives!',
    originalPrice: 600,
    salePrice: 249,
    coins: 300,
    lives: 30,
    hints: 10,
    discount: 58,
  },
];

export const TILE_COLORS = {
  path: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
  obstacle: '#1F2937',
  start: '#22C55E',
  goal: '#FBBF24',
  empty: '#111827',
};


export const POWER_UP_COLORS = {
  teleport: '#06B6D4',    // Cyan
  wallbreak: '#EF4444',   // Red
  extramoves: '#22C55E',  // Green
};

export const POWER_UP_INFO = {
  teleport: {
    name: 'Teleport',
    description: 'Jump to any empty tile',
    icon: 'zap',
    color: '#06B6D4',
  },
  wallbreak: {
    name: 'Wall Break',
    description: 'Destroy one obstacle',
    icon: 'hammer',
    color: '#EF4444',
  },
  extramoves: {
    name: 'Extra Moves',
    description: '+3 moves',
    icon: 'plus-circle',
    color: '#22C55E',
  },
};

export const INITIAL_POWER_UP_INVENTORY: PowerUpInventory = {
  teleport: 0,
  wallbreak: 0,
  extramoves: 0,
};


export const GAME_IMAGES = {
  character: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981444429_8c0d25e5.jpg',
  background: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981464007_c09372fa.jpg',
  coin: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981480565_f88cde6d.jpg',
  heart: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981508356_d8a35b22.jpg',
  hint: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981526106_3547d90e.jpg',
  screenshot: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981545645_29d1cef5.jpg',
  promo: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765981567612_6e088814.jpg',
};

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'progress' | 'skill' | 'collection';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementProgress {
  id: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete Level 1',
    icon: 'footprints',
    requirement: 1,
    category: 'progress',
    rarity: 'common',
  },
  {
    id: 'star_collector',
    name: 'Star Collector',
    description: 'Earn 50 stars total',
    icon: 'stars',
    requirement: 50,
    category: 'collection',
    rarity: 'rare',
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Complete a level in under 10 seconds',
    icon: 'zap',
    requirement: 10,
    category: 'skill',
    rarity: 'epic',
  },
  {
    id: 'coin_master',
    name: 'Coin Master',
    description: 'Collect 1000 coins total',
    icon: 'coins',
    requirement: 1000,
    category: 'collection',
    rarity: 'rare',
  },
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Get 3 stars on any level',
    icon: 'trophy',
    requirement: 3,
    category: 'skill',
    rarity: 'common',
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Complete 25 levels',
    icon: 'medal',
    requirement: 25,
    category: 'progress',
    rarity: 'epic',
  },
  {
    id: 'dedicated',
    name: 'Dedicated Player',
    description: 'Complete 10 levels',
    icon: 'target',
    requirement: 10,
    category: 'progress',
    rarity: 'common',
  },
  {
    id: 'star_hunter',
    name: 'Star Hunter',
    description: 'Earn 100 stars total',
    icon: 'sparkles',
    requirement: 100,
    category: 'collection',
    rarity: 'epic',
  },
  {
    id: 'wealthy',
    name: 'Wealthy Blobby',
    description: 'Accumulate 5000 coins',
    icon: 'gem',
    requirement: 5000,
    category: 'collection',
    rarity: 'legendary',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all 50 levels',
    icon: 'crown',
    requirement: 50,
    category: 'progress',
    rarity: 'legendary',
  },
];


export const INITIAL_ACHIEVEMENT_PROGRESS: AchievementProgress[] = ACHIEVEMENTS.map(a => ({
  id: a.id,
  unlocked: false,
  unlockedAt: null,
  progress: 0,
}));

// Daily Challenge Types
export type DailyChallengeType = 'complete_levels' | 'collect_coins' | 'get_stars' | 'perfect_level' | 'use_hints' | 'fast_complete';

export interface DailyChallenge {
  id: string;
  type: DailyChallengeType;
  title: string;
  description: string;
  requirement: number;
  progress: number;
  completed: boolean;
  reward: {
    coins: number;
    hints?: number;
    lives?: number;
  };
}

export interface DailyChallengesState {
  challenges: DailyChallenge[];
  lastResetDate: string; // ISO date string (YYYY-MM-DD)
  streak: number;
  lastStreakDate: string | null; // ISO date string
  allCompletedToday: boolean;
  bonusClaimed: boolean;
}

// Challenge templates for generating daily challenges
// Challenge templates for generating daily challenges - rewards reduced to make coins scarcer
export const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id' | 'progress' | 'completed'>[] = [
  {
    type: 'complete_levels',
    title: 'Level Crusher',
    description: 'Complete 3 levels today',
    requirement: 3,
    reward: { coins: 25 }, // Reduced from 50
  },
  {
    type: 'complete_levels',
    title: 'Marathon Runner',
    description: 'Complete 5 levels today',
    requirement: 5,
    reward: { coins: 50, lives: 1 }, // Reduced from 100
  },
  {
    type: 'collect_coins',
    title: 'Coin Collector',
    description: 'Collect 50 coins', // Reduced requirement from 100
    requirement: 50,
    reward: { coins: 15, hints: 1 }, // Reduced from 30
  },
  {
    type: 'collect_coins',
    title: 'Treasure Hunter',
    description: 'Collect 100 coins', // Reduced from 200
    requirement: 100,
    reward: { coins: 35 }, // Reduced from 75
  },
  {
    type: 'get_stars',
    title: 'Star Seeker',
    description: 'Earn 5 stars today',
    requirement: 5,
    reward: { coins: 20 }, // Reduced from 40
  },
  {
    type: 'get_stars',
    title: 'Stellar Performance',
    description: 'Earn 10 stars today',
    requirement: 10,
    reward: { coins: 40, hints: 1 }, // Reduced from 80
  },
  {
    type: 'perfect_level',
    title: 'Perfectionist',
    description: 'Get 3 stars on any level',
    requirement: 1,
    reward: { coins: 30 }, // Reduced from 60
  },
  {
    type: 'perfect_level',
    title: 'Triple Threat',
    description: 'Get 3 stars on 2 different levels',
    requirement: 2,
    reward: { coins: 50, lives: 1 }, // Reduced from 100
  },
  {
    type: 'use_hints',
    title: 'Hint Master',
    description: 'Use 2 hints today',
    requirement: 2,
    reward: { coins: 15, hints: 1 }, // Reduced from 25 coins, 2 hints
  },
  {
    type: 'fast_complete',
    title: 'Speed Demon',
    description: 'Complete a level in under 15 seconds',
    requirement: 1,
    reward: { coins: 35 }, // Reduced from 75
  },
  {
    type: 'fast_complete',
    title: 'Lightning Fast',
    description: 'Complete 2 levels in under 20 seconds each',
    requirement: 2,
    reward: { coins: 60, hints: 1 }, // Reduced from 120
  },
];


// Bonus reward for completing all daily challenges - reduced to make coins scarcer
export const DAILY_BONUS_REWARD = {
  coins: 75, // Reduced from 150
  lives: 1, // Reduced from 2
  hints: 1, // Reduced from 2
};


// Helper function to get today's date string
export const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Helper function to generate daily challenges (seeded by date for consistency)
export const generateDailyChallenges = (dateString: string): DailyChallenge[] => {
  // Use date string as seed for pseudo-random selection
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // Shuffle templates based on seed
  const shuffled = [...CHALLENGE_TEMPLATES].sort((a, b) => {
    const hashA = (seed * a.requirement) % 100;
    const hashB = (seed * b.requirement) % 100;
    return hashA - hashB;
  });
  
  // Select 3 challenges with different types
  const selected: DailyChallenge[] = [];
  const usedTypes = new Set<DailyChallengeType>();
  
  for (const template of shuffled) {
    if (selected.length >= 3) break;
    if (!usedTypes.has(template.type)) {
      usedTypes.add(template.type);
      selected.push({
        ...template,
        id: `${dateString}-${template.type}-${template.requirement}`,
        progress: 0,
        completed: false,
      });
    }
  }
  
  // If we don't have 3 yet, add more (allowing duplicate types)
  for (const template of shuffled) {
    if (selected.length >= 3) break;
    const id = `${dateString}-${template.type}-${template.requirement}-${selected.length}`;
    if (!selected.find(c => c.id === id)) {
      selected.push({
        ...template,
        id,
        progress: 0,
        completed: false,
      });
    }
  }
  return selected;
};

export const INITIAL_DAILY_CHALLENGES_STATE: DailyChallengesState = {

  challenges: generateDailyChallenges(getTodayDateString()),
  lastResetDate: getTodayDateString(),
  streak: 0,
  lastStreakDate: null,
  allCompletedToday: false,
  bonusClaimed: false,
};

// Social Features Types
export interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  total_stars: number;
  levels_completed: number;
  status: 'pending' | 'accepted' | 'blocked';
  is_sender: boolean; // true if current player sent the request
}

export interface Gift {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_color: string;
  gift_type: 'coins' | 'hints' | 'lives';
  amount: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenger_name: string;
  challenger_avatar_color: string;
  challenged_id: string;
  challenged_name: string;
  level_id: number;
  challenger_score: number;
  challenged_score: number | null;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
}

export const GIFT_OPTIONS = [
  { type: 'coins' as const, amount: 25, cost: 0, label: '25 Coins', icon: 'coins' },
  { type: 'coins' as const, amount: 50, cost: 0, label: '50 Coins', icon: 'coins' },
  { type: 'hints' as const, amount: 1, cost: 0, label: '1 Hint', icon: 'lightbulb' },
  { type: 'lives' as const, amount: 1, cost: 0, label: '1 Life', icon: 'heart' },
];
export const DAILY_GIFT_LIMIT = 5; // Max gifts per day

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  featured_level: number;
  entry_fee: number;
  prize_pool: number;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  player_id: string;
  score: number;
  moves_used: number | null;
  completion_time: number | null;
  stars_earned: number;
  submitted_at: string | null;
  created_at: string;
  // Joined player data
  player?: {
    username: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface TournamentWinner {
  id: string;
  tournament_id: string;
  player_id: string;
  rank: number;
  prize_amount: number;
  score: number;
  created_at: string;
  // Joined player data
  player?: {
    username: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface TournamentWithEntries extends Tournament {
  entries: TournamentEntry[];
  winners?: TournamentWinner[];
  player_entry?: TournamentEntry | null;
  participant_count: number;
}

// Prize distribution for top 3
export const TOURNAMENT_PRIZE_DISTRIBUTION = {
  1: 0.5,  // 50% of prize pool
  2: 0.3,  // 30% of prize pool
  3: 0.2,  // 20% of prize pool
};


// Season Pass Types
export interface Season {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  premium_price_cents: number;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

export interface SeasonProgress {
  id: string;
  player_id: string;
  season_id: string;
  xp: number;
  level: number;
  is_premium: boolean;
  premium_purchased_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeasonRewardClaimed {
  id: string;
  player_id: string;
  season_id: string;
  reward_level: number;
  is_premium_reward: boolean;
  claimed_at: string;
}

export type SeasonRewardType = 'coins' | 'hints' | 'lives' | 'avatar_color';

export interface SeasonReward {
  level: number;
  free: {
    type: SeasonRewardType;
    amount: number;
    color?: string; // For avatar colors
    label: string;
  };
  premium: {
    type: SeasonRewardType;
    amount: number;
    color?: string;
    label: string;
  };
}

// XP rewards for different actions
export const SEASON_XP_REWARDS = {
  level_complete: 20,
  level_3_stars: 30,
  tournament_play: 50,
  daily_challenge: 15,
  daily_bonus: 25,
};

// Season pass rewards for each level (30 levels)
export const SEASON_REWARDS: SeasonReward[] = [
  { level: 1, free: { type: 'coins', amount: 50, label: '50 Coins' }, premium: { type: 'coins', amount: 100, label: '100 Coins' } },
  { level: 2, free: { type: 'hints', amount: 1, label: '1 Hint' }, premium: { type: 'hints', amount: 3, label: '3 Hints' } },
  { level: 3, free: { type: 'coins', amount: 75, label: '75 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#FF6B6B', label: 'Coral Red' } },
  { level: 4, free: { type: 'lives', amount: 2, label: '2 Lives' }, premium: { type: 'lives', amount: 5, label: '5 Lives' } },
  { level: 5, free: { type: 'coins', amount: 100, label: '100 Coins' }, premium: { type: 'coins', amount: 250, label: '250 Coins' } },
  { level: 6, free: { type: 'hints', amount: 2, label: '2 Hints' }, premium: { type: 'avatar_color', amount: 1, color: '#4ECDC4', label: 'Teal Wave' } },
  { level: 7, free: { type: 'coins', amount: 100, label: '100 Coins' }, premium: { type: 'hints', amount: 5, label: '5 Hints' } },
  { level: 8, free: { type: 'lives', amount: 2, label: '2 Lives' }, premium: { type: 'coins', amount: 300, label: '300 Coins' } },
  { level: 9, free: { type: 'coins', amount: 125, label: '125 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#9B59B6', label: 'Royal Purple' } },
  { level: 10, free: { type: 'hints', amount: 3, label: '3 Hints' }, premium: { type: 'coins', amount: 500, label: '500 Coins' } },
  { level: 11, free: { type: 'coins', amount: 150, label: '150 Coins' }, premium: { type: 'lives', amount: 10, label: '10 Lives' } },
  { level: 12, free: { type: 'lives', amount: 3, label: '3 Lives' }, premium: { type: 'avatar_color', amount: 1, color: '#F39C12', label: 'Golden Sun' } },
  { level: 13, free: { type: 'coins', amount: 150, label: '150 Coins' }, premium: { type: 'hints', amount: 8, label: '8 Hints' } },
  { level: 14, free: { type: 'hints', amount: 3, label: '3 Hints' }, premium: { type: 'coins', amount: 400, label: '400 Coins' } },
  { level: 15, free: { type: 'coins', amount: 200, label: '200 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#1ABC9C', label: 'Emerald' } },
  { level: 16, free: { type: 'lives', amount: 3, label: '3 Lives' }, premium: { type: 'coins', amount: 500, label: '500 Coins' } },
  { level: 17, free: { type: 'coins', amount: 200, label: '200 Coins' }, premium: { type: 'hints', amount: 10, label: '10 Hints' } },
  { level: 18, free: { type: 'hints', amount: 4, label: '4 Hints' }, premium: { type: 'avatar_color', amount: 1, color: '#E74C3C', label: 'Ruby Red' } },
  { level: 19, free: { type: 'coins', amount: 250, label: '250 Coins' }, premium: { type: 'lives', amount: 15, label: '15 Lives' } },
  { level: 20, free: { type: 'lives', amount: 5, label: '5 Lives' }, premium: { type: 'coins', amount: 750, label: '750 Coins' } },
  { level: 21, free: { type: 'coins', amount: 250, label: '250 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#3498DB', label: 'Ocean Blue' } },
  { level: 22, free: { type: 'hints', amount: 5, label: '5 Hints' }, premium: { type: 'hints', amount: 15, label: '15 Hints' } },
  { level: 23, free: { type: 'coins', amount: 300, label: '300 Coins' }, premium: { type: 'coins', amount: 600, label: '600 Coins' } },
  { level: 24, free: { type: 'lives', amount: 5, label: '5 Lives' }, premium: { type: 'avatar_color', amount: 1, color: '#E91E63', label: 'Hot Pink' } },
  { level: 25, free: { type: 'coins', amount: 350, label: '350 Coins' }, premium: { type: 'coins', amount: 1000, label: '1000 Coins' } },
  { level: 26, free: { type: 'hints', amount: 5, label: '5 Hints' }, premium: { type: 'lives', amount: 20, label: '20 Lives' } },
  { level: 27, free: { type: 'coins', amount: 400, label: '400 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#00BCD4', label: 'Cyan Frost' } },
  { level: 28, free: { type: 'lives', amount: 8, label: '8 Lives' }, premium: { type: 'hints', amount: 20, label: '20 Hints' } },
  { level: 29, free: { type: 'coins', amount: 500, label: '500 Coins' }, premium: { type: 'avatar_color', amount: 1, color: '#FFD700', label: 'Pure Gold' } },
  { level: 30, free: { type: 'coins', amount: 1000, label: '1000 Coins' }, premium: { type: 'coins', amount: 2500, label: '2500 Coins' } },
];

export const XP_PER_LEVEL = 100;
export const MAX_SEASON_LEVEL = 30;

// Guild/Clan Types
export interface Guild {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  icon_color: string;
  banner_color: string;
  leader_id: string;
  co_leader_id: string | null;
  min_level: number;
  max_members: number;
  total_stars: number;
  total_wins: number;
  total_losses: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  leader?: {
    username: string;
    display_name: string;
    avatar_color: string;
  };
  member_count?: number;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  player_id: string;
  role: 'leader' | 'co_leader' | 'elder' | 'member';
  contribution_points: number;
  gifts_sent: number;
  gifts_received: number;
  tournament_wins: number;
  joined_at: string;
  // Joined player data
  player?: {
    username: string;
    display_name: string;
    avatar_color: string;
    total_stars: number;
    levels_completed: number;
  };
}

export interface GuildChatMessage {
  id: string;
  guild_id: string;
  player_id: string;
  message: string;
  message_type: 'text' | 'system' | 'gift' | 'tournament';
  created_at: string;
  // Joined player data
  player?: {
    username: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface GuildJoinRequest {
  id: string;
  guild_id: string;
  player_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Joined player data
  player?: {
    username: string;
    display_name: string;
    avatar_color: string;
    total_stars: number;
  };
}

export interface GuildGift {
  id: string;
  guild_id: string;
  sender_id: string;
  receiver_id: string | null;
  gift_type: 'coins' | 'hints' | 'lives';
  amount: number;
  is_guild_wide: boolean;
  claimed: boolean;
  created_at: string;
  // Joined sender data
  sender?: {
    username: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface GuildTournament {
  id: string;
  guild_a_id: string;
  guild_b_id: string;
  guild_a_score: number;
  guild_b_score: number;
  status: 'pending' | 'active' | 'completed';
  winner_guild_id: string | null;
  prize_coins: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  // Joined guild data
  guild_a?: {
    name: string;
    icon: string;
    icon_color: string;
  };
  guild_b?: {
    name: string;
    icon: string;
    icon_color: string;
  };
}

export const GUILD_ICONS = [
  { id: 'shield', name: 'Shield', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'sword', name: 'Sword', path: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2' },
  { id: 'crown', name: 'Crown', path: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14' },
  { id: 'star', name: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'flame', name: 'Flame', path: 'M12 22c-4.97 0-9-2.582-9-7.75C3 9.393 9 3.25 9 3.25s.5 4.5 3 4.5 3-2.5 3-2.5 6 4.5 6 9c0 5.168-4.03 7.75-9 7.75z' },
  { id: 'lightning', name: 'Lightning', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'diamond', name: 'Diamond', path: 'M2.5 9l9.5-7 9.5 7L12 22 2.5 9z' },
  { id: 'skull', name: 'Skull', path: 'M12 2a9 9 0 00-9 9c0 3.6 2.4 6.5 6 7.5V22h6v-3.5c3.6-1 6-3.9 6-7.5a9 9 0 00-9-9zM9 13a2 2 0 110-4 2 2 0 010 4zm6 0a2 2 0 110-4 2 2 0 010 4z' },
];

export const GUILD_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export const GUILD_GIFT_OPTIONS = [
  { type: 'coins' as const, amount: 50, label: '50 Coins', icon: 'coins' },
  { type: 'coins' as const, amount: 100, label: '100 Coins', icon: 'coins' },
  { type: 'hints' as const, amount: 2, label: '2 Hints', icon: 'lightbulb' },
  { type: 'lives' as const, amount: 2, label: '2 Lives', icon: 'heart' },
];
