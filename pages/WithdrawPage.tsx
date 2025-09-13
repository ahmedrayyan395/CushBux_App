import React, { useState, useEffect } from 'react';
import type { User, Transaction } from '../types';
import { CONVERSION_RATE, MIN_WITHDRAWAL_TON } from '../constants';
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const userTonBalance = user?.ton ? Number(user.ton) : 0;
  const minWithdrawal = MIN_WITHDRAWAL_TON || 1.10;
  const maxWithdrawal = userTonBalance;
  const canWithdraw = userTonBalance >= minWithdrawal;

  useEffect(() => {
    fetchTransactions().then(setTransactions);
  }, []);

 
const handleWithdraw = async () => {
  if (!wallet || !user || !withdrawAmount) return;
  
  const amount = parseFloat(withdrawAmount);
  if (isNaN(amount) || amount < minWithdrawal || amount > userTonBalance) {
    alert(`Please enter a valid amount between ${minWithdrawal} and ${userTonBalance} TON`);
    return;
  }

  setIsWithdrawing(true);

  try {
    // Build transaction to send TON to the user's connected wallet
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: wallet.account.address, // ✅ user's wallet
          amount: (amount * 1e9).toString(), // ✅ convert TON → nanoton
        },
      ],
    };
    
    // Send blockchain transaction
    const txResponse = await tonConnectUI.sendTransaction(transaction);

    if (!txResponse || !txResponse.boc) {
      throw new Error("Transaction failed: no response from wallet.");
    }

    // Update backend with withdrawal info
    const result = await executeWithdrawal(amount, txResponse.boc, user.id);
    if (result.success && result.user) {
      setUser(result.user);
      setWithdrawAmount('');
      fetchTransactions().then(setTransactions);
      alert(`Successfully withdrew ${amount} TON to your wallet!`);
    } else {
      throw new Error(result.message || "Failed to update balance after withdrawal.");
    }
  } catch (error: any) {
    console.error("Withdrawal failed:", error);
    const errorMessage = (error instanceof Error && error.message.length < 100) 
      ? error.message 
      : "Transaction was cancelled or failed.";
    
    if (!errorMessage.toLowerCase().includes('user rejected') && 
        !errorMessage.toLowerCase().includes('transaction was cancelled')) {
      alert(errorMessage);
    }
  } finally {
    setIsWithdrawing(false);
  }
};






  const handleMaxWithdraw = () => {
    setWithdrawAmount(userTonBalance.toFixed(6));
  };

  const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="space-y-8">
      {/* Balance Section */}
      <div className="bg-slate-800 p-6 rounded-xl text-center">
        <p className="text-slate-300">Your TON Balance</p>
        <p className="text-4xl font-bold text-white my-1">{userTonBalance.toFixed(6)} TON</p>
        <p className="text-green-400 font-semibold">
          ≈ {(userTonBalance * CONVERSION_RATE).toLocaleString()} Coins
        </p>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-slate-800 p-6 rounded-xl space-y-4">
        {wallet ? (
          <div className="text-center">
            <p className="text-slate-300">Connected Wallet:</p>
            <p className="font-mono text-green-500">{formatAddress(wallet.account.address)}</p>
          </div>
        ) : (
          <p className="text-center text-slate-300">Connect your TON wallet to withdraw funds.</p>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm">Withdrawal Amount (TON)</label>
          <div className="relative">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Min: ${minWithdrawal} TON`}
              min={minWithdrawal}
              max={userTonBalance}
              step="0.001"
              className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
              disabled={!wallet || isWithdrawing}
            />
            <button
              onClick={handleMaxWithdraw}
              disabled={!wallet || isWithdrawing}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-600 text-xs text-white px-2 py-1 rounded hover:bg-slate-500 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Min: {minWithdrawal} TON</span>
            <span>Available: {userTonBalance.toFixed(6)} TON</span>
          </div>
        </div>

        {/* Action Buttons */}
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
            disabled={!wallet || !withdrawAmount || isWithdrawing || parseFloat(withdrawAmount) < minWithdrawal || parseFloat(withdrawAmount) > userTonBalance}
            className="w-full bg-green-500 text-white font-bold py-3 rounded-lg transition-colors hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isWithdrawing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              'Withdraw TON'
            )}
          </button>
        </div>

        {/* Fee Information */}
        <div className="text-xs text-slate-400 text-center">
          <p>⚠️ Network fees will be deducted from your withdrawal amount</p>
          <p>Estimated fee: ~0.05 TON</p>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">Withdrawal History</h2>
        <div className="bg-slate-800 p-4 rounded-xl">
          {transactions.length > 0 ? (
            transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
          ) : (
            <p className="text-center text-slate-400 py-4">No withdrawal transactions yet.</p>
          )}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
        <h3 className="text-yellow-400 font-bold mb-2">⚠️ Important Notice</h3>
        <p className="text-yellow-300 text-sm">
          Withdrawals are processed on the TON blockchain. Please ensure you're connected to the correct wallet address.
          Transactions may take a few minutes to confirm.
        </p>
      </div>
    </div>
  );
};

export default WithdrawPage;