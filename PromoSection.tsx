import React from 'react';
import { GAME_IMAGES } from '../../types/game';

const PromoSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-purple-900/50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Promo Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-16 shadow-2xl">
          <img 
            src={GAME_IMAGES.promo} 
            alt="Blobby Promo" 
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent flex items-center">
            <div className="p-8 md:p-12 max-w-lg">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                The #1 Puzzle Game
              </h2>
              <p className="text-lg text-gray-200 mb-6">
                Join millions of players worldwide! Guide Blobby through 50+ challenging levels.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg">
                  Download Free
                </button>
                <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30">
                  Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 hover:scale-105 transition-transform">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">50+ Levels</h3>
            <p className="text-gray-400">Challenging puzzles that get progressively harder. New levels added weekly!</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30 hover:scale-105 transition-transform">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quick Sessions</h3>
            <p className="text-gray-400">Perfect for short breaks. Complete a level in just 2-3 minutes!</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30 hover:scale-105 transition-transform">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Compete & Share</h3>
            <p className="text-gray-400">Challenge friends and climb the global leaderboards!</p>
          </div>
        </div>

        {/* Screenshot Gallery */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Gameplay Screenshots</h2>
          <p className="text-gray-400 mb-8">See what makes Blobby so addictive!</p>
          
          <div className="flex justify-center gap-4 overflow-x-auto pb-4">
            <img 
              src={GAME_IMAGES.screenshot} 
              alt="Gameplay 1" 
              className="w-48 h-auto rounded-2xl border-4 border-white/20 shadow-xl hover:scale-105 transition-transform"
            />
            <img 
              src={GAME_IMAGES.screenshot} 
              alt="Gameplay 2" 
              className="w-48 h-auto rounded-2xl border-4 border-white/20 shadow-xl hover:scale-105 transition-transform"
            />
            <img 
              src={GAME_IMAGES.screenshot} 
              alt="Gameplay 3" 
              className="w-48 h-auto rounded-2xl border-4 border-white/20 shadow-xl hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold text-white text-center mb-8">What Players Say</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', rating: 5, text: 'So addictive! I can\'t stop playing. The puzzles are perfectly challenging.' },
              { name: 'James K.', rating: 5, text: 'Best puzzle game I\'ve played in years. Blobby is adorable!' },
              { name: 'Emma L.', rating: 5, text: 'Great for killing time. The hint system is really helpful when stuck.' },
            ].map((review, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-2">"{review.text}"</p>
                <p className="text-gray-500 text-xs">- {review.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Play?</h3>
          <p className="text-gray-400 mb-6">Download now and start your puzzle adventure!</p>
          <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-xl shadow-orange-500/30">
            Download Free Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoSection;
