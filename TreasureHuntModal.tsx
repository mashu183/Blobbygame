import React, { useState, useCallback } from 'react';

interface TreasureHuntModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onAddCoins: (amount: number) => void;
  onAddHints: (amount: number) => void;
  onAddLives: (amount: number) => void;
  onSpendCoins: (amount: number) => boolean;
  onContributeToJackpot?: (amount: number) => void;
}

interface Tile {
  id: number;
  type: 'treasure' | 'bomb' | 'empty' | 'bonus';
  value: number;
  revealed: boolean;
}

const GRID_SIZE = 16; // 4x4 grid
const ENTRY_COST = 30;
const TREASURE_COUNT = 5;
const BOMB_COUNT = 4;
const BONUS_COUNT = 2;

const TreasureHuntModal: React.FC<TreasureHuntModalProps> = ({
  isOpen,
  onClose,
  coins,
  onAddCoins,
  onAddHints,
  onAddLives,
  onSpendCoins,
  onContributeToJackpot,
}) => {
  const [grid, setGrid] = useState<Tile[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [hitBomb, setHitBomb] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [netProfit, setNetProfit] = useState(0);

  const generateGrid = useCallback((): Tile[] => {
    const tiles: Tile[] = [];
    
    // Create empty tiles
    for (let i = 0; i < GRID_SIZE; i++) {
      tiles.push({ id: i, type: 'empty', value: 0, revealed: false });
    }

    // Shuffle and assign types
    const shuffled = [...Array(GRID_SIZE).keys()].sort(() => Math.random() - 0.5);
    
    // Add treasures (varying values)
    const treasureValues = [10, 15, 20, 30, 50];
    for (let i = 0; i < TREASURE_COUNT; i++) {
      tiles[shuffled[i]] = {
        id: shuffled[i],
        type: 'treasure',
        value: treasureValues[i],
        revealed: false,
      };
    }

    // Add bombs
    for (let i = TREASURE_COUNT; i < TREASURE_COUNT + BOMB_COUNT; i++) {
      tiles[shuffled[i]] = {
        id: shuffled[i],
        type: 'bomb',
        value: 0,
        revealed: false,
      };
    }

    // Add bonus tiles (hints/lives)
    for (let i = TREASURE_COUNT + BOMB_COUNT; i < TREASURE_COUNT + BOMB_COUNT + BONUS_COUNT; i++) {
      tiles[shuffled[i]] = {
        id: shuffled[i],
        type: 'bonus',
        value: 1,
        revealed: false,
      };
    }

    return tiles;
  }, []);

  const startGame = () => {
    if (coins < ENTRY_COST) return;

    const success = onSpendCoins(ENTRY_COST);
    if (!success) return;

    setGrid(generateGrid());
    setGameActive(true);
    setGameOver(false);
    setTotalWinnings(0);
    setRevealedCount(0);
    setHitBomb(false);
    setMultiplier(1);
    setNetProfit(-ENTRY_COST);
  };

  const revealTile = (index: number) => {
    if (!gameActive || gameOver || grid[index].revealed) return;

    const newGrid = [...grid];
    newGrid[index].revealed = true;
    setGrid(newGrid);

    const tile = grid[index];

    if (tile.type === 'bomb') {
      // Hit a bomb - lose half winnings
      setHitBomb(true);
      setGameOver(true);
      const lostAmount = Math.floor(totalWinnings / 2);
      if (lostAmount > 0) {
        onAddCoins(-lostAmount);
      }
      const finalWinnings = totalWinnings - lostAmount;
      setTotalWinnings(finalWinnings);
      
      // Calculate net loss and contribute to jackpot
      const finalNetProfit = finalWinnings - ENTRY_COST;
      setNetProfit(finalNetProfit);
      if (finalNetProfit < 0 && onContributeToJackpot) {
        onContributeToJackpot(Math.abs(finalNetProfit));
      }
    } else if (tile.type === 'treasure') {
      const winAmount = Math.floor(tile.value * multiplier);
      onAddCoins(winAmount);
      setTotalWinnings(prev => prev + winAmount);
      setNetProfit(prev => prev + winAmount);
      setRevealedCount(prev => prev + 1);
      setMultiplier(prev => prev + 0.1); // Increase multiplier
    } else if (tile.type === 'bonus') {
      // Random bonus
      const bonusType = Math.random();
      if (bonusType < 0.5) {
        onAddHints(1);
      } else {
        onAddLives(1);
      }
      setRevealedCount(prev => prev + 1);
    } else {
      setRevealedCount(prev => prev + 1);
    }

    // Check if all treasures found
    const allTreasuresFound = newGrid.filter(t => t.type === 'treasure' && t.revealed).length === TREASURE_COUNT;
    if (allTreasuresFound) {
      setGameOver(true);
      // Bonus for finding all treasures
      const bonus = 50;
      onAddCoins(bonus);
      setTotalWinnings(prev => prev + bonus);
      setNetProfit(prev => prev + bonus);
    }
  };

  const cashOut = () => {
    setGameOver(true);
    setGameActive(false);
    
    // If net loss, contribute to jackpot
    const finalNetProfit = totalWinnings - ENTRY_COST;
    if (finalNetProfit < 0 && onContributeToJackpot) {
      onContributeToJackpot(Math.abs(finalNetProfit));
    }
  };

  const revealAll = () => {
    setGrid(prev => prev.map(tile => ({ ...tile, revealed: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-amber-900 to-yellow-900 rounded-3xl max-w-md w-full p-6 relative border border-yellow-500/30 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Treasure Hunt
          </h2>
          <p className="text-gray-400 mt-1">Find treasures, avoid bombs!</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="text-center px-3 py-2 bg-white/10 rounded-xl">
            <p className="text-xs text-gray-400">Coins</p>
            <p className="text-yellow-400 font-bold">{coins}</p>
          </div>
          {gameActive && (
            <>
              <div className="text-center px-3 py-2 bg-green-500/20 rounded-xl border border-green-500/50">
                <p className="text-xs text-green-400">Winnings</p>
                <p className="text-green-300 font-bold">+{totalWinnings}</p>
              </div>
              <div className="text-center px-3 py-2 bg-purple-500/20 rounded-xl">
                <p className="text-xs text-purple-400">Multiplier</p>
                <p className="text-purple-300 font-bold">{multiplier.toFixed(1)}x</p>
              </div>
            </>
          )}
        </div>

        {!gameActive ? (
          <>
            {/* Start Screen */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-white mb-2">How to Play:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                  Tap tiles to reveal what's underneath
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  Find treasures to win coins!
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                  Avoid bombs - they take half your winnings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  Find bonus tiles for hints & lives
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Cash out anytime to keep your winnings
                </li>
              </ul>
            </div>

            <div className="text-center mb-4">
              <p className="text-gray-400">Entry Cost: <span className="text-yellow-400 font-bold">{ENTRY_COST} coins</span></p>
              <p className="text-sm text-gray-500">Treasures: {TREASURE_COUNT} | Bombs: {BOMB_COUNT}</p>
              <p className="text-xs text-yellow-400/60 mt-2">Losses contribute to the JACKPOT!</p>
            </div>

            <button
              onClick={startGame}
              disabled={coins < ENTRY_COST}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-xl transition-all hover:scale-105 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              START HUNT ({ENTRY_COST} coins)
            </button>
          </>
        ) : (
          <>
            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {grid.map((tile, index) => (
                <button
                  key={tile.id}
                  onClick={() => revealTile(index)}
                  disabled={tile.revealed || gameOver}
                  className={`aspect-square rounded-xl transition-all ${
                    tile.revealed
                      ? tile.type === 'treasure'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : tile.type === 'bomb'
                        ? 'bg-gradient-to-br from-red-500 to-red-700'
                        : tile.type === 'bonus'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                        : 'bg-gray-700'
                      : 'bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 hover:scale-105'
                  } disabled:hover:scale-100 flex items-center justify-center border-2 ${
                    tile.revealed ? 'border-transparent' : 'border-amber-400/50'
                  }`}
                >
                  {tile.revealed ? (
                    tile.type === 'treasure' ? (
                      <div className="text-center">
                        <svg className="w-6 h-6 mx-auto text-yellow-900" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        <p className="text-xs font-bold text-yellow-900">+{Math.floor(tile.value * multiplier)}</p>
                      </div>
                    ) : tile.type === 'bomb' ? (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="14" r="8" />
                        <path d="M12 6V2M15 4l2-2M9 4L7 2" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    ) : tile.type === 'bonus' ? (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    ) : (
                      <span className="text-gray-500 text-xl">·</span>
                    )
                  ) : (
                    <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Game Status */}
            {gameOver && (
              <div className={`text-center mb-4 p-4 rounded-xl ${hitBomb ? 'bg-red-500/20 border border-red-500' : 'bg-green-500/20 border border-green-500'}`}>
                {hitBomb ? (
                  <>
                    <h3 className="text-xl font-bold text-red-400">BOOM!</h3>
                    <p className="text-red-300">You hit a bomb! Lost half your winnings.</p>
                    {netProfit < 0 && (
                      <p className="text-yellow-400 text-xs mt-1">Your loss feeds the JACKPOT!</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-green-400">Congratulations!</h3>
                    <p className="text-green-300">You found all treasures!</p>
                  </>
                )}
                <p className="text-white font-bold mt-2">Total: +{totalWinnings} coins</p>
              </div>
            )}

            {/* Action Buttons */}
            {!gameOver ? (
              <div className="space-y-2">
                <button
                  onClick={cashOut}
                  disabled={totalWinnings === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  CASH OUT ({totalWinnings} coins)
                </button>
                <p className="text-center text-xs text-gray-400">
                  Revealed: {revealedCount}/{GRID_SIZE - BOMB_COUNT} safe tiles
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={revealAll}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Reveal All
                </button>
                <button
                  onClick={startGame}
                  disabled={coins < ENTRY_COST}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  PLAY AGAIN ({ENTRY_COST} coins)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TreasureHuntModal;
