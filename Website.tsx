import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Website Images
const WEBSITE_IMAGES = {
  mascot: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984523811_8096a0f6.jpg',
  heroBanner: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984552943_3d2f3ec5.jpg',
  screenshot1: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984576481_c30e7ada.jpg',
  screenshot2: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984583251_fa816298.png',
  screenshot3: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984630433_c46fe7c5.jpg',
  testimonial1: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984667355_d1f2055b.jpg',
  testimonial2: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984676067_a9006b24.png',
  testimonial3: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984663429_1836059b.jpg',
  feature1: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984702692_7d847d6a.jpg',
  feature2: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984704002_0431ee45.jpg',
  feature3: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984744677_cadc7efb.png',
  feature4: 'https://d64gsuwffb70l.cloudfront.net/6942ba83484103d4cae1c5db_1765984738433_4551d456.png',
};

const Website: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const handlePlayNow = () => {
    navigate('/play');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };



  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: '50+ Unique Levels',
      description: 'Challenge yourself with increasingly difficult puzzles. New levels added every week!',
      image: WEBSITE_IMAGES.feature1,
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      title: 'Daily Rewards',
      description: 'Log in every day to claim free coins, lives, and special power-ups!',
      image: WEBSITE_IMAGES.feature2,
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: 'Global Leaderboards',
      description: 'Compete with players worldwide and climb to the top of the rankings!',
      image: WEBSITE_IMAGES.feature3,
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Smart Hint System',
      description: 'Stuck on a level? Use hints to get helpful suggestions without spoiling the fun!',
      image: WEBSITE_IMAGES.feature4,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      location: 'London, UK',
      text: "Absolutely addicted! The puzzles are perfectly challenging and Blobby is the cutest character ever. I play during my commute every day!",
      rating: 5,
      image: WEBSITE_IMAGES.testimonial1,
    },
    {
      name: 'James Chen',
      location: 'New York, USA',
      text: "Best puzzle game I've played in years. The daily rewards keep me coming back, and the leaderboard competition with my friends is intense!",
      rating: 5,
      image: WEBSITE_IMAGES.testimonial2,
    },
    {
      name: 'Emma Laurent',
      location: 'Paris, France',
      text: "Perfect for quick gaming sessions. The levels are creative and the difficulty curve is just right. Highly recommend to puzzle lovers!",
      rating: 5,
      image: WEBSITE_IMAGES.testimonial3,
    },
  ];

  const faqs = [
    {
      question: 'Is Blobby free to play?',
      answer: 'Yes! Blobby is completely free to download and play. You can enjoy all levels without spending any money. Optional in-app purchases are available for players who want extra coins, lives, or hints.',
    },
    {
      question: 'How do I earn coins?',
      answer: 'You can earn coins by completing levels (the faster you complete, the more coins you earn), claiming daily rewards, watching optional ads, and participating in special events.',
    },
    {
      question: 'What are hints and how do they work?',
      answer: 'Hints help you when you\'re stuck on a level. When activated, they highlight the optimal path or next move. You can earn hints through gameplay or purchase them in the store.',
    },
    {
      question: 'Can I play offline?',
      answer: 'Yes! Once downloaded, you can play Blobby offline. However, features like leaderboards and cloud saves require an internet connection.',
    },
    {
      question: 'How do I sync my progress across devices?',
      answer: 'Create a player profile with a username to enable cloud saves. Your progress will automatically sync across all devices where you\'re logged in.',
    },
    {
      question: 'Are there new levels coming?',
      answer: 'Absolutely! We release new levels every week. Follow us on social media to get notified about new content, special events, and updates.',
    },
  ];

  const pricingPlans = [
    { coins: 100, price: '£0.99', popular: false, bonus: '' },
    { coins: 500, price: '£3.99', popular: true, bonus: '+50 Bonus' },
    { coins: 1000, price: '£6.99', popular: false, bonus: '+150 Bonus' },
    { coins: 5000, price: '£24.99', popular: false, bonus: '+1000 Bonus' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-lg shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <img src={WEBSITE_IMAGES.mascot} alt="Blobby" className="w-12 h-12 rounded-full border-2 border-purple-500" />
              <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                BLOBBY
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('screenshots')} className="text-gray-300 hover:text-white transition-colors font-medium">
                Screenshots
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-300 hover:text-white transition-colors font-medium">
                Reviews
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-white transition-colors font-medium">
                Store
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-300 hover:text-white transition-colors font-medium">
                FAQ
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={handlePlayNow}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full font-bold transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Play Now
              </button>
            </div>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-950/98 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('screenshots')} className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium">
                Screenshots
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium">
                Reviews
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium">
                Store
              </button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium">
                FAQ
              </button>
              <button
                onClick={handlePlayNow}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold"
              >
                Play Now
              </button>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={WEBSITE_IMAGES.heroBanner} 
            alt="Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-purple-950/60 to-gray-950" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                opacity: 0.2,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-purple-300 font-medium">10M+ Downloads Worldwide</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Meet
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  BLOBBY
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
                The most addictive puzzle game of 2024! Guide Blobby through mind-bending levels, 
                collect coins, and become a puzzle master. Free to play!
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 mb-10">
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button 
                  onClick={handlePlayNow}
                  className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-green-500/30 flex items-center justify-center gap-3"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Now Free
                </button>

                
                <button 
                  onClick={() => scrollToSection('screenshots')}
                  className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-2xl transition-all border-2 border-white/30 flex items-center justify-center gap-3"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  Watch Trailer
                </button>
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-all hover:scale-105 border border-white/20">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-lg font-semibold text-white">App Store</div>
                  </div>
                </button>
                <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-all hover:scale-105 border border-white/20">
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

            {/* Character Image */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl animate-pulse" />
              </div>
              <img 
                src={WEBSITE_IMAGES.mascot} 
                alt="Blobby Character" 
                className="relative w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-purple-500/50 shadow-2xl shadow-purple-500/30 animate-bounce"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <button onClick={() => scrollToSection('features')} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-to-b from-gray-950 to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
              Game Features
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why Players Love Blobby
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the most addictive puzzle game with features designed to keep you entertained for hours!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🎮', title: 'Easy Controls', desc: 'Swipe to move' },
              { icon: '🌙', title: 'Dark Mode', desc: 'Easy on eyes' },
              { icon: '🔊', title: 'Great Sound', desc: 'Immersive audio' },
              { icon: '📱', title: 'Works Offline', desc: 'Play anywhere' },
              { icon: '🏅', title: 'Achievements', desc: '50+ to unlock' },
              { icon: '🎁', title: 'Free Updates', desc: 'New content weekly' },
              { icon: '👥', title: 'Social Play', desc: 'Challenge friends' },
              { icon: '💾', title: 'Cloud Save', desc: 'Never lose progress' },
            ].map((item, i) => (
              <div 
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all text-center group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h4 className="font-bold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-24 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-pink-500/20 rounded-full text-pink-300 text-sm font-medium mb-4">
              Screenshots
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              See Blobby in Action
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Beautiful graphics, smooth animations, and addictive gameplay await you!
            </p>
          </div>

          <div className="flex justify-center gap-6 overflow-x-auto pb-8 px-4 snap-x snap-mandatory">
            {[WEBSITE_IMAGES.screenshot1, WEBSITE_IMAGES.screenshot2, WEBSITE_IMAGES.screenshot3].map((img, i) => (
              <div key={i} className="flex-shrink-0 snap-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[2.5rem] opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
                  <img 
                    src={img} 
                    alt={`Screenshot ${i + 1}`} 
                    className="relative w-64 md:w-72 rounded-3xl border-4 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-950 to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-500/20 rounded-full text-green-300 text-sm font-medium mb-4">
              Getting Started
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How to Play
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple to learn, challenging to master!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Swipe to Move',
                description: 'Guide Blobby through the maze by swiping in any direction. Plan your moves carefully!',
                color: 'from-purple-500 to-purple-600',
              },
              {
                step: '02',
                title: 'Collect Coins',
                description: 'Gather coins along the way to unlock power-ups, hints, and extra lives.',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                step: '03',
                title: 'Reach the Goal',
                description: 'Navigate to the golden goal tile before running out of moves. Earn up to 3 stars!',
                color: 'from-green-500 to-emerald-500',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className={`absolute -top-4 -left-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
                  {item.step}
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 pt-16 border border-white/10 h-full">
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-yellow-500/20 rounded-full text-yellow-300 text-sm font-medium mb-4">
              Player Reviews
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What Players Are Saying
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join millions of happy players worldwide!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((review, i) => (
              <div key={i} className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={review.image} 
                    alt={review.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/50"
                  />
                  <div>
                    <div className="font-bold text-white text-lg">{review.name}</div>
                    <div className="text-gray-500">{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full">
              <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-white font-bold">4.9 Rating</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-bold">Editor's Choice</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-white font-bold">10M+ Players</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-950 to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
              In-App Store
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Coin Packs
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get more coins to unlock hints, lives, and power-ups. Free to play, optional purchases available!
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div 
                key={i}
                className={`relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-3xl border transition-all hover:scale-105 ${
                  plan.popular 
                    ? 'border-yellow-500/50 shadow-xl shadow-yellow-500/10' 
                    : 'border-white/10 hover:border-purple-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-sm font-bold text-black">
                    Most Popular
                  </div>
                )}
                <div className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  <div className="text-4xl font-black text-white mb-2">{plan.coins.toLocaleString()}</div>
                  <div className="text-gray-400 mb-2">Coins</div>
                  {plan.bonus && (
                    <div className="text-green-400 text-sm font-medium mb-4">{plan.bonus}</div>
                  )}
                  <div className="text-3xl font-bold text-white mb-6">{plan.price}</div>
                  <button 
                    onClick={handlePlayNow}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Buy Now
                  </button>

                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8">
            Secure payments powered by Stripe. All purchases are final.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4">
              Support
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">
              Got questions? We've got answers!
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-white text-lg">{faq.question}</span>
                  <svg 
                    className={`w-6 h-6 text-purple-400 transition-transform ${activeAccordion === i ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-3xl mx-auto text-center">
          <img 
            src={WEBSITE_IMAGES.mascot} 
            alt="Blobby" 
            className="w-24 h-24 mx-auto rounded-full border-4 border-white/30 mb-8"
          />
          <h2 className="text-4xl font-black text-white mb-4">
            Get Exclusive Updates & Rewards!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Subscribe to our newsletter and receive 500 free coins when you download the game!
          </p>

          {subscribed ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-300 font-bold text-xl">Thanks for subscribing!</p>
              <p className="text-green-400 mt-2">Check your email for your reward code.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 text-lg"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gray-950 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Download Blobby now and join millions of players worldwide. It's free to play!
          </p>
          <button 
            onClick={handlePlayNow}
            className="px-14 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-2xl rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-green-500/30"
          >
            Play Now - It's Free!
          </button>

          {/* App Store Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-all hover:scale-105 border border-white/20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Download on the</div>
                <div className="text-lg font-semibold text-white">App Store</div>
              </div>
            </button>
            <button className="bg-black hover:bg-gray-900 rounded-xl px-6 py-3 flex items-center gap-3 transition-all hover:scale-105 border border-white/20">
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
      </section>


      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={WEBSITE_IMAGES.mascot} alt="Blobby" className="w-12 h-12 rounded-full border-2 border-purple-500" />
                <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  BLOBBY
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                The most addictive puzzle game of 2024. Guide Blobby through challenging levels and become a puzzle master!
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Game</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-purple-400 transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('screenshots')} className="hover:text-purple-400 transition-colors">Screenshots</button></li>
                <li><button onClick={handlePlayNow} className="hover:text-purple-400 transition-colors">Play Now</button></li>

                <li><button className="hover:text-purple-400 transition-colors">Leaderboards</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-purple-400 transition-colors">FAQ</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Help Center</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Contact Us</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Report a Bug</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button className="hover:text-purple-400 transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Cookie Policy</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 Blobby Games. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" alt="Stripe" className="h-6 opacity-50" />
              <span className="text-gray-500 text-sm">Secure payments</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Website;
