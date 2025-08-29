
import React, { useState, useEffect } from 'react';
import type { Quest } from '../types';
import { fetchQuests } from '../services/api';
import ProgressBar from '../components/ProgressBar';

const QuestItem: React.FC<{ quest: Quest }> = ({ quest }) => {
  const isCompleted = quest.currentProgress >= quest.totalProgress;
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
        disabled={!isCompleted}
        className="w-full font-bold py-2 px-4 rounded-lg text-sm transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {isCompleted ? 'Claim' : 'In Progress'}
      </button>
    </div>
  );
};

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    fetchQuests().then(setQuests);
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4 text-white">Quests</h2>
        <div className="space-y-3">
          {quests.map(quest => (
            <QuestItem key={quest.id} quest={quest} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default QuestsPage;
