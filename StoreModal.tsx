import React, { useState } from 'react';
import { STORE_ITEMS, StoreItem, GAME_IMAGES } from '../../types/game';
import CheckoutModal from './CheckoutModal';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onPurchaseWithCoins: (type: 'lives' | 'hints', amount: number, cost: number) => boolean;
  onPurchaseCoins: (amount: number) => void;
  onAddVIPPoints?: (dollarAmount: number) => number; // Returns actual points earned
  vipPointsMultiplier?: number;
  vipTierName?: string;
}

const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  coins,
  onPurchaseWithCoins,
  onPurchaseCoins,
  onAddVIPPoints,
  vipPointsMultiplier = 1,
  vipTierName = 'Bronze',
}) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'lives' | 'hints'>('coins');
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastVIPPointsEarned, setLastVIPPointsEarned] = useState<number>(0);

  if (!isOpen) return null;

  const coinItems = STORE_ITEMS.filter(item => item.type === 'coins');
  const livesItems = STORE_ITEMS.filter(item => item.type === 'lives');
  const hintsItems = STORE_ITEMS.filter(item => item.type === 'hints');

  // Calculate VIP points that will be earned for a purchase
  const calculateVIPPoints = (price: number): number => {
    const basePoints = Math.floor(price * 10); // 10 points per £1
    return Math.floor(basePoints * vipPointsMultiplier);
  };

  const handlePurchase = (item: StoreItem) => {
    if (item.type === 'coins') {
      // Open Stripe checkout for real money purchase
      setSelectedItem(item);
      setShowCheckout(true);
    } else {
      // Purchase with coins
      if (typeof item.price === 'number' && item.price <= coins) {
        const success = onPurchaseWithCoins(item.type, item.amount, item.price);
        if (success) {
          setPurchaseMessage(`You purchased ${item.amount} ${item.type}!`);
        } else {
          setPurchaseMessage('Purchase failed!');
        }
      } else {
        setPurchaseMessage('Not enough coins!');
      }
      
      setTimeout(() => setPurchaseMessage(null), 2000);
    }
  };

  const handlePaymentSuccess = (coinsAmount: number, vipPointsFromServer?: number) => {
    // Add coins to the player's balance
    onPurchaseCoins(coinsAmount);
    
    // Use server-verified VIP points if available, otherwise calculate locally
    let vipPointsEarned = vipPointsFromServer || 0;
    if (!vipPointsFromServer && onAddVIPPoints && selectedItem) {
      vipPointsEarned = onAddVIPPoints(selectedItem.price);
    }
    setLastVIPPointsEarned(vipPointsEarned);
    
    // Close checkout and show success message
    setShowCheckout(false);
    setSelectedItem(null);
    
    const vipMessage = vipPointsEarned > 0 ? ` +${vipPointsEarned} VIP Points!` : '';
    setPurchaseMessage(`Payment successful! You received ${coinsAmount.toLocaleString()} coins!${vipMessage}`);
    
    setTimeout(() => {
      setPurchaseMessage(null);
      setLastVIPPointsEarned(0);
    }, 4000);
  };


  const handleCheckoutClose = () => {
    setShowCheckout(false);
    setSelectedItem(null);
  };

  const renderItems = (items: StoreItem[], isCoinPurchase: boolean) => (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => {
        const vipPoints = isCoinPurchase ? calculateVIPPoints(item.price) : 0;
        
        return (
          <div
            key={item.id}
            className={`
              relative p-4 rounded-xl border-2 transition-all hover:scale-105
              ${item.popular 
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/50' 
                : 'bg-white/5 border-white/10 hover:border-purple-400/50'
              }
            `}
          >
            {item.popular && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                BEST VALUE
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <img 
                  src={item.type === 'coins' ? GAME_IMAGES.coin : item.type === 'lives' ? GAME_IMAGES.heart : GAME_IMAGES.hint} 
                  alt={item.type}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div>
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
            </div>
            
            {/* VIP Points Preview for coin purchases */}
            {isCoinPurchase && vipPoints > 0 && (
              <div className="mb-3 flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-purple-300">+{vipPoints} VIP</span>
                </div>
                {vipPointsMultiplier > 1 && (
                  <span className="text-green-400 text-xs">({vipPointsMultiplier}x bonus!)</span>
                )}
              </div>
            )}
            
            <button
              onClick={() => handlePurchase(item)}
              className={`
                w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                ${isCoinPurchase
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white'
                  : coins >= (item.price as number)
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
              disabled={!isCoinPurchase && coins < (item.price as number)}
            >
              {isCoinPurchase ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>£{item.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <img src={GAME_IMAGES.coin} alt="Coins" className="w-4 h-4 rounded-full" />
                  {item.price}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Blobby Store</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <img src={GAME_IMAGES.coin} alt="Coins" className="w-5 h-5 rounded-full" />
                    <span className="font-bold">{coins.toLocaleString()} coins</span>
                  </div>
                  {vipTierName && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/30">
                      <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-purple-300 font-medium">{vipTierName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'coins', label: 'Buy Coins', icon: GAME_IMAGES.coin },
              { id: 'lives', label: 'Extra Lives', icon: GAME_IMAGES.heart },
              { id: 'hints', label: 'Hints', icon: GAME_IMAGES.hint },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all
                  ${activeTab === tab.id 
                    ? 'bg-white/10 text-white border-b-2 border-purple-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <img src={tab.icon} alt={tab.label} className="w-5 h-5 rounded-full" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            {purchaseMessage && (
              <div className={`mb-4 p-3 rounded-lg border text-center font-semibold animate-pulse ${
                purchaseMessage.includes('successful') || purchaseMessage.includes('purchased')
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}>
                {purchaseMessage}
                {lastVIPPointsEarned > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-purple-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-purple-300">VIP Points Earned!</span>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'coins' && (
              <>
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">Earn VIP Points with every purchase!</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-7">
                    10 VIP points per £1 spent. Higher VIP tiers earn bonus multipliers!
                  </p>
                </div>
                <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure payments powered by Stripe. All major cards accepted.</span>
                </div>
                {renderItems(coinItems, true)}
              </>
            )}
            {activeTab === 'lives' && renderItems(livesItems, false)}
            {activeTab === 'hints' && renderItems(hintsItems, false)}
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/30 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Payment
              </span>
              <span>•</span>
              <span>Instant Delivery</span>
              <span>•</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        item={selectedItem}
        onClose={handleCheckoutClose}
        onSuccess={handlePaymentSuccess}
        vipPointsPreview={selectedItem ? calculateVIPPoints(selectedItem.price) : 0}
      />
    </>
  );
};

export default StoreModal;
