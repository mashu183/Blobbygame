import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  GameState, Level, Position, Tile, TILE_COLORS, 
  AchievementProgress, ACHIEVEMENTS, INITIAL_ACHIEVEMENT_PROGRESS, Achievement,
  DailyChallengesState, DailyChallenge, INITIAL_DAILY_CHALLENGES_STATE,
  getTodayDateString, generateDailyChallenges, DAILY_BONUS_REWARD,
  PowerUpInventory, PowerUpType, INITIAL_POWER_UP_INVENTORY, POWER_UP_COLORS
} from '../types/game';
import { hapticFeedback } from '../utils/capacitor';
import { Analytics } from '@/lib/analytics';


// Helper function to check if a path exists from start to goal using BFS
const hasValidPath = (grid: Tile[][], startPos: Position, goalPos: Position): boolean => {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const queue: Position[] = [startPos];
  visited.add(`${startPos.row},${startPos.col}`);
  
  const directions = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 },  // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 },  // right
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.row === goalPos.row && current.col === goalPos.col) {
      return true;
    }
    
    for (const { dr, dc } of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        grid[newRow][newCol].type !== 'obstacle' &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return false;
};

// Find the shortest path using BFS and return it
const findPath = (grid: Tile[][], startPos: Position, goalPos: Position): Position[] | null => {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const queue: { pos: Position; path: Position[] }[] = [{ pos: startPos, path: [startPos] }];
  visited.add(`${startPos.row},${startPos.col}`);
  
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  
  while (queue.length > 0) {
    const { pos: current, path } = queue.shift()!;
    
    if (current.row === goalPos.row && current.col === goalPos.col) {
      return path;
    }
    
    for (const { dr, dc } of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        grid[newRow][newCol].type !== 'obstacle' &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ 
          pos: { row: newRow, col: newCol }, 
          path: [...path, { row: newRow, col: newCol }] 
        });
      }
    }
  }
  
  return null;
};

// Create a guaranteed path from start to goal using random walk with backtracking
const createGuaranteedPath = (grid: Tile[][], startPos: Position, goalPos: Position): void => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Use A* inspired approach - carve a path that generally moves toward goal
  const path: Position[] = [];
  let current = { ...startPos };
  const visited = new Set<string>();
  visited.add(`${current.row},${current.col}`);
  
  while (current.row !== goalPos.row || current.col !== goalPos.col) {
    path.push({ ...current });
    
    // Calculate possible moves, prioritizing moves toward goal
    const moves: { pos: Position; score: number }[] = [];
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];
    
    for (const { dr, dc } of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        !visited.has(key)
      ) {
        // Score based on Manhattan distance to goal (lower is better)
        const distToGoal = Math.abs(newRow - goalPos.row) + Math.abs(newCol - goalPos.col);
        moves.push({ pos: { row: newRow, col: newCol }, score: distToGoal });
      }
    }
    
    if (moves.length === 0) {
      // Dead end - backtrack
      if (path.length > 0) {
        current = path.pop()!;
        continue;
      }
      break; // Shouldn't happen
    }
    
    // Sort by score and pick best move (with some randomness for variety)
    moves.sort((a, b) => a.score - b.score);
    
    // 70% chance to pick best move, 30% chance for random
    const pickIndex = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * moves.length);
    const nextPos = moves[pickIndex].pos;
    
    // Clear obstacle if present
    if (grid[nextPos.row][nextPos.col].type === 'obstacle') {
      grid[nextPos.row][nextPos.col] = { 
        type: 'path', 
        color: TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)] 
      };
    }
    
    visited.add(`${nextPos.row},${nextPos.col}`);
    current = nextPos;
  }
  
  // Also create a second alternative path for variety
  createAlternativePath(grid, startPos, goalPos);
};

// Create an alternative path using different strategy
const createAlternativePath = (grid: Tile[][], startPos: Position, goalPos: Position): void => {
  // Simple L-shaped paths: right-then-down and down-then-right
  let row = startPos.row;
  let col = startPos.col;
  
  // Path 1: Move right first, then down
  while (col < goalPos.col) {
    col++;
    if (col < grid[0].length && grid[row][col].type === 'obstacle') {
      grid[row][col] = { 
        type: 'path', 
        color: TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)] 
      };
    }
  }
  while (row < goalPos.row) {
    row++;
    if (row < grid.length && grid[row][col].type === 'obstacle') {
      grid[row][col] = { 
        type: 'path', 
        color: TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)] 
      };
    }
  }
  
  // Path 2: Move down first, then right
  row = startPos.row;
  col = startPos.col;
  while (row < goalPos.row) {
    row++;
    if (row < grid.length && grid[row][col].type === 'obstacle') {
      grid[row][col] = { 
        type: 'path', 
        color: TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)] 
      };
    }
  }
  while (col < goalPos.col) {
    col++;
    if (col < grid[0].length && grid[row][col].type === 'obstacle') {
      grid[row][col] = { 
        type: 'path', 
        color: TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)] 
      };
    }
  }
};

