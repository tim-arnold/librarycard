'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useSession } from 'next-auth/react'
import { createAppTheme, type ThemeVariant } from './theme'
import { getStorageItem, setStorageItem } from './storage'
import { generateMarketingVariables, injectMarketingVariables } from './generateMarketingVariables'

export type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  isDarkMode: boolean
  themeVariant: ThemeVariant
  toggleTheme: () => void
  setThemeVariant: (variant: ThemeVariant) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}

interface ThemeContextProviderProps {
  children: React.ReactNode
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const saved = getStorageItem('librarycard-theme', 'functional')
  return saved === 'dark'
}

function getInitialThemeVariant(): ThemeVariant {
  if (typeof window === 'undefined') return 'amber'
  const saved = getStorageItem('librarycard-theme-variant', 'functional') as ThemeVariant
  if (saved && ['indigo', 'green', 'red', 'blue', 'purple', 'amber'].includes(saved)) {
    return saved
  }
  return 'amber'
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const { data: session, status } = useSession()
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode)
  const [themeVariant, setThemeVariant] = useState(getInitialThemeVariant)
  const [hasMounted, setHasMounted] = useState(false)
  const [sessionResolved, setSessionResolved] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      const savedVariant = getStorageItem('librarycard-theme-variant', 'functional') as ThemeVariant
      if (savedVariant && ['indigo', 'green', 'red', 'blue', 'purple', 'amber'].includes(savedVariant)) {
        setThemeVariant(savedVariant)
      }
    } else {
      setThemeVariant('amber')
    }

    setSessionResolved(true)
  }, [session, status])

  useEffect(() => {
    if (sessionResolved) {
      setStorageItem('librarycard-theme', isDarkMode ? 'dark' : 'light', 'functional')
    }
  }, [isDarkMode, sessionResolved])

  useEffect(() => {
    if (sessionResolved && session) {
      setStorageItem('librarycard-theme-variant', themeVariant, 'functional')
    }
  }, [themeVariant, sessionResolved, session])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const handleSetThemeVariant = (variant: ThemeVariant) => {
    if (session) {
      setThemeVariant(variant)
    }
  }

  const theme = createAppTheme(isDarkMode, themeVariant)

  useEffect(() => {
    if (typeof window !== 'undefined' && hasMounted) {
      const marketingVariables = generateMarketingVariables(theme, themeVariant)
      injectMarketingVariables(marketingVariables)
    }
  }, [theme, themeVariant, hasMounted])

  if (!hasMounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      themeVariant,
      toggleTheme,
      setThemeVariant: handleSetThemeVariant
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}