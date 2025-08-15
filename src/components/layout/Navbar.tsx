import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { SimpleThemeToggle } from '@/components/ui/ThemeToggle';
import { LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavbarProps {
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 sticky top-0 z-30">
      <div className="pl-4 pr-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button and Logo */}
          <div className="flex items-center space-x-4">
            {/* Desktop collapse button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-md text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={
                  sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img
                src="/favicon-32x32.png"
                alt="App logo"
                className="h-8 w-8 rounded"
              />
              <span className="hidden sm:block text-xl font-bold text-surface-900 dark:text-surface-100">
                SaaS Platform
              </span>
            </div>
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <SimpleThemeToggle />

              {/* User info - hidden on small screens */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-surface-600 dark:text-surface-400">
                <User className="h-4 w-4" />
                <span className="max-w-32 truncate">{user.email}</span>
                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-full capitalize">
                  {user.role.toLowerCase()}
                </span>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center space-x-1 p-2 rounded-md text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut
                  className={`h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`}
                />
                <span className="hidden md:inline">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
