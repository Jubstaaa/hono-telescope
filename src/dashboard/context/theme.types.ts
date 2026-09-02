import type { ReactNode } from 'react';

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}