// Regenerate a single level's grid while ensuring it has a valid path
// Difficulty progression for 200 levels:
// Levels 1-10: Easy (small grid, few obstacles, more moves)
// Levels 11-30: Slightly harder (medium grid, more obstacles)
// Levels 31-60: Medium (larger grid, hurdles introduced)
// Levels 61-100: Hard (more hurdles, tighter moves)
// Levels 101-150: Very Hard (complex paths, multiple hurdles)
// Levels 151-200: Expert (maximum difficulty)
const regenerateLevelGrid = (levelId: number): { grid: Tile[][], startPos: Position, goalPos: Position, moves: number } => {
  // Grid size based on difficulty - gradual increase over 200 levels
  let size: number;
  if (levelId <= 10) {
    size = 4 + Math.floor(levelId / 5); // 4-6
  } else if (levelId <= 30) {
    size = 5 + Math.floor((levelId - 10) / 10); // 5-7
  } else if (levelId <= 60) {
    size = 6 + Math.floor((levelId - 30) / 15); // 6-8
  } else if (levelId <= 100) {
    size = 7 + Math.floor((levelId - 60) / 20); // 7-9
  } else if (levelId <= 150) {
    size = 8 + Math.floor((levelId - 100) / 25); // 8-10
  } else {
    size = Math.min(9 + Math.floor((levelId - 150) / 25), 10); // 9-10
  }
  
  const grid: Tile[][] = [];
  
  // Difficulty-based parameters - gradual progression over 200 levels
  let obstacleRate: number;
  let coinSpawnRate: number;
  let hurdleChance: number;
  let extraMoves: number;
  
  if (levelId <= 10) {
    // Easy: Few obstacles, generous moves, no hurdles
    obstacleRate = 0.06 + (levelId * 0.005);
    coinSpawnRate = 0.12;
    hurdleChance = 0;
    extraMoves = 10;
  } else if (levelId <= 30) {
    // Slightly harder: More obstacles, fewer extra moves
    obstacleRate = 0.10 + ((levelId - 10) * 0.003);
    coinSpawnRate = 0.10;
    hurdleChance = 0.01 + ((levelId - 10) * 0.002); // 1-5% chance
    extraMoves = 8;
  } else if (levelId <= 60) {
    // Medium: Hurdles appear more often
    obstacleRate = 0.14 + ((levelId - 30) * 0.002);
    coinSpawnRate = 0.08;
    hurdleChance = 0.04 + ((levelId - 30) * 0.002); // 4-10% chance
    extraMoves = 6;
  } else if (levelId <= 100) {
    // Hard: Many hurdles, tighter moves
    obstacleRate = 0.18 + ((levelId - 60) * 0.001);
    coinSpawnRate = 0.06;
    hurdleChance = 0.08 + ((levelId - 60) * 0.001); // 8-12% chance
    extraMoves = 5;
  } else if (levelId <= 150) {
    // Very Hard: Complex levels
    obstacleRate = Math.min(0.20 + ((levelId - 100) * 0.001), 0.24);
    coinSpawnRate = 0.05;
    hurdleChance = Math.min(0.10 + ((levelId - 100) * 0.001), 0.14); // 10-14% chance
    extraMoves = 4;
  } else {
    // Expert: Maximum difficulty
    obstacleRate = Math.min(0.22 + ((levelId - 150) * 0.001), 0.26);
    coinSpawnRate = 0.04;
    hurdleChance = Math.min(0.12 + ((levelId - 150) * 0.001), 0.16); // 12-16% chance
    extraMoves = 3;
  }
  // Create grid
  for (let row = 0; row < size; row++) {
    const rowTiles: Tile[] = [];
    for (let col = 0; col < size; col++) {
      const random = Math.random();
      let type: Tile['type'] = 'path';
      
      // Don't place obstacles on start, goal, or adjacent cells
      const isStart = row === 0 && col === 0;
      const isGoal = row === size - 1 && col === size - 1;
      const isNearStart = (row === 0 && col === 1) || (row === 1 && col === 0) || (row === 1 && col === 1);
      const isNearGoal = (row === size - 1 && col === size - 2) || (row === size - 2 && col === size - 1) || (row === size - 2 && col === size - 2);
      
      if (!isStart && !isGoal && !isNearStart && !isNearGoal) {
        if (random < obstacleRate) {
          type = 'obstacle';
        } else if (random < obstacleRate + hurdleChance) {
          type = 'hurdle'; // Puzzle challenge tile
        } else if (random < obstacleRate + hurdleChance + coinSpawnRate) {
          type = 'coin';
        } else if (random < obstacleRate + hurdleChance + coinSpawnRate + 0.015) {
          type = 'hint';
        } else if (random < obstacleRate + hurdleChance + coinSpawnRate + 0.025) {
          type = 'life';
        } else if (random < obstacleRate + hurdleChance + coinSpawnRate + 0.030) {
          // Power-up spawn - very rare (~0.5% each type)
          const powerUpRoll = Math.random();
          if (powerUpRoll < 0.33) {
            type = 'powerup_teleport';
          } else if (powerUpRoll < 0.66) {
            type = 'powerup_wallbreak';
          } else {
            type = 'powerup_extramoves';
          }
        }
      }
      
      // Determine tile color based on type
      let tileColor: string;
      if (type === 'obstacle') {
        tileColor = TILE_COLORS.obstacle;
      } else if (type === 'hurdle') {
        tileColor = '#FF6B35'; // Orange for hurdles
      } else if (type === 'powerup_teleport') {
        tileColor = POWER_UP_COLORS.teleport;
      } else if (type === 'powerup_wallbreak') {
        tileColor = POWER_UP_COLORS.wallbreak;
      } else if (type === 'powerup_extramoves') {
        tileColor = POWER_UP_COLORS.extramoves;
      } else {
        tileColor = TILE_COLORS.path[Math.floor(Math.random() * TILE_COLORS.path.length)];
      }
      
      rowTiles.push({
        type,
        color: tileColor,
        collected: false,
      });
    }
    grid.push(rowTiles);
  }

  // Set start and goal
  const startPos = { row: 0, col: 0 };
  const goalPos = { row: size - 1, col: size - 1 };
  
  grid[0][0] = { type: 'start', color: TILE_COLORS.start };
  grid[size - 1][size - 1] = { type: 'goal', color: TILE_COLORS.goal };
  
  // Clear cells adjacent to start and goal
  if (size > 1) {
    const adjacentCells = [
      [0, 1], [1, 0], [1, 1], // Near start
      [size - 1, size - 2], [size - 2, size - 1], [size - 2, size - 2] // Near goal
    ];
    for (const [r, c] of adjacentCells) {
      if (r >= 0 && r < size && c >= 0 && c < size && grid[r][c].type === 'obstacle') {
        grid[r][c] = { type: 'path', color: TILE_COLORS.path[0] };
      }
    }
  }
  
  // CRITICAL: Ensure there's a valid path from start to goal
  if (!hasValidPath(grid, startPos, goalPos)) {
    createGuaranteedPath(grid, startPos, goalPos);
  }
  
  // Double-check and force a diagonal path if still no valid path
  if (!hasValidPath(grid, startPos, goalPos)) {
    console.warn(`Level ${levelId} regeneration: Creating diagonal fallback path`);
    for (let i = 0; i < size; i++) {
      if (grid[i][i].type === 'obstacle') {
        grid[i][i] = { type: 'path', color: TILE_COLORS.path[0] };
      }
      // Also clear adjacent diagonal for wider path
      if (i + 1 < size && grid[i][i + 1].type === 'obstacle') {
        grid[i][i + 1] = { type: 'path', color: TILE_COLORS.path[1] };
      }
      if (i + 1 < size && grid[i + 1][i].type === 'obstacle') {
        grid[i + 1][i] = { type: 'path', color: TILE_COLORS.path[2] };
      }
    }
  }
  
  // Final verification
  if (!hasValidPath(grid, startPos, goalPos)) {
    console.error(`Level ${levelId}: CRITICAL - Still no valid path after all attempts!`);
    // Nuclear option: clear all obstacles
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c].type === 'obstacle') {
          grid[r][c] = { type: 'path', color: TILE_COLORS.path[0] };
        }
      }
    }
  }
  
  // Calculate moves based on difficulty
  const shortestPath = findPath(grid, startPos, goalPos);
  const minMoves = shortestPath ? shortestPath.length : size * 2;
  const moves = minMoves + extraMoves;
  
  return { grid, startPos, goalPos, moves };
};



