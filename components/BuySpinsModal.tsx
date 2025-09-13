import React, { useState } from 'react';
import type { User } from '../types';
import { buySpins } from '../services/api';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import {SPIN_STORE_PACKAGES} from '../constants';


// Define packages locally since they're now in backend
// const SPIN_STORE_PACKAGES = [
//   { id: "spins_10", spins: 10, costTon: 0.1 },
//   { id: "spins_25", spins: 25, costTon: 0.2 },
//   { id: "spins_50", spins: 50, costTon: 0.35 },
//   { id: "spins_100", spins: 100, costTon: 0.6 },
//   { id: "spins_200", spins: 200, costTon: 1.0 }
// ];

const CONVERSION_RATE = 1000000; // 1 TON = 1,000,000 coins

interface BuySpinsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    setUser: (user: User) => void;
}

const BuySpinsModal: React.FC<BuySpinsModalProps> = ({ isOpen, onClose, user, setUser }) => {
    const [paymentMethod, setPaymentMethod] = useState<'COINS' | 'TON'>('COINS');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();


    
    const handlePurchase = async (packageId: string) => {
        if (isLoading || !user) return;

        const selectedPackage = SPIN_STORE_PACKAGES.find(p => p.id === packageId);
        if (!selectedPackage) {
            alert("Invalid package selected.");
            return;
        }

        setIsLoading(packageId);

        try {
            if (paymentMethod === 'TON') {
                // Check if user has sufficient TON in their in-app wallet
                const userTonBalance = user.ad_credit ? Number(user.ad_credit) : 0;
                
                if (userTonBalance >= selectedPackage.costTon) {
                    // Use in-app TON balance
                    const result = await buySpins(packageId, 'TON', user.id);
                    if (result.success && result.user) {
                        setUser(result.user);
                        alert(`Purchased ${selectedPackage.spins} spins using your TON balance!`);
                        onClose();
                    } else {
                        throw new Error(result.message || "Failed to process TON purchase.");
                    }
                } else {
                    // Insufficient in-app TON, require blockchain transaction
                    if (!wallet) {
                        tonConnectUI.openModal();
                        setIsLoading(null);
                        return;
                    }

                    // Execute real blockchain transaction
                    const transaction = {
                        validUntil: Math.floor(Date.now() / 1000) + 60,
                        messages: [
                            {
                                address: process.env.REACT_APP_RECIPIENT_WALLET_ADDRESS!, // From your .env
                                amount: (selectedPackage.costTon * 1e9).toString(), // Convert to nanoton
                            },
                        ],
                    };
                    
                    // Send blockchain transaction
                    const resultBoc = await tonConnectUI.sendTransaction(transaction);

                    if (!resultBoc) {
                        throw new Error("Transaction failed: no response from wallet.");
                    }
                    
                    // After successful blockchain transaction, credit the spins
                    const result = await buySpins(packageId, 'TON_BLOCKCHAIN', user.id);
                    if (result.success && result.user) {
                        setUser(result.user);
                        alert(`Purchased ${selectedPackage.spins} spins! Blockchain transaction confirmed.`);
                        onClose();
                    } else {
                        throw new Error(result.message || "Failed to credit spins after transaction.");
                    }
                }

            } else { 
                // COINS payment - purely in-app
                const costInCoins = selectedPackage.costTon * CONVERSION_RATE;
                const userCoinBalance = user.coins ?? 0;
                
                if (userCoinBalance < costInCoins) {
                    throw new Error("Insufficient coins. Complete more tasks to earn coins!");
                }

                const result = await buySpins(packageId, 'COINS', user.id);
                if (result.success && result.user) {
                    setUser(result.user);
                    alert(`Purchased ${selectedPackage.spins} spins!`);
                    onClose();
                } else {
                    throw new Error(result.message || "Purchase failed.");
                }
            }
        } catch (error: any) {
            console.error("Purchase failed:", error);
            const errorMessage = (error instanceof Error && error.message.length < 100) 
                ? error.message 
                : "Transaction was cancelled or failed.";
            
            if (!errorMessage.toLowerCase().includes('user rejected') && 
                !errorMessage.toLowerCase().includes('transaction was cancelled') &&
                !errorMessage.toLowerCase().includes('user closed the modal')) {
                alert(errorMessage);
            }
        } finally {
            setIsLoading(null);
        }
    };


    const formatCoinCost = (costInCoins: number) => {
        if (costInCoins >= 1000000) {
            return `${(costInCoins / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M Coins`;
        }
        if (costInCoins >= 1000) {
            return `${(costInCoins / 1000).toLocaleString()}K Coins`;
        }
        return `${costInCoins} Coins`;
    };

    const getPackageAffordability = (pkg: typeof SPIN_STORE_PACKAGES[0]) => {
        if (paymentMethod === 'COINS') {
            const costInCoins = pkg.costTon * CONVERSION_RATE;
            const canAfford = (user?.coins ?? 0) >= costInCoins;
            return { canAfford, costDisplay: formatCoinCost(costInCoins) };
        } else {
            const userTonBalance = user?.ton ? Number(user.ad_credit) : 0;
            const canAffordWithInAppTon = userTonBalance >= pkg.costTon;
            return { 
                canAfford: canAffordWithInAppTon, 
                costDisplay: `${pkg.costTon.toLocaleString()} TON`,
                requiresBlockchain: !canAffordWithInAppTon
            };
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-lg border border-slate-700 p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Spin Store</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                {/* Balance Display */}
                <div className="bg-slate-700/50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">Your Coins:</span>
                        <span className="text-yellow-400 font-bold">
                            {(user?.coins || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">Your TON:</span>
                        <span className="text-blue-400 font-bold">
                            {user?.ton ? Number(user.ad_credit).toFixed(3) : '0.000'} TON
                        </span>
                    </div>
                </div>

                {/* Payment method toggle */}
                <div className="bg-slate-700 p-1 rounded-xl flex space-x-1">
                    <button 
                        onClick={() => setPaymentMethod('COINS')}
                        className={`w-full p-2 rounded-lg font-bold transition-colors ${paymentMethod === 'COINS' ? 'bg-green-500 text-white' : 'text-slate-300'}`}
                    >
                        Pay with Coins
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('TON')}
                        className={`w-full p-2 rounded-lg font-bold transition-colors ${paymentMethod === 'TON' ? 'bg-blue-500 text-white' : 'text-slate-300'}`}
                    >
                        Pay with TON
                    </button>
                </div>

                {/* Packages */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {SPIN_STORE_PACKAGES.map(pkg => {
                        const { canAfford, costDisplay, requiresBlockchain } = getPackageAffordability(pkg);
                        const isProcessing = isLoading === pkg.id;
                        
                        return (
                            <button
                                key={pkg.id}
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={(!canAfford && !requiresBlockchain) || isProcessing || !user}
                                className="w-full bg-slate-700 p-4 rounded-lg flex justify-between items-center hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                            >
                                <div className="text-left">
                                    <p className="text-lg font-bold text-white">{pkg.spins.toLocaleString()} Spins</p>
                                    {requiresBlockchain && (
                                        <p className="text-xs text-blue-300 mt-1">Requires wallet payment</p>
                                    )}
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-semibold text-white min-w-[100px] text-center ${
                                    paymentMethod === 'COINS' 
                                        ? canAfford ? 'bg-green-500' : 'bg-red-500' 
                                        : canAfford ? 'bg-blue-500' : requiresBlockchain ? 'bg-purple-500' : 'bg-red-500'
                                }`}>
                                    {isProcessing ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    ) : (
                                        costDisplay
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Payment method info */}
                <div className="text-slate-400 text-sm p-3 bg-slate-700/30 rounded-lg">
                    {paymentMethod === 'TON' ? (
                        <p>
                            💡 Uses in-app TON first. If insufficient, requires wallet connection for blockchain payment.
                        </p>
                    ) : (
                        <p>
                            💡 Coin payments use your earned in-app currency from completing tasks.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuySpinsModal;