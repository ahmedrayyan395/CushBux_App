import React, { useState, useEffect } from 'react';
import type { Quest, User } from '../types';
import { fetchQuests, claimQuestReward } from '../services/api';
import ProgressBar from '@/components/ProgressBar';

interface QuestsPageProps {
  user: User;
  setUser: (user: User) => void;
}

const QuestItem: React.FC<{ 
  quest: Quest; 
  onClaim: (questId: string) => void;
  isClaiming: boolean;
}> = ({ quest, onClaim, isClaiming }) => {
  const isCompleted = quest.currentProgress >= quest.totalProgress;
  const isClaimed = quest.isClaimed;

  return (
    <div className="bg-slate-800 p-4 rounded-lg flex flex-col space-y-3">
      <div className="flex items-center space-x-4">
        <div className="bg-slate-700 p-3 rounded-full text-green-500">{quest.icon}</div>
        <div>
          <h3 className="font-semibold text-white">{quest.title}</h3>
          <p className="text-sm text-green-400">+{quest.reward.toLocaleString()} Coins</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <ProgressBar current={quest.currentProgress} total={quest.totalProgress} />
        </div>
        <span className="text-sm font-medium text-slate-300">
          {quest.currentProgress}/{quest.totalProgress}
        </span>
      </div>
      <button
        onClick={() => onClaim(quest.id)}
        disabled={!isCompleted || isClaimed || isClaiming}
        className="w-full font-bold py-2 px-4 rounded-lg text-sm transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {isClaimed ? 'Claimed' : isCompleted ? 'Claim' : 'In Progress'}
      </button>
    </div>
  );
};

const QuestsPage: React.FC<QuestsPageProps> = ({ user, setUser }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, [user.id]);

  const loadQuests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userQuests = await fetchQuests(user.id);
      setQuests(userQuests);
    } catch (err: any) {
      console.error('Error loading quests:', err);
      setError(err.data?.message || 'Failed to load quests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimQuest = async (questId: string) => {
    try {
      setClaimingQuest(questId);
      setError(null);
      
      const result = await claimQuestReward(questId, user.id);
      
      // Update user balance
      setUser({
        ...user,
        coins: result.new_balance
      });
      
      // Refresh quests list to show claimed status
      await loadQuests();
      
    } catch (err: any) {
      console.error('Error claiming quest:', err);
      setError(err.data?.message || 'Failed to claim quest reward');
    } finally {
      setClaimingQuest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-white">Loading quests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-white hover:text-gray-200 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      <section>
        <h2 className="text-xl font-bold mb-4 text-white">Quests</h2>
        <div className="space-y-3">
          {quests.map(quest => (
            <QuestItem 
              key={quest.id} 
              quest={quest}
              onClaim={handleClaimQuest}
              isClaiming={claimingQuest === quest.id}
            />
          ))}
        </div>
        
        {quests.length === 0 && !isLoading && (
          <div className="text-center text-slate-400 py-8">
            No quests available at the moment.
          </div>
        )}
      </section>
    </div>
  );
};

export default QuestsPage;