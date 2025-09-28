import React, { useState, useEffect } from 'react';
import type { AdNetwork, Transaction } from '../../types';
import { fetchSettings, updateSettings, fetchAdNetworks, addAdNetwork, toggleAdNetwork, fetchPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../services/api';

const SettingsPage: React.FC = () => {
  const [autoWithdrawals, setAutoWithdrawals] = useState(false);
  const [adNetworks, setAdNetworks] = useState<AdNetwork[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadSettingsAndWithdrawals();
  }, []);

  const loadSettingsAndWithdrawals = async () => {
    setLoading(true);
    try {
      const [settingsData, networks, pendingData] = await Promise.all([
        fetchSettings(),
        fetchAdNetworks(),
        fetchPendingWithdrawals()
      ]);
      
      setAutoWithdrawals(settingsData.autoWithdrawals);
      setAdNetworks(networks);
      if (pendingData.success) {
        setPendingWithdrawals(pendingData.transactions);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load settings", err);
      setLoading(false);
    }
  };

 const handleSettingChange = async (value: boolean) => {
  setAutoWithdrawals(value); // optimistic
  try {
    const result = await updateSettings({ autoWithdrawals: value });
    
    if (result.success) {
      // Update with the confirmed value from server
      setAutoWithdrawals(result.autoWithdrawals);
      
      // Reload pending withdrawals when settings change
      if (!result.autoWithdrawals) {
        try {
          const pendingData = await fetchPendingWithdrawals();
          if (pendingData.success) {
            setPendingWithdrawals(pendingData.transactions);
          }
        } catch (pendingError) {
          console.error('Failed to load pending withdrawals:', pendingError);
        }
      } else {
        // Clear pending withdrawals when switching to auto mode
        setPendingWithdrawals([]);
      }
    } else {
      throw new Error(result.message || 'Failed to update settings');
    }
  } catch (error: any) {
    console.error('Failed to update autoWithdrawals:', error);
    alert(`Failed to update autoWithdrawals: ${error.message || 'Unknown error'}`);
    // Revert to previous value by fetching latest settings
    try {
      const latest = await fetchSettings();
      setAutoWithdrawals(latest.autoWithdrawals);
    } catch (fetchError) {
      console.error('Failed to fetch latest settings:', fetchError);
    }
  }
};

  const handleApproveWithdrawal = async (transactionId: number) => {
    setProcessingId(transactionId);
    try {
      const result = await approveWithdrawal(transactionId);
      if (result.success) {
        alert('Withdrawal approved successfully');
        // Remove from pending list
        setPendingWithdrawals(prev => prev.filter(tx => tx.id !== transactionId));
      } else {
        alert(`Failed to approve withdrawal: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Error approving withdrawal: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithdrawal = async (transactionId: number) => {
    setProcessingId(transactionId);
    try {
      const result = await rejectWithdrawal(transactionId);
      if (result.success) {
        alert('Withdrawal rejected successfully');
        // Remove from pending list
        setPendingWithdrawals(prev => prev.filter(tx => tx.id !== transactionId));
      } else {
        alert(`Failed to reject withdrawal: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Error rejecting withdrawal: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  if (loading) {
    return <div className="text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Application Settings</h1>

      <div className="space-y-12">
        {/* Withdrawal Settings */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Withdrawal Settings</h2>
          <div className="flex items-center justify-between">
            <p className="text-slate-300">Enable automatic payouts for users?</p>
            <button
              onClick={() => handleSettingChange(!autoWithdrawals)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                autoWithdrawals ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  autoWithdrawals ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {autoWithdrawals 
              ? "Withdrawals are processed automatically. Users receive TON immediately."
              : "Withdrawals require manual approval. Users must wait for admin approval."
            }
          </p>
        </section>

        {/* Pending Withdrawals Section - Only show when auto-withdrawals are disabled */}
        {!autoWithdrawals && (
          <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Pending Withdrawal Approvals</h2>
            
            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400">No pending withdrawals to approve</p>
                <p className="text-slate-500 text-sm mt-2">All withdrawal requests are processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-slate-700/50 p-4 rounded-lg border border-yellow-500/20"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-slate-300 text-sm">User</p>
                        <p className="text-white font-semibold">
                          {transaction.user?.name || `User ${transaction.user_id}`}
                        </p>
                        {transaction.user?.wallet_address && (
                          <p className="text-slate-400 text-xs font-mono">
                            {formatAddress(transaction.user.wallet_address)}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-slate-300 text-sm">Amount</p>
                        <p className="text-white font-bold">
                          {Math.abs(transaction.amount)} TON
                        </p>
                        <p className="text-slate-400 text-xs">
                          ≈ {(Math.abs(transaction.amount) * 1000000).toLocaleString()} coins
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-300 text-sm">Requested</p>
                        <p className="text-white text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveWithdrawal(transaction.id)}
                            disabled={processingId === transaction.id}
                            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {processingId === transaction.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            ) : (
                              'Approve'
                            )}
                          </button>

                          <button
                            onClick={() => handleRejectWithdrawal(transaction.id)}
                            disabled={processingId === transaction.id}
                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {processingId === transaction.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            ) : (
                              'Reject'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-slate-400 text-xs mt-2">{transaction.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 <strong>Auto-Withdrawals are OFF</strong> - All withdrawals require manual approval. 
                When you approve, TON will be sent from your admin wallet to the user's wallet address.
              </p>
            </div>
          </section>
        )}

        {/* Ad Network Settings - commented out as in original */}
        {/* <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          ... existing ad network code ...
        </section> */}
      </div>
    </div>
  );
};

// Keep the existing AddNetworkForm component
const AddNetworkForm: React.FC<{ onAdd: (name: string, code: string) => void }> = ({ onAdd }) => {
  // ... existing AddNetworkForm code ...
};

export default SettingsPage;