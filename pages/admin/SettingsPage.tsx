import React, { useState, useEffect } from 'react';
import type { AdNetwork, Transaction } from '../../types';
import { fetchSettings, updateSettings, fetchAdNetworks, addAdNetwork, toggleAdNetwork, fetchPendingTransactions, approveTransaction, rejectTransaction } from '../../services/api';






const SettingsPage: React.FC = () => {
  const [autoWithdrawals, setAutoWithdrawals] = useState(false);
  const [adNetworks, setAdNetworks] = useState<AdNetwork[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [settingsData, networks] = await Promise.all([fetchSettings(), fetchAdNetworks()]);
      setAutoWithdrawals(settingsData.autoWithdrawals);
      setAdNetworks(networks);
      setLoading(false);
      
      // Load pending transactions if auto withdrawals are disabled
      if (!settingsData.autoWithdrawals) {
        await loadPendingTransactions();
      }
    } catch (err) {
      console.error("Failed to load settings", err);
      setLoading(false);
    }
  };

  const loadPendingTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const transactions = await fetchPendingTransactions();
      setPendingTransactions(transactions);
    } catch (err) {
      console.error("Failed to load pending transactions", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleSettingChange = async (value: boolean) => {
    const previousValue = autoWithdrawals;
    setAutoWithdrawals(value); // optimistic update
    
    try {
      await updateSettings({ autoWithdrawals: value });
      
      // If disabling auto withdrawals, load pending transactions
      if (previousValue && !value) {
        await loadPendingTransactions();
      }
      
      // If enabling auto withdrawals, clear pending transactions
      if (!previousValue && value) {
        setPendingTransactions([]);
      }
    } catch {
      alert("Failed to update autoWithdrawals");
      const latest = await fetchSettings();
      setAutoWithdrawals(latest.autoWithdrawals);
    }
  };

  const handleAdNetworkToggle = async (networkId: string) => {
    const network = adNetworks.find(n => n.id === networkId);
    if (!network) return;
    const updated = { ...network, enabled: !network.enabled };
    setAdNetworks(adNetworks.map(n => (n.id === networkId ? updated : n))); // optimistic
    try {
      await toggleAdNetwork(networkId, updated.enabled);
    } catch {
      alert("Failed to update ad network");
      setAdNetworks(await fetchAdNetworks());
    }
  };

  const handleAddAdNetwork = async (name: string, code: string) => {
    try {
      const newNetwork = await addAdNetwork({ name, code, enabled: true });
      setAdNetworks([...adNetworks, newNetwork]);
    } catch {
      alert("Failed to add ad network");
    }
  };

  const handleApproveTransaction = async (transactionId: number) => {
    try {
      await approveTransaction(transactionId);
      alert('Transaction approved successfully');
      await loadPendingTransactions();
    } catch (error) {
      alert('Failed to approve transaction');
      console.error('Approval error:', error);
    }
  };

  const handleRejectTransaction = async (transactionId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await rejectTransaction(transactionId, reason);
      alert('Transaction rejected successfully');
      await loadPendingTransactions();
    } catch (error) {
      alert('Failed to reject transaction');
      console.error('Rejection error:', error);
    }
  };

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
              ? 'Withdrawals are processed automatically.' 
              : 'Withdrawals require manual approval. Pending transactions will appear below.'
            }
          </p>
        </section>

        {/* Pending Transactions Management (only show when auto withdrawals are disabled) */}
        {!autoWithdrawals && (
          <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Pending Withdrawal Approvals</h2>
              <button 
                onClick={loadPendingTransactions}
                disabled={transactionsLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {transactionsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {transactionsLoading ? (
              <div className="text-center text-slate-400 py-4">Loading transactions...</div>
            ) : pendingTransactions.length === 0 ? (
              <div className="text-center text-slate-400 py-4">No pending withdrawals</div>
            ) : (
              <div className="space-y-3">
                {pendingTransactions.map(transaction => (
                  <div key={transaction.id} className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-white">User ID: {transaction.user_id}</p>
                        <p className="text-slate-300 text-sm">{transaction.description}</p>
                        <p className="text-slate-400 text-xs">
                          Created: {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {Math.abs(transaction.amount).toFixed(6)} {transaction.currency}
                        </p>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          PENDING
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveTransaction(transaction.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectTransaction(transaction.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Ad Network Settings (commented out as in original) */}
        {/* <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          ... existing ad network code ...
        </section> */}
      </div>
    </div>
  );
};

// AddNetworkForm component remains the same
const AddNetworkForm: React.FC<{ onAdd: (name: string, code: string) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name, code);
    setName('');
    setCode('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 pt-4 border-t border-slate-700"
    >
      <h3 className="font-semibold">Add New Ad Network</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Network Name (e.g., AdCompany)"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
          required
        />
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Ad Script/Code Snippet"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg col-span-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-600 transition-colors"
      >
        + Add Network
      </button>
    </form>
  );
};

export default SettingsPage;