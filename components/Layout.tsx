import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import type { User } from '../types';

interface LayoutProps {
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  return (
    <>
      <Header user={user} />
      <main className="pt-20 pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
};

export default Layout;