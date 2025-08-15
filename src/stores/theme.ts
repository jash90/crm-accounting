import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Check system preference
const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme());
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  return isDark;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isDark: false,
      
      setTheme: (theme: Theme) => {
        const isDark = applyTheme(theme);
        set({ theme, isDark });
      },
      
      toggleTheme: () => {
        const { theme } = get();
        let newTheme: Theme;
        
        if (theme === 'system') {
          // If system, toggle to opposite of current system preference
          newTheme = getSystemTheme() ? 'light' : 'dark';
        } else {
          // If manual, toggle between light and dark
          newTheme = theme === 'light' ? 'dark' : 'light';
        }
        
        const isDark = applyTheme(newTheme);
        set({ theme: newTheme, isDark });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isDark = applyTheme(state.theme);
          state.isDark = isDark;
        }
      },
    }
  )
);

// Initialize theme on app start
export const initializeTheme = () => {
  const { theme, setTheme } = useThemeStore.getState();
  setTheme(theme);
  
  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const { theme } = useThemeStore.getState();
      if (theme === 'system') {
        const isDark = applyTheme('system');
        useThemeStore.setState({ isDark });
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
};