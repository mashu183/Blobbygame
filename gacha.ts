// Gacha System Types and Constants

export type GachaRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface GachaItem {
  id: string;
  name: string;
  description: string;
  rarity: GachaRarity;
  type: 'character' | 'powerup' | 'cosmetic' | 'frame' | 'effect';
  image: string;
  ability?: string;
  stats?: {
    coinBonus?: number;
    moveBonus?: number;
    starBonus?: number;
  };
  isLimited?: boolean;
  bannerId?: string;
}

export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  image: string;
  featuredItems: string[]; // Item IDs
  rateUpItems: string[]; // Items with boosted rates
  rateUpMultiplier: number;
  startTime: string; // ISO date
  endTime: string; // ISO date
  isLimited: boolean;
  costPerPull: number;
  costPer10Pull: number;
  guaranteedRarity?: GachaRarity; // For 10-pulls
}

export interface GachaInventory {
  characters: string[];
  powerups: Record<string, number>;
  cosmetics: string[];
  frames: string[];
  effects: string[];
  equippedCharacter: string | null;
  equippedFrame: string | null;
  equippedEffect: string | null;
}

export interface GachaState {
  gems: number;
  inventory: GachaInventory;
  pityCounter: Record<string, number>; // Banner ID -> pulls since last legendary+
  totalPulls: Record<string, number>; // Banner ID -> total pulls
  pullHistory: GachaPullRecord[];
}

export interface GachaPullRecord {
  id: string;
  itemId: string;
  bannerId: string;
  rarity: GachaRarity;
  timestamp: string;
  wasPity: boolean;
}

// Rarity configuration
export const RARITY_CONFIG: Record<GachaRarity, {
  color: string;
  bgGradient: string;
  glowColor: string;
  baseRate: number;
  pullAnimationDuration: number;
  stars: number;
}> = {
  common: {
    color: '#9CA3AF',
    bgGradient: 'from-gray-500 to-gray-600',
    glowColor: 'rgba(156, 163, 175, 0.5)',
    baseRate: 0.60, // 60%
    pullAnimationDuration: 1000,
    stars: 1,
  },
  rare: {
    color: '#3B82F6',
    bgGradient: 'from-blue-500 to-blue-600',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    baseRate: 0.25, // 25%
    pullAnimationDuration: 1500,
    stars: 2,
  },
  epic: {
    color: '#8B5CF6',
    bgGradient: 'from-purple-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    baseRate: 0.10, // 10%
    pullAnimationDuration: 2000,
    stars: 3,
  },
  legendary: {
    color: '#F59E0B',
    bgGradient: 'from-yellow-500 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    baseRate: 0.04, // 4%
    pullAnimationDuration: 2500,
    stars: 4,
  },
  mythic: {
    color: '#EC4899',
    bgGradient: 'from-pink-500 via-purple-500 to-cyan-500',
    glowColor: 'rgba(236, 72, 153, 0.7)',
    baseRate: 0.01, // 1%
    pullAnimationDuration: 3500,
    stars: 5,
  },
};

// Pity system configuration
export const PITY_CONFIG = {
  softPityStart: 40, // Increased legendary rate starts here
  hardPity: 50, // Guaranteed legendary at 50 pulls
  softPityRateIncrease: 0.05, // +5% per pull after soft pity
  mythicPity: 100, // Guaranteed mythic at 100 pulls
};

// Gem costs
export const GEM_COSTS = {
  singlePull: 160,
  tenPull: 1440, // 10% discount
  dailyDeal: 80, // 50% off single pull, once per day
};

// Gem packages for purchase
export const GEM_PACKAGES = [
  { id: 'gems-60', gems: 60, price: 0.99, bonus: 0 },
  { id: 'gems-330', gems: 330, price: 4.99, bonus: 30 },
  { id: 'gems-980', gems: 980, price: 14.99, bonus: 180 },
  { id: 'gems-1980', gems: 1980, price: 29.99, bonus: 480, popular: true },
  { id: 'gems-3280', gems: 3280, price: 49.99, bonus: 880 },
  { id: 'gems-6480', gems: 6480, price: 99.99, bonus: 1880, bestValue: true },
];

// Character images by rarity
export const CHARACTER_IMAGES = {
  common: [
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189757659_bb672625.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189758016_068aa14f.jpg',
  ],
  rare: [
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189760812_4e60a40b.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189762684_6629de05.png',
  ],
  epic: [
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189765961_09b55bd8.png',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189764482_cece4f08.png',
  ],
  legendary: [
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189784331_82af57d8.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189791457_2dfb2b94.png',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189792131_23669773.png',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189791324_f39e31c3.png',
  ],
  mythic: [
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189814992_a859f6a7.png',
    'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189811659_de686820.jpg',
  ],
};

// All gacha items
export const GACHA_ITEMS: GachaItem[] = [
  // Common Characters
  {
    id: 'char-blob-blue',
    name: 'Blue Blobby',
    description: 'A cheerful blue blob ready for adventure!',
    rarity: 'common',
    type: 'character',
    image: CHARACTER_IMAGES.common[0],
    stats: { coinBonus: 5 },
  },
  {
    id: 'char-blob-green',
    name: 'Green Blobby',
    description: 'A nature-loving green blob.',
    rarity: 'common',
    type: 'character',
    image: CHARACTER_IMAGES.common[1],
    stats: { moveBonus: 1 },
  },
  {
    id: 'char-blob-pink',
    name: 'Pink Blobby',
    description: 'A sweet pink blob with a kind heart.',
    rarity: 'common',
    type: 'character',
    image: CHARACTER_IMAGES.common[0],
    stats: { coinBonus: 3 },
  },
  {
    id: 'char-blob-orange',
    name: 'Orange Blobby',
    description: 'An energetic orange blob!',
    rarity: 'common',
    type: 'character',
    image: CHARACTER_IMAGES.common[1],
    stats: { starBonus: 2 },
  },
  
  // Rare Characters
  {
    id: 'char-blob-crystal',
    name: 'Crystal Blobby',
    description: 'A rare crystalline blob that sparkles!',
    rarity: 'rare',
    type: 'character',
    image: CHARACTER_IMAGES.rare[0],
    ability: 'Reveals hidden coins on the map',
    stats: { coinBonus: 15 },
  },
  {
    id: 'char-blob-shadow',
    name: 'Shadow Blobby',
    description: 'A mysterious shadow blob.',
    rarity: 'rare',
    type: 'character',
    image: CHARACTER_IMAGES.rare[1],
    ability: 'Can phase through one obstacle per level',
    stats: { moveBonus: 2 },
  },
  {
    id: 'char-blob-flame',
    name: 'Flame Blobby',
    description: 'A fiery blob with burning passion!',
    rarity: 'rare',
    type: 'character',
    image: CHARACTER_IMAGES.rare[0],
    stats: { starBonus: 5 },
  },
  
  // Epic Characters
  {
    id: 'char-blob-thunder',
    name: 'Thunder Blobby',
    description: 'An electrifying epic blob!',
    rarity: 'epic',
    type: 'character',
    image: CHARACTER_IMAGES.epic[0],
    ability: '+2 extra moves every level',
    stats: { moveBonus: 2, coinBonus: 20 },
  },
  {
    id: 'char-blob-frost',
    name: 'Frost Blobby',
    description: 'A cool and collected ice blob.',
    rarity: 'epic',
    type: 'character',
    image: CHARACTER_IMAGES.epic[1],
    ability: 'Freezes one hurdle per level',
    stats: { starBonus: 10 },
  },
  {
    id: 'char-blob-nature',
    name: 'Nature Blobby',
    description: 'One with the forest spirits.',
    rarity: 'epic',
    type: 'character',
    image: CHARACTER_IMAGES.epic[0],
    ability: 'Regenerates 1 hint every 3 levels',
    stats: { coinBonus: 25 },
  },
  
  // Legendary Characters
  {
    id: 'char-blob-golden',
    name: 'Golden Blobby',
    description: 'The legendary golden blob of fortune!',
    rarity: 'legendary',
    type: 'character',
    image: CHARACTER_IMAGES.legendary[0],
    ability: '2x coin collection',
    stats: { coinBonus: 100, moveBonus: 3 },
  },
  {
    id: 'char-blob-phoenix',
    name: 'Phoenix Blobby',
    description: 'Rises from defeat with renewed vigor!',
    rarity: 'legendary',
    type: 'character',
    image: CHARACTER_IMAGES.legendary[1],
    ability: 'Auto-revive once per day (free continue)',
    stats: { starBonus: 25 },
  },
  {
    id: 'char-blob-dragon',
    name: 'Dragon Blobby',
    description: 'A fearsome dragon-infused blob!',
    rarity: 'legendary',
    type: 'character',
    image: CHARACTER_IMAGES.legendary[2],
    ability: 'Destroys 2 random obstacles at level start',
    stats: { moveBonus: 5, coinBonus: 50 },
  },
  {
    id: 'char-blob-royal',
    name: 'Royal Blobby',
    description: 'The king of all blobs!',
    rarity: 'legendary',
    type: 'character',
    image: CHARACTER_IMAGES.legendary[3],
    ability: 'VIP treatment - 50% off all purchases',
    stats: { coinBonus: 75 },
  },
  
  // Mythic Characters
  {
    id: 'char-blob-cosmic',
    name: 'Cosmic Blobby',
    description: 'Born from the stars themselves!',
    rarity: 'mythic',
    type: 'character',
    image: CHARACTER_IMAGES.mythic[0],
    ability: 'All abilities combined + 3x star bonus',
    stats: { coinBonus: 200, moveBonus: 5, starBonus: 50 },
  },
  {
    id: 'char-blob-void',
    name: 'Void Blobby',
    description: 'Master of the infinite void!',
    rarity: 'mythic',
    type: 'character',
    image: CHARACTER_IMAGES.mythic[1],
    ability: 'Teleport anywhere + unlimited wall breaks',
    stats: { coinBonus: 150, moveBonus: 10 },
  },
  
  // Power-ups (can be pulled multiple times)
  {
    id: 'powerup-teleport-x3',
    name: 'Teleport Pack',
    description: '3x Teleport power-ups',
    rarity: 'common',
    type: 'powerup',
    image: CHARACTER_IMAGES.common[0],
  },
  {
    id: 'powerup-wallbreak-x3',
    name: 'Wall Break Pack',
    description: '3x Wall Break power-ups',
    rarity: 'common',
    type: 'powerup',
    image: CHARACTER_IMAGES.common[1],
  },
  {
    id: 'powerup-extramoves-x3',
    name: 'Extra Moves Pack',
    description: '3x Extra Moves power-ups',
    rarity: 'rare',
    type: 'powerup',
    image: CHARACTER_IMAGES.rare[0],
  },
  {
    id: 'powerup-mega-pack',
    name: 'Mega Power Pack',
    description: '5x of each power-up!',
    rarity: 'epic',
    type: 'powerup',
    image: CHARACTER_IMAGES.epic[0],
  },
  
  // Cosmetic Frames
  {
    id: 'frame-basic-gold',
    name: 'Golden Frame',
    description: 'A shiny golden profile frame',
    rarity: 'rare',
    type: 'frame',
    image: CHARACTER_IMAGES.rare[1],
  },
  {
    id: 'frame-diamond',
    name: 'Diamond Frame',
    description: 'A dazzling diamond profile frame',
    rarity: 'epic',
    type: 'frame',
    image: CHARACTER_IMAGES.epic[1],
  },
  {
    id: 'frame-legendary-fire',
    name: 'Inferno Frame',
    description: 'A blazing legendary frame',
    rarity: 'legendary',
    type: 'frame',
    image: CHARACTER_IMAGES.legendary[0],
  },
  {
    id: 'frame-mythic-cosmic',
    name: 'Cosmic Frame',
    description: 'A frame made of stardust',
    rarity: 'mythic',
    type: 'frame',
    image: CHARACTER_IMAGES.mythic[0],
  },
  
  // Effects
  {
    id: 'effect-sparkle',
    name: 'Sparkle Trail',
    description: 'Leave sparkles as you move',
    rarity: 'rare',
    type: 'effect',
    image: CHARACTER_IMAGES.rare[0],
  },
  {
    id: 'effect-rainbow',
    name: 'Rainbow Trail',
    description: 'Leave a rainbow trail behind',
    rarity: 'epic',
    type: 'effect',
    image: CHARACTER_IMAGES.epic[0],
  },
  {
    id: 'effect-lightning',
    name: 'Lightning Aura',
    description: 'Crackling lightning surrounds you',
    rarity: 'legendary',
    type: 'effect',
    image: CHARACTER_IMAGES.legendary[1],
  },
  {
    id: 'effect-cosmic-aura',
    name: 'Cosmic Aura',
    description: 'Stars orbit around you',
    rarity: 'mythic',
    type: 'effect',
    image: CHARACTER_IMAGES.mythic[1],
  },
];

// Get items by rarity
export const getItemsByRarity = (rarity: GachaRarity): GachaItem[] => {
  return GACHA_ITEMS.filter(item => item.rarity === rarity);
};

// Banners
export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'standard',
    name: 'Standard Banner',
    description: 'The classic summon banner with all characters',
    image: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189838262_7cc4eadf.png',
    featuredItems: [],
    rateUpItems: [],
    rateUpMultiplier: 1,
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2099-12-31T23:59:59Z',
    isLimited: false,
    costPerPull: GEM_COSTS.singlePull,
    costPer10Pull: GEM_COSTS.tenPull,
    guaranteedRarity: 'rare',
  },
  {
    id: 'legendary-festival',
    name: 'Legendary Festival',
    description: 'Double legendary rates! Limited time only!',
    image: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189838262_7cc4eadf.png',
    featuredItems: ['char-blob-golden', 'char-blob-phoenix', 'char-blob-dragon'],
    rateUpItems: ['char-blob-golden', 'char-blob-phoenix'],
    rateUpMultiplier: 2,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    isLimited: true,
    costPerPull: GEM_COSTS.singlePull,
    costPer10Pull: GEM_COSTS.tenPull,
    guaranteedRarity: 'epic',
  },
  {
    id: 'mythic-summon',
    name: 'Mythic Summon',
    description: 'Increased Mythic rates! Ultra rare characters await!',
    image: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1766189838262_7cc4eadf.png',
    featuredItems: ['char-blob-cosmic', 'char-blob-void'],
    rateUpItems: ['char-blob-cosmic', 'char-blob-void'],
    rateUpMultiplier: 3,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    isLimited: true,
    costPerPull: 200, // Premium banner costs more
    costPer10Pull: 1800,
    guaranteedRarity: 'legendary',
  },
];

