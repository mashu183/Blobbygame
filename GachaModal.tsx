import React, { useState, useEffect, useCallback } from 'react';
import { X, Gem, Star, ChevronLeft, ChevronRight, Info, Gift, Sparkles, Clock, Zap, Crown, Package } from 'lucide-react';
import {
  GachaItem,
  GachaBanner,
  GachaState,
  GachaRarity,
  GACHA_BANNERS,
  GACHA_ITEMS,
  RARITY_CONFIG,
  PITY_CONFIG,
  GEM_COSTS,
  GEM_PACKAGES,
  INITIAL_GACHA_STATE,
  calculatePullRates,
  performPull,
} from '@/types/gacha';

interface GachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  gachaState: GachaState;
  onUpdateGachaState: (state: GachaState) => void;
  onPurchaseGems?: (packageId: string) => void;
}

type TabType = 'summon' | 'inventory' | 'shop' | 'odds';

const GachaModal: React.FC<GachaModalProps> = ({
  isOpen,
  onClose,
  gachaState,
  onUpdateGachaState,
  onPurchaseGems,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summon');
  const [selectedBanner, setSelectedBanner] = useState<GachaBanner>(GACHA_BANNERS[0]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResults, setPullResults] = useState<GachaItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [revealedItems, setRevealedItems] = useState<Set<number>>(new Set());
  const [showOddsInfo, setShowOddsInfo] = useState(false);

  // Get active banners (filter by time)
  const activeBanners = GACHA_BANNERS.filter(banner => {
    const now = new Date();
    return new Date(banner.startTime) <= now && new Date(banner.endTime) >= now;
  });

  // Calculate time remaining for limited banners
  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Perform pulls
  const doPull = useCallback((count: number) => {
    const cost = count === 1 ? selectedBanner.costPerPull : selectedBanner.costPer10Pull;
    
    if (gachaState.gems < cost) {
      alert('Not enough gems!');
      return;
    }

    setIsPulling(true);
    setPullResults([]);
    setRevealedItems(new Set());
    setCurrentResultIndex(0);

    const results: GachaItem[] = [];
    let currentPity = gachaState.pityCounter[selectedBanner.id] || 0;
    const newHistory = [...gachaState.pullHistory];
    
    for (let i = 0; i < count; i++) {
      const { item, wasPity } = performPull(selectedBanner.id, currentPity, selectedBanner);
      results.push(item);
      
      // Update pity counter
      if (item.rarity === 'legendary' || item.rarity === 'mythic') {
        currentPity = 0;
      } else {
        currentPity++;
      }
      
      // Add to history
      newHistory.unshift({
        id: `${Date.now()}-${i}`,
        itemId: item.id,
        bannerId: selectedBanner.id,
        rarity: item.rarity,
        timestamp: new Date().toISOString(),
        wasPity,
      });
    }

    // Guarantee at least rare on 10-pull
    if (count === 10 && selectedBanner.guaranteedRarity) {
      const hasGuaranteed = results.some(r => 
        ['rare', 'epic', 'legendary', 'mythic'].indexOf(r.rarity) >= 
        ['rare', 'epic', 'legendary', 'mythic'].indexOf(selectedBanner.guaranteedRarity!)
      );
      
      if (!hasGuaranteed) {
        const guaranteedItems = GACHA_ITEMS.filter(i => i.rarity === selectedBanner.guaranteedRarity);
        const randomGuaranteed = guaranteedItems[Math.floor(Math.random() * guaranteedItems.length)];
        results[9] = randomGuaranteed;
      }
    }

    // Update inventory
    const newInventory = { ...gachaState.inventory };
    results.forEach(item => {
      if (item.type === 'character') {
        if (!newInventory.characters.includes(item.id)) {
          newInventory.characters.push(item.id);
        }
      } else if (item.type === 'powerup') {
        newInventory.powerups[item.id] = (newInventory.powerups[item.id] || 0) + 1;
      } else if (item.type === 'frame') {
        if (!newInventory.frames.includes(item.id)) {
          newInventory.frames.push(item.id);
        }
      } else if (item.type === 'effect') {
        if (!newInventory.effects.includes(item.id)) {
          newInventory.effects.push(item.id);
        }
      } else if (item.type === 'cosmetic') {
        if (!newInventory.cosmetics.includes(item.id)) {
          newInventory.cosmetics.push(item.id);
        }
      }
    });

    // Update state
    const newState: GachaState = {
      ...gachaState,
      gems: gachaState.gems - cost,
      inventory: newInventory,
      pityCounter: {
        ...gachaState.pityCounter,
        [selectedBanner.id]: currentPity,
      },
      totalPulls: {
        ...gachaState.totalPulls,
        [selectedBanner.id]: (gachaState.totalPulls[selectedBanner.id] || 0) + count,
      },
      pullHistory: newHistory.slice(0, 100), // Keep last 100 pulls
    };

    // Animate the pull
    setTimeout(() => {
      setPullResults(results);
      setShowResults(true);
      setIsPulling(false);
      onUpdateGachaState(newState);
    }, 1500);
  }, [gachaState, selectedBanner, onUpdateGachaState]);

  // Reveal next item in results
  const revealNext = useCallback(() => {
    if (currentResultIndex < pullResults.length) {
      setRevealedItems(prev => new Set([...prev, currentResultIndex]));
      setCurrentResultIndex(prev => prev + 1);
    }
  }, [currentResultIndex, pullResults.length]);

  // Reveal all items
  const revealAll = useCallback(() => {
    const allIndices = new Set(pullResults.map((_, i) => i));
    setRevealedItems(allIndices);
    setCurrentResultIndex(pullResults.length);
  }, [pullResults]);

  // Close results
  const closeResults = useCallback(() => {
    setShowResults(false);
    setPullResults([]);
    setRevealedItems(new Set());
    setCurrentResultIndex(0);
  }, []);

  // Get pity info
  const getPityInfo = () => {
    const currentPity = gachaState.pityCounter[selectedBanner.id] || 0;
    const untilSoftPity = Math.max(0, PITY_CONFIG.softPityStart - currentPity);
    const untilHardPity = Math.max(0, PITY_CONFIG.hardPity - currentPity);
    return { currentPity, untilSoftPity, untilHardPity };
  };

  if (!isOpen) return null;

  const pityInfo = getPityInfo();
  const currentRates = calculatePullRates(selectedBanner.id, pityInfo.currentPity, selectedBanner);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 flex items-center justify-between border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gacha Summon</h2>
              <p className="text-purple-300 text-sm">Collect rare Blobbies!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Gems display */}
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
              <Gem className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-bold">{gachaState.gems.toLocaleString()}</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['summon', 'inventory', 'shop', 'odds'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Summon Tab */}
          {activeTab === 'summon' && (
            <div className="p-4 space-y-4">
              {/* Banner Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeBanners.map(banner => (
                  <button
                    key={banner.id}
                    onClick={() => setSelectedBanner(banner)}
                    className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all ${
                      selectedBanner.id === banner.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{banner.name}</span>
                        {banner.isLimited && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeRemaining(banner.endTime)}
                          </span>
                        )}
                      </div>
                      {banner.rateUpMultiplier > 1 && (
                        <span className="text-yellow-400 text-xs">{banner.rateUpMultiplier}x Rate Up!</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Banner Display */}
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={selectedBanner.image}
                  alt={selectedBanner.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-2xl font-bold text-white">{selectedBanner.name}</h3>
                  <p className="text-gray-300 text-sm">{selectedBanner.description}</p>
                </div>
                
                {/* Featured Items */}
                {selectedBanner.featuredItems.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {selectedBanner.featuredItems.slice(0, 3).map(itemId => {
                      const item = GACHA_ITEMS.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div
                          key={itemId}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                            item.rarity === 'mythic' ? 'border-pink-500' :
                            item.rarity === 'legendary' ? 'border-yellow-500' :
                            'border-purple-500'
                          }`}
                        >
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pity Counter */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Pity Progress</span>
                  <button
                    onClick={() => setShowOddsInfo(true)}
                    className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300"
                  >
                    <Info className="w-4 h-4" />
                    View Rates
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-yellow-500 transition-all"
                        style={{ width: `${(pityInfo.currentPity / PITY_CONFIG.hardPity) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {pityInfo.currentPity}/{PITY_CONFIG.hardPity}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      {pityInfo.untilHardPity > 0 
                        ? `${pityInfo.untilHardPity} pulls until guaranteed Legendary`
                        : 'Legendary guaranteed on next pull!'}
                    </span>
                    {pityInfo.currentPity >= PITY_CONFIG.softPityStart && (
                      <span className="text-yellow-400">Soft pity active!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pull Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => doPull(1)}
                  disabled={isPulling || gachaState.gems < selectedBanner.costPerPull}
                  className="relative group p-4 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-white font-bold text-lg">Single Pull</div>
                    <div className="flex items-center justify-center gap-1 text-purple-200">
                      <Gem className="w-4 h-4" />
                      <span>{selectedBanner.costPerPull}</span>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => doPull(10)}
                  disabled={isPulling || gachaState.gems < selectedBanner.costPer10Pull}
                  className="relative group p-4 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    +1 FREE
                  </div>
                  <div className="relative">
                    <div className="text-white font-bold text-lg">10x Pull</div>
                    <div className="flex items-center justify-center gap-1 text-yellow-200">
                      <Gem className="w-4 h-4" />
                      <span>{selectedBanner.costPer10Pull}</span>
                      <span className="text-xs line-through opacity-60">{selectedBanner.costPerPull * 10}</span>
                    </div>
                    {selectedBanner.guaranteedRarity && (
                      <div className="text-xs text-yellow-300 mt-1">
                        Guaranteed {selectedBanner.guaranteedRarity}+
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="p-4 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Your Collection
              </h3>
              
              {/* Characters */}
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Characters ({gachaState.inventory.characters.length})</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {gachaState.inventory.characters.map(charId => {
                    const item = GACHA_ITEMS.find(i => i.id === charId);
                    if (!item) return null;
                    const isEquipped = gachaState.inventory.equippedCharacter === charId;
                    return (
                      <button
                        key={charId}
                        onClick={() => {
                          onUpdateGachaState({
                            ...gachaState,
                            inventory: {
                              ...gachaState.inventory,
                              equippedCharacter: charId,
                            },
                          });
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          isEquipped
                            ? `border-${RARITY_CONFIG[item.rarity].bgGradient.split('-')[1]}-500 ring-2 ring-${RARITY_CONFIG[item.rarity].bgGradient.split('-')[1]}-500/50`
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                        <div className={`absolute bottom-0 left-0 right-0 py-1 px-1 bg-gradient-to-t ${RARITY_CONFIG[item.rarity].bgGradient}`}>
                          <div className="flex justify-center">
                            {Array.from({ length: RARITY_CONFIG[item.rarity].stars }).map((_, i) => (
                              <Star key={i} className="w-2 h-2 text-yellow-300 fill-yellow-300" />
                            ))}
                          </div>
                        </div>
                        {isEquipped && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Zap className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frames */}
              {gachaState.inventory.frames.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Frames ({gachaState.inventory.frames.length})</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {gachaState.inventory.frames.map(frameId => {
                      const item = GACHA_ITEMS.find(i => i.id === frameId);
                      if (!item) return null;
                      const isEquipped = gachaState.inventory.equippedFrame === frameId;
                      return (
                        <button
                          key={frameId}
                          onClick={() => {
                            onUpdateGachaState({
                              ...gachaState,
                              inventory: {
                                ...gachaState.inventory,
                                equippedFrame: isEquipped ? null : frameId,
                              },
                            });
                          }}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isEquipped ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Effects */}
              {gachaState.inventory.effects.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Effects ({gachaState.inventory.effects.length})</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {gachaState.inventory.effects.map(effectId => {
                      const item = GACHA_ITEMS.find(i => i.id === effectId);
                      if (!item) return null;
                      const isEquipped = gachaState.inventory.equippedEffect === effectId;
                      return (
                        <button
                          key={effectId}
                          onClick={() => {
                            onUpdateGachaState({
                              ...gachaState,
                              inventory: {
                                ...gachaState.inventory,
                                equippedEffect: isEquipped ? null : effectId,
                              },
                            });
                          }}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isEquipped ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <div className="p-4 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Gem className="w-5 h-5 text-cyan-400" />
                Gem Shop
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GEM_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => onPurchaseGems?.(pkg.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      pkg.bestValue
                        ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/30 to-orange-900/30'
                        : pkg.popular
                        ? 'border-purple-500 bg-gradient-to-br from-purple-900/30 to-pink-900/30'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    {pkg.bestValue && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full whitespace-nowrap">
                        BEST VALUE
                      </div>
                    )}
                    {pkg.popular && !pkg.bestValue && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center mb-2">
                      <Gem className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="text-white font-bold text-lg">{pkg.gems.toLocaleString()}</div>
                    {pkg.bonus > 0 && (
                      <div className="text-green-400 text-xs">+{pkg.bonus} Bonus</div>
                    )}
                    <div className="text-purple-400 font-medium mt-2">${pkg.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Odds Tab */}
          {activeTab === 'odds' && (
            <div className="p-4 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Drop Rates - {selectedBanner.name}
              </h3>
              
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                {(['mythic', 'legendary', 'epic', 'rare', 'common'] as GachaRarity[]).map(rarity => (
                  <div key={rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${RARITY_CONFIG[rarity].bgGradient}`} />
                      <span className="text-white capitalize">{rarity}</span>
                      <div className="flex">
                        {Array.from({ length: RARITY_CONFIG[rarity].stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-300 font-mono">
                      {(currentRates[rarity] * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Pity System Explanation */}
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
                <h4 className="text-purple-300 font-medium mb-2">Pity System</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Soft pity starts at {PITY_CONFIG.softPityStart} pulls (+{(PITY_CONFIG.softPityRateIncrease * 100).toFixed(0)}% legendary rate per pull)</li>
                  <li>• Hard pity at {PITY_CONFIG.hardPity} pulls (guaranteed Legendary)</li>
                  <li>• Mythic pity at {PITY_CONFIG.mythicPity} pulls (guaranteed Mythic)</li>
                  <li>• Pity counter resets when you get Legendary or Mythic</li>
                </ul>
              </div>

              {/* Rate Up Info */}
              {selectedBanner.rateUpMultiplier > 1 && (
                <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/30">
                  <h4 className="text-yellow-300 font-medium mb-2">Rate Up Active!</h4>
                  <p className="text-gray-300 text-sm">
                    Featured items have {selectedBanner.rateUpMultiplier}x increased drop rate!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pull Animation Overlay */}
      {isPulling && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-purple-500/50 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 animate-spin" style={{ animationDuration: '2s' }} />
              <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-white animate-pulse" />
            </div>
            <p className="text-white text-xl font-bold animate-pulse">Summoning...</p>
          </div>
        </div>
      )}

      {/* Results Overlay */}
      {showResults && pullResults.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {pullResults.map((item, index) => {
                const isRevealed = revealedItems.has(index);
                const config = RARITY_CONFIG[item.rarity];
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (!isRevealed && index === currentResultIndex) {
                        revealNext();
                      }
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-500 cursor-pointer ${
                      isRevealed ? '' : 'bg-gray-800'
                    }`}
                    style={{
                      boxShadow: isRevealed ? `0 0 30px ${config.glowColor}` : 'none',
                    }}
                  >
                    {isRevealed ? (
                      <>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover animate-scale-in"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${config.bgGradient} opacity-30`} />
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60">
                          <div className="flex justify-center">
                            {Array.from({ length: config.stars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                        {item.rarity === 'legendary' || item.rarity === 'mythic' ? (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 animate-pulse" style={{
                              background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                            }} />
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Item Details (show last revealed) */}
            {revealedItems.size > 0 && (
              <div className="text-center mb-4">
                {(() => {
                  const lastIndex = Math.max(...Array.from(revealedItems));
                  const item = pullResults[lastIndex];
                  const config = RARITY_CONFIG[item.rarity];
                  return (
                    <div className="animate-fade-in">
                      <h3 className={`text-2xl font-bold bg-gradient-to-r ${config.bgGradient} bg-clip-text text-transparent`}>
                        {item.name}
                      </h3>
                      <p className="text-gray-400">{item.description}</p>
                      {item.ability && (
                        <p className="text-purple-400 text-sm mt-1">
                          <Zap className="w-4 h-4 inline mr-1" />
                          {item.ability}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {currentResultIndex < pullResults.length ? (
                <>
                  <button
                    onClick={revealNext}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                  >
                    Reveal Next
                  </button>
                  <button
                    onClick={revealAll}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Skip All
                  </button>
                </>
              ) : (
                <button
                  onClick={closeResults}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GachaModal;
