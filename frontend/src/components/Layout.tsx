import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <main className={`flex-1 p-8 transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 