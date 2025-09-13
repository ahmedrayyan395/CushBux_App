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
        setTimeout(onClose, 500);
      }, 4000);

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
        return 'bg-gradient-to-br from-yellow-500 to-orange-600';
      case 'spins':
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      case 'ton':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-700';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${getBackgroundClass(prize.type)} text-white p-4 rounded-xl shadow-2xl border-2 border-white/20 max-w-sm`}>
        <div className="flex items-center space-x-3">
          <div className="text-2xl animate-bounce">
            {getPrizeIcon(prize.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Congratulations!</h3>
            <p className="text-sm">You won: {prize.label}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 500);
            }}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Progress bar for auto-close */}
        <div className="w-full bg-white/20 rounded-full h-1 mt-2">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-4000 ease-linear"
            style={{ width: isVisible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrizeNotification;