

import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';

const navItems = [
  { path: '/', label: 'Earnings', icon: ICONS.home },
  { path: '/quests', label: 'Quests', icon: ICONS.tasks },
  { path: '/game', label: 'Game', icon: ICONS.game },
  { path: '/friends', label: 'Friends', icon: ICONS.friends },
  { path: '/withdraw', label: 'Withdraw', icon: ICONS.wallet },
];

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 z-40">
      <div className="flex justify-around items-center max-w-lg mx-auto h-20">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
                isActive ? 'text-green-500' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <div className="w-7 h-7">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;