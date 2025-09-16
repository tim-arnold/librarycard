'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
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

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('amber')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = getStorageItem('librarycard-theme', 'functional')
    const savedVariant = getStorageItem('librarycard-theme-variant', 'functional') as ThemeVariant
    
    if (savedTheme === 'light') {
      setIsDarkMode(false)
    } else if (!savedTheme) {
      // Default to light mode for new users
      setIsDarkMode(false)
    } else {
      setIsDarkMode(savedTheme === 'dark')
    }
    
    if (savedVariant && ['indigo', 'green', 'red', 'blue', 'purple', 'amber'].includes(savedVariant)) {
      setThemeVariant(savedVariant)
    } else if (!savedVariant) {
      // Default to golden amber for new users
      setThemeVariant('amber')
    }
    
    setIsLoaded(true)
  }, [])

  // Save theme preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      setStorageItem('librarycard-theme', isDarkMode ? 'dark' : 'light', 'functional')
    }
  }, [isDarkMode, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      setStorageItem('librarycard-theme-variant', themeVariant, 'functional')
    }
  }, [themeVariant, isLoaded])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const handleSetThemeVariant = (variant: ThemeVariant) => {
    setThemeVariant(variant)
  }

  const theme = createAppTheme(isDarkMode, themeVariant)
  
  // Inject marketing variables whenever theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      const marketingVariables = generateMarketingVariables(theme, themeVariant)
      injectMarketingVariables(marketingVariables)
    }
  }, [theme, themeVariant, isLoaded])

  // Don't render until we've loaded the preferences to prevent flash
  if (!isLoaded) {
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