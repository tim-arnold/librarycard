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

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const { data: session, status } = useSession()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('amber')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load theme preferences based on authentication state
  useEffect(() => {
    // Wait for session to be determined
    if (status === 'loading') {
      return
    }

    const savedTheme = getStorageItem('librarycard-theme', 'functional')

    // Light/Dark mode preference is always honored (both logged in and out)
    if (savedTheme === 'light') {
      setIsDarkMode(false)
    } else if (!savedTheme) {
      // Default to light mode for new users
      setIsDarkMode(false)
    } else {
      setIsDarkMode(savedTheme === 'dark')
    }

    // Theme variant logic depends on authentication state
    if (session) {
      // User is logged in - honor their saved preference
      const savedVariant = getStorageItem('librarycard-theme-variant', 'functional') as ThemeVariant

      if (savedVariant && ['indigo', 'green', 'red', 'blue', 'purple', 'amber'].includes(savedVariant)) {
        setThemeVariant(savedVariant)
      } else {
        // Default to golden amber for new logged-in users
        setThemeVariant('amber')
      }
    } else {
      // User is logged out - force Golden Amber theme for marketing pages
      setThemeVariant('amber')
    }

    setIsLoaded(true)
  }, [session, status])

  // Save theme preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      setStorageItem('librarycard-theme', isDarkMode ? 'dark' : 'light', 'functional')
    }
  }, [isDarkMode, isLoaded])

  useEffect(() => {
    // Only save theme variant preference when user is logged in
    if (isLoaded && session) {
      setStorageItem('librarycard-theme-variant', themeVariant, 'functional')
    }
  }, [themeVariant, isLoaded, session])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const handleSetThemeVariant = (variant: ThemeVariant) => {
    // Only allow theme variant changes when user is logged in
    if (session) {
      setThemeVariant(variant)
    }
    // For logged-out users, theme variant is always locked to 'amber'
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