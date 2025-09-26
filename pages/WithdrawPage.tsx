import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Transaction, TransactionsFilters, TransactionsResponse } from '../types';
import { CONVERSION_RATE, MIN_WITHDRAWAL_TON } from '../constants';
import { fetchWithdrawalTransactions, executeWithdrawal, updateWithdrawalTransaction } from '../services/api';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

// ... (keep all your existing components: TransactionRow, TransactionsFilters, Pagination)

const TransactionRow: React.FC<{ tx: Transaction }> = React.memo(({ tx }) => {
  const statusColor = {
    COMPLETED: 'text-green-500',
    PENDING: 'text-yellow-500',
    FAILED: 'text-red-500',
  }[tx.status] || 'text-gray-500';

  const formattedDate = tx.date || new Date(tx.created_at).toLocaleDateString();

  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{tx.description}</p>
        <p className="text-sm text-slate-400">{formattedDate}</p>
        {tx.transaction_id_on_blockchain && (
          <p className="text-xs text-blue-400 mt-1 truncate">
            TX: {tx.transaction_id_on_blockchain.slice(0, 8)}...{tx.transaction_id_on_blockchain.slice(-8)}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="font-bold text-white">{Math.abs(tx.amount).toFixed(6)} {tx.currency}</p>
        <p className={`text-sm font-medium ${statusColor}`}>{tx.status}</p>
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

// Filters Component
const TransactionsFilters: React.FC<{
  filters: TransactionsFilters;
  onFiltersChange: (filters: TransactionsFilters) => void;
}> = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-white font-semibold mb-3">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined, page: 1 })}
          className="bg-slate-700 text-white p-2 rounded border border-slate-600"
        >
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          value={filters.currency || ''}
          onChange={(e) => onFiltersChange({ ...filters, currency: e.target.value || undefined, page: 1 })}
          className="bg-slate-700 text-white p-2 rounded border border-slate-600"
        >
          <option value="">All Currencies</option>
          <option value="TON">TON</option>
          <option value="COINS">Coins</option>
        </select>

        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined, page: 1 })}
          className="bg-slate-700 text-white p-2 rounded border border-slate-600"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined, page: 1 })}
          className="bg-slate-700 text-white p-2 rounded border border-slate-600"
          placeholder="End Date"
        />
      </div>
    </div>
  );
};

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50"
      >
        ←
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
        if (page > totalPages) return null;
        
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50"
      >
        →
      </button>

      <span className="text-slate-400 text-sm">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

