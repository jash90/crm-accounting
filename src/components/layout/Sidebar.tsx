import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useModules } from '@/hooks/useModules';
import { 
  Building2, 
  Users, 
  Package, 
  UserCheck,
  LayoutDashboard,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  isDesktop?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  isCollapsed = false, 
  isDesktop = false,
  onClose, 
  onToggleCollapse 
}) => {
  const { user } = useAuthStore();
  const { modules } = useModules();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);

  // Minimum swipe distance for gesture recognition
  const minSwipeDistance = 50;

  // Focus management for accessibility
  React.useEffect(() => {
    if (isOpen && !isDesktop && sidebarRef.current) {
      const firstFocusableElement = sidebarRef.current.querySelector('a, button');
      if (firstFocusableElement) {
        (firstFocusableElement as HTMLElement).focus();
      }
    }
  }, [isOpen, isDesktop]);

  // Handle touch gestures for mobile swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDesktop && isOpen) {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDesktop && isOpen) {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isDesktop || !isOpen) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isHorizontalSwipe = distanceY < 100; // Prevent vertical scrolling from triggering
    
    if (isLeftSwipe && isHorizontalSwipe) {
      onClose();
    }
  };

  // Focus trap for mobile sidebar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDesktop && isOpen && e.key === 'Tab') {
      const focusableElements = sidebarRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    }
  };

  const getNavLinks = () => {
    if (!user) return [];

    const links = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    // Add enabled modules to sidebar
    modules.forEach(module => {
      if (module.href && (module as any).company_modules?.[0]?.is_enabled) {
        let icon = Package;
        if (module.name === 'Clients') icon = Building2;
        
        links.push({ 
          to: module.href, 
          label: module.name, 
          icon,
          isExternal: module.href.startsWith('http')
        });
      }
    });

    if (user.role === 'SUPERADMIN') {
      links.push(
        { to: '/modules', label: 'All Modules', icon: Package }
      );
    }

    if (user.role === 'OWNER') {
      links.push(
        { to: '/modules', label: 'Modules', icon: Package },
        { to: '/invites', label: 'Invites', icon: Users }
      );
    }

    return links;
  };

  // Enhanced active link detection
  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    
    // Handle nested routes better
    const pathSegments = path.split('/').filter(Boolean);
    const locationSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) return false;
    
    return pathSegments.every((segment, index) => 
      locationSegments[index] === segment
    );
  };

  // Handle navigation with proper mobile closure
  const handleNavigation = (to: string, isExternal: boolean = false) => {
    if (isExternal) {
      window.open(to, '_blank', 'noopener,noreferrer');
    } else {
      navigate(to);
    }
    
    // Close sidebar on mobile after navigation
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isDesktop && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out"
          onClick={onClose}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isDesktop 
          ? 'relative flex-shrink-0' 
          : 'fixed top-0 left-0 z-50'
        }
        bg-white dark:bg-surface-900 shadow-xl border-r border-surface-200 dark:border-surface-700 rounded-[5px]
        min-h-fit
        transform transition-all duration-300 ease-out will-change-transform
        ${isDesktop 
          ? 'translate-x-0' 
          : (isOpen ? 'translate-x-0' : '-translate-x-full')
        }
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${isDesktop 
          ? (isCollapsed ? 'w-16' : 'w-64') 
          : 'w-64'
        }
      `}
      ref={sidebarRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Main navigation"
      aria-hidden={!isOpen && !isDesktop}
      >
        {/* Navigation */}
        <nav className={`flex-1 ${isDesktop ? 'mt-4' : 'mt-4'}`}>
          <div className={`px-2 space-y-1 ${isCollapsed ? 'lg:px-2' : 'px-4'}`}>
            {getNavLinks().map(({ to, label, icon: Icon, isExternal }) => (
              <button
                key={to}
                onClick={() => handleNavigation(to, isExternal)}
                title={isCollapsed ? label : ''}
                className={`
                  group flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-out
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-900
                  hover:transform hover:scale-[1.02] active:scale-[0.98]
                  ${isActiveLink(to)
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 shadow-md border-l-4 border-primary-600'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 hover:shadow-sm'
                  }
                  ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}
                `}
                type="button"
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isCollapsed ? '' : 'mr-3'
                }`} />
                <span className={`truncate text-left transition-opacity duration-200 ${
                  isCollapsed ? 'lg:hidden' : ''
                }`}>
                  {label}
                </span>
                {isExternal && !isCollapsed && (
                  <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && isDesktop && (
                  <div className="hidden lg:group-hover:block absolute left-16 bg-surface-900 dark:bg-surface-100 text-surface-100 dark:text-surface-900 px-2 py-1 rounded text-xs whitespace-nowrap z-50 shadow-lg pointer-events-none">
                    {label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-surface-900 dark:bg-surface-100 rotate-45"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};