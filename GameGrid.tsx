import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Level, Position, GAME_IMAGES } from '../../types/game';
import PuzzleChallengeModal, { PuzzleChallenge, getPuzzleForLevel } from './PuzzleChallengeModal';
import AskFriendModal from './AskFriendModal';

interface GameGridProps {
  level: Level;
  playerPos: Position;
  movesUsed: number;
  showHint: boolean;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onUseHint: () => void;
  onExit: () => void;
  hints: number;
  coins: number;
  onSkipLevel?: (levelId: number) => { success: boolean; message: string };
  skipLevelCost?: number;
}

interface PathStep {
  row: number;
  col: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

const MAX_VISIBLE_STEPS = 5; // Show first 5 steps of the path

const GameGrid: React.FC<GameGridProps> = ({
  level,
  playerPos,
  movesUsed,
  showHint,
  onMove,
  onUseHint,
  onExit,
  hints,
  coins,
  onSkipLevel,
  skipLevelCost = 50,
}) => {
  const movesLeft = level.moves - movesUsed;
  const canSkip = coins >= skipLevelCost && level.id < 100;

  const [hintPath, setHintPath] = useState<PathStep[]>([]);
  const [visibleHintPath, setVisibleHintPath] = useState<PathStep[]>([]);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const [hintFading, setHintFading] = useState(false);
  const [hintAnimationStep, setHintAnimationStep] = useState(0);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Puzzle challenge state
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showAskFriend, setShowAskFriend] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleChallenge | null>(null);
  const [pendingMove, setPendingMove] = useState<{ direction: 'up' | 'down' | 'left' | 'right'; targetPos: Position } | null>(null);
  const [solvedHurdles, setSolvedHurdles] = useState<Set<string>>(new Set());

  // Reset solved hurdles when level changes
  useEffect(() => {
    setSolvedHurdles(new Set());
  }, [level.id]);

  // Handle move with hurdle detection
  const handleMoveWithHurdle = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (showSkipConfirm || showPuzzle || showAskFriend) return;
    
    const { row, col } = playerPos;
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
    
    // Check if it's a hurdle tile that hasn't been solved yet
    const hurdleKey = `${newRow},${newCol}`;
    if (targetTile.type === 'hurdle' && !solvedHurdles.has(hurdleKey)) {
      // Generate a puzzle for this hurdle
      const puzzle = getPuzzleForLevel(level.id);
      setCurrentPuzzle(puzzle);
      setPendingMove({ direction, targetPos: { row: newRow, col: newCol } });
      setShowPuzzle(true);
      return;
    }
    
    // Normal move
    onMove(direction);
  }, [playerPos, level, onMove, showSkipConfirm, showPuzzle, showAskFriend, solvedHurdles]);

  // Handle puzzle correct answer
  const handlePuzzleCorrect = useCallback(() => {
    if (pendingMove) {
      // Mark hurdle as solved
      const hurdleKey = `${pendingMove.targetPos.row},${pendingMove.targetPos.col}`;
      setSolvedHurdles(prev => new Set(prev).add(hurdleKey));
      
      // Execute the pending move
      onMove(pendingMove.direction);
    }
    setShowPuzzle(false);
    setCurrentPuzzle(null);
    setPendingMove(null);
  }, [pendingMove, onMove]);

  // Handle puzzle incorrect answer
  const handlePuzzleIncorrect = useCallback(() => {
    // Don't allow the move - player must try again or use Ask a Friend
    setShowPuzzle(false);
    setCurrentPuzzle(null);
    setPendingMove(null);
  }, []);

  // Handle Ask a Friend
  const handleAskFriend = useCallback(() => {
    setShowPuzzle(false);
    setShowAskFriend(true);
  }, []);

  // Handle using the answer from Ask a Friend
  const handleUseAnswer = useCallback((answer: string) => {
    if (pendingMove && currentPuzzle) {
      // Mark hurdle as solved since they got help
      const hurdleKey = `${pendingMove.targetPos.row},${pendingMove.targetPos.col}`;
      setSolvedHurdles(prev => new Set(prev).add(hurdleKey));
      
      // Execute the pending move
      onMove(pendingMove.direction);
    }
    setShowAskFriend(false);
    setCurrentPuzzle(null);
    setPendingMove(null);
  }, [pendingMove, currentPuzzle, onMove]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showSkipConfirm || showPuzzle || showAskFriend) return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        handleMoveWithHurdle('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        handleMoveWithHurdle('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        handleMoveWithHurdle('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        handleMoveWithHurdle('right');
        break;
    }
  }, [handleMoveWithHurdle, showSkipConfirm, showPuzzle, showAskFriend]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate full path to goal using BFS
  const calculateHintPath = useCallback((): PathStep[] => {
    const { row: startRow, col: startCol } = playerPos;
    const { row: goalRow, col: goalCol } = level.goalPos;
    
    // BFS to find shortest path
    const queue: { row: number; col: number; path: PathStep[] }[] = [
      { row: startRow, col: startCol, path: [] }
    ];
    const visited = new Set<string>();
    visited.add(`${startRow},${startCol}`);
    
    const directions: { dr: number; dc: number; dir: 'up' | 'down' | 'left' | 'right' }[] = [
      { dr: -1, dc: 0, dir: 'up' },
      { dr: 1, dc: 0, dir: 'down' },
      { dr: 0, dc: -1, dir: 'left' },
      { dr: 0, dc: 1, dir: 'right' },
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.row === goalRow && current.col === goalCol) {
        return current.path;
      }
      
      for (const { dr, dc, dir } of directions) {
        const newRow = current.row + dr;
        const newCol = current.col + dc;
        const key = `${newRow},${newCol}`;
        
        if (
          newRow >= 0 && newRow < level.grid.length &&
          newCol >= 0 && newCol < level.grid[0].length &&
          level.grid[newRow][newCol].type !== 'obstacle' &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({
            row: newRow,
            col: newCol,
            path: [...current.path, { row: newRow, col: newCol, direction: dir }]
          });
        }
      }
    }
    
    return [];
  }, [playerPos, level]);

  // Update hint path when showHint changes
  useEffect(() => {
    // Clear any existing timeouts
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    
    if (showHint) {
      const path = calculateHintPath();
      setHintPath(path);
      setHintFading(false);
      setHintAnimationStep(0);
      
      // Limit visible path to MAX_VISIBLE_STEPS
      const limitedPath = path.slice(0, MAX_VISIBLE_STEPS);
      setVisibleHintPath(limitedPath);
      
      // Generate helpful hint message
      if (path.length > 0) {
        const firstStep = path[0];
        const directionText = {
          up: 'UP',
          down: 'DOWN',
          left: 'LEFT',
          right: 'RIGHT'
        };
        const keyHint = {
          up: '(W or ↑)',
          down: '(S or ↓)',
          left: '(A or ←)',
          right: '(D or →)'
        };
        
        const stepsToGoal = path.length;
        let message = `Go ${directionText[firstStep.direction]} ${keyHint[firstStep.direction]}`;
        
        if (stepsToGoal === 1) {
          message = `One step ${directionText[firstStep.direction]} to reach the goal!`;
        } else if (stepsToGoal <= MAX_VISIBLE_STEPS) {
          message += ` — ${stepsToGoal} steps to the goal`;
        } else {
          message += ` — showing ${MAX_VISIBLE_STEPS} of ${stepsToGoal} steps`;
        }
        
        // Add tip about collectibles on the visible path
        const collectiblesOnPath = limitedPath.filter(step => {
          const tile = level.grid[step.row][step.col];
          return (tile.type === 'coin' || tile.type === 'life' || tile.type === 'hint') && !tile.collected;
        });
        
        if (collectiblesOnPath.length > 0) {
          message += ` — ${collectiblesOnPath.length} item${collectiblesOnPath.length > 1 ? 's' : ''} ahead!`;
        }
        
        setHintMessage(message);
      } else {
        setHintMessage('No path found! The level may need to regenerate.');
      }
      
      // Animate steps appearing one by one
      let step = 0;
      animationIntervalRef.current = setInterval(() => {
        step++;
        setHintAnimationStep(step);
        if (step >= limitedPath.length) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
          }
        }
      }, 150);
      
      // Start fading after 3.5 seconds (hint lasts 4 seconds total)
      hintTimeoutRef.current = setTimeout(() => {
        setHintFading(true);
      }, 3500);
      
    } else {
      setHintPath([]);
      setVisibleHintPath([]);
      setHintMessage('');
      setHintFading(false);
      setHintAnimationStep(0);
    }
    
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [showHint, calculateHintPath, level.grid]);



  // Get arrow rotation for direction
  const getArrowRotation = (direction: 'up' | 'down' | 'left' | 'right'): string => {
    switch (direction) {
      case 'up': return 'rotate-0';
      case 'right': return 'rotate-90';
      case 'down': return 'rotate-180';
      case 'left': return '-rotate-90';
    }
  };

  // Check if a cell is on the visible hint path
  const getVisiblePathStepIndex = (row: number, col: number): number => {
    return visibleHintPath.findIndex(step => step.row === row && step.col === col);
  };

  // Get the direction for a path step
  const getPathDirection = (row: number, col: number): 'up' | 'down' | 'left' | 'right' | null => {
    const step = visibleHintPath.find(s => s.row === row && s.col === col);
    return step?.direction || null;
  };

  // Get animation delay for staggered appearance
  const getAnimationDelay = (stepIndex: number): string => {
    return `${stepIndex * 150}ms`;
  };

  // Check if step should be visible based on animation progress
  const isStepVisible = (stepIndex: number): boolean => {
    return stepIndex < hintAnimationStep;
  };

  const handleSkipLevel = () => {
    if (!onSkipLevel) return;
    
    const result = onSkipLevel(level.id);
    if (!result.success) {
      setSkipMessage(result.message);
      setTimeout(() => setSkipMessage(null), 3000);
      setShowSkipConfirm(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Level Info */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-white">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-400">Level</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-400">{level.id}</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-400">Moves Left</div>
          <div className={`text-xl sm:text-2xl font-bold ${movesLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {movesLeft}
          </div>
        </div>
        <button
          onClick={onUseHint}
          disabled={hints <= 0}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
            hints > 0 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <img src={GAME_IMAGES.hint} alt="Hint" className="w-5 h-5 rounded-full" />
          Hint ({hints})
        </button>
        
        {/* Skip Level Button */}
        {onSkipLevel && level.id < 100 && (

          <button
            onClick={() => canSkip ? setShowSkipConfirm(true) : setSkipMessage(`Need ${skipLevelCost} coins to skip`)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
              canSkip
                ? 'bg-gradient-to-r from-orange-500/30 to-yellow-500/30 border border-orange-500/50 text-orange-300 hover:from-orange-500/40 hover:to-yellow-500/40'
                : 'bg-gray-700/50 border border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
            title={canSkip ? `Skip level for ${skipLevelCost} coins` : `Need ${skipLevelCost} coins`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            <span className="hidden sm:inline">Skip</span>
            <img src={GAME_IMAGES.coin} alt="Coins" className="w-4 h-4 rounded-full" />
            <span className={canSkip ? 'text-yellow-300' : ''}>{skipLevelCost}</span>
          </button>
        )}
        
        <button
          onClick={onExit}
          className="px-3 sm:px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors text-sm sm:text-base"
        >
          Exit
        </button>
      </div>

      {/* Skip Message */}
      {skipMessage && (
        <div className="w-full max-w-md mx-auto animate-fade-in">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm text-center">
            {skipMessage}
          </div>
        </div>
      )}

      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div className="w-full max-w-md mx-auto animate-fade-in">
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-400/50 rounded-xl p-4 shadow-lg">
            <div className="text-center mb-3">
              <h3 className="text-lg font-bold text-orange-300">Skip Level {level.id}?</h3>
              <p className="text-gray-300 text-sm mt-1">
                This will cost <span className="text-yellow-300 font-bold">{skipLevelCost} coins</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">
                You can always come back later to earn stars!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipLevel}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hint Message Panel */}
      {showHint && hintMessage && (
        <div className={`w-full max-w-md mx-auto transition-all duration-500 ${hintFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400 rounded-xl p-4 shadow-lg shadow-yellow-500/30 animate-pulse-slow">
            <div className="flex items-start gap-3">
              {/* Hint Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-bounce">
                <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                </svg>
              </div>
              
              {/* Hint Text */}
              <div className="flex-1">
                <div className="text-yellow-300 font-bold text-sm mb-1 flex items-center gap-2">
                  <span>PATH HINT</span>
                  <span className="text-xs text-yellow-200/70">({visibleHintPath.length} of {hintPath.length} steps shown)</span>
                </div>
                <div className="text-white font-medium text-base leading-snug">
                  {hintMessage}
                </div>
              </div>
              
              {/* Large Direction Arrow */}
              {hintPath.length > 0 && (
                <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50 ${getArrowRotation(hintPath[0].direction)}`}>
                  <svg className="w-10 h-10 text-black animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Step-by-step Path Preview */}
            {visibleHintPath.length > 0 && (
              <div className="mt-4 pt-3 border-t border-yellow-400/40">
                <div className="text-yellow-300/80 text-xs mb-2 font-medium">Follow these steps:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {visibleHintPath.map((step, index) => (
                    <React.Fragment key={index}>
                      <div 
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                          isStepVisible(index) 
                            ? index === 0 
                              ? 'bg-yellow-500 text-black scale-110 shadow-lg shadow-yellow-500/50' 
                              : 'bg-yellow-500/40 text-yellow-100'
                            : 'bg-gray-700/50 text-gray-500 scale-90 opacity-50'
                        }`}
                        style={{ 
                          transitionDelay: getAnimationDelay(index),
                        }}
                      >
                        <span className="font-bold text-sm">{index + 1}</span>
                        <div className={`${getArrowRotation(step.direction)}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                          </svg>
                        </div>
                      </div>
                      {index < visibleHintPath.length - 1 && (
                        <svg className={`w-3 h-3 transition-opacity duration-300 ${isStepVisible(index) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                      )}
                    </React.Fragment>
                  ))}
                  {hintPath.length > MAX_VISIBLE_STEPS && (
                    <div className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm font-medium">
                      +{hintPath.length - MAX_VISIBLE_STEPS} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Timer indicator */}
            <div className="mt-3 h-1 bg-black/30 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-[3000ms] ease-linear ${showHint ? 'w-0' : 'w-full'}`}
                style={{ width: showHint && !hintFading ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Grid */}
      <div 
        className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 shadow-2xl"
        style={{
          backgroundImage: `url(${GAME_IMAGES.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 rounded-2xl" />
        <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${level.grid[0].length}, 1fr)` }}>
          {level.grid.map((row, rowIndex) =>
            row.map((tile, colIndex) => {
              const isPlayer = playerPos.row === rowIndex && playerPos.col === colIndex;
              const pathStepIndex = getVisiblePathStepIndex(rowIndex, colIndex);
              const isOnPath = showHint && pathStepIndex !== -1 && isStepVisible(pathStepIndex);
              const isNextStep = showHint && pathStepIndex === 0 && isStepVisible(0);
              const pathDirection = getPathDirection(rowIndex, colIndex);
              const isGoal = tile.type === 'goal';
              const isStart = tile.type === 'start';
              const isHurdle = tile.type === 'hurdle';
              const hurdleKey = `${rowIndex},${colIndex}`;
              const isHurdleSolved = solvedHurdles.has(hurdleKey);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center relative
                    transition-all duration-300
                    ${tile.type === 'obstacle' ? 'bg-gray-800 border-2 border-gray-700' : ''}
                    ${tile.type === 'path' || tile.type === 'coin' || tile.type === 'hint' || tile.type === 'life' ? 'border-2 border-white/20' : ''}
                    ${isHurdle && !isHurdleSolved ? 'border-2 border-orange-500/50 animate-pulse' : ''}
                    ${isHurdle && isHurdleSolved ? 'border-2 border-green-500/50' : ''}
                    ${isGoal ? 'animate-pulse border-4 border-yellow-400 shadow-lg shadow-yellow-400/50' : ''}
                    ${isStart ? 'border-2 border-green-400' : ''}
                    ${isNextStep && !isPlayer ? 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/70 scale-105 z-20' : ''}
                    ${isOnPath && !isNextStep && !isPlayer && !isGoal ? 'ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-400/30 z-10' : ''}
                    ${hintFading && isOnPath ? 'opacity-50' : ''}
                  `}
                  style={{
                    backgroundColor: tile.type === 'obstacle' ? '#1F2937' : 
                                    isHurdle && !isHurdleSolved ? '#FF6B35' : 
                                    isHurdle && isHurdleSolved ? '#22C55E' : 
                                    tile.color,
                    transitionDelay: isOnPath ? getAnimationDelay(pathStepIndex) : '0ms',
                  }}
                >
                  {/* Glowing path overlay */}
                  {isOnPath && !isPlayer && !isGoal && (
                    <div 
                      className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                        isNextStep 
                          ? 'bg-yellow-400/40 animate-pulse' 
                          : 'bg-yellow-400/20'
                      } ${hintFading ? 'opacity-0' : 'opacity-100'}`}
                    />
                  )}
                  
                  {/* Animated arrow indicator */}
                  {isOnPath && !isPlayer && !isGoal && pathDirection && (
                    <div 
                      className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-300 ${
                        hintFading ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                      }`}
                      style={{ transitionDelay: getAnimationDelay(pathStepIndex) }}
                    >
                      <div className={`${getArrowRotation(pathDirection)} ${isNextStep ? 'animate-bounce' : ''}`}>
                        <svg 
                          className={`w-7 h-7 sm:w-9 sm:h-9 drop-shadow-lg ${
                            isNextStep ? 'text-yellow-300' : 'text-yellow-400/80'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Step number badge */}
                  {isOnPath && !isPlayer && !isGoal && (
                    <div 
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-30 border-2 border-black/30 shadow-lg transition-all duration-300 ${
                        isNextStep 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black scale-110' 
                          : 'bg-gradient-to-br from-yellow-500/90 to-orange-500/90 text-black'
                      } ${hintFading ? 'opacity-0 scale-50' : 'opacity-100'}`}
                      style={{ transitionDelay: getAnimationDelay(pathStepIndex) }}
                    >
                      {pathStepIndex + 1}
                    </div>
                  )}
                  
                  {/* Goal Star */}
                  {isGoal && !isPlayer && (
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                  
                  {/* Hurdle Icon */}
                  {isHurdle && !isPlayer && !isHurdleSolved && (
                    <div className="flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Solved Hurdle Checkmark */}
                  {isHurdle && !isPlayer && isHurdleSolved && (
                    <div className="flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Collectibles */}
                  {tile.type === 'coin' && !tile.collected && !isPlayer && (
                    <img 
                      src={GAME_IMAGES.coin} 
                      alt="Coin" 
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${isOnPath ? 'z-0' : 'animate-bounce'}`} 
                    />
                  )}
                  {tile.type === 'hint' && !tile.collected && !isPlayer && (
                    <img 
                      src={GAME_IMAGES.hint} 
                      alt="Hint" 
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${isOnPath ? 'z-0' : 'animate-pulse'}`} 
                    />
                  )}
                  {tile.type === 'life' && !tile.collected && !isPlayer && (
                    <img 
                      src={GAME_IMAGES.heart} 
                      alt="Life" 
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${isOnPath ? 'z-0' : 'animate-pulse'}`} 
                    />
                  )}
                  
                  {/* Obstacle X */}
                  {tile.type === 'obstacle' && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  
                  {/* Player */}
                  {isPlayer && (
                    <img 
                      src={GAME_IMAGES.character} 
                      alt="Blobby" 
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-lg animate-bounce z-30"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend when hint is active */}
      {showHint && visibleHintPath.length > 0 && (
        <div className={`flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-gray-300 bg-black/40 rounded-lg px-4 py-2 transition-opacity duration-500 ${hintFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-xs">1</span>
            </div>
            <span>Next move</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded ring-2 ring-yellow-400/60 bg-yellow-400/20"></div>
            <span>Path ahead</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
            <span>Direction</span>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 mt-2 md:hidden">
        <div />
        <button
          onClick={() => handleMoveWithHurdle('up')}
          disabled={showSkipConfirm || showPuzzle || showAskFriend}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div />
        <button
          onClick={() => handleMoveWithHurdle('left')}
          disabled={showSkipConfirm || showPuzzle || showAskFriend}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => handleMoveWithHurdle('down')}
          disabled={showSkipConfirm || showPuzzle || showAskFriend}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-t from-purple-500 to-purple-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={() => handleMoveWithHurdle('right')}
          disabled={showSkipConfirm || showPuzzle || showAskFriend}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-l from-purple-500 to-purple-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop Controls Hint */}
      <div className="hidden md:block text-center text-gray-400 text-sm">
        Use <span className="text-purple-400 font-bold">Arrow Keys</span> or <span className="text-purple-400 font-bold">WASD</span> to move
      </div>
      
      {/* Puzzle Challenge Modal */}
      {currentPuzzle && (
        <PuzzleChallengeModal
          isOpen={showPuzzle}
          onClose={() => {
            setShowPuzzle(false);
            setCurrentPuzzle(null);
            setPendingMove(null);
          }}
          puzzle={currentPuzzle}
          onCorrect={handlePuzzleCorrect}
          onIncorrect={handlePuzzleIncorrect}
          onAskFriend={handleAskFriend}
          levelId={level.id}
        />
      )}
      
      {/* Ask a Friend Modal */}
      {currentPuzzle && (
        <AskFriendModal
          isOpen={showAskFriend}
          onClose={() => {
            setShowAskFriend(false);
            setCurrentPuzzle(null);
            setPendingMove(null);
          }}
          puzzle={currentPuzzle}
          onUseAnswer={handleUseAnswer}
        />
      )}
      
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GameGrid;
