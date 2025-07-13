import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className="flex-1 transition-all duration-300">
        
        {children}
      </main>
    </div>
  );
};

export default Layout; 