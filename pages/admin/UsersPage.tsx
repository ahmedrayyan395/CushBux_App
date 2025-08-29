import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { fetchAllUsers, updateUser } from '../../services/api';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchAllUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    const handleUpdateUser = async (updatedData: Partial<User>) => {
        if (!editingUser) return;
        const result = await updateUser(editingUser.id, updatedData);
        if (result.success && result.user) {
            setUsers(prevUsers => prevUsers.map(u => u.id === result.user!.id ? result.user! : u));
            setEditingUser(null);
        } else {
            alert('Failed to update user.');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm)
    );

    if (loading) {
        return <div className="text-center text-slate-400">Loading users...</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">User Management</h1>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Coins</th>
                                <th className="p-4">Spins</th>
                                <th className="p-4">Ad Credit (TON)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-4">{user.id}</td>
                                    <td className="p-4 font-semibold">{user.name}</td>
                                    <td className="p-4">{user.coins.toLocaleString()}</td>
                                    <td className="p-4">{user.spins.toLocaleString()}</td>
                                    <td className="p-4">{user.ad_credit.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {user.banned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => setEditingUser(user)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm font-semibold">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}
        </div>
    );
};

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (data: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        coins: user.coins.toString(),
        spins: user.spins.toString(),
        adCredit: user.adCredit.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            coins: parseInt(formData.coins, 10),
            spins: parseInt(formData.spins, 10),
            adCredit: parseFloat(formData.adCredit),
        });
    };
    
    const handleBanToggle = () => {
        onSave({ banned: !user.banned });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-lg border border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Edit User: {user.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Coins</label>
                        <input type="number" value={formData.coins} onChange={e => setFormData({...formData, coins: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Spins</label>
                        <input type="number" value={formData.spins} onChange={e => setFormData({...formData, spins: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Ad Credit (TON)</label>
                        <input type="number" step="0.01" value={formData.adCredit} onChange={e => setFormData({...formData, adCredit: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={handleBanToggle} className={`font-semibold py-2 px-4 rounded-lg ${user.banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                           {user.banned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button type="button" onClick={onClose} className="font-semibold text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsersPage;
