import React, { useState, useEffect } from 'react';
import type { PromoCode } from '../../types';
import { fetchAllPromoCodes, createPromoCode } from '../../services/api';

const PromoCodesPage: React.FC = () => {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    const loadCodes = () => {
        setLoading(true);
        fetchAllPromoCodes().then(data => {
            setPromoCodes(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadCodes();
    }, []);
    
    const handleCreateCode = async (data: Omit<PromoCode, 'usedBy'>) => {
        const result = await createPromoCode(data);
        if (result.success) {
            alert('Promo code created successfully!');
            setShowForm(false);
            loadCodes();
        } else {
            alert('Failed to create promo code. The code might already exist.');
        }
    };

    const getStatus = (code: PromoCode) => {
        if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
            return { text: 'Expired', color: 'bg-red-500/20 text-red-400' };
        }
        if (code.usedBy.length >= code.maxUses) {
            return { text: 'Used Up', color: 'bg-yellow-500/20 text-yellow-400' };
        }
        return { text: 'Active', color: 'bg-green-500/20 text-green-400' };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">Promo Codes</h1>
                <button onClick={() => setShowForm(!showForm)} className="bg-green-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors">
                    {showForm ? 'Cancel' : '+ Create Code'}
                </button>
            </div>

            {showForm && <CreatePromoCodeForm onSubmit={handleCreateCode} />}

            {loading ? (
                <div className="text-center text-slate-400">Loading codes...</div>
            ) : (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mt-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="p-4">Code</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Value</th>
                                    <th className="p-4">Usage</th>
                                    <th className="p-4">Expires At</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promoCodes.map(code => {
                                    const status = getStatus(code);
                                    return (
                                        <tr key={code.code} className="border-t border-slate-700 hover:bg-slate-700/50">
                                            <td className="p-4 font-mono font-semibold">{code.code}</td>
                                            <td className="p-4">{code.type}</td>
                                            <td className="p-4">{code.value.toLocaleString()}</td>
                                            <td className="p-4">{code.usedBy.length} / {code.maxUses}</td>
                                            <td className="p-4">{code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


const CreatePromoCodeForm: React.FC<{ onSubmit: (data: Omit<PromoCode, 'usedBy'>) => void }> = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        code: '',
        type: 'COINS' as PromoCode['type'],
        value: '1000',
        maxUses: '100',
        expiresAt: '', // Date string
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const dataToSubmit: Omit<PromoCode, 'usedBy'> = {
            code: formData.code.toUpperCase(),
            type: formData.type,
            value: parseInt(formData.value, 10),
            maxUses: parseInt(formData.maxUses, 10),
            ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt).toISOString() })
        };
        onSubmit(dataToSubmit);
        setIsLoading(false);
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold mb-6">Create New Promo Code</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Code</label>
                    <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="SUMMER2024"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as PromoCode['type']})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                        <option value="COINS">Coins</option>
                        <option value="SPINS">Spins</option>
                        <option value="TON_AD_CREDIT">TON Ad Credit</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Value</label>
                    <input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Uses</label>
                    <input type="number" required value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date (Optional)</label>
                    <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                </div>
                <div className="flex items-end">
                     <button type="submit" disabled={isLoading} className="w-full bg-blue-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-600">
                        {isLoading ? 'Creating...' : 'Create Code'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PromoCodesPage;