const WithdrawPage: React.FC<{ user: User | null, setUser: (user: User) => void }> = ({ user, setUser }) => {
  const [transactionsData, setTransactionsData] = useState<TransactionsResponse>({
    transactions: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [filters, setFilters] = useState<TransactionsFilters>({
    page: 1,
    limit: 20,
  });
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  // Calculate available TON balance from coins only
  const availableTonBalance = useMemo(() => {
    if (!user || !user.coins) return 0;
    return Number(user.coins) / CONVERSION_RATE;
  }, [user]);

  const availableCoinsBalance = useMemo(() => {
    if (!user) return 0;
    return user.coins ? Number(user.coins) : 0;
  }, [user]);

  const minWithdrawal = MIN_WITHDRAWAL_TON || 0.010;

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithdrawalTransactions(filters);
      setTransactionsData(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const validateWithdrawalAmount = (amount: number): { isValid: boolean; message: string } => {
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, message: "Please enter a valid amount" };
    }

    if (amount < minWithdrawal) {
      return { isValid: false, message: `Minimum withdrawal is ${minWithdrawal} TON` };
    }

    if (amount > availableTonBalance) {
      return { 
        isValid: false, 
        message: `Insufficient coins balance. You need ${(amount * CONVERSION_RATE).toFixed(0)} coins for ${amount} TON` 
      };
    }

    return { isValid: true, message: "" };
  };

  // In your WithdrawPage component, update the handleWithdraw function:

const handleWithdraw = async () => {
    if (!wallet || !user || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    const validation = validateWithdrawalAmount(amount);
    
    if (!validation.isValid) {
        alert(validation.message);
        return;
    }

    setIsWithdrawing(true);

    try {
        const result = await executeWithdrawal(amount, user.id);
        
        if (!result.success || !result.user) {
            throw new Error(result.message || "Failed to process withdrawal");
        }

        // Only update user balance if auto-withdrawals are enabled
        if (!result.requiresApproval) {
            setUser(result.user);
        }

        // Only proceed with blockchain transaction if auto-withdrawals are enabled
        if (!result.requiresApproval) {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: wallet.account.address,
                        amount: Math.round(amount * 1e9).toString(),
                    },
                ],
            };

            const txResponse = await tonConnectUI.sendTransaction(transaction);

            if (!txResponse?.boc) {
                throw new Error("Transaction failed: no response from wallet.");
            }

            if (result.transactionId) {
                await updateWithdrawalTransaction(result.transactionId, txResponse.boc);
            }
        }

        setWithdrawAmount('');
        await loadTransactions();
        
        if (result.requiresApproval) {
            alert(`Withdrawal submitted for approval. ${amount} TON will be processed after admin review.`);
        } else {
            alert(`Successfully withdrew ${amount} TON to your wallet!`);
        }

    } catch (error: any) {
        console.error("Withdrawal failed:", error);
        const errorMessage = error.message || "Transaction was cancelled or failed.";
        
        // Only revert if auto-withdrawals were enabled (balance was deducted)
        if (user && !errorMessage.toLowerCase().includes('user rejected')) {
            const revertedUser = { ...user };
            setUser(revertedUser);
        }

        if (!errorMessage.toLowerCase().includes('user rejected') && 
            !errorMessage.toLowerCase().includes('transaction was cancelled')) {
            alert(errorMessage);
        }
    } finally {
        setIsWithdrawing(false);
    }
};
  const handleMaxWithdraw = () => {
    setWithdrawAmount(availableTonBalance.toFixed(6));
  };

  const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="space-y-8">
      {/* Balance Section - Updated */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-white text-center mb-4">Your Balance</h2>
        
        {/* Available TON Balance from Coins */}
        <div className="text-center mb-6">
          <p className="text-slate-300">Available TON Balance (from Coins)</p>
          <p className="text-4xl font-bold text-white my-1">{availableTonBalance.toFixed(6)} TON</p>
          <p className="text-green-400 font-semibold">
            ≈ {availableCoinsBalance.toLocaleString()} Coins
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 gap-4 text-sm max-w-md mx-auto">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-slate-300">Coins Balance</p>
            <p className="text-yellow-400 font-bold text-2xl">
              {availableCoinsBalance.toLocaleString()} Coins
            </p>
            <p className="text-green-400 text-lg mt-1">
              ≈ {availableTonBalance.toFixed(6)} TON
            </p>
          </div>
        </div>

        {/* Conversion Info */}
        <div className="text-xs text-slate-400 text-center mt-4">
          <p>💱 Conversion rate: 1 TON = {CONVERSION_RATE.toLocaleString()} Coins</p>
        </div>
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
              max={availableTonBalance}
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
            <span>Available: {availableTonBalance.toFixed(6)} TON</span>
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
            disabled={!wallet || !withdrawAmount || isWithdrawing}
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Withdrawal History</h2>
          <span className="text-slate-400 text-sm">
            {transactionsData.total} total transactions
          </span>
        </div>

        <TransactionsFilters filters={filters} onFiltersChange={setFilters} />

        <div className="bg-slate-800 p-4 rounded-xl">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading transactions...</p>
            </div>
          ) : transactionsData.transactions.length > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto">
                {transactionsData.transactions.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
              
              <Pagination
                currentPage={transactionsData.page}
                totalPages={transactionsData.totalPages}
                onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <p className="text-center text-slate-400 py-8">No withdrawal transactions found.</p>
          )}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
        <h3 className="text-yellow-400 font-bold mb-2">⚠️ Important Notice</h3>
        <p className="text-yellow-300 text-sm">
          Withdrawals are now processed using coins only. Your coins will be automatically converted to TON.
          Conversion rate: 1 TON = {CONVERSION_RATE.toLocaleString()} Coins.
        </p>
      </div>
    </div>
  );
};

export default WithdrawPage;