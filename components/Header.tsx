import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const formatNumber = (num: number): string => {
    if (num > 0 && num < 0.001) {
      return '<0.001';
    } else if (num < 1) {
      return num.toFixed(3);
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString('en-US');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 z-40 p-3">
      <div className="flex justify-between items-center">
        {/* Compact Balance Section */}
        <div className="flex items-center">
          <div className="bg-slate-800 p-2 rounded-lg flex items-center space-x-3 border border-slate-700/50">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 text-yellow-400">
                {ICONS.coin}
              </div>
              <span className="font-bold text-white text-sm min-w-[45px] text-right">
                {user?.coins != null ? formatNumber(user.coins) : '0'}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 text-blue-400">
                {ICONS.ton}
              </div>
              <span className="font-bold text-white text-sm min-w-[50px] text-right font-mono">
                {user?.ton != null ? formatNumber(user.ad_credit) : '0'}
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