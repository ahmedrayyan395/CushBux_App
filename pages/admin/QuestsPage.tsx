// components/QuestAdmin.tsx
import React, { useState, useEffect } from 'react';
import { fetchAllQuests, createQuest, updateQuest, deleteQuest } from '../../services/api';

interface AdminQuest {
  id: string;
  title: string;
  icon: string;
  reward: number;
  total_progress: number;
  quest_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const QuestAdmin: React.FC = () => {
  const [quests, setQuests] = useState<AdminQuest[]>([]);
  const [editingQuest, setEditingQuest] = useState<AdminQuest | null>(null);
  const [newQuest, setNewQuest] = useState<Partial<AdminQuest>>({
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAllQuests();
      setQuests(data);
    } catch (err: any) {
      console.error('Error loading quests:', err);
      setError(err.data?.message || 'Failed to load quests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuest = async () => {
    try {
      setError(null);
      await createQuest(newQuest);
      setNewQuest({ is_active: true });
      await loadQuests();
    } catch (err: any) {
      console.error('Error creating quest:', err);
      setError(err.data?.message || 'Failed to create quest');
    }
  };

  const handleUpdateQuest = async (quest: AdminQuest) => {
    try {
      setError(null);
      await updateQuest(quest.id, quest);
      setEditingQuest(null);
      await loadQuests();
    } catch (err: any) {
      console.error('Error updating quest:', err);
      setError(err.data?.message || 'Failed to update quest');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      try {
        setError(null);
        await deleteQuest(questId);
        await loadQuests();
      } catch (err: any) {
        console.error('Error deleting quest:', err);
        setError(err.data?.message || 'Failed to delete quest');
      }
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Quest Management</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-white hover:text-gray-200 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Create New Quest Form */}
      <div className="bg-slate-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Create New Quest</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Quest ID"
            value={newQuest.id || ''}
            onChange={e => setNewQuest({...newQuest, id: e.target.value})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          />
          <input
            type="text"
            placeholder="Title"
            value={newQuest.title || ''}
            onChange={e => setNewQuest({...newQuest, title: e.target.value})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          />
          <input
            type="text"
            placeholder="Icon"
            value={newQuest.icon || ''}
            onChange={e => setNewQuest({...newQuest, icon: e.target.value})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          />
          <input
            type="number"
            placeholder="Reward"
            value={newQuest.reward || ''}
            onChange={e => setNewQuest({...newQuest, reward: parseInt(e.target.value) || 0})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          />
          <input
            type="number"
            placeholder="Total Progress"
            value={newQuest.total_progress || ''}
            onChange={e => setNewQuest({...newQuest, total_progress: parseInt(e.target.value) || 0})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          />
          <select
            value={newQuest.quest_type || ''}
            onChange={e => setNewQuest({...newQuest, quest_type: e.target.value})}
            className="border border-slate-600 bg-slate-700 text-white p-2 rounded"
          >
            <option value="">Select Type</option>
            <option value="game">Game</option>
            <option value="social">Social</option>
            <option value="partner">Partner</option>
            <option value="invite">Invite</option>
          </select>
        </div>
        <button
          onClick={handleCreateQuest}
          className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-colors"
          disabled={!newQuest.id || !newQuest.title}
        >
          Create Quest
        </button>
      </div>

      {/* Quests List */}
      <div className="bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-white">ID</th>
              <th className="px-6 py-3 text-left text-white">Title</th>
              <th className="px-6 py-3 text-left text-white">Reward</th>
              <th className="px-6 py-3 text-left text-white">Progress</th>
              <th className="px-6 py-3 text-left text-white">Type</th>
              <th className="px-6 py-3 text-left text-white">Status</th>
              <th className="px-6 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quests.map(quest => (
              <tr key={quest.id} className="border-t border-slate-600">
                <td className="px-6 py-4 text-white">{quest.id}</td>
                <td className="px-6 py-4 text-white">{quest.title}</td>
                <td className="px-6 py-4 text-white">{quest.reward.toLocaleString()}</td>
                <td className="px-6 py-4 text-white">{quest.total_progress}</td>
                <td className="px-6 py-4 text-white capitalize">{quest.quest_type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    quest.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {quest.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => setEditingQuest(quest)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {quests.length === 0 && !isLoading && (
          <div className="text-center text-slate-400 py-8">
            No quests found.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4 text-white">Edit Quest</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editingQuest.title}
                  onChange={e => setEditingQuest({...editingQuest, title: e.target.value})}
                  className="border border-slate-600 bg-slate-700 text-white p-2 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Reward</label>
                <input
                  type="number"
                  value={editingQuest.reward}
                  onChange={e => setEditingQuest({...editingQuest, reward: parseInt(e.target.value) || 0})}
                  className="border border-slate-600 bg-slate-700 text-white p-2 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Total Progress</label>
                <input
                  type="number"
                  value={editingQuest.total_progress}
                  onChange={e => setEditingQuest({...editingQuest, total_progress: parseInt(e.target.value) || 0})}
                  className="border border-slate-600 bg-slate-700 text-white p-2 rounded w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingQuest.is_active}
                  onChange={e => setEditingQuest({...editingQuest, is_active: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">Active</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingQuest(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateQuest(editingQuest)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestAdmin;