import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface AdminLayoutProps {
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
    return (
        <div className="flex min-h-screen bg-slate-950 text-white">
            <AdminSidebar onLogout={onLogout} />
            <main className="flex-grow p-8 ml-64">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
