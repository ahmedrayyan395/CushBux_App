
import React, { useState, useEffect } from 'react';
import type { User, Transaction } from '../types';
import { CONVERSION_RATE } from '../constants';
import { fetchTransactions, executeWithdrawal } from '../services/api';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';



const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const statusColor = {
    Completed: 'text-green-500',
    Pending: 'text-yellow-500',
    Failed: 'text-red-500',
  }[tx.status];

  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
      <div>
        <p className="font-semibold text-white">{tx.type}</p>
        <p className="text-sm text-slate-400">{tx.date}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-white">{tx.amount.toFixed(2)} {tx.currency}</p>
        <p className={`text-sm font-medium ${statusColor}`}>{tx.status}</p>
      </div>
    </div>
  );
};




const WithdrawPage: React.FC<{ user: User | null, setUser: (user: User) => void }> = ({ user, setUser }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const tonEquivalent = user ? user.coins / CONVERSION_RATE : 0;
  const minWithdrawal = 1.10;
  const canWithdraw = tonEquivalent >= minWithdrawal;

  useEffect(() => {
    fetchTransactions().then(setTransactions);
  }, []);

  const handleWithdraw = async () => {
    if (!canWithdraw || !user) return;
    // For simplicity, we withdraw the minimum amount. A real app would have an input.
    const result = await executeWithdrawal(minWithdrawal);
    if (result.success && result.user) {
      setUser(result.user);
      // refetch or update transactions
      fetchTransactions().then(setTransactions);
      alert(`Successfully withdrew ${minWithdrawal} TON!`);
    } else {
      alert('Withdrawal failed. Insufficient balance.');
    }
  };
  
  const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-6 rounded-xl text-center">
        <p className="text-slate-300">Your balance</p>
        <p className="text-4xl font-bold text-white my-1">{user ? user.coins.toLocaleString() : 0} Coins</p>
        <p className="text-green-400 font-semibold">≈ {tonEquivalent.toFixed(6)} TON</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl space-y-4">
        {wallet ? (
             <div className="text-center">
                <p className="text-slate-300">Connected Wallet:</p>
                <p className="font-mono text-green-500">{formatAddress(wallet.account.address)}</p>
            </div>
        ) : (
             <p className="text-center text-slate-300">Connect your TON wallet to withdraw funds.</p>
        )}

        <div className="flex space-x-3">
          {!wallet ? (
            <button
              onClick={() => tonConnectUI.openModal()}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
             <button
              onClick={() => tonConnectUI.disconnect()}
              className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          )}

          <button
            onClick={handleWithdraw}
            disabled={!wallet || !canWithdraw}
            className="w-full bg-green-500 text-white font-bold py-3 rounded-lg transition-colors hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Min {minWithdrawal.toFixed(2)} TON
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-white">Payment history</h2>
        <div className="bg-slate-800 p-4 rounded-xl">
          {transactions.length > 0 ? (
            transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
          ) : (
            <p className="text-center text-slate-400 py-4">No transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
