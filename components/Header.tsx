import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const formatNumber = (num: any): string => {
    // Convert to number first to handle string inputs
    const numberValue = Number(num);
    
    if (isNaN(numberValue)) {
      return '0';
    }
    
    if (numberValue > 0 && numberValue < 0.001) {
      return '<0.001';
    } else if (numberValue < 1) {
      return numberValue.toFixed(3);
    } else if (numberValue >= 1000000) {
      return (numberValue / 1000000).toFixed(1) + 'M';
    } else if (numberValue >= 1000) {
      return (numberValue / 1000).toFixed(1) + 'k';
    }
    // For whole numbers, show without decimals
    if (Number.isInteger(numberValue)) {
      return numberValue.toLocaleString('en-US');
    }
    // For numbers with decimals but less than 1000, show with up to 2 decimal places
    return numberValue.toFixed(2).replace(/\.?0+$/, '');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 z-40 p-3">
      <div className="flex justify-between items-center">
        {/* Compact Balance Section */}
        <div className="flex items-center">
          <div className="bg-slate-800 p-2 rounded-lg flex items-center space-x-2 border border-slate-700/50">
            {/* Coins */}
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center justify-center w-4 h-4 text-yellow-400 flex-shrink-0">
                {ICONS.coin}
              </span>
              <span className="font-bold text-white text-sm min-w-[40px] text-right tabular-nums">
                {user?.coins != null ? formatNumber(user.coins) : '0'}
              </span>
            </div>

            <div className="w-px h-4 bg-slate-600"></div>

            {/* Rings - Optimized for small numbers */}
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center justify-center w-4 h-4 text-blue-400 flex-shrink-0">
                {ICONS.ring}
              </span>
              <span className="font-bold text-white text-sm min-w-[35px] text-right tabular-nums">
                {user?.rings != null ? formatNumber(user.rings) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/new-task')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-xs hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 whitespace-nowrap flex-shrink-0"
          >
            Tasks
          </button>
          <button
            onClick={() => navigate('/new-partner-task')}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-2 px-3 rounded-lg text-xs hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 whitespace-nowrap flex-shrink-0"
          >
            Partners
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;