import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
            fontSize: 14,
          },
          components: {
            Layout: {
              siderBg: isDark ? '#001529' : '#f0f2f5',
              headerBg: isDark ? '#001529' : '#ffffff',
            },
            Menu: {
              darkItemBg: '#001529',
              darkSubMenuItemBg: '#000c17',
            },
            Table: {
              headerBg: isDark ? '#1f1f1f' : '#fafafa',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