// Initial gacha state
export const INITIAL_GACHA_STATE: GachaState = {
  gems: 500, // Start with some gems
  inventory: {
    characters: ['char-blob-blue'], // Start with basic character
    powerups: {},
    cosmetics: [],
    frames: [],
    effects: [],
    equippedCharacter: 'char-blob-blue',
    equippedFrame: null,
    equippedEffect: null,
  },
  pityCounter: {},
  totalPulls: {},
  pullHistory: [],
};

// Calculate pull rates with pity
export const calculatePullRates = (bannerId: string, pityCount: number, banner: GachaBanner) => {
  const rates: Record<GachaRarity, number> = {
    common: RARITY_CONFIG.common.baseRate,
    rare: RARITY_CONFIG.rare.baseRate,
    epic: RARITY_CONFIG.epic.baseRate,
    legendary: RARITY_CONFIG.legendary.baseRate,
    mythic: RARITY_CONFIG.mythic.baseRate,
  };
  
  // Apply rate up for limited banners
  if (banner.rateUpMultiplier > 1) {
    rates.legendary *= banner.rateUpMultiplier;
    rates.mythic *= banner.rateUpMultiplier;
    // Reduce common/rare to compensate
    const excess = (rates.legendary - RARITY_CONFIG.legendary.baseRate) + 
                   (rates.mythic - RARITY_CONFIG.mythic.baseRate);
    rates.common -= excess * 0.7;
    rates.rare -= excess * 0.3;
  }
  
  // Apply soft pity
  if (pityCount >= PITY_CONFIG.softPityStart) {
    const pityBonus = (pityCount - PITY_CONFIG.softPityStart) * PITY_CONFIG.softPityRateIncrease;
    rates.legendary += pityBonus;
    rates.common -= pityBonus;
  }
  
  // Hard pity - guaranteed legendary
  if (pityCount >= PITY_CONFIG.hardPity - 1) {
    rates.legendary = 1;
    rates.common = 0;
    rates.rare = 0;
    rates.epic = 0;
    rates.mythic = 0;
  }
  
  // Mythic pity
  if (pityCount >= PITY_CONFIG.mythicPity - 1) {
    rates.mythic = 1;
    rates.legendary = 0;
    rates.common = 0;
    rates.rare = 0;
    rates.epic = 0;
  }
  
  // Normalize rates
  const total = Object.values(rates).reduce((a, b) => a + b, 0);
  Object.keys(rates).forEach(key => {
    rates[key as GachaRarity] /= total;
  });
  
  return rates;
};

// Perform a single pull
export const performPull = (
  bannerId: string, 
  pityCount: number, 
  banner: GachaBanner
): { item: GachaItem; wasPity: boolean } => {
  const rates = calculatePullRates(bannerId, pityCount, banner);
  const roll = Math.random();
  
  let cumulative = 0;
  let selectedRarity: GachaRarity = 'common';
  
  for (const [rarity, rate] of Object.entries(rates)) {
    cumulative += rate;
    if (roll <= cumulative) {
      selectedRarity = rarity as GachaRarity;
      break;
    }
  }
  
  // Get items of selected rarity
  let availableItems = getItemsByRarity(selectedRarity);
  
  // If banner has rate-up items, give them priority
  if (banner.rateUpItems.length > 0 && Math.random() < 0.5) {
    const rateUpItemsOfRarity = availableItems.filter(
      item => banner.rateUpItems.includes(item.id)
    );
    if (rateUpItemsOfRarity.length > 0) {
      availableItems = rateUpItemsOfRarity;
    }
  }
  
  // Select random item from available
  const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
  
  const wasPity = pityCount >= PITY_CONFIG.hardPity - 1 || pityCount >= PITY_CONFIG.mythicPity - 1;
  
  return { item: selectedItem, wasPity };
};
