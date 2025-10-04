import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, Transaction, TransactionsFilters, TransactionsResponse } from '../types';
import { CONVERSION_RATE, MIN_WITHDRAWAL_TON } from '../constants';
import { 
  fetchWithdrawalTransactions, 
  executeWithdrawal, 
  updateWithdrawalTransaction, 
  updateUserWalletAddress,
  fetchSettings 
} from '../services/api';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

// TransactionRow Component
const TransactionRow: React.FC<{ tx: Transaction }> = React.memo(({ tx }) => {
  const statusColor = {
    COMPLETED: 'text-green-500',
    PENDING: 'text-yellow-500',
    FAILED: 'text-red-500',
  }[tx.status] || 'text-gray-500';

  const statusBg = {
    COMPLETED: 'bg-green-500/10',
    PENDING: 'bg-yellow-500/10',
    FAILED: 'bg-red-500/10',
  }[tx.status] || 'bg-gray-500/10';

  const formattedDate = tx.date || new Date(tx.created_at).toLocaleDateString();

  return (
    <div className="flex justify-between items-center py-3 px-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full ${statusBg} ${statusColor} text-xs font-medium`}>
            {tx.status}
          </div>
          <p className="font-semibold text-white text-sm truncate">{tx.description}</p>
        </div>
        <p className="text-xs text-slate-400 mt-1">{formattedDate}</p>
        {tx.transaction_id_on_blockchain && (
          <p className="text-xs text-blue-400 mt-1 truncate font-mono">
            TX: {tx.transaction_id_on_blockchain.slice(0, 6)}...{tx.transaction_id_on_blockchain.slice(-6)}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-bold text-white text-base">{Math.abs(tx.amount).toFixed(6)} {tx.currency}</p>
        <p className="text-xs text-slate-400">{tx.currency === 'TON' ? 'TON' : 'Coins'}</p>
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

// Filters Component
// const TransactionsFilters: React.FC<{
//   filters: TransactionsFilters;
//   onFiltersChange: (filters: TransactionsFilters) => void;
// }> = ({ filters, onFiltersChange }) => {
//   return (
//     <div className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700/50">
//       <h3 className="text-white font-semibold mb-3 text-base">Filter Transactions</h3>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//         <div>
//           <label className="text-slate-300 text-xs block mb-1">Status</label>
//           <select
//             value={filters.status || ''}
//             onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined, page: 1 })}
//             className="w-full bg-slate-700 text-white p-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
//           >
//             <option value="">All Status</option>
//             <option value="COMPLETED">Completed</option>
//             <option value="PENDING">Pending</option>
//             <option value="FAILED">Failed</option>
//           </select>
//         </div>

//         <div>
//           <label className="text-slate-300 text-xs block mb-1">Currency</label>
//           <select
//             value={filters.currency || ''}
//             onChange={(e) => onFiltersChange({ ...filters, currency: e.target.value || undefined, page: 1 })}
//             className="w-full bg-slate-700 text-white p-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
//           >
//             <option value="">All Currencies</option>
//             <option value="TON">TON</option>
//             <option value="COINS">Coins</option>
//           </select>
//         </div>

//         <div>
//           <label className="text-slate-300 text-xs block mb-1">From Date</label>
//           <input
//             type="date"
//             value={filters.startDate || ''}
//             onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined, page: 1 })}
//             className="w-full bg-slate-700 text-white p-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
//           />
//         </div>

//         <div>
//           <label className="text-slate-300 text-xs block mb-1">To Date</label>
//           <input
//             type="date"
//             value={filters.endDate || ''}
//             onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined, page: 1 })}
//             className="w-full bg-slate-700 text-white p-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

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
        className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
      >
        <span>←</span>
        <span>Prev</span>
      </button>

      <div className="flex space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          if (page > totalPages) return null;
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                currentPage === page
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
      >
        <span>Next</span>
        <span>→</span>
      </button>

      <span className="text-slate-400 text-xs ml-3">
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
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [settings, setSettings] = useState<{ autoWithdrawals: boolean } | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Track if we've already updated the wallet address for this session
  const walletAddressUpdatedRef = useRef<string>('');
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await fetchSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings({ autoWithdrawals: false });
      }
    };
    loadSettings();
  }, []);

  // Function to update user's wallet address in backend
  const updateUserWallet = useCallback(async (walletAddress: string) => {
    if (!user || !user.id) {
      console.error('No user found to update wallet address');
      return;
    }

    if (walletAddressUpdatedRef.current === walletAddress) {
      return;
    }

    try {
      const result = await updateUserWalletAddress(user.id, walletAddress);
      
      if (result.success && result.user) {
        setUser(result.user);
        walletAddressUpdatedRef.current = walletAddress;
      } else {
        console.error('Failed to update wallet address:', result.message);
      }
    } catch (error) {
      console.error('Error updating wallet address:', error);
    }
  }, [user, setUser]);

  // Enhanced wallet connection handler
  useEffect(() => {
    const handleWalletChange = () => {
      if (wallet && wallet.account.address && user) {
        if (!walletConnected || walletAddressUpdatedRef.current !== wallet.account.address) {
          setWalletConnected(true);
          setIsConnecting(false);
          clearTimeout(connectionTimeoutRef.current);
          updateUserWallet(wallet.account.address);
        }
      } else if (walletConnected && !wallet) {
        setWalletConnected(false);
        walletAddressUpdatedRef.current = '';
      }
    };

    handleWalletChange();
  }, [wallet, user, walletConnected, updateUserWallet]);

  // Reset connecting state when modal closes without connection
  useEffect(() => {
    const checkModalClosed = () => {
      if (isConnecting && !wallet) {
        const modal = document.querySelector('.ton-connect-modal');
        if (!modal) {
          setIsConnecting(false);
          clearTimeout(connectionTimeoutRef.current);
        }
      }
    };

    const intervalId = setInterval(checkModalClosed, 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(connectionTimeoutRef.current);
    };
  }, [isConnecting, wallet]);

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

 // Add rings conversion constant at the top with other constants
const TON_TO_RINGS = 10000; // 1 TON = 10,000 rings

// Update the validateWithdrawalAmount function to include rings check
const validateWithdrawalAmount = (amount: number): { isValid: boolean; message: string } => {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, message: "Please enter a valid amount" };
  }

  if (amount < minWithdrawal) {
    return { isValid: false, message: `Minimum withdrawal is ${minWithdrawal} TON` };
  }

  // Calculate required rings for this withdrawal
  const requiredRings = amount * TON_TO_RINGS;
  const userRings = user?.rings ? Number(user.rings) : 0;

  // Check if user has enough rings
  if (requiredRings > userRings) {
    return { 
      isValid: false, 
      message: `Insufficient rings! You need ${requiredRings.toFixed(0)} rings to withdraw ${amount} TON. You have ${userRings} rings.` 
    };
  }

  if (amount > availableTonBalance) {
    return { 
      isValid: false, 
      message: `Insufficient coins balance. You need ${(amount * CONVERSION_RATE).toFixed(0)} coins for ${amount} TON` 
    };
  }

  return { isValid: true, message: "" };
};




  
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    
    connectionTimeoutRef.current = setTimeout(() => {
      if (isConnecting && !wallet) {
        console.log('Connection timeout - modal was likely closed without connecting');
        setIsConnecting(false);
      }
    }, 30000);

    try {
      await tonConnectUI.openModal();
      
      setTimeout(() => {
        if (isConnecting && !wallet) {
          const modal = document.querySelector('.ton-connect-modal');
          if (!modal) {
            setIsConnecting(false);
            clearTimeout(connectionTimeoutRef.current);
          }
        }
      }, 5000);
      
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
      setIsConnecting(false);
      clearTimeout(connectionTimeoutRef.current);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
      setIsConnecting(false);
      clearTimeout(connectionTimeoutRef.current);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet || !user || !withdrawAmount) return;
    
    if (wallet.account.address && walletAddressUpdatedRef.current !== wallet.account.address) {
      await updateUserWallet(wallet.account.address);
    }

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

      setUser(result.user);

      if (settings?.autoWithdrawals) {
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

        setWithdrawAmount('');
        await loadTransactions();
        alert(`Successfully withdrew ${amount} TON to your wallet!`);
      } else {
        setWithdrawAmount('');
        await loadTransactions();
        alert(`Withdrawal request for ${amount} TON submitted for admin approval! You will receive your TON once approved.`);
      }

    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      const errorMessage = error.message || "Transaction was cancelled or failed.";
      
      if (user) {
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

  // Enhanced Wallet Status Component
  const WalletStatus = () => {
    if (isConnecting) {
      return (
        <div className="text-center p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-blue-400 font-semibold text-base">Connecting Wallet...</p>
          <p className="text-blue-300 text-xs mt-1">Please confirm the connection in your wallet app</p>
          <button
            onClick={() => {
              setIsConnecting(false);
              clearTimeout(connectionTimeoutRef.current);
            }}
            className="mt-3 bg-red-500/20 text-red-400 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-xs"
          >
            Cancel Connection
          </button>
        </div>
      );
    }

    if (!wallet) {
      return (
        <div className="text-center p-4 bg-slate-700/50 border-2 border-slate-600 rounded-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🔗</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Connect Your Wallet</h3>
          <p className="text-slate-300 text-sm mb-4">Connect your TON wallet to withdraw funds securely</p>
          <button
            onClick={handleConnectWallet}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2 text-sm"
          >
            <span className="text-base">👛</span>
            <span>Connect TON Wallet</span>
          </button>
          <p className="text-slate-400 text-xs mt-3">
            Supported: Tonkeeper, TonHub, and other TON wallets
          </p>
        </div>
      );
    }

    return (
      <div className="text-center p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
        <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">✓</span>
        </div>
        <h3 className="text-green-400 font-bold text-base mb-1">Wallet Connected</h3>
        <div className="bg-slate-700/50 p-2 rounded-lg mb-3">
          <p className="text-slate-300 text-xs mb-1">Connected Address:</p>
          <p className="font-mono text-green-400 text-xs break-all">{wallet.account.address}</p>
        </div>
        {user?.wallet_address ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-1 text-green-400 text-xs">
              <span>✓</span>
              <span>Wallet address saved to your account</span>
            </div>
            {user.wallet_address !== wallet.account.address && (
              <div className="flex items-center justify-center space-x-1 text-yellow-400 text-xs">
                <span>⚠️</span>
                <span>Different from previously saved address</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-1 text-yellow-400 text-xs">
            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Saving wallet address...</span>
          </div>
        )}
        <button
          onClick={handleDisconnectWallet}
          className="mt-3 w-full bg-red-500/20 text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(connectionTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-4 px-2">
      {/* Balance Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white text-center mb-4">Your Balance</h2>
        
        {/* Available TON Balance from Coins */}
       <div className="text-center mb-4">
  <p className="text-green-400 font-semibold text-base">
    {availableCoinsBalance.toLocaleString()} Coins
  </p>
  {/* <p className="text-blue-400 font-semibold text-base mt-2">
    {user?.rings ? Number(user.rings).toLocaleString() : 0} Rings
  </p> */}
  <p className="text-3xl font-bold text-white my-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
    ≈ {availableTonBalance.toFixed(6)} TON
  </p>
  <p className="text-slate-300 text-sm mb-1">Available TON Balance (from Coins)</p>
</div>

       

        {/* Conversion Info */}
    <div className="text-center mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
  <div className="text-center space-y-1">
    <p className="text-blue-400 text-sm">
      💱 1 TON = {CONVERSION_RATE.toLocaleString()} Coins
    </p>
    <p className="text-green-400 text-sm">
      💍 1 TON requires {TON_TO_RINGS.toLocaleString()} Rings to withdraw
    </p>
    <p className="text-yellow-400 text-xs">
      🎥 Get more rings by watching ads & completing tasks!
    </p>
  </div>
</div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700/50 shadow-xl">
        <h2 className="text-lg font-bold text-white text-center mb-4">Withdraw Funds</h2>
        
        <WalletStatus />

        {/* Approval Status Notice */}
        {settings && (
          <div className={`p-3 rounded-xl mt-4 ${
            settings.autoWithdrawals 
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20' 
              : 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                settings.autoWithdrawals ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                <span className="text-white text-xs">
                  {settings.autoWithdrawals ? '✓' : '⏳'}
                </span>
              </div>
              <h3 className={`font-bold text-base ${
                settings.autoWithdrawals ? 'text-green-400' : 'text-blue-400'
              }`}>
                {settings.autoWithdrawals ? 'Automatic Withdrawals' : 'Manual Approval Required'}
              </h3>
            </div>
            <p className={`text-xs ${
              settings.autoWithdrawals ? 'text-green-300' : 'text-blue-300'
            }`}>
              {settings.autoWithdrawals 
                ? "Withdrawals are processed automatically. You'll receive TON immediately after confirmation."
                : "Automatic withdrawals are currently disabled. Your withdrawal requests will require manual approval by an administrator. You will be notified once approved."
              }
            </p>
          </div>
        )}

        {withdrawAmount && (
  <div className="p-3 bg-slate-700/30 rounded-xl mt-2">
    <p className="text-slate-300 text-sm text-center">
      Required: {(parseFloat(withdrawAmount) * TON_TO_RINGS).toLocaleString()} Rings
    </p>
    <p className="text-slate-400 text-xs text-center mt-1">
      You have: {user?.rings ? Number(user.rings).toLocaleString() : 0} Rings
    </p>
  </div>
)}

        {/* Amount Input */}
        {wallet && (
          <div className="space-y-3 mt-4">
            <label className="text-slate-300 text-base font-semibold">Withdrawal Amount (TON)</label>
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Minimum: ${minWithdrawal} TON`}
                min={minWithdrawal}
                max={availableTonBalance}
                step="0.001"
                className="w-full bg-slate-700 text-white p-3 rounded-xl border-2 border-slate-600 focus:border-blue-500 focus:outline-none text-base transition-colors"
                disabled={!wallet || isWithdrawing}
              />
              <button
                onClick={handleMaxWithdraw}
                disabled={!wallet || isWithdrawing}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-600"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Minimum: {minWithdrawal} TON</span>
              <span>Available: {availableTonBalance.toFixed(6)} TON</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-3">
              <button
                onClick={handleWithdraw}
                disabled={!wallet || !withdrawAmount || isWithdrawing || !user?.wallet_address}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25 flex items-center justify-center space-x-2 text-base"
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">{settings?.autoWithdrawals ? 'Processing...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>💸</span>
                    <span className="text-sm">{settings?.autoWithdrawals ? 'Withdraw TON' : 'Submit for Approval'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Fee Information */}
            <div className="text-center p-3 bg-slate-700/30 rounded-xl mt-3">
              <p className="text-slate-400 text-xs">
                ⚠️ Network fees will be deducted from your withdrawal amount
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Estimated fee: ~0.05 TON
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Withdrawal History</h2>
          <span className="text-slate-400 text-xs bg-slate-700/50 px-2 py-1 rounded-full">
            {transactionsData.total} total
          </span>
        </div>

        {/* <TransactionsFilters filters={filters} onFiltersChange={setFilters} /> */}

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading transactions...</p>
            </div>
          ) : transactionsData.transactions.length > 0 ? (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
            <div className="text-center py-8 bg-slate-700/30 rounded-xl">
              <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📝</span>
              </div>
              <p className="text-slate-400 text-sm">No withdrawal transactions found</p>
              <p className="text-slate-500 text-xs mt-1">Your withdrawal history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">⚠️</span>
          </div>
          <h3 className="text-yellow-400 font-bold text-base">Important Notice</h3>
        </div>
        <p className="text-yellow-300 text-xs">
          Withdrawals are now processed using coins only. Your coins will be automatically converted to TON.
          Conversion rate: 1 TON = {CONVERSION_RATE.toLocaleString()} Coins.
        </p>
        {!settings?.autoWithdrawals && (
          <p className="text-yellow-300 text-xs mt-2">
            ⏳ <strong>Manual Approval Mode:</strong> Your withdrawal requests will be reviewed by an administrator. 
            You will receive your TON once approved.
          </p>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;