// Generate levels with increasing difficulty - ENSURES SOLVABLE PATHS
// Now generates 200 levels for more gameplay
const generateLevels = (): Level[] => {
  const levels: Level[] = [];
  
  for (let i = 1; i <= 200; i++) {
    const { grid, startPos, goalPos, moves } = regenerateLevelGrid(i);
    
    levels.push({
      id: i,
      name: `Level ${i}`,
      grid,
      startPos,
      goalPos,
      moves,
      stars: 0,
      unlocked: i === 1,
      completed: false,
    });
  }
  
  return levels;
};











interface ExtendedGameState extends GameState {
  playerId: string | null;
  username: string | null;
  displayName: string | null;
  avatarColor: string;
  levelStartTime: number | null;
  fastestLevelTime: number | null;
  achievements: AchievementProgress[];
  totalCoinsEarned: number;
  dailyChallenges: DailyChallengesState;
  // Power-up inventory
  powerUpInventory: PowerUpInventory;
  // Active power-up mode for selection
  activePowerUpMode: PowerUpType | null;
  // Daily tracking for challenges
  dailyStats: {
    levelsCompleted: number;
    coinsCollected: number;
    starsEarned: number;
    perfectLevels: number;
    hintsUsed: number;
    fastCompletions: number;
  };
}

const INITIAL_STATE: ExtendedGameState = {
  coins: 50, // Reduced from 100 to 50 starting coins
  lives: 3, // Reduced from 5 to 3 starting lives
  hints: 1, // Reduced from 3 to 1 starting hint
  currentLevel: 1,
  levels: generateLevels(),
  playerPos: { row: 0, col: 0 },
  movesUsed: 0,
  isPlaying: false,
  showHint: false,
  playerId: null,
  username: null,
  displayName: null,
  avatarColor: '#8B5CF6',
  levelStartTime: null,
  fastestLevelTime: null,
  achievements: INITIAL_ACHIEVEMENT_PROGRESS,
  totalCoinsEarned: 50, // Match starting coins
  dailyChallenges: INITIAL_DAILY_CHALLENGES_STATE,
  powerUpInventory: INITIAL_POWER_UP_INVENTORY,
  activePowerUpMode: null,
  dailyStats: {
    levelsCompleted: 0,
    coinsCollected: 0,
    starsEarned: 0,
    perfectLevels: 0,
    hintsUsed: 0,
    fastCompletions: 0,
  },
};



