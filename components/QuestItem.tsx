// components/QuestItem.tsx
import React from 'react';
import type { Quest } from '../services/api';
import ProgressBar from './ProgressBar';

interface QuestItemProps {
  quest: Quest;
  onClaim: (questId: string) => void;
  isClaiming?: boolean;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, onClaim, isClaiming = false }) => {
  const handleClaimClick = () => {
    if (quest.canClaim && !isClaiming) {
      onClaim(quest.id);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg flex flex-col space-y-3">
      <div className="flex items-center space-x-4">
        <div className="bg-slate-700 p-3 rounded-full text-2xl">{quest.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{quest.title}</h3>
          <p className="text-sm text-green-400">+{quest.reward.toLocaleString()} Coins</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <ProgressBar current={quest.currentProgress} total={quest.totalProgress} />
        </div>
        <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
          {quest.currentProgress}/{quest.totalProgress}
        </span>
      </div>
      
      <button
        onClick={handleClaimClick}
        disabled={!quest.canClaim || isClaiming}
        className={`w-full font-bold py-2 px-4 rounded-lg text-sm transition-colors ${
          quest.isClaimed 
            ? 'bg-gray-600 text-gray-400 cursor-default' 
            : quest.canClaim 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-slate-600 text-slate-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isClaiming ? 'Claiming...' : 
         quest.isClaimed ? 'Claimed' : 
         quest.canClaim ? 'Claim Reward' : 'In Progress'}
      </button>
    </div>
  );
};

export default QuestItem;