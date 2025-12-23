import React, { useState, useEffect } from 'react';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  onWatchAd?: () => void;
}

const SAMPLE_ADS = [
  {
    id: 1,
    title: 'Super Puzzle Quest',
    description: 'Download now and get 1000 free gems!',
    cta: 'Install',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    title: 'MegaShop Sale',
    description: 'Up to 70% off on electronics!',
    cta: 'Shop Now',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 3,
    title: 'FitLife Pro',
    description: 'Your personal fitness coach',
    cta: 'Try Free',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    title: 'StreamMax',
    description: 'Watch unlimited movies & shows',
    cta: 'Subscribe',
    color: 'from-purple-500 to-pink-500',
  },
];

const AdBanner: React.FC<AdBannerProps> = ({ position = 'bottom', onWatchAd }) => {
  const [currentAd, setCurrentAd] = useState(SAMPLE_ADS[0]);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd(SAMPLE_ADS[Math.floor(Math.random() * SAMPLE_ADS.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleWatchAd = () => {
    setShowRewardAd(true);
    setAdProgress(0);
    
    const progressInterval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setShowRewardAd(false);
            onWatchAd?.();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  if (showRewardAd) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="w-full max-w-lg p-8 text-center">
          <div className={`w-full h-64 rounded-2xl bg-gradient-to-br ${currentAd.color} flex items-center justify-center mb-6`}>
            <div className="text-white text-center p-6">
              <h3 className="text-3xl font-bold mb-2">{currentAd.title}</h3>
              <p className="text-lg opacity-90">{currentAd.description}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-100"
                style={{ width: `${adProgress}%` }}
              />
            </div>
            <p className="text-gray-400 mt-2 text-sm">
              {adProgress < 100 ? 'Watch to earn reward...' : 'Reward earned!'}
            </p>
          </div>
          
          {adProgress >= 100 && (
            <div className="animate-bounce text-yellow-400 font-bold text-xl">
              +25 Coins Earned!
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-gradient-to-r ${currentAd.color} ${position === 'top' ? 'border-b' : 'border-t'} border-white/10`}>
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 bg-black/20 px-2 py-0.5 rounded">AD</span>
          <div>
            <span className="font-semibold text-white text-sm">{currentAd.title}</span>
            <span className="text-white/80 text-sm ml-2 hidden sm:inline">{currentAd.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleWatchAd}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-semibold transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch for Coins
          </button>
          <button className="px-4 py-1 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-100 transition-colors">
            {currentAd.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
