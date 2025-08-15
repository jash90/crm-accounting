import React from 'react';
import { useThemeStore } from '@/stores/theme';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, isDark, setTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light mode' },
    { value: 'dark' as const, icon: Moon, label: 'Dark mode' },
    { value: 'system' as const, icon: Monitor, label: 'System preference' },
  ];

  return (
    <div className="relative">
      <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-lg p-1 gap-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ease-in-out
              ${
                theme === value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-700'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-950
            `}
            title={label}
            aria-label={label}
            aria-pressed={theme === value}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Alternative simple toggle button
export const SimpleThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg transition-all duration-200 ease-in-out
        text-surface-600 dark:text-surface-400 
        hover:text-surface-900 dark:hover:text-surface-100 
        hover:bg-surface-100 dark:hover:bg-surface-800
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
        focus:ring-offset-surface-50 dark:focus:ring-offset-surface-950
      "
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};