import React from 'react';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({
  isOpen,
  onClick,
  className = '',
  ariaLabel = 'Toggle navigation menu'
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg bg-white dark:bg-surface-800 shadow-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border border-surface-200 dark:border-surface-600 ${className}`}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      type="button"
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <div className="w-5 h-5 relative">
          {/* Top line */}
          <span
            className={`absolute block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
              isOpen ? 'rotate-45 translate-y-2' : 'translate-y-1'
            }`}
          />
          {/* Middle line */}
          <span
            className={`absolute block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out translate-y-2 ${
              isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}
          />
          {/* Bottom line */}
          <span
            className={`absolute block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
              isOpen ? '-rotate-45 translate-y-2' : 'translate-y-3'
            }`}
          />
        </div>
      </div>
    </button>
  );
};