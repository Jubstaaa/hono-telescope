import type { ReactNode } from 'react'

import { ConfigProvider, theme } from 'antd'
import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
    isDark: boolean
    toggleTheme: () => void
}

interface ThemeProviderProps {
    children: ReactNode
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme')
        return saved ? saved === 'dark' : false
    })

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggleTheme = () => {
        setIsDark(!isDark)
    }

    const { darkAlgorithm, defaultAlgorithm } = theme

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <ConfigProvider
                theme={{
                    algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
                    components: {
                        Layout: {
                            headerBg: isDark ? '#001529' : '#ffffff',
                            siderBg: isDark ? '#001529' : '#f0f2f5',
                        },
                        Menu: {
                            darkItemBg: '#001529',
                            darkSubMenuItemBg: '#000c17',

                            ...(isDark ? { itemSelectedColor: '#ffffff' } : {}),
                        },
                        Table: {
                            headerBg: isDark ? '#1f1f1f' : '#fafafa',
                        },
                    },
                    token: {
                        borderRadius: 8,

                        colorPrimary: isDark ? '#4096ff' : '#0958d9',

                        ...(isDark
                            ? {}
                            : { colorTextDescription: 'rgba(0, 0, 0, 0.65)' }),
                        fontSize: 14,
                    },
                }}>
                {children}
            </ConfigProvider>
        </ThemeContext.Provider>
    )
}
