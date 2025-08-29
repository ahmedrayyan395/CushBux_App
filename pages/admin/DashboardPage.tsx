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

    useEffect(() => {
        fetchDashboardStats().then(data => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    if (loading) {
        return <div className="text-center text-slate-400">Loading dashboard...</div>;
    }

    if (!stats) {
        return <div className="text-center text-red-500">Failed to load dashboard statistics.</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    icon={ICONS.users}
                    title="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    colorClass="bg-blue-500/20 text-blue-400"
                />
                <StatCard 
                    icon={ICONS.coin}
                    title="Total Coins in Circulation"
                    value={formatNumber(stats.totalCoins)}
                    colorClass="bg-yellow-500/20 text-yellow-400"
                />
                 <StatCard 
                    icon={ICONS.ton}
                    title="Total TON Withdrawn"
                    value={stats.totalWithdrawals.toFixed(2)}
                    colorClass="bg-sky-500/20 text-sky-400"
                />
                <StatCard 
                    icon={ICONS.tasks}
                    title="Tasks Completed"
                    value={formatNumber(stats.tasksCompleted)}
                    colorClass="bg-green-500/20 text-green-400"
                />
            </div>

            <div className="mt-12 bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome, Admin!</h2>
                <p className="text-slate-300">
                    Use the navigation on the left to manage users, create promotional codes, add new tasks, and configure your application settings.
                </p>
            </div>
        </div>
    );
};

export default DashboardPage;
