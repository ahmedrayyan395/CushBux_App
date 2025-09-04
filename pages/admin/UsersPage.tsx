import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import {
  fetchAllUsers,
  updateUser,
  banUser,
  unbanUser,
  updateUserCurrency,
  updateGameProgress,
  resetDailyStats,
  addCoinsToUser,
  addTONToUser,
  addSpinsToUser,
  resetUserProgress,
  searchUsers
} from '../../services/api';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [bannedFilter, setBannedFilter] = useState<boolean | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const loadUsers = async (page: number = 1, filter?: boolean | null) => {
        setLoading(true);
        try {
            const response = await fetchAllUsers(page, 50, filter);
            setUsers(response.users);
            setTotalPages(response.pages);
            setTotalUsers(response.total);
            setCurrentPage(response.current_page);
        } catch (error) {
            console.error('Failed to load users:', error);
            alert('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadUsers(1, bannedFilter);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchUsers(searchTerm);
            setUsers(results);
            setTotalPages(1);
            setTotalUsers(results.length);
            setCurrentPage(1);
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        loadUsers(1, bannedFilter);
    }, [bannedFilter]);

    const handleUpdateUser = async (updatedData: Partial<User>) => {
        if (!editingUser) return;
        
        try {
            const result = await updateUser(editingUser.id.toString(), updatedData);
            setUsers(prevUsers => prevUsers.map(u => u.id === result.id ? result : u));
            setEditingUser(null);
            alert('User updated successfully!');
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user');
        }
    };

    const handleBanToggle = async (user: User) => {
        try {
            const result = user.banned 
                ? await unbanUser(user.id.toString())
                : await banUser(user.id.toString());
            
            setUsers(prevUsers => prevUsers.map(u => u.id === result.id ? result : u));
            alert(user.banned ? 'User unbanned successfully!' : 'User banned successfully!');
        } catch (error) {
            console.error('Failed to update ban status:', error);
            alert('Failed to update ban status');
        }
    };

    const handleQuickAction = async (action: string, user: User, value?: number) => {
        try {
            let result: User;
            
            switch (action) {
                case 'addCoins':
                    result = await addCoinsToUser(user.id.toString(), value || 1000);
                    break;
                case 'addTON':
                    result = await addTONToUser(user.id.toString(), value || 1);
                    break;
                case 'addSpins':
                    result = await addSpinsToUser(user.id.toString(), value || 5);
                    break;
                case 'resetDaily':
                    result = await resetDailyStats(user.id.toString());
                    break;
                case 'resetProgress':
                    result = await resetUserProgress(user.id.toString(), 'all');
                    break;
                default:
                    return;
            }

            setUsers(prevUsers => prevUsers.map(u => u.id === result.id ? result : u));
            alert('Action completed successfully!');
        } catch (error) {
            console.error('Failed to perform action:', error);
            alert('Failed to perform action');
        }
    };

    const filteredUsers = isSearching ? users : users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm)
    );

    if (loading) {
        return <div className="text-center text-slate-400">Loading users...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-4xl font-bold text-white mb-8">User Management</h1>

            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[300px]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setBannedFilter(null);
                                loadUsers(1);
                            }}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={bannedFilter === null ? 'all' : bannedFilter.toString()}
                        onChange={e => setBannedFilter(e.target.value === 'all' ? null : e.target.value === 'true')}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                        <option value="all">All Users</option>
                        <option value="true">Banned Only</option>
                        <option value="false">Active Only</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Total Users</div>
                    <div className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Active Users</div>
                    <div className="text-2xl font-bold text-green-400">
                        {users.filter(u => !u.banned).length.toLocaleString()}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Banned Users</div>
                    <div className="text-2xl font-bold text-red-400">
                        {users.filter(u => u.banned).length.toLocaleString()}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Current Page</div>
                    <div className="text-2xl font-bold text-white">
                        {currentPage} / {totalPages}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Coins</th>
                                <th className="p-4">TON</th>
                                <th className="p-4">Spins</th>
                                <th className="p-4">Ad Credit</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-4 font-mono text-sm">{user.id}</td>
                                    <td className="p-4 font-semibold">{user.name}</td>
                                    <td className="p-4">{user.coins.toLocaleString()}</td>
                                    <td className="p-4">{typeof user.ton === 'number' ? user.ton.toFixed(4) : '0.0000'}</td>
                                    <td className="p-4">{user.spins.toLocaleString()}</td>
                                    <td className="p-4">{typeof user.ad_credit === 'number' ? user.ad_credit.toFixed(4) : '0.0000'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {user.banned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <button 
                                            onClick={() => setEditingUser(user)}
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm font-semibold"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleBanToggle(user)}
                                            className={`px-3 py-1 rounded text-sm font-semibold ${
                                                user.banned 
                                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                                    : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                        >
                                            {user.banned ? 'Unban' : 'Ban'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                    <button
                        onClick={() => loadUsers(currentPage - 1, bannedFilter)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-slate-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => loadUsers(currentPage + 1, bannedFilter)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                    onQuickAction={handleQuickAction}
                />
            )}
        </div>
    );
};

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (data: Partial<User>) => void;
    onQuickAction: (action: string, user: User, value?: number) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, onQuickAction }) => {
    const [formData, setFormData] = useState({
        coins: user.coins.toString(),
        ton: (typeof user.ton === 'number' ? user.ton : 0).toString(),
        spins: user.spins.toString(),
        ad_credit: (typeof user.ad_credit === 'number' ? user.ad_credit : 0).toString(),
        referral_earnings: user.referral_earnings.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            coins: parseInt(formData.coins, 10),
            ton: parseFloat(formData.ton),
            spins: parseInt(formData.spins, 10),
            ad_credit: parseFloat(formData.ad_credit),
            referral_earnings: parseInt(formData.referral_earnings, 10),
        });
    };

    const handleBanToggle = () => {
        onSave({ banned: !user.banned });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-lg border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Edit User: {user.name}</h2>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    <button 
                        onClick={() => onQuickAction('addCoins', user, 1000)}
                        className="px-3 py-2 bg-green-500 text-white rounded text-sm"
                    >
                        +1000 Coins
                    </button>
                    <button 
                        onClick={() => onQuickAction('addTON', user, 1)}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
                    >
                        +1 TON
                    </button>
                    <button 
                        onClick={() => onQuickAction('addSpins', user, 5)}
                        className="px-3 py-2 bg-purple-500 text-white rounded text-sm"
                    >
                        +5 Spins
                    </button>
                    <button 
                        onClick={() => onQuickAction('resetDaily', user)}
                        className="px-3 py-2 bg-orange-500 text-white rounded text-sm"
                    >
                        Reset Daily
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Coins</label>
                            <input 
                                type="number" 
                                value={formData.coins} 
                                onChange={e => setFormData({...formData, coins: e.target.value})} 
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">TON</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={formData.ton} 
                                onChange={e => setFormData({...formData, ton: e.target.value})} 
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Spins</label>
                            <input 
                                type="number" 
                                value={formData.spins} 
                                onChange={e => setFormData({...formData, spins: e.target.value})} 
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Ad Credit</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={formData.ad_credit} 
                                onChange={e => setFormData({...formData, ad_credit: e.target.value})} 
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Referral Earnings</label>
                            <input 
                                type="number" 
                                value={formData.referral_earnings} 
                                onChange={e => setFormData({...formData, referral_earnings: e.target.value})} 
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button 
                            type="button" 
                            onClick={handleBanToggle} 
                            className={`font-semibold py-2 px-4 rounded-lg ${user.banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                        >
                            {user.banned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="font-semibold text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsersPage;