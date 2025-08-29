import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };


  

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 z-40 p-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="bg-slate-800 p-2 rounded-lg flex items-center space-x-2">
            {ICONS.coin}
            <span className="font-bold text-lg">{user?.coins!= null ? formatNumber(user.coins) : '0'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/new-task')}
            className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-sm hover:bg-green-600 transition-colors"
          >
            New task
          </button>
           <button
            onClick={() => navigate('/new-partner-task')}
            className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Task Partner
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;