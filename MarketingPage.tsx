import React, { useState } from 'react';
import { GAME_IMAGES } from '../../types/game';

interface MarketingPageProps {
  onBackToGame: () => void;
}

const MarketingPage: React.FC<MarketingPageProps> = ({ onBackToGame }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Video Ad Section - Facebook/Instagram Ad Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${GAME_IMAGES.background})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-pink-900/90 to-blue-900/95" />
          
          {/* Floating Elements */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${10 + Math.random() * 40}px`,
                height: `${10 + Math.random() * 40}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#FBBF24'][i % 4],
                opacity: 0.3,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Character Animation */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-r from-yellow-400/30 to-orange-500/30 blur-3xl animate-pulse" />
            </div>
            <img 
              src={GAME_IMAGES.character} 
              alt="Blobby" 
              className="relative w-48 h-48 mx-auto rounded-full border-8 border-yellow-400 shadow-2xl shadow-yellow-400/50 animate-bounce"
              style={{ animationDuration: '1.5s' }}
            />
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              BLOBBY
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-white font-bold mb-2">
            The #1 Puzzle Game Everyone's Talking About!
          </p>
          
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 10 million+ players worldwide! Guide Blobby through mind-bending puzzles, 
            collect coins, and become a puzzle master!
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="text-4xl font-black text-yellow-400">10M+</div>
              <div className="text-sm text-gray-400">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-pink-400">4.9</div>
              <div className="text-sm text-gray-400">App Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-400">50+</div>
              <div className="text-sm text-gray-400">Levels</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button 
              onClick={onBackToGame}
              className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-green-500/40 flex items-center justify-center gap-3"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              PLAY NOW FREE
            </button>
            
            <button className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-2xl transition-all border-2 border-white/30 flex items-center justify-center gap-3">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              Watch Trailer
            </button>
          </div>

          {/* App Store Badges */}
          <div className="flex justify-center gap-4">
            <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-colors border border-white/20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Download on the</div>
                <div className="text-lg font-semibold text-white">App Store</div>
              </div>
            </button>
            <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-colors border border-white/20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">GET IT ON</div>
                <div className="text-lg font-semibold text-white">Google Play</div>
              </div>
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-purple-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            Why Players Love Blobby
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Experience the most addictive puzzle game of the year with features designed to keep you entertained for hours!
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🧩', title: '50+ Levels', desc: 'New challenges added weekly!' },
              { icon: '🎁', title: 'Daily Rewards', desc: 'Free coins & power-ups daily' },
              { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends globally' },
              { icon: '💡', title: 'Hint System', desc: 'Never get stuck again' },
              { icon: '❤️', title: 'Lives System', desc: 'Earn or buy extra lives' },
              { icon: '🪙', title: 'Coin Economy', desc: 'Collect & spend wisely' },
              { icon: '🎨', title: 'Beautiful Design', desc: 'Stunning visuals & animations' },
              { icon: '📱', title: 'Play Anywhere', desc: 'Works offline too!' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot Gallery */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            Gameplay Screenshots
          </h2>
          <p className="text-center text-gray-400 mb-12">
            See what makes Blobby so addictive!
          </p>

          <div className="flex justify-center gap-6 overflow-x-auto pb-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <img 
                  src={GAME_IMAGES.screenshot} 
                  alt={`Gameplay ${i + 1}`} 
                  className="w-56 h-auto rounded-3xl border-4 border-white/20 shadow-2xl hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-purple-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            What Players Are Saying
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', location: 'London, UK', text: 'Absolutely addicted! The puzzles are perfectly challenging and Blobby is so cute!', rating: 5 },
              { name: 'James K.', location: 'New York, USA', text: 'Best puzzle game I\'ve played in years. The daily rewards keep me coming back!', rating: 5 },
              { name: 'Emma L.', location: 'Sydney, AU', text: 'Perfect for my commute. Quick levels but still satisfying to complete.', rating: 5 },
            ].map((review, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-sm text-gray-500">{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get Exclusive Updates & Rewards!
          </h2>
          <p className="text-gray-300 mb-8">
            Subscribe to our newsletter and receive 500 free coins when you download the game!
          </p>

          {subscribed ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
              <svg className="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-300 font-semibold">Thanks for subscribing! Check your email for your reward code.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 flex-1 max-w-md"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:scale-105 transition-transform"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gray-900 text-center">
        <img 
          src={GAME_IMAGES.character} 
          alt="Blobby" 
          className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-lg mb-8"
        />
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Start Your Adventure?
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Download Blobby now and join millions of players worldwide. It's free to play!
        </p>
        <button 
          onClick={onBackToGame}
          className="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-green-500/40"
        >
          PLAY NOW - IT'S FREE!
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src={GAME_IMAGES.character} alt="Blobby" className="w-8 h-8 rounded-full" />
          <span className="text-xl font-bold text-purple-300">BLOBBY</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          © 2024 Blobby Games. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-gray-500 text-sm">
          <button className="hover:text-purple-400 transition-colors">Privacy Policy</button>
          <button className="hover:text-purple-400 transition-colors">Terms of Service</button>
          <button className="hover:text-purple-400 transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
};

export default MarketingPage;
