import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { HamburgerIcon } from '@/components/ui/HamburgerIcon';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);

  // Handle responsive behavior and desktop detection
  React.useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation and body scroll lock
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar is open on mobile only
      if (!isDesktop) {
        document.body.style.overflow = 'hidden';
        // Add touch-action to prevent scroll on mobile
        document.body.style.touchAction = 'none';
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    };
  }, [sidebarOpen, isDesktop]);

  // Handle sidebar close with animation callback
  const handleSidebarClose = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Handle sidebar toggle with proper state management
  const handleSidebarToggle = React.useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Handle collapse toggle with state persistence
  const handleCollapseToggle = React.useCallback(() => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      // Persist collapsed state in localStorage
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Load collapsed state from localStorage on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      try {
        setSidebarCollapsed(JSON.parse(savedState));
      } catch (e) {
        console.warn('Failed to parse sidebar collapsed state:', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Navbar spans full width */}
      <Navbar 
        onMenuClick={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={handleCollapseToggle}
        sidebarOpen={sidebarOpen}
      />
      
      {/* Layout with sidebar and content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={sidebarCollapsed}
          onClose={handleSidebarClose}
          onToggleCollapse={handleCollapseToggle}
          isDesktop={isDesktop}
        />
        
        {/* Main content */}
        <main 
          className={`
            flex-1 overflow-x-hidden focus-within:outline-none transition-all duration-300 ease-out
            ${isDesktop 
              ? (sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0') 
              : ''
            }
          `} 
          role="main"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};