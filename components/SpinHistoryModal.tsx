// components/SpinHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { getSpinHistory } from '../services/api';

interface SpinHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
}

const SpinHistoryModal: React.FC<SpinHistoryModalProps> = ({ isOpen, onClose, userId }) => {
  const [history, setHistory] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadHistory();
    }
  }, [isOpen, userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getSpinHistory(userId!, 50);
      if (response.success) {
        setHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to load spin history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Spin History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-80">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No spin history yet
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.prize_label}</p>
                    <p className="text-slate-400 text-sm">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.prize_type === 'coins' ? 'bg-yellow-500/20 text-yellow-400' :
                    item.prize_type === 'spins' ? 'bg-green-500/20 text-green-400' :
                    item.prize_type === 'ton' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {item.prize_type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinHistoryModal;