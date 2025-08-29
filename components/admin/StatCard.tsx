import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, colorClass }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-xl flex items-center space-x-4 border border-slate-700">
            <div className={`p-4 rounded-full ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
