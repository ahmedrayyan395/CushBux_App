import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';

const GameItem: React.FC<{ to: string, icon: React.ReactNode, title: string, description: string }> = ({ to, icon, title, description }) => {
    return (
        <Link to={to} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-4">
                <div className="bg-slate-700 p-3 rounded-full text-green-500">{icon}</div>
                <div>
                    <h3 className="font-semibold text-white text-lg">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>
            <div className="text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        </Link>
    );
};

const GamePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4 text-white">Games</h2>
        <div className="space-y-3">
          <GameItem
            to="/game/street-racing"
            icon={ICONS.car}
            title="Street Racing Empire"
            description="Customize your car and rule the streets!"
          />
          <GameItem
            to="/spin-wheel"
            icon={ICONS.gift}
            title="Spin Wheel"
            description="Win coins and TON prizes!"
          />
           <GameItem
            to="/game/space-defender"
            icon={ICONS.zap}
            title="Space Defender"
            description="Destroy aliens and upgrade your ship!"
          />
          {/* Future games will be added here */}
        </div>
      </section>
    </div>
  );
};

export default GamePage;