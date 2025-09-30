import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ICONS } from '../../constants';

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { path: '/admin/system-users', label: 'System Users', icon: ICONS.dashboard },
    { path: '/admin/users', label: 'Users', icon: ICONS.users },
    { path: '/admin/tasks', label: 'Add Task', icon: ICONS.tasks },
    { path: '/admin/questadmin', label: 'Quests Management', icon: '⚡' },
    { path: '/admin/promocodes', label: 'Promo Codes', icon: ICONS.promoCode },
    { path: '/admin/settings', label: 'Settings', icon: ICONS.settings },
];

interface AdminSidebarProps {
    onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
    const location = useLocation();

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 fixed h-full">
            <div className="text-center py-4 mb-4">
                <h1 className="text-2xl font-bold text-white">CashuBux <span className="text-green-500">Admin</span></h1>
            </div>
            <nav className="flex-grow">
                <ul>
                    {navItems.map(item => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/admin/dashboard'} // Use 'end' for exact match on dashboard
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 p-3 my-1 rounded-lg text-lg font-semibold transition-colors ${
                                        isActive
                                            ? 'bg-green-500 text-white'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <span className="w-6 h-6">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-3 p-3 my-1 rounded-lg text-lg font-semibold transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
                >
                     <span className="w-6 h-6">{ICONS.logout}</span>
                     <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;