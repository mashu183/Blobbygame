import React, { useState, useEffect } from 'react';
import { X, Bot, Users, Share2, Copy, Check, MessageCircle, Sparkles } from 'lucide-react';
import { PuzzleChallenge } from './PuzzleChallengeModal';

interface AskFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleChallenge;
  onUseAnswer: (answer: string) => void;
}

export default function AskFriendModal({
  isOpen,
  onClose,
  puzzle,
  onUseAnswer,
}: AskFriendModalProps) {
  const [activeTab, setActiveTab] = useState<'bot' | 'friend'>('bot');
  const [botThinking, setBotThinking] = useState(false);
  const [botAnswer, setBotAnswer] = useState<string | null>(null);
  const [botExplanation, setBotExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBotThinking(false);
      setBotAnswer(null);
      setBotExplanation(null);
      setCopied(false);
      setShowShareOptions(false);
    }
  }, [isOpen]);

  const handleAskBot = () => {
    setBotThinking(true);
    
    // Simulate bot "thinking" for 2-3 seconds
    const thinkTime = 2000 + Math.random() * 1000;
    
    setTimeout(() => {
      setBotThinking(false);
      setBotAnswer(puzzle.correctAnswer.toString());
      
      // Generate explanation based on puzzle type
      let explanation = '';
      switch (puzzle.type) {
        case 'trivia':
          explanation = `Based on my knowledge, the correct answer is "${puzzle.correctAnswer}". This is a well-known fact that you might want to remember for future reference!`;
          break;
        case 'riddle':
          explanation = `The answer to this riddle is "${puzzle.correctAnswer}". ${puzzle.hint ? `The hint "${puzzle.hint}" points to this answer.` : 'Think about what matches all the clues in the riddle.'}`;
          break;
        case 'math':
          explanation = `Let me calculate... The answer is ${puzzle.correctAnswer}. Always double-check your arithmetic!`;
          break;
        case 'wordscramble':
          explanation = `Unscrambling the letters gives us "${puzzle.correctAnswer}". ${puzzle.hint ? `The hint was: ${puzzle.hint}` : ''}`;
          break;
        default:
          explanation = `The correct answer is "${puzzle.correctAnswer}".`;
      }
      setBotExplanation(explanation);
    }, thinkTime);
  };

  const handleUseAnswer = () => {
    if (botAnswer) {
      onUseAnswer(botAnswer);
      onClose();
    }
  };

  const generateShareText = () => {
    return `🎮 Help me with this puzzle in Blobby!\n\n${puzzle.question}\n\nOptions:\n${puzzle.options?.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}\n\nCan you help me figure out the answer?`;
  };

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: string) => {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${text}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Help%20me%20with%20this%20puzzle!&body=${text}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-md overflow-hidden border border-blue-500/30 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Users size={24} />
            </div>
            <div>
              <div className="text-white font-bold text-lg">Ask a Friend</div>
              <div className="text-blue-100 text-sm">Get help with this puzzle</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'bot'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Bot size={18} />
            Ask Blobby Bot
          </button>
          <button
            onClick={() => setActiveTab('friend')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'friend'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Share2 size={18} />
            Ask Real Friend
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'bot' ? (
            <div className="space-y-4">
              {/* Bot Avatar */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Bot size={40} className="text-white" />
                </div>
              </div>
              
              <div className="text-center text-gray-400 text-sm mb-4">
                Blobby Bot can help you with the answer!
              </div>

              {!botAnswer && !botThinking && (
                <button
                  onClick={handleAskBot}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Ask Blobby Bot
                </button>
              )}

              {botThinking && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-800">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-gray-300">Blobby is thinking...</span>
                  </div>
                </div>
              )}

              {botAnswer && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="text-cyan-400 font-medium mb-1">Blobby Bot says:</div>
                        <div className="text-white text-lg font-bold mb-2">
                          The answer is: {botAnswer}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {botExplanation}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUseAnswer}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                  >
                    Use This Answer
                  </button>

                  <p className="text-center text-gray-500 text-xs">
                    Note: Using the bot's answer won't give you bonus points
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Preview */}
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-2">Question to share:</div>
                <div className="text-white font-medium mb-3">{puzzle.question}</div>
                <div className="space-y-1">
                  {puzzle.options?.map((opt, i) => (
                    <div key={i} className="text-gray-300 text-sm">
                      {String.fromCharCode(65 + i)}) {opt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyQuestion}
                className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-medium hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-green-400" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy Question
                  </>
                )}
              </button>

              {/* Share Options */}
              <div className="space-y-3">
                <div className="text-gray-400 text-sm text-center">Share via:</div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <MessageCircle size={20} />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('telegram')}
                    className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <MessageCircle size={20} />
                    <span className="text-xs">Telegram</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('sms')}
                    className="py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <MessageCircle size={20} />
                    <span className="text-xs">SMS</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <Share2 size={20} />
                    <span className="text-xs">Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('facebook')}
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <Share2 size={20} />
                    <span className="text-xs">Facebook</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('email')}
                    className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all flex flex-col items-center gap-1"
                  >
                    <Share2 size={20} />
                    <span className="text-xs">Email</span>
                  </button>
                </div>
              </div>

              <p className="text-center text-gray-500 text-xs mt-4">
                Ask a friend for help and enter their answer manually
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