export const useGameState = () => {
  const [state, setState] = useState<ExtendedGameState>(() => {
    const saved = localStorage.getItem('blobby-game-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure achievements array exists with all achievements
        const savedAchievements = parsed.achievements || [];
        const achievements = INITIAL_ACHIEVEMENT_PROGRESS.map(initial => {
          const saved = savedAchievements.find((a: AchievementProgress) => a.id === initial.id);
          return saved || initial;
        });
        
        // Check if daily challenges need to be reset
        const today = getTodayDateString();
        let dailyChallenges = parsed.dailyChallenges || INITIAL_DAILY_CHALLENGES_STATE;
        let dailyStats = parsed.dailyStats || INITIAL_STATE.dailyStats;
        
        if (dailyChallenges.lastResetDate !== today) {
          // Reset daily challenges for new day
          const yesterday = dailyChallenges.lastResetDate;
          const wasYesterday = isYesterday(yesterday);
          const allCompletedYesterday = dailyChallenges.allCompletedToday;
          
          dailyChallenges = {
            challenges: generateDailyChallenges(today),
            lastResetDate: today,
            streak: wasYesterday && allCompletedYesterday ? dailyChallenges.streak + 1 : (allCompletedYesterday ? 1 : 0),
            lastStreakDate: wasYesterday && allCompletedYesterday ? today : dailyChallenges.lastStreakDate,
            allCompletedToday: false,
            bonusClaimed: false,
          };
          
          // Reset daily stats
          dailyStats = {
            levelsCompleted: 0,
            coinsCollected: 0,
            starsEarned: 0,
            perfectLevels: 0,
            hintsUsed: 0,
            fastCompletions: 0,
          };
        }
        
        return { ...INITIAL_STATE, ...parsed, achievements, dailyChallenges, dailyStats };
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // Queue for newly unlocked achievements to show notifications
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Achievement | null>(null);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('blobby-game-state', JSON.stringify(state));
  }, [state]);

  // Process achievement notification queue
  useEffect(() => {
    if (!currentNotification && achievementQueue.length > 0) {
      setCurrentNotification(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [currentNotification, achievementQueue]);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Update daily challenge progress
  const updateDailyChallenges = useCallback((
    type: 'complete_levels' | 'collect_coins' | 'get_stars' | 'perfect_level' | 'use_hints' | 'fast_complete',
    amount: number = 1
  ) => {
    setState(prev => {
      const updatedChallenges = prev.dailyChallenges.challenges.map(challenge => {
        if (challenge.type === type && !challenge.completed) {
          const newProgress = challenge.progress + amount;
          return {
            ...challenge,
            progress: newProgress,
            completed: newProgress >= challenge.requirement,
          };
        }
        return challenge;
      });

      const allCompleted = updatedChallenges.every(c => c.completed);

      return {
        ...prev,
        dailyChallenges: {
          ...prev.dailyChallenges,
          challenges: updatedChallenges,
          allCompletedToday: allCompleted,
        },
      };
    });
  }, []);

  // Check and update achievements
  const checkAchievements = useCallback((newState: ExtendedGameState): AchievementProgress[] => {
    const totalStars = newState.levels.reduce((acc, l) => acc + l.stars, 0);
    const levelsCompleted = newState.levels.filter(l => l.completed).length;
    const hasThreeStarLevel = newState.levels.some(l => l.stars === 3);
    const completionTime = newState.levelStartTime 
      ? Math.floor((Date.now() - newState.levelStartTime) / 1000)
      : null;

    const newlyUnlocked: Achievement[] = [];

    const updatedAchievements = newState.achievements.map(progress => {
      const achievement = ACHIEVEMENTS.find(a => a.id === progress.id);
      if (!achievement || progress.unlocked) return progress;

      let currentProgress = progress.progress;
      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_steps':
          currentProgress = newState.levels[0]?.completed ? 1 : 0;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'star_collector':
          currentProgress = totalStars;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'star_hunter':
          currentProgress = totalStars;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'speed_runner':
          // Check if just completed a level in under 10 seconds
          if (completionTime !== null && completionTime < achievement.requirement) {
            currentProgress = achievement.requirement;
            shouldUnlock = true;
          }
          break;
        case 'coin_master':
          currentProgress = newState.totalCoinsEarned;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'wealthy':
          currentProgress = newState.totalCoinsEarned;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'perfect_game':
          currentProgress = hasThreeStarLevel ? 3 : 0;
          shouldUnlock = hasThreeStarLevel;
          break;
        case 'marathon':
          currentProgress = levelsCompleted;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'dedicated':
          currentProgress = levelsCompleted;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'completionist':
          currentProgress = levelsCompleted;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
      }

      if (shouldUnlock && !progress.unlocked) {
        newlyUnlocked.push(achievement);
        return {
          ...progress,
          progress: currentProgress,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        };
      }

      return {
        ...progress,
        progress: currentProgress,
      };
    });

    // Queue notifications for newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    }

    return updatedAchievements;
  }, []);

  // Sync stats to database when they change
  const syncToDatabase = useCallback(async () => {
    if (!state.playerId) return;
    
    const totalStars = state.levels.reduce((acc, l) => acc + l.stars, 0);
    const levelsCompleted = state.levels.filter(l => l.completed).length;
    const unlockedAchievements = state.achievements.filter(a => a.unlocked).map(a => a.id);
    
    try {
      await supabase
        .from('players')
        .update({
          total_stars: totalStars,
          levels_completed: levelsCompleted,
          total_coins: state.coins,
          fastest_level_time: state.fastestLevelTime,
          achievements: unlockedAchievements,
          daily_streak: state.dailyChallenges.streak,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.playerId);
    } catch (error) {
      console.error('Error syncing to database:', error);
    }
  }, [state.playerId, state.levels, state.coins, state.fastestLevelTime, state.achievements, state.dailyChallenges.streak]);

  // Sync on level completion
  useEffect(() => {
    if (state.playerId) {
      syncToDatabase();
    }
  }, [state.levels.filter(l => l.completed).length, syncToDatabase]);

  const getCurrentLevel = useCallback((): Level | undefined => {
    return state.levels.find(l => l.id === state.currentLevel);
  }, [state.levels, state.currentLevel]);

  const setUsername = useCallback(async (username: string, displayName?: string) => {
    const avatarColors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    
    // Helper function to set local-only username
    const setLocalUsername = () => {
      setState(prev => ({
        ...prev,
        playerId: `local_${Date.now()}`,
        username: username.toLowerCase().trim(),
        displayName: (displayName || username).trim(),
        avatarColor: randomColor,
      }));
      return { success: true, isNew: true, isLocal: true };
    };
    
    try {
      // First, test if database is accessible with a simple query
      const { error: testError } = await supabase
        .from('players')
        .select('id')
        .limit(1);
      
      // If database is not accessible, use local-only mode
      if (testError) {
        console.warn('Database not accessible, using local mode:', testError);
        return setLocalUsername();
      }
      
      // Check if username exists - use maybeSingle() to avoid error when no rows found
      const { data: existing, error: checkError } = await supabase
        .from('players')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      // If there was an error other than "no rows", use local mode
      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Error checking username, using local mode:', checkError);
        return setLocalUsername();
      }

      if (existing) {
        // Login to existing account
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('username', username.toLowerCase())
          .single();
        
        if (playerError) {
          console.warn('Error fetching player, using local mode:', playerError);
          return setLocalUsername();
        }
        
        if (player) {
          setState(prev => ({
            ...prev,
            playerId: player.id,
            username: player.username,
            displayName: player.display_name,
            avatarColor: player.avatar_color,
          }));
          return { success: true, isNew: false };
        }
      } else {
        // Create new player
        const totalStars = state.levels.reduce((acc, l) => acc + l.stars, 0);
        const levelsCompleted = state.levels.filter(l => l.completed).length;
        const unlockedAchievements = state.achievements.filter(a => a.unlocked).map(a => a.id);
        
        // Ensure all values are properly typed for database insertion
        const playerData = {
          username: username.toLowerCase().trim(),
          display_name: (displayName || username).trim(),
          avatar_color: randomColor,
          total_stars: Math.max(0, Number(totalStars) || 0),
          levels_completed: Math.max(0, Number(levelsCompleted) || 0),
          total_coins: Math.max(0, Number(state.coins) || 0),
          fastest_level_time: state.fastestLevelTime ? Math.max(0, Number(state.fastestLevelTime)) : null,
          achievements: unlockedAchievements || [],
          daily_streak: Math.max(0, Number(state.dailyChallenges?.streak) || 0),
        };
        
        console.log('Creating player with data:', JSON.stringify(playerData));
        
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert(playerData)
          .select()
          .single();

        if (error) {
          console.warn('Error creating player, using local mode:', error);
          // Fall back to local mode instead of showing error
          return setLocalUsername();
        }

        if (newPlayer) {
          setState(prev => ({
            ...prev,
            playerId: newPlayer.id,
            username: newPlayer.username,
            displayName: newPlayer.display_name,
            avatarColor: newPlayer.avatar_color,
          }));
          return { success: true, isNew: true };
        }
      }
    } catch (error: any) {
      console.warn('Connection error, using local mode:', error);
      // Fall back to local mode on any error
      return setLocalUsername();
    }
    
    // If we get here, something unexpected happened - use local mode
    return setLocalUsername();
  }, [state.levels, state.coins, state.fastestLevelTime, state.achievements, state.dailyChallenges?.streak]);








  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!state.playerId) return false;
    
    try {
      await supabase
        .from('players')
        .update({ display_name: displayName })
        .eq('id', state.playerId);
      
      setState(prev => ({ ...prev, displayName }));
      return true;
    } catch (error) {
      console.error('Error updating display name:', error);
      return false;
    }
  }, [state.playerId]);

  const updateAvatarColor = useCallback(async (color: string) => {
    if (!state.playerId) return false;
    
    try {
      await supabase
        .from('players')
        .update({ avatar_color: color })
        .eq('id', state.playerId);
      
      setState(prev => ({ ...prev, avatarColor: color }));
      return true;
    } catch (error) {
      console.error('Error updating avatar color:', error);
      return false;
    }
  }, [state.playerId]);

  const startLevel = useCallback((levelId: number) => {
    const level = state.levels.find(l => l.id === levelId);
    if (!level || !level.unlocked) return;
    
    // Log analytics event
    Analytics.logLevelStart(levelId, level.name);
    
    // CRITICAL: Check if the level has a valid path - if not, regenerate it
    // This fixes levels that were generated with old buggy code
    let gridToUse = level.grid;
    let movesToUse = level.moves;
    
    if (!hasValidPath(level.grid, level.startPos, level.goalPos)) {
      console.warn(`Level ${levelId} has no valid path - regenerating...`);
      const regenerated = regenerateLevelGrid(levelId);
      gridToUse = regenerated.grid;
      movesToUse = regenerated.moves;
    }
    
    // Reset the level grid (regenerate collectibles)
    const newGrid = gridToUse.map(row => 
      row.map(tile => ({ ...tile, collected: false }))
    );
    
    setState(prev => ({
      ...prev,
      currentLevel: levelId,
      playerPos: { ...level.startPos },
      movesUsed: 0,
      isPlaying: true,
      showHint: false,
      levelStartTime: Date.now(),
      levels: prev.levels.map(l => 
        l.id === levelId ? { ...l, grid: newGrid, moves: movesToUse } : l
      ),
    }));
  }, [state.levels]);




  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!state.isPlaying) return;
    
    const level = getCurrentLevel();
    if (!level) return;
    
    const { row, col } = state.playerPos;
    let newRow = row;
    let newCol = col;
    
    switch (direction) {
      case 'up': newRow = row - 1; break;
      case 'down': newRow = row + 1; break;
      case 'left': newCol = col - 1; break;
      case 'right': newCol = col + 1; break;
    }
    
    // Check bounds
    if (newRow < 0 || newRow >= level.grid.length || newCol < 0 || newCol >= level.grid[0].length) {
      return;
    }
    
    const targetTile = level.grid[newRow][newCol];
    
    // Can't move to obstacles
    if (targetTile.type === 'obstacle') {
      return;
    }
    
    // Haptic feedback on valid move (native only)
    hapticFeedback('light');
    
    // Move player
    setState(prev => {

      const newMovesUsed = prev.movesUsed + 1;
      let newCoins = prev.coins;
      let newTotalCoinsEarned = prev.totalCoinsEarned;
      let newHints = prev.hints;
      let newLives = prev.lives;
      let newFastestTime = prev.fastestLevelTime;
      let coinsCollectedThisMove = 0;
      let newPowerUpInventory = { ...prev.powerUpInventory };
      
      // Collect items - reduced coin value from 10 to 3
      if (targetTile.type === 'coin' && !targetTile.collected) {
        newCoins += 3; // Reduced from 10 to 3
        newTotalCoinsEarned += 3;
        coinsCollectedThisMove = 3;
      } else if (targetTile.type === 'hint' && !targetTile.collected) {
        newHints += 1;
      } else if (targetTile.type === 'life' && !targetTile.collected) {
        newLives += 1;
      } else if (targetTile.type === 'powerup_teleport' && !targetTile.collected) {
        newPowerUpInventory.teleport += 1;
      } else if (targetTile.type === 'powerup_wallbreak' && !targetTile.collected) {
        newPowerUpInventory.wallbreak += 1;
      } else if (targetTile.type === 'powerup_extramoves' && !targetTile.collected) {
        newPowerUpInventory.extramoves += 1;
      }

      
      // Mark tile as collected
      const newLevels = prev.levels.map(l => {
        if (l.id === prev.currentLevel) {
          const newGrid = l.grid.map((r, ri) => 
            r.map((t, ci) => 
              ri === newRow && ci === newCol ? { ...t, collected: true } : t
            )
          );
          return { ...l, grid: newGrid };
        }
        return l;
      });
      
      // Check if reached goal
      const currentLvl = newLevels.find(l => l.id === prev.currentLevel);
      const isGoal = targetTile.type === 'goal';
      
      if (isGoal && currentLvl) {
        // Calculate completion time
        const completionTime = prev.levelStartTime 
          ? Math.floor((Date.now() - prev.levelStartTime) / 1000)
          : null;
        
        // Update fastest time
        if (completionTime && (!newFastestTime || completionTime < newFastestTime)) {
          newFastestTime = completionTime;
        }
        
        // Calculate stars
        const movesLeft = currentLvl.moves - newMovesUsed;
        const stars = movesLeft >= currentLvl.moves * 0.5 ? 3 : 
                      movesLeft >= currentLvl.moves * 0.25 ? 2 : 1;
        
        // Log analytics event for level completion
        Analytics.logLevelComplete(prev.currentLevel, stars, newMovesUsed, completionTime || undefined);
        
        // Unlock next level and mark current as completed
        const finalLevels = newLevels.map(l => {
          if (l.id === prev.currentLevel) {
            return { ...l, completed: true, stars: Math.max(l.stars, stars) };
          }
          if (l.id === prev.currentLevel + 1) {
            return { ...l, unlocked: true };
          }
          return l;
        });
        // Award completion bonus - reduced from 25 + (stars * 10) to 10 + (stars * 5)
        const bonus = 10 + (stars * 5); // 1 star = 15, 2 stars = 20, 3 stars = 25 (down from 35/45/55)
        newCoins += bonus;
        newTotalCoinsEarned += bonus;

        
        // Update daily stats and challenges
        const newDailyStats = {
          ...prev.dailyStats,
          levelsCompleted: prev.dailyStats.levelsCompleted + 1,
          coinsCollected: prev.dailyStats.coinsCollected + bonus + coinsCollectedThisMove,
          starsEarned: prev.dailyStats.starsEarned + stars,
          perfectLevels: prev.dailyStats.perfectLevels + (stars === 3 ? 1 : 0),
          fastCompletions: prev.dailyStats.fastCompletions + (completionTime && completionTime < 15 ? 1 : 0),
        };

        // Update daily challenges
        const updatedChallenges = prev.dailyChallenges.challenges.map(challenge => {
          if (challenge.completed) return challenge;
          
          let newProgress = challenge.progress;
          switch (challenge.type) {
            case 'complete_levels':
              newProgress = newDailyStats.levelsCompleted;
              break;
            case 'collect_coins':
              newProgress = newDailyStats.coinsCollected;
              break;
            case 'get_stars':
              newProgress = newDailyStats.starsEarned;
              break;
            case 'perfect_level':
              newProgress = newDailyStats.perfectLevels;
              break;
            case 'fast_complete':
              newProgress = newDailyStats.fastCompletions;
              break;
          }
          
          return {
            ...challenge,
            progress: newProgress,
            completed: newProgress >= challenge.requirement,
          };
        });

        const allChallengesCompleted = updatedChallenges.every(c => c.completed);
        
        const newState = {
          ...prev,
          playerPos: { row: newRow, col: newCol },
          movesUsed: newMovesUsed,
          coins: newCoins,
          totalCoinsEarned: newTotalCoinsEarned,
          hints: newHints,
          lives: newLives,
          levels: finalLevels,
          isPlaying: false,
          fastestLevelTime: newFastestTime,
          dailyStats: newDailyStats,
          dailyChallenges: {
            ...prev.dailyChallenges,
            challenges: updatedChallenges,
            allCompletedToday: allChallengesCompleted,
          },
        };

        // Check achievements after level completion
        const updatedAchievements = checkAchievements(newState);
        
        return {
          ...newState,
          achievements: updatedAchievements,
        };
      }

      
      // Check if out of moves
      if (currentLvl && newMovesUsed >= currentLvl.moves) {
        return {
          ...prev,
          playerPos: { row: newRow, col: newCol },
          movesUsed: newMovesUsed,
          coins: newCoins,
          totalCoinsEarned: newTotalCoinsEarned,
          hints: newHints,
          lives: Math.max(0, newLives - 1),
          levels: newLevels,
          isPlaying: false,
        };
      }
      
      // Update coin collection for daily challenge (even without completing level)
      let updatedDailyStats = prev.dailyStats;
      let updatedDailyChallenges = prev.dailyChallenges;
      
      if (coinsCollectedThisMove > 0) {
        updatedDailyStats = {
          ...prev.dailyStats,
          coinsCollected: prev.dailyStats.coinsCollected + coinsCollectedThisMove,
        };
        
        updatedDailyChallenges = {
          ...prev.dailyChallenges,
          challenges: prev.dailyChallenges.challenges.map(challenge => {
            if (challenge.type === 'collect_coins' && !challenge.completed) {
              const newProgress = updatedDailyStats.coinsCollected;
              return {
                ...challenge,
                progress: newProgress,
                completed: newProgress >= challenge.requirement,
              };
            }
            return challenge;
          }),
        };
      }
      
      return {
        ...prev,
        playerPos: { row: newRow, col: newCol },
        movesUsed: newMovesUsed,
        coins: newCoins,
        totalCoinsEarned: newTotalCoinsEarned,
        hints: newHints,
        lives: newLives,
        levels: newLevels,
        powerUpInventory: newPowerUpInventory,
        dailyStats: updatedDailyStats,
        dailyChallenges: updatedDailyChallenges,
      };
    });
  }, [state.isPlaying, state.playerPos, getCurrentLevel, checkAchievements]);

  // Power-up usage functions
  const useTeleport = useCallback((targetPos: Position) => {
    if (state.powerUpInventory.teleport <= 0 || !state.isPlaying) return false;
    
    const level = getCurrentLevel();
    if (!level) return false;
    
    // Check if target is valid (not obstacle, within bounds, not current position)
    const { row, col } = targetPos;
    if (
      row < 0 || row >= level.grid.length ||
      col < 0 || col >= level.grid[0].length ||
      level.grid[row][col].type === 'obstacle' ||
      (row === state.playerPos.row && col === state.playerPos.col)
    ) {
      return false;
    }
    
    hapticFeedback('medium');
    
    setState(prev => ({
      ...prev,
      playerPos: targetPos,
      powerUpInventory: {
        ...prev.powerUpInventory,
        teleport: prev.powerUpInventory.teleport - 1,
      },
      activePowerUpMode: null,
    }));
    
    return true;
  }, [state.powerUpInventory.teleport, state.isPlaying, state.playerPos, getCurrentLevel]);

  const useWallBreak = useCallback((targetPos: Position) => {
    if (state.powerUpInventory.wallbreak <= 0 || !state.isPlaying) return false;
    
    const level = getCurrentLevel();
    if (!level) return false;
    
    const { row, col } = targetPos;
    
    // Check if target is a valid obstacle
    if (
      row < 0 || row >= level.grid.length ||
      col < 0 || col >= level.grid[0].length ||
      level.grid[row][col].type !== 'obstacle'
    ) {
      return false;
    }
    
    hapticFeedback('heavy');
    
    setState(prev => {
      const newLevels = prev.levels.map(l => {
        if (l.id === prev.currentLevel) {
          const newGrid = l.grid.map((r, ri) =>
            r.map((t, ci) =>
              ri === row && ci === col
                ? { type: 'path' as const, color: TILE_COLORS.path[0], collected: false }
                : t
            )
          );
          return { ...l, grid: newGrid };
        }
        return l;
      });
      
      return {
        ...prev,
        levels: newLevels,
        powerUpInventory: {
          ...prev.powerUpInventory,
          wallbreak: prev.powerUpInventory.wallbreak - 1,
        },
        activePowerUpMode: null,
      };
    });
    
    return true;
  }, [state.powerUpInventory.wallbreak, state.isPlaying, getCurrentLevel]);

  const useExtraMoves = useCallback(() => {
    if (state.powerUpInventory.extramoves <= 0 || !state.isPlaying) return false;
    
    hapticFeedback('light');
    
    setState(prev => {
      const newLevels = prev.levels.map(l => {
        if (l.id === prev.currentLevel) {
          return { ...l, moves: l.moves + 3 };
        }
        return l;
      });
      
      return {
        ...prev,
        levels: newLevels,
        powerUpInventory: {
          ...prev.powerUpInventory,
          extramoves: prev.powerUpInventory.extramoves - 1,
        },
        activePowerUpMode: null,
      };
    });
    
    return true;
  }, [state.powerUpInventory.extramoves, state.isPlaying]);

  const setActivePowerUpMode = useCallback((mode: PowerUpType | null) => {
    setState(prev => ({ ...prev, activePowerUpMode: mode }));
  }, []);

  const addPowerUp = useCallback((type: PowerUpType, amount: number = 1) => {
    setState(prev => ({
      ...prev,
      powerUpInventory: {
        ...prev.powerUpInventory,
        [type]: prev.powerUpInventory[type] + amount,
      },
    }));
  }, []);


  const useHint = useCallback(() => {
    if (state.hints <= 0) return;
    
    setState(prev => {
      // Update daily stats for hint usage
      const newDailyStats = {
        ...prev.dailyStats,
        hintsUsed: prev.dailyStats.hintsUsed + 1,
      };
      
      // Update daily challenges for hint usage
      const updatedChallenges = prev.dailyChallenges.challenges.map(challenge => {
        if (challenge.type === 'use_hints' && !challenge.completed) {
          const newProgress = newDailyStats.hintsUsed;
          return {
            ...challenge,
            progress: newProgress,
            completed: newProgress >= challenge.requirement,
          };
        }
        return challenge;
      });
      
      return {
        ...prev,
        hints: prev.hints - 1,
        showHint: true,
        dailyStats: newDailyStats,
        dailyChallenges: {
          ...prev.dailyChallenges,
          challenges: updatedChallenges,
        },
      };
    });
    
    // Hide hint after 4 seconds (extended from 3s to give more time to follow the path)
    setTimeout(() => {
      setState(prev => ({ ...prev, showHint: false }));
    }, 4000);
  }, [state.hints]);


  const purchaseWithCoins = useCallback((type: 'lives' | 'hints', amount: number, cost: number) => {
    if (state.coins < cost) return false;
    
    setState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      [type]: prev[type] + amount,
    }));
    
    return true;
  }, [state.coins]);

  const addCoins = useCallback((amount: number) => {
    setState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins + amount,
        totalCoinsEarned: prev.totalCoinsEarned + amount,
      };
      const updatedAchievements = checkAchievements(newState);
      return { ...newState, achievements: updatedAchievements };
    });
  }, [checkAchievements]);

  const addLives = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      lives: prev.lives + amount,
    }));
  }, []);

  const addHints = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      hints: prev.hints + amount,
    }));
  }, []);

  const claimDailyChallengeReward = useCallback((challenge: DailyChallenge) => {
    if (!challenge.completed) return;
    
    setState(prev => {
      // Add rewards
      let newCoins = prev.coins + challenge.reward.coins;
      let newHints = prev.hints + (challenge.reward.hints || 0);
      let newLives = prev.lives + (challenge.reward.lives || 0);
      let newTotalCoinsEarned = prev.totalCoinsEarned + challenge.reward.coins;
      
      return {
        ...prev,
        coins: newCoins,
        hints: newHints,
        lives: newLives,
        totalCoinsEarned: newTotalCoinsEarned,
      };
    });
  }, []);

  const claimDailyBonus = useCallback(() => {
    if (!state.dailyChallenges.allCompletedToday || state.dailyChallenges.bonusClaimed) return;
    
    setState(prev => {
      const today = getTodayDateString();
      const yesterday = prev.dailyChallenges.lastStreakDate;
      const wasYesterday = yesterday ? isYesterday(yesterday) : false;
      
      return {
        ...prev,
        coins: prev.coins + DAILY_BONUS_REWARD.coins,
        lives: prev.lives + DAILY_BONUS_REWARD.lives,
        hints: prev.hints + DAILY_BONUS_REWARD.hints,
        totalCoinsEarned: prev.totalCoinsEarned + DAILY_BONUS_REWARD.coins,
        dailyChallenges: {
          ...prev.dailyChallenges,
          bonusClaimed: true,
          streak: wasYesterday ? prev.dailyChallenges.streak : prev.dailyChallenges.streak + 1,
          lastStreakDate: today,
        },
      };
    });
  }, [state.dailyChallenges.allCompletedToday, state.dailyChallenges.bonusClaimed]);

  const resetProgress = useCallback(() => {
    localStorage.removeItem('blobby-game-state');
    setState({ ...INITIAL_STATE, levels: generateLevels() });
  }, []);

  const exitLevel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  // Skip Level feature - costs coins to skip a difficult level
  const SKIP_LEVEL_COST = 50;
  
  const skipLevel = useCallback((levelId: number): { success: boolean; message: string } => {
    // Check if player has enough coins
    if (state.coins < SKIP_LEVEL_COST) {
      return { 
        success: false, 
        message: `Not enough coins! You need ${SKIP_LEVEL_COST} coins to skip this level.` 
      };
    }
    
    // Find the level
    const levelIndex = state.levels.findIndex(l => l.id === levelId);
    if (levelIndex === -1) {
      return { success: false, message: 'Level not found!' };
    }
    
    const level = state.levels[levelIndex];
    
    // Can't skip if already completed
    if (level.completed) {
      return { success: false, message: 'This level is already completed!' };
    }
    
    // Can't skip if not unlocked
    if (!level.unlocked) {
      return { success: false, message: 'This level is not unlocked yet!' };
    }
    // Can't skip the last level
    if (levelId >= 200) {
      return { success: false, message: 'Cannot skip the final level!' };
    }

    

    
    setState(prev => {
      const newLevels = prev.levels.map(l => {
        if (l.id === levelId) {
          // Mark as completed with 0 stars (skipped)
          return { ...l, completed: true, stars: 0 };
        }
        if (l.id === levelId + 1) {
          // Unlock next level
          return { ...l, unlocked: true };
        }
        return l;
      });
      
      return {
        ...prev,
        coins: prev.coins - SKIP_LEVEL_COST,
        levels: newLevels,
        isPlaying: false,
        currentLevel: levelId + 1, // Move to next level
      };
    });
    
    return { 
      success: true, 
      message: `Level ${levelId} skipped! You can always come back to earn stars.` 
    };
  }, [state.coins, state.levels]);

  const getSkipLevelCost = useCallback(() => SKIP_LEVEL_COST, []);

  const getPlayerStats = useCallback(() => {
    return {
      totalStars: state.levels.reduce((acc, l) => acc + l.stars, 0),
      levelsCompleted: state.levels.filter(l => l.completed).length,
      fastestTime: state.fastestLevelTime,
    };
  }, [state.levels, state.fastestLevelTime]);

  const getAchievementStats = useCallback(() => {
    const unlocked = state.achievements.filter(a => a.unlocked).length;
    const total = ACHIEVEMENTS.length;
    return { unlocked, total };
  }, [state.achievements]);

  const getDailyChallengeStats = useCallback(() => {
    const completed = state.dailyChallenges.challenges.filter(c => c.completed).length;
    const total = state.dailyChallenges.challenges.length;
    return { completed, total, streak: state.dailyChallenges.streak };
  }, [state.dailyChallenges]);

  return {
    state,
    getCurrentLevel,
    startLevel,
    movePlayer,
    useHint,
    purchaseWithCoins,
    addCoins,
    addLives,
    addHints,
    resetProgress,
    exitLevel,
    skipLevel,
    getSkipLevelCost,
    setUsername,
    updateDisplayName,
    updateAvatarColor,
    getPlayerStats,
    syncToDatabase,
    getAchievementStats,
    getDailyChallengeStats,
    currentNotification,
    dismissNotification,
    claimDailyChallengeReward,
    claimDailyBonus,
    // Power-up functions
    useTeleport,
    useWallBreak,
    useExtraMoves,
    setActivePowerUpMode,
    addPowerUp,
  };
};


// Helper function to check if a date string is yesterday
function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}
