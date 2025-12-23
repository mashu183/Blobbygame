import React from 'react';
import { Level, GAME_IMAGES } from '../../types/game';

interface LevelSelectProps {
  levels: Level[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ levels, onSelectLevel, onClose }) => {
  const renderStars = (stars: number, maxStars: number = 3) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src={GAME_IMAGES.character} 
              alt="Blobby" 
              className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg shadow-yellow-400/30"
            />
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Select Level
              </h2>
              <p className="text-gray-400">Choose your adventure!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => level.unlocked && onSelectLevel(level.id)}
              disabled={!level.unlocked}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center
                transition-all duration-200 transform
                ${level.unlocked 
                  ? level.completed
                    ? 'bg-gradient-to-br from-green-500/30 to-emerald-600/30 border-2 border-green-400/50 hover:scale-110 hover:shadow-lg hover:shadow-green-400/30'
                    : 'bg-gradient-to-br from-purple-500/30 to-pink-600/30 border-2 border-purple-400/50 hover:scale-110 hover:shadow-lg hover:shadow-purple-400/30'
                  : 'bg-gray-800/50 border-2 border-gray-700 cursor-not-allowed opacity-50'
                }
              `}
            >
              {level.unlocked ? (
                <>
                  <span className={`text-xl font-bold ${level.completed ? 'text-green-300' : 'text-white'}`}>
                    {level.id}
                  </span>
                  {level.completed && renderStars(level.stars)}
                </>
              ) : (
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Progress Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-4 text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-300">
              {levels.filter(l => l.completed).length}
            </div>
            <div className="text-sm text-gray-400">Levels Completed</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-4 text-center border border-yellow-500/30">
            <div className="text-3xl font-bold text-yellow-300">
              {levels.reduce((acc, l) => acc + l.stars, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Stars</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 text-center border border-green-500/30">
            <div className="text-3xl font-bold text-green-300">
              {Math.round((levels.filter(l => l.completed).length / levels.length) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
