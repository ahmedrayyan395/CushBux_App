import React, { useState, useEffect } from 'react';
import StatCard from '../../components/admin/StatCard';
import { fetchDashboardStats } from '../../services/api';
import { ICONS } from '../../constants';

interface DashboardStats {
    totalUsers: number;
    totalCoins: number;
    totalWithdrawals: number;
    tasksCompleted: number;
}

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchDashboardStats();
            setStats(data);
        } catch (err: any) {
            console.error('Failed to load dashboard stats:', err);
            
            // More specific error messages
            let errorMessage = 'Failed to load dashboard statistics';
            
            if (err.message.includes('Network error')) {
                errorMessage = 'Network error: Please check your connection';
            } else if (err.message.includes('401')) {
                errorMessage = 'Authentication required: Please log in again';
            } else if (err.message.includes('403')) {
                errorMessage = 'Access denied: Admin privileges required';
            } else if (err.message.includes('status: undefined')) {
                errorMessage = 'Connection refused: Server may be unavailable';
            } else {
                errorMessage = err.message || errorMessage;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    const formatTON = (amount: number) => {
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K TON`;
        return `${amount.toFixed(3)} TON`;
    };

    // Debug: Check what's being received
    console.log('Dashboard Stats:', stats);
    console.log('Loading:', loading);
    console.log('Error:', error);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-400 font-semibold">Error Loading Dashboard</p>
                    <p className="text-red-300 text-sm mt-2">{error}</p>
                    <div className="mt-4 space-x-2">
                        <button
                            onClick={loadDashboardStats}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-yellow-400">No data available</p>
                    <button
                        onClick={loadDashboardStats}
                        className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                <button
                    onClick={loadDashboardStats}
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    icon={ICONS.users}
                    title="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    colorClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
                    description="Registered users in the system"
                />
                <StatCard 
                    icon={ICONS.coin}
                    title="Total Coins in Circulation"
                    value={formatNumber(stats.totalCoins)}
                    colorClass="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    description="Coins distributed across all users"
                />
                <StatCard 
                    icon={ICONS.ton}
                    title="Total TON Withdrawn"
                    value={formatTON(stats.totalWithdrawals)}
                    colorClass="bg-sky-500/20 text-sky-400 border-sky-500/30"
                    description="TON withdrawn by users"
                />
                <StatCard 
                    icon={ICONS.tasks}
                    title="Tasks Completed"
                    value={formatNumber(stats.tasksCompleted)}
                    colorClass="bg-green-500/20 text-green-400 border-green-500/30"
                    description="Total tasks completed by users"
                />
            </div>

            {/* Additional Statistics Section */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Platform Overview</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300">Active Users Today</span>
                            <span className="text-white font-semibold">Coming Soon</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300">Daily Task Completions</span>
                            <span className="text-white font-semibold">Coming Soon</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-300">Average Coins per User</span>
                            <span className="text-white font-semibold">
                                {stats.totalUsers > 0 ? formatNumber(stats.totalCoins / stats.totalUsers) : 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Welcome, Admin!</h2>
                    <p className="text-slate-300 mb-4">
                        Use the navigation on the left to manage users, create promotional codes, add new tasks, and configure your application settings.
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h3 className="text-green-400 font-semibold mb-2">Quick Actions</h3>
                        <ul className="text-slate-400 text-sm space-y-1">
                            <li>• Monitor user activity and engagement</li>
                            <li>• Review withdrawal requests</li>
                            <li>• Create new promotional campaigns</li>
                            <li>• Manage task availability</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;