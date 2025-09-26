// components/AdminWithdrawalControl.tsx
import React, { useState, useEffect } from 'react';

interface PendingWithdrawal {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  currency: string;
  created_at: string;
  description: string;
}

const AdminWithdrawalControl: React.FC = () => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [autoWithdrawals, setAutoWithdrawals] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [withdrawalsResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/pending-withdrawals').then(res => res.json()),
        fetch('/api/settings/withdrawals').then(res => res.json())
      ]);

      if (withdrawalsResponse.success) {
        setPendingWithdrawals(withdrawalsResponse.withdrawals);
      }

      if (settingsResponse.auto_withdrawals !== undefined) {
        setAutoWithdrawals(settingsResponse.auto_withdrawals);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: number) => {
    try {
      const response = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId })
      });

      const result = await response.json();

      if (result.success) {
        alert('Withdrawal approved successfully!');
        loadData(); // Refresh the list
      } else {
        alert('Failed to approve withdrawal: ' + result.message);
      }
    } catch (error) {
      alert('Error approving withdrawal');
    }
  };

  const handleReject = async (withdrawalId: number) => {
    try {
      const response = await fetch('/api/admin/reject-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId })
      });

      const result = await response.json();

      if (result.success) {
        alert('Withdrawal rejected successfully!');
        loadData(); // Refresh the list
      } else {
        alert('Failed to reject withdrawal: ' + result.message);
      }
    } catch (error) {
      alert('Error rejecting withdrawal');
    }
  };

  const handleToggleAutoWithdrawals = async () => {
    try {
      const response = await fetch('/api/admin/toggle-auto-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoWithdrawals })
      });

      const result = await response.json();

      if (result.success) {
        setAutoWithdrawals(!autoWithdrawals);
        alert(`Auto withdrawals ${!autoWithdrawals ? 'enabled' : 'disabled'}`);
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      alert('Error updating settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Settings Section */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Withdrawal Settings</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Auto Withdrawals</h3>
            <p className="text-slate-400">
              {autoWithdrawals 
                ? 'Withdrawals are processed automatically' 
                : 'Withdrawals require manual approval'
              }
            </p>
          </div>
          
          <button
            onClick={handleToggleAutoWithdrawals}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              autoWithdrawals 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {autoWithdrawals ? 'Disable Auto' : 'Enable Auto'}
          </button>
        </div>
      </div>

      {/* Pending Withdrawals Section */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Pending Withdrawals</h2>
          <span className="text-slate-400">
            {pendingWithdrawals.length} pending
          </span>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No pending withdrawals</p>
        ) : (
          <div className="space-y-4">
            {pendingWithdrawals.map(withdrawal => (
              <div key={withdrawal.id} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">
                      {withdrawal.username} (ID: {withdrawal.user_id})
                    </p>
                    <p className="text-slate-300">{withdrawal.amount} {withdrawal.currency}</p>
                    <p className="text-slate-400 text-sm">
                      Requested: {new Date(withdrawal.created_at).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-sm">{withdrawal.description}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(withdrawal.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(withdrawal.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawalControl;