import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { supabase } from '@/lib/supabase';
import { StoreItem, GAME_IMAGES } from '../../types/game';

// Initialize Stripe with the correct publishable key and connected account
const stripePromise = loadStripe('pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ', {
  stripeAccount: 'acct_1SfLZCQfPNx6CLyO'
});

// PayPal Client ID
const PAYPAL_CLIENT_ID = 'AdnsweJ5kUo7nYTnLn4a5Ei_npthlulbAVIjSm3pdS8SNKvB8sLBLtwk-wQr4tsSN6wp-qy52IeZf3LN';

// Generate or retrieve a persistent player ID
const getPlayerId = (): string => {
  let playerId = localStorage.getItem('player_id');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('player_id', playerId);
  }
  return playerId;
};

type PaymentMethod = 'stripe' | 'paypal';

interface CheckoutFormProps {
  item: StoreItem;
  onSuccess: (coinsAmount: number, vipPoints: number) => void;
  onCancel: () => void;
  vipPointsPreview: number;
  paymentIntentId: string;
  playerId: string;
}

const StripeCheckoutForm: React.FC<CheckoutFormProps> = ({ item, onSuccess, onCancel, vipPointsPreview, paymentIntentId, playerId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const verifyPurchase = async (intentId: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          payment_intent_id: intentId,
          player_id: playerId
        }
      });

      if (error) {
        console.error('Verification error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to verify purchase:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      // Payment successful - verify with server
      setPaymentSuccess(true);
      
      // Poll for verification (webhook may take a moment)
      let verificationAttempts = 0;
      const maxAttempts = 5;
      
      const checkVerification = async () => {
        verificationAttempts++;
        const verification = await verifyPurchase(paymentIntentId);
        
        if (verification?.verified) {
          setVerifiedData(verification);
          // Wait a moment then trigger success callback with server-verified data
          setTimeout(() => {
            onSuccess(
              verification.transaction?.coins_purchased || item.amount,
              verification.transaction?.vip_points_earned || vipPointsPreview
            );
          }, 2000);
        } else if (verificationAttempts < maxAttempts) {
          // Retry after delay
          setTimeout(checkVerification, 1000);
        } else {
          // Fall back to client-side data if verification fails
          console.warn('Server verification failed, using client data');
          setTimeout(() => {
            onSuccess(item.amount, vipPointsPreview);
          }, 2000);
        }
      };

      // Start verification after a short delay to allow webhook processing
      setTimeout(checkVerification, 500);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-green-300 mb-4">
          {verifiedData ? 'Purchase verified!' : 'Verifying purchase...'}
        </p>
        <div className="flex items-center justify-center gap-2 text-yellow-300 mb-4">
          <img src={GAME_IMAGES.coin} alt="Coins" className="w-8 h-8 rounded-full animate-pulse" />
          <span className="text-3xl font-bold">
            +{(verifiedData?.transaction?.coins_purchased || item.amount).toLocaleString()}
          </span>
        </div>
        
        {/* VIP Points Earned */}
        {(verifiedData?.transaction?.vip_points_earned || vipPointsPreview) > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-purple-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-purple-300 font-bold">
                +{verifiedData?.transaction?.vip_points_earned || vipPointsPreview} VIP Points!
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Climb the VIP ranks for exclusive rewards!</p>
          </div>
        )}

        {/* Server Verification Badge */}
        {verifiedData?.verified && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Server Verified</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="bg-white rounded-xl p-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay £{item.price.toFixed(2)}
            </>
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe. Your payment info is encrypted.
      </div>
    </form>
  );
};

// PayPal Checkout Component
interface PayPalCheckoutProps {
  item: StoreItem;
  onSuccess: (coinsAmount: number, vipPoints: number) => void;
  onCancel: () => void;
  vipPointsPreview: number;
  playerId: string;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ item, onSuccess, onCancel, vipPointsPreview, playerId }) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-green-300 mb-4">Your PayPal payment has been processed!</p>
        <div className="flex items-center justify-center gap-2 text-yellow-300 mb-4">
          <img src={GAME_IMAGES.coin} alt="Coins" className="w-8 h-8 rounded-full animate-pulse" />
          <span className="text-3xl font-bold">+{item.amount.toLocaleString()}</span>
        </div>
        
        {vipPointsPreview > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-purple-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-purple-300 font-bold">+{vipPointsPreview} VIP Points!</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PayPal Buttons */}
      <div className="bg-white rounded-xl p-4">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 45
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: `${item.name} - ${item.amount.toLocaleString()} coins`,
                  amount: {
                    currency_code: 'GBP',
                    value: item.price.toFixed(2)
                  },
                  custom_id: JSON.stringify({
                    playerId,
                    itemId: item.id,
                    coinsAmount: item.amount,
                    vipPoints: vipPointsPreview
                  })
                }
              ]
            });
          }}
          onApprove={async (data, actions) => {
            try {
              const details = await actions.order?.capture();
              if (details?.status === 'COMPLETED') {
                // Store purchase in localStorage for tracking
                const purchases = JSON.parse(localStorage.getItem('paypal_purchases') || '[]');
                purchases.push({
                  orderId: data.orderID,
                  playerId,
                  itemId: item.id,
                  coinsAmount: item.amount,
                  vipPoints: vipPointsPreview,
                  timestamp: Date.now()
                });
                localStorage.setItem('paypal_purchases', JSON.stringify(purchases));

                setPaymentSuccess(true);
                setTimeout(() => {
                  onSuccess(item.amount, vipPointsPreview);
                }, 2000);
              }
            } catch (err: any) {
              setError(err.message || 'Payment failed');
            }
          }}
          onError={(err) => {
            console.error('PayPal error:', err);
            setError('PayPal payment failed. Please try again.');
          }}
          onCancel={() => {
            setError('Payment was cancelled.');
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
      >
        Cancel
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
        </svg>
        Secured by PayPal. Buyer protection included.
      </div>
    </div>
  );
};

// Account Setup Required Component
const AccountSetupRequired: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Payment Setup Required</h3>
      <p className="text-gray-300 mb-4 max-w-sm mx-auto">
        The payment account needs to complete setup before accepting payments. Please contact support to complete the onboarding process.
      </p>
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-left">
        <h4 className="font-semibold text-amber-300 mb-2">Required Information:</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Business details & website URL</li>
          <li>• Personal identification</li>
          <li>• UK bank account for payouts</li>
          <li>• Terms of Service acceptance</li>
        </ul>
      </div>
      <button
        onClick={onClose}
        className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white transition-all"
      >
        Got it
      </button>
    </div>
  );
};

interface CheckoutModalProps {
  isOpen: boolean;
  item: StoreItem | null;
  onClose: () => void;
  onSuccess: (coinsAmount: number, vipPoints?: number) => void;
  vipPointsPreview?: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, item, onClose, onSuccess, vipPointsPreview = 0 }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountNotReady, setAccountNotReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

  useEffect(() => {
    // Get or create player ID on mount
    setPlayerId(getPlayerId());
  }, []);

  useEffect(() => {
    if (isOpen && item && playerId) {
      // Only create payment intent if Stripe is selected
      if (paymentMethod === 'stripe') {
        createPaymentIntent();
      } else {
        setLoading(false);
      }
    } else {
      setClientSecret(null);
      setPaymentIntentId(null);
      setError(null);
      setAccountNotReady(false);
    }
  }, [isOpen, item, playerId, paymentMethod]);

  const createPaymentIntent = async () => {
    if (!item) return;

    setLoading(true);
    setError(null);
    setAccountNotReady(false);

    try {
      // Convert price to pence (e.g., £0.99 -> 99 pence)
      const amountInPence = Math.round(item.price * 100);

      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amountInPence,
          currency: 'gbp',
          itemId: item.id,
          itemName: item.name,
          coinsAmount: item.amount,
          vipPoints: vipPointsPreview,
          playerId: playerId
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to initialize payment');
      }

      if (data?.error) {
        // Check if it's an account setup issue
        if (data.error.includes('payment method') || data.error.includes('activated')) {
          setAccountNotReady(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } else {
        throw new Error('No client secret received');
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      // Check if it's an account setup issue
      if (err.message?.includes('payment method') || err.message?.includes('activated')) {
        setAccountNotReady(true);
      } else {
        setError(err.message || 'Failed to initialize payment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (coinsAmount: number, vipPoints: number) => {
    onSuccess(coinsAmount, vipPoints);
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  if (!isOpen || !item) return null;

  return (
    <PayPalScriptProvider options={{ 
      clientId: PAYPAL_CLIENT_ID,
      currency: 'GBP',
      intent: 'capture'
    }}>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-purple-900/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
                <p className="text-sm text-gray-300">Complete your purchase</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400/30 to-orange-500/30 flex items-center justify-center">
                <img src={GAME_IMAGES.coin} alt="Coins" className="w-10 h-10 rounded-full" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{item.name}</h4>
                <p className="text-sm text-gray-400">{item.description}</p>
                {vipPointsPreview > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-purple-300">+{vipPointsPreview} VIP Points</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">£{item.price.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-4 border-b border-white/10">
            <p className="text-sm text-gray-400 mb-3">Select payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* PayPal Option */}
              <button
                onClick={() => handlePaymentMethodChange('paypal')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#00457C">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                </svg>
                <span className={`text-sm font-semibold ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-gray-300'}`}>
                  PayPal
                </span>
                {paymentMethod === 'paypal' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Stripe Option */}
              <button
                onClick={() => handlePaymentMethodChange('stripe')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'stripe'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#635BFF">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
                <span className={`text-sm font-semibold ${paymentMethod === 'stripe' ? 'text-purple-400' : 'text-gray-300'}`}>
                  Card
                </span>
                {paymentMethod === 'stripe' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                <p className="text-gray-400">Initializing secure payment...</p>
              </div>
            )}

            {accountNotReady && !loading && paymentMethod === 'stripe' && (
              <AccountSetupRequired onClose={onClose} />
            )}

            {error && !loading && !accountNotReady && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Payment Error</h3>
                <p className="text-red-300 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => paymentMethod === 'stripe' ? createPaymentIntent() : setError(null)}
                    className="flex-1 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* PayPal Checkout */}
            {paymentMethod === 'paypal' && !loading && !error && (
              <PayPalCheckout
                item={item}
                onSuccess={handleSuccess}
                onCancel={onClose}
                vipPointsPreview={vipPointsPreview}
                playerId={playerId}
              />
            )}

            {/* Stripe Checkout */}
            {paymentMethod === 'stripe' && clientSecret && paymentIntentId && !loading && !error && !accountNotReady && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#8B5CF6',
                      colorBackground: '#ffffff',
                      colorText: '#1f2937',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    }
                  }
                }}
              >
                <StripeCheckoutForm 
                  item={item} 
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                  vipPointsPreview={vipPointsPreview}
                  paymentIntentId={paymentIntentId}
                  playerId={playerId}
                />
              </Elements>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {paymentMethod === 'paypal' ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                )}
                {paymentMethod === 'paypal' ? 'PayPal' : 'Stripe'}
              </span>
              <span>•</span>
              <span>256-bit SSL</span>
              <span>•</span>
              <span>Buyer Protection</span>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutModal;
