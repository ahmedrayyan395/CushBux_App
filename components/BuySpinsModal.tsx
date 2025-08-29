import React, { useState } from 'react';
import type { User } from '../types';
import { ICONS, SPIN_STORE_PACKAGES, CONVERSION_RATE, RECIPIENT_WALLET_ADDRESS } from '../constants';
import { buySpins } from '../services/api';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

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
        if (isLoading) return;

        if (paymentMethod === 'TON' && !wallet) {
            tonConnectUI.openModal();
            return;
        }
        
        const selectedPackage = SPIN_STORE_PACKAGES.find(p => p.id === packageId);
        if (!selectedPackage) {
            alert("Invalid package selected.");
            return;
        }

        setIsLoading(packageId);

        try {
            if (paymentMethod === 'TON') {
                if (!wallet) return; // Should not happen, but for safety.

                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 60, // 60 seconds
                    messages: [
                        {
                            address: RECIPIENT_WALLET_ADDRESS,
                            amount: (selectedPackage.costTon * 1e9).toString(), // to nanocoins
                        },
                    ],
                };
                
                // This will open the wallet and ask for confirmation.
                // It returns a boc string on success, and throws an error on cancellation.
                const resultBoc = await tonConnectUI.sendTransaction(transaction);

                // Only proceed if the transaction was sent successfully.
                if (!resultBoc) {
                    throw new Error("Transaction failed: no response from wallet.");
                }
                
                // If transaction is successful, then we credit the spins via our API.
                const result = await buySpins(packageId, 'TON');
                 if (result.success && result.user) {
                    setUser(result.user);
                    alert(result.message);
                    onClose();
                } else {
                    throw new Error(result.message || "Failed to credit spins after transaction.");
                }

            } else { // COINS payment
                const result = await buySpins(packageId, 'COINS');
                if (result.success && result.user) {
                    setUser(result.user);
                    alert(result.message);
                    onClose();
                } else {
                    throw new Error(result.message || "Purchase failed.");
                }
            }
        } catch (error: any) {
            console.error("Purchase failed:", error);
            const errorMessage = (error instanceof Error && error.message.length < 100) ? error.message : "Transaction was cancelled or failed.";
            if (!errorMessage.toLowerCase().includes('user rejected') && !errorMessage.toLowerCase().includes('transaction was cancelled')) {
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

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-2xl w-full max-w-md shadow-lg border border-slate-700 p-6 space-y-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Spin Store</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
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
                        const costInCoins = pkg.costTon * CONVERSION_RATE;
                        const canAfford = (user?.coins ?? 0) >= costInCoins;
                        
                        return (
                            <button
                                key={pkg.id}
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={(paymentMethod === 'COINS' && !canAfford) || !!isLoading}
                                className="w-full bg-slate-700 p-4 rounded-lg flex justify-between items-center hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div>
                                    <p className="text-lg font-bold text-white">{pkg.spins.toLocaleString()} Spins</p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-semibold text-white ${paymentMethod === 'COINS' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {isLoading === pkg.id ? '...' : (
                                        paymentMethod === 'COINS'
                                        ? formatCoinCost(costInCoins)
                                        : `${pkg.costTon.toLocaleString()} TON`
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default BuySpinsModal;