// components/PrizeNotification.tsx
import React, { useEffect, useState } from 'react';

interface PrizeNotificationProps {
  prize: {
    label: string;
    type: string;
    value: number;
  } | null;
  onClose: () => void;
}

const PrizeNotification: React.FC<PrizeNotificationProps> = ({ prize, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prize) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [prize, onClose]);

  if (!prize) return null;

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'coins':
        return '💰';
      case 'spins':
        return '🎰';
      case 'ton':
        return '⚡';
      default:
        return '🎁';
    }
  };

  const getBackgroundClass = (type: string) => {
    switch (type) {
      case 'coins':
        return 'bg-gradient-to-r from-yellow-500/95 to-orange-600/95 border-yellow-400/50';
      case 'spins':
        return 'bg-gradient-to-r from-green-500/95 to-emerald-600/95 border-green-400/50';
      case 'ton':
        return 'bg-gradient-to-r from-blue-500/95 to-indigo-600/95 border-blue-400/50';
      default:
        return 'bg-gradient-to-r from-gray-500/95 to-gray-700/95 border-gray-400/50';
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ease-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${getBackgroundClass(prize.type)} text-white p-3 rounded-lg shadow-2xl border backdrop-blur-sm max-w-xs`}>
        <div className="flex items-center space-x-2">
          <div className="text-xl animate-pulse">
            {getPrizeIcon(prize.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">You won!</h3>
            <p className="text-xs opacity-90">{prize.label}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/70 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
        
        {/* Progress bar for auto-close */}
        <div className="w-full bg-white/20 rounded-full h-1 mt-2">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-3000 ease-linear"
            style={{ width: isVisible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrizeNotification;