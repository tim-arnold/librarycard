'use client'

import React, { useState, useContext, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import {
  CreditCard,
  Menu,
  Close,
  AccountCircle,
  ExitToApp,
  Help,
  LocationOn,
  History,
  Settings,
  Lock,
  Notifications,
  Palette,
  LightMode,
  DarkMode,
  Tour
} from '@mui/icons-material'
import { isAdmin } from '@/lib/permissions'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useRejectedReviewNotifications } from '@/hooks/useRejectedReviewNotifications'
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts'
import useScrollLock from '@/hooks/useScrollLock'
import useMobileBreakpoints from '@/hooks/useMobileBreakpoints'
import { themeVariants, type ThemeVariant } from '@/lib/theme'
import { TourContext } from '@/components/tour/TourProvider'
import { SkipLinks } from '@/components/ui/SkipLink'

interface GlobalHeaderProps {
  userRole?: string | null
  userFirstName?: string | null
}

export default function GlobalHeader({ userRole, userFirstName }: GlobalHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { isDarkMode, themeVariant, toggleTheme, setThemeVariant } = useTheme()
  const muiTheme = useMuiTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [themeMenuClosing, setThemeMenuClosing] = useState(false)
  const { unreadCount } = useUnreadNotificationCount()
  const { isMobile } = useMobileBreakpoints()

  // Lock scroll when mobile menus are open, or theme menu on mobile
  useScrollLock(mobileMenuOpen || (themeMenuOpen && isMobile))
  const { unreadRejectedCount } = useRejectedReviewNotifications()
  const { counts: adminCounts } = useAdminPendingCounts()

  // Enhanced keyboard navigation for theme menu
  useEffect(() => {
    if (!themeMenuOpen) return

    const handleThemeMenuKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement

      // Check if we're focused on any theme menu button (Light/Dark or theme colors)
      const isThemeMenuButton = activeElement?.tagName === 'BUTTON' && (
        // Light/Dark mode buttons
        (activeElement?.textContent?.includes('Light') || activeElement?.textContent?.includes('Dark')) ||
        // Theme color buttons
        (activeElement?.style?.color === 'var(--marketing-gray-700)' &&
         ['Indigo', 'Forest Green', 'Crimson Red', 'Ocean Blue', 'Purple', 'Amber'].some(color =>
           activeElement?.textContent?.includes(color)))
      )

      if (isThemeMenuButton && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()

        // Find all theme menu buttons in order: Light, Dark, then theme colors
        const lightButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.trim() === 'Light')
        const darkButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.trim() === 'Dark')
        const themeColorButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
          btn.style.color === 'var(--marketing-gray-700)' &&
          btn.textContent &&
          ['Indigo', 'Forest Green', 'Crimson Red', 'Ocean Blue', 'Purple', 'Amber'].some(color =>
            btn.textContent?.includes(color))
        )

        const allButtons = [lightButton, darkButton, ...themeColorButtons].filter(Boolean) as HTMLButtonElement[]
        const currentIndex = allButtons.indexOf(activeElement as HTMLButtonElement)

        if (currentIndex >= 0) {
          let nextIndex = currentIndex

          // Grid layout: [Light, Dark] (row 0), then 2-column grid for theme colors (rows 1+)
          const isInModeRow = currentIndex < 2 // Light/Dark buttons
          const currentRow = isInModeRow ? 0 : Math.floor((currentIndex - 2) / 2) + 1
          const currentCol = isInModeRow ? currentIndex : (currentIndex - 2) % 2

          switch (e.key) {
            case 'ArrowRight':
              if (isInModeRow && currentIndex === 0) {
                // Light -> Dark
                nextIndex = 1
              } else if (isInModeRow && currentIndex === 1) {
                // Dark -> first theme color
                nextIndex = 2
              } else {
                // Move right in theme color grid, wrap to next row
                nextIndex = currentIndex + 1
                if (nextIndex >= allButtons.length) {
                  nextIndex = 2 // Wrap to first theme color
                }
              }
              break

            case 'ArrowLeft':
              if (currentIndex === 2) {
                // First theme color -> Dark
                nextIndex = 1
              } else if (currentIndex === 1) {
                // Dark -> Light
                nextIndex = 0
              } else if (currentIndex === 0) {
                // Light -> last theme color
                nextIndex = allButtons.length - 1
              } else {
                // Move left in theme color grid
                nextIndex = currentIndex - 1
              }
              break

            case 'ArrowDown':
              if (isInModeRow) {
                // From Light/Dark -> corresponding column in theme colors
                nextIndex = 2 + currentCol // First row of theme colors
              } else {
                // Move down in theme color grid
                const nextRowIndex = currentIndex + 2
                nextIndex = nextRowIndex < allButtons.length ? nextRowIndex : currentIndex
              }
              break

            case 'ArrowUp':
              if (currentRow === 1) {
                // From first row of theme colors -> Light/Dark
                nextIndex = currentCol < 2 ? currentCol : 1
              } else if (currentRow > 1) {
                // Move up in theme color grid
                nextIndex = currentIndex - 2
              }
              // Stay in same position if already at top
              break

            case 'Home':
              nextIndex = 0 // Light button
              break

            case 'End':
              nextIndex = allButtons.length - 1 // Last theme color
              break

            case 'Enter':
            case ' ':
              ;(activeElement as HTMLButtonElement).click()
              return

            case 'Escape':
              setThemeMenuOpen(false)
              return
          }

          if (nextIndex !== currentIndex && allButtons[nextIndex]) {
            allButtons[nextIndex].focus()
          }
        }
      } else if (e.key === 'Escape') {
        setThemeMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleThemeMenuKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleThemeMenuKeyDown, true)
    }
  }, [themeMenuOpen])

  // Simple keyboard navigation for account menu - escape to close
  useEffect(() => {
    if (!accountMenuOpen) return

    const handleAccountMenuKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleAccountMenuKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleAccountMenuKeyDown, true)
    }
  }, [accountMenuOpen])

  // Safe tour usage - might not be available on marketing pages
  const tourContext = useContext(TourContext)
  const startTour = tourContext?.startTour || (() => {
    console.log('Tour not available on this page')
  })

  const totalNotifications = unreadCount + unreadRejectedCount
  const totalAdminNotifications = adminCounts.total

  // Theme options
  const themeOptions: { value: ThemeVariant; label: string; color: string }[] = [
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
    { value: 'green', label: 'Forest Green', color: '#22c55e' },
    { value: 'red', label: 'Crimson Red', color: '#ef4444' },
    { value: 'blue', label: 'Ocean Blue', color: '#3b82f6' },
    { value: 'purple', label: 'Royal Purple', color: '#a855f7' },
    { value: 'amber', label: 'Golden Amber', color: '#f59e0b' },
  ]

  // Define navigation items based on authentication state
  const getNavigationItems = () => {
    if (session) {
      // Authenticated: Functional navigation
      const items = [
        { name: 'My Library', href: '/library', key: 'library' },
        { name: 'Add Books', href: '/add-books', key: 'add-books', dataTour: 'add-books-nav' },
      ]

      // Add admin navigation for admin users
      if (isAdmin(userRole)) {
        items.push({ name: 'Admin', href: '/admin', key: 'admin' })
      }

      // Add account and support items
      items.push(
        { name: 'Account & Settings', href: '/profile', key: 'account' },
        { name: 'Support', href: '/contact', key: 'support' }
      )

      return items
    } else {
      // Unauthenticated: Marketing navigation
      return [
        { name: 'Home', href: '/', key: 'home' },
        { name: 'Features', href: '/features', key: 'features' },
        { name: 'Pricing', href: '/pricing', key: 'pricing' },
        { name: 'About', href: '/about', key: 'about' },
        { name: 'Contact', href: '/contact', key: 'contact' },
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error clearing user cache on logout:', error)
    }
    
    signOut({ callbackUrl: '/' }) // Redirect to marketing homepage
    setAccountMenuOpen(false)
  }

  const handleNavClick = (href: string) => {
    if (mobileMenuOpen) {
      closeMobileMenu()
    }
    router.push(href)
  }

  const closeMobileMenu = () => {
    setMobileMenuClosing(true)
    setTimeout(() => {
      setMobileMenuOpen(false)
      setMobileMenuClosing(false)
    }, 300) // Match animation duration
  }

  const closeThemeMenu = () => {
    setThemeMenuClosing(true)
    setTimeout(() => {
      setThemeMenuOpen(false)
      setThemeMenuClosing(false)
    }, 300) // Match animation duration
  }

  const isActivePath = (href: string, key: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    
    // Special handling for library routes
    if (key === 'library' && (pathname === '/library' || pathname === '/')) return session ? true : false
    
    return false
  }

  // Define additional skip links based on current page
  const additionalSkipLinks = pathname.startsWith('/library') ? [
    { href: '#search-filters', label: 'Skip to search and filters' }
  ] : []

  return (
    <>
      <SkipLinks additionalLinks={additionalSkipLinks} />
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1300, // Higher than Material-UI modal (1300) and all page content
          // Fallback to CSS variables for compatibility
          '--marketing-white': muiTheme.palette.background.paper,
          '--marketing-gray-200': muiTheme.palette.divider,
          '--header-height': '80px'
        } as React.CSSProperties}
      >
      <div
        style={{
          backgroundColor: muiTheme.palette.background.paper,
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          position: 'relative',
          zIndex: 1302, // Higher than mobile menus within header context
          boxShadow: (mobileMenuOpen || themeMenuOpen) ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
          width: '100%'
        }}
      >
        <div
          className="marketing-flex marketing-items-center marketing-justify-between"
          style={{
            padding: 'var(--marketing-spacing-4)',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {/* Logo */}
          <div
            className="marketing-flex marketing-items-center marketing-gap-2"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleNavClick(session ? '/library' : '/')
            }}
          >
            <CreditCard 
              style={{ 
                color: muiTheme.palette.primary.main,
                fontSize: '2rem'
              }} 
            />
            <span 
              style={{ 
                fontSize: 'var(--marketing-text-xl)',
                fontWeight: 'var(--marketing-font-bold)',
                color: muiTheme.palette.text.primary
              }}
            >
              LibraryCard
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="marketing-hidden-mobile" id="main-navigation" tabIndex={-1}>
            <ul 
              className="marketing-flex marketing-items-center marketing-gap-8"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {navigationItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    {...(item.dataTour && { 'data-tour': item.dataTour })}
                    style={{
                      background: 'none',
                      cursor: 'pointer',
                      color: isActivePath(item.href, item.key)
                        ? muiTheme.palette.primary.main
                        : muiTheme.palette.text.secondary,
                      textDecoration: 'none',
                      fontSize: 'var(--marketing-text-base)',
                      fontWeight: 'var(--marketing-font-medium)', // Same weight for all
                      transition: 'color 0.2s ease',
                      padding: 'var(--marketing-spacing-2)',
                      borderRadius: 'var(--marketing-radius-base)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--marketing-spacing-1)',
                      // Custom CSS properties for the underline
                      '--nav-underline-width': isActivePath(item.href, item.key) ? '100%' : '0%',
                      '--nav-underline-opacity': isActivePath(item.href, item.key) ? '1' : '0',
                    } as React.CSSProperties}
                    onMouseOver={(e) => {
                      if (!isActivePath(item.href, item.key)) {
                        e.currentTarget.style.color = muiTheme.palette.primary.main
                        e.currentTarget.style.setProperty('--nav-underline-width', '100%')
                        e.currentTarget.style.setProperty('--nav-underline-opacity', '0.6')
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActivePath(item.href, item.key)) {
                        e.currentTarget.style.color = muiTheme.palette.text.secondary
                        e.currentTarget.style.setProperty('--nav-underline-width', '0%')
                        e.currentTarget.style.setProperty('--nav-underline-opacity', '0')
                      }
                    }}
                  >
                    {item.name}
                    {/* Admin notifications badge */}
                    {item.key === 'admin' && totalAdminNotifications > 0 && (
                      <span
                        style={{
                          backgroundColor: muiTheme.palette.primary.main,
                          color: muiTheme.palette.primary.contrastText,
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          marginLeft: '4px'
                        }}
                      >
                        {totalAdminNotifications > 99 ? '99+' : totalAdminNotifications}
                      </span>
                    )}
                    {/* Decorative underline */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'var(--nav-underline-width)',
                        height: '2px',
                        background: `linear-gradient(90deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.secondary.main} 100%)`,
                        borderRadius: '1px',
                        opacity: 'var(--nav-underline-opacity)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop User Controls */}
          <div className="marketing-hidden-mobile marketing-flex marketing-items-center marketing-gap-4">
            {/* Theme Options Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setThemeMenuOpen(!themeMenuOpen)
                  // Close account menu if it's open
                  if (accountMenuOpen) {
                    setAccountMenuOpen(false)
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--marketing-gray-300)',
                  borderRadius: 'var(--marketing-radius-base)',
                  padding: 'var(--marketing-spacing-2)',
                  cursor: 'pointer',
                  color: 'var(--marketing-gray-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  gap: 'var(--marketing-spacing-1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--marketing-primary)'
                  e.currentTarget.style.color = 'var(--marketing-primary)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--marketing-gray-300)'
                  e.currentTarget.style.color = 'var(--marketing-gray-600)'
                }}
                title="Theme options"
              >
                <>
                  <Palette style={{ fontSize: '1.71429rem' }} />
                  {muiTheme.palette.mode === 'dark' ? (
                    <DarkMode style={{ fontSize: '1.71429rem' }} />
                  ) : (
                    <LightMode style={{ fontSize: '1.71429rem' }} />
                  )}
                </>
              </button>

              {/* Theme Dropdown Menu */}
              {themeMenuOpen && (
                <div
                  className="marketing-hidden-mobile"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 'var(--marketing-spacing-2)',
                    background: 'var(--marketing-white)',
                    border: '1px solid var(--marketing-gray-200)',
                    borderRadius: 'var(--marketing-radius-lg)',
                    boxShadow: 'var(--marketing-shadow-lg)',
                    minWidth: '200px',
                    zIndex: 1000,
                    padding: 'var(--marketing-spacing-2) 0'
                  }}
                >
                  {/* Light/Dark Mode Toggle */}
                  <div style={{ padding: '0 var(--marketing-spacing-4)', marginBottom: 'var(--marketing-spacing-3)' }}>
                    <div style={{ 
                      fontSize: 'var(--marketing-text-sm)', 
                      fontWeight: 'var(--marketing-font-medium)',
                      color: 'var(--marketing-gray-700)',
                      marginBottom: 'var(--marketing-spacing-2)'
                    }}>
                      Mode
                    </div>
                    <div className="marketing-flex marketing-gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (isDarkMode) toggleTheme()
                        }}
                        style={{
                          flex: 1,
                          background: !isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-gray-100)',
                          color: !isDarkMode ? 'var(--marketing-white)' : 'var(--marketing-gray-600)',
                          border: 'none',
                          borderRadius: 'var(--marketing-radius-base)',
                          padding: 'var(--marketing-spacing-2)',
                          cursor: 'pointer',
                          fontSize: 'var(--marketing-text-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--marketing-spacing-1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <LightMode style={{ fontSize: '1rem' }} />
                        Light
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!isDarkMode) toggleTheme()
                        }}
                        style={{
                          flex: 1,
                          background: isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-gray-100)',
                          color: isDarkMode ? 'var(--marketing-white)' : 'var(--marketing-gray-600)',
                          border: 'none',
                          borderRadius: 'var(--marketing-radius-base)',
                          padding: 'var(--marketing-spacing-2)',
                          cursor: 'pointer',
                          fontSize: 'var(--marketing-text-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--marketing-spacing-1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DarkMode style={{ fontSize: '1rem' }} />
                        Dark
                      </button>
                    </div>
                  </div>

                  {/* Divider - only shown when color scheme options are available */}
                  {session && (
                    <div style={{
                      height: '1px',
                      background: 'var(--marketing-gray-200)',
                      margin: 'var(--marketing-spacing-2) var(--marketing-spacing-4)'
                    }} />
                  )}

                  {/* Color Scheme Options - only shown when logged in */}
                  {session && (
                    <div style={{ padding: '0 var(--marketing-spacing-4)' }}>
                      <div style={{
                        fontSize: 'var(--marketing-text-sm)',
                        fontWeight: 'var(--marketing-font-medium)',
                        color: 'var(--marketing-gray-700)',
                        marginBottom: 'var(--marketing-spacing-2)'
                      }}>
                        Color Scheme
                      </div>
                      <div className="marketing-grid marketing-grid-cols-2 marketing-gap-2">
                        {themeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setThemeVariant(option.value)
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--marketing-spacing-2)',
                              padding: 'var(--marketing-spacing-2)',
                              background: themeVariant === option.value ? 'var(--marketing-gray-100)' : 'none',
                              border: '1px solid',
                              borderColor: themeVariant === option.value ? 'var(--marketing-primary)' : 'transparent',
                              borderRadius: 'var(--marketing-radius-base)',
                              cursor: 'pointer',
                              fontSize: 'var(--marketing-text-sm)',
                              color: 'var(--marketing-gray-700)',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              if (themeVariant !== option.value) {
                                e.currentTarget.style.backgroundColor = 'var(--marketing-gray-50)'
                              }
                            }}
                            onMouseOut={(e) => {
                              if (themeVariant !== option.value) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: option.color,
                                flexShrink: 0
                              }}
                            />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {session ? (
              <>
                {/* User Greeting */}
                <span style={{ 
                  color: 'var(--marketing-gray-700)',
                  fontSize: 'var(--marketing-text-sm)',
                  fontWeight: 'var(--marketing-font-medium)'
                }}>
                  Hello, {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}!
                </span>

                {/* Account Menu */}
                <div style={{ position: 'relative' }}>
                  <button
                    data-tour="user-menu"
                    onClick={() => {
                      setAccountMenuOpen(!accountMenuOpen)
                      // Close theme menu if it's open
                      if (themeMenuOpen) {
                        setThemeMenuOpen(false)
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 'var(--marketing-spacing-2)',
                      borderRadius: 'var(--marketing-radius-base)',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      const icon = e.currentTarget.querySelector('svg')
                      if (icon) icon.style.color = 'var(--marketing-primary)'
                    }}
                    onMouseOut={(e) => {
                      const icon = e.currentTarget.querySelector('svg')
                      if (icon) icon.style.color = 'var(--marketing-gray-600)'
                    }}
                    title="Account menu"
                  >
                    <div style={{ position: 'relative' }}>
                      {totalNotifications > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            backgroundColor: 'var(--marketing-primary)',
                            color: 'var(--marketing-white)',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}
                        >
                          {totalNotifications > 99 ? '99+' : totalNotifications}
                        </span>
                      )}
                      <AccountCircle 
                        style={{ 
                          fontSize: '2rem',
                          color: 'var(--marketing-gray-600)'
                        }} 
                      />
                    </div>
                  </button>

                  {/* Account Dropdown */}
                  {accountMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 'var(--marketing-spacing-2)',
                        background: 'var(--marketing-white)',
                        border: '1px solid var(--marketing-gray-200)',
                        borderRadius: 'var(--marketing-radius-lg)',
                        boxShadow: 'var(--marketing-shadow-lg)',
                        minWidth: '200px',
                        zIndex: 1000
                      }}
                    >
                      {[
                        { icon: <AccountCircle />, label: 'Profile', action: () => router.push('/profile') },
                        { 
                          icon: (
                            <div style={{ position: 'relative' }}>
                              {totalNotifications > 0 && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    backgroundColor: 'var(--marketing-primary)',
                                    color: 'var(--marketing-white)',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    zIndex: 1
                                  }}
                                >
                                  {totalNotifications > 9 ? '9+' : totalNotifications}
                                </span>
                              )}
                              <Notifications />
                            </div>
                          ), 
                          label: 'Notifications', 
                          action: () => router.push('/notifications') 
                        },
                        { icon: <LocationOn />, label: 'Locations', action: () => router.push('/locations') },
                        { icon: <History />, label: 'Checkout History', action: () => router.push('/checkout-history') },
                        { icon: <Lock />, label: 'Security', action: () => router.push('/security') },
                        { icon: <Help />, label: 'Help', action: () => {} }, // TODO: Implement help modal
                        // Only show Start Tour on desktop devices
                        ...(isMobile ? [] : [{ icon: <Tour />, label: 'Start Tour', action: () => startTour() }]),
                        { icon: <ExitToApp />, label: 'Sign Out', action: handleSignOut },
                      ].map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            item.action()
                            setAccountMenuOpen(false)
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--marketing-spacing-3)',
                            padding: 'var(--marketing-spacing-3) var(--marketing-spacing-4)',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 'var(--marketing-text-sm)',
                            color: 'var(--marketing-gray-700)',
                            borderBottom: index < 7 ? '1px solid var(--marketing-gray-100)' : 'none',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--marketing-gray-50)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <span style={{ color: 'var(--marketing-gray-500)', fontSize: '1.1rem' }}>
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  style={{
                    background: 'none',
                    color: 'var(--marketing-gray-600)',
                    fontSize: 'var(--marketing-text-base)',
                    fontWeight: 'var(--marketing-font-medium)',
                    cursor: 'pointer',
                    padding: 'var(--marketing-spacing-2)',
                    borderRadius: 'var(--marketing-radius-base)',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-gray-600)'
                  }}
                >
                  Sign In
                </a>
                <a
                  href="/auth/signin"
                  className="marketing-button marketing-button-primary marketing-button-md"
                  style={{ textDecoration: 'none' }}
                >
                  Get Started Free
                </a>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div
            className="marketing-hidden-desktop marketing-flex marketing-items-center marketing-gap-2"
          >
            {/* Mobile theme button */}
            <button
              onClick={() => {
                if (themeMenuOpen) {
                  closeThemeMenu()
                } else {
                  setThemeMenuOpen(true)
                  // Close account menu if it's open
                  if (accountMenuOpen) {
                    setAccountMenuOpen(false)
                  }
                  if (mobileMenuOpen) closeMobileMenu()
                }
              }}
              aria-label="Theme options"
              style={{
                background: themeMenuOpen ? 'var(--marketing-gray-100)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: themeMenuOpen ? 'var(--marketing-primary)' : 'var(--marketing-gray-600)',
                padding: 'var(--marketing-spacing-2)',
                borderRadius: 'var(--marketing-radius-base)',
                transition: 'all 0.2s ease',
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (!themeMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--marketing-gray-100)'
                  e.currentTarget.style.color = 'var(--marketing-primary)'
                }
              }}
              onMouseOut={(e) => {
                if (!themeMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--marketing-gray-600)'
                }
              }}
            >
              {themeMenuOpen ? <Close /> : <Palette />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => {
                if (mobileMenuOpen) {
                  closeMobileMenu()
                } else {
                  setMobileMenuOpen(true)
                  if (themeMenuOpen) closeThemeMenu()
                }
              }}
              aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileMenuOpen}
              style={{
                background: mobileMenuOpen ? 'var(--marketing-gray-100)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: mobileMenuOpen ? 'var(--marketing-primary)' : 'var(--marketing-gray-600)',
                padding: 'var(--marketing-spacing-2)',
                borderRadius: 'var(--marketing-radius-base)',
                transition: 'all 0.2s ease',
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (!mobileMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--marketing-gray-100)'
                  e.currentTarget.style.color = 'var(--marketing-primary)'
                }
              }}
              onMouseOut={(e) => {
                if (!mobileMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--marketing-gray-600)'
                }
              }}
            >
              {mobileMenuOpen ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Theme Dropdown - Outside container for full width */}
      {(themeMenuOpen || themeMenuClosing) && (
        <>
          {/* Backdrop - lower z-index than header and footer - mobile only */}
          <div
            className="marketing-hidden-desktop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 900, // Below header (1300+) and footer toolbar (1000)
            }}
            onClick={closeThemeMenu}
          />
          {/* Theme menu content */}
          <div
            className="marketing-hidden-desktop"
            style={{
              borderTop: `1px solid ${muiTheme.palette.divider}`,
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              paddingBottom: 'var(--marketing-spacing-6)',
              background: muiTheme.palette.background.paper,
              position: 'fixed',
              top: 'var(--header-height, 80px)',
              left: 0,
              right: 0,
              height: 'auto',
              zIndex: 950, // Above backdrop (900) but below header (1300+) and footer (1000)
              animation: themeMenuClosing
                ? 'slideUpToBehindHeader 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'slideDownFromBehindHeader 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'top',
              paddingTop: 'var(--marketing-spacing-4)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1280px', // Same as marketing-container-xl
              margin: '0 auto',
              padding: 'var(--marketing-spacing-4)',
              background: 'transparent'
            }}
          >
            {/* Light/Dark Mode Toggle */}
            <div style={{
              marginBottom: 'var(--marketing-spacing-3)'
            }}>
            <div style={{
              fontSize: 'var(--marketing-text-sm)',
              fontWeight: 'var(--marketing-font-medium)',
              color: 'var(--marketing-gray-700)',
              marginBottom: 'var(--marketing-spacing-2)'
            }}>
              Mode
            </div>
            <div className="marketing-flex marketing-gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (isDarkMode) {
                    toggleTheme()
                  }
                }}
                style={{
                  flex: 1,
                  padding: 'var(--marketing-spacing-3)',
                  border: '1px solid',
                  borderColor: !isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-gray-300)',
                  borderRadius: 'var(--marketing-radius-base)',
                  background: !isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-white)',
                  color: !isDarkMode ? 'var(--marketing-white)' : 'var(--marketing-gray-700)',
                  cursor: 'pointer',
                  fontSize: 'var(--marketing-text-base)',
                  fontWeight: 'var(--marketing-font-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--marketing-spacing-1)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
              >
                <LightMode style={{ fontSize: '1rem' }} />
                Light
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!isDarkMode) {
                    toggleTheme()
                  }
                }}
                style={{
                  flex: 1,
                  padding: 'var(--marketing-spacing-3)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-gray-300)',
                  borderRadius: 'var(--marketing-radius-base)',
                  background: isDarkMode ? 'var(--marketing-primary)' : 'var(--marketing-white)',
                  color: isDarkMode ? 'var(--marketing-white)' : 'var(--marketing-gray-700)',
                  cursor: 'pointer',
                  fontSize: 'var(--marketing-text-base)',
                  fontWeight: 'var(--marketing-font-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--marketing-spacing-1)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
              >
                <DarkMode style={{ fontSize: '1rem' }} />
                Dark
              </button>
            </div>
          </div>

            {/* Color Scheme Options - only shown when logged in */}
            {session && (
              <div>
              <div style={{
                fontSize: 'var(--marketing-text-sm)',
                fontWeight: 'var(--marketing-font-medium)',
                color: 'var(--marketing-gray-700)',
                marginBottom: 'var(--marketing-spacing-2)'
              }}>
                Color Scheme
              </div>
              <div className="marketing-grid marketing-grid-cols-2 marketing-gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setThemeVariant(option.value)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--marketing-spacing-2)',
                      padding: 'var(--marketing-spacing-3)',
                      background: themeVariant === option.value ? 'var(--marketing-white)' : 'transparent',
                      border: '1px solid',
                      borderColor: themeVariant === option.value ? 'var(--marketing-primary)' : 'var(--marketing-gray-200)',
                      borderRadius: 'var(--marketing-radius-base)',
                      cursor: 'pointer',
                      fontSize: 'var(--marketing-text-base)',
                      color: 'var(--marketing-gray-700)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      minHeight: '48px'
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: option.color,
                        flexShrink: 0
                      }}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
          </div>
        </>
      )}

      {/* Mobile Navigation - Outside container for full width */}
      {(mobileMenuOpen || mobileMenuClosing) && (
        <>
          {/* Backdrop - lower z-index than header and footer - mobile only */}
          <div
            className="marketing-hidden-desktop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 900, // Below header (1300+) and footer toolbar (1000)
            }}
            onClick={closeMobileMenu}
          />
          {/* Mobile menu content */}
          <div
            className="marketing-hidden-desktop"
            style={{
              borderTop: `1px solid ${muiTheme.palette.divider}`,
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              paddingBottom: 'var(--marketing-spacing-6)',
              background: muiTheme.palette.background.paper,
              position: 'fixed',
              top: 'var(--header-height, 80px)',
              left: 0,
              right: 0,
              height: 'auto',
              zIndex: 950, // Above backdrop (900) but below header (1300+) and footer (1000)
              animation: mobileMenuClosing
                ? 'slideUpToBehindHeader 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'slideDownFromBehindHeader 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'top',
              paddingTop: 'var(--marketing-spacing-4)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1280px', // Same as marketing-container-xl
              margin: '0 auto',
              padding: '0 var(--marketing-spacing-4)',
              background: 'transparent'
            }}
          >
            <nav>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {navigationItems.map((item) => (
                  <li key={item.key} style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                    <a
                      href={item.href}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: isActivePath(item.href, item.key)
                          ? 'var(--marketing-white)'
                          : 'transparent',
                        border: isActivePath(item.href, item.key)
                          ? '1px solid var(--marketing-primary)'
                          : '1px solid var(--marketing-gray-200)',
                        cursor: 'pointer',
                        color: isActivePath(item.href, item.key)
                          ? muiTheme.palette.primary.main
                          : muiTheme.palette.text.primary,
                        fontSize: 'var(--marketing-text-lg)',
                        fontWeight: isActivePath(item.href, item.key)
                          ? 'var(--marketing-font-semibold)'
                          : 'var(--marketing-font-medium)',
                        padding: 'var(--marketing-spacing-4)',
                        borderRadius: 'var(--marketing-radius-lg)',
                        margin: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        minHeight: '56px',
                        boxShadow: isActivePath(item.href, item.key)
                          ? 'var(--marketing-shadow-sm)'
                          : 'none',
                        textDecoration: 'none'
                      }}
                      onMouseOver={(e) => {
                        if (!isActivePath(item.href, item.key)) {
                          e.currentTarget.style.backgroundColor = 'var(--marketing-white)'
                          e.currentTarget.style.borderColor = 'var(--marketing-gray-300)'
                          e.currentTarget.style.boxShadow = 'var(--marketing-shadow-sm)'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isActivePath(item.href, item.key)) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = 'var(--marketing-gray-200)'
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                    >
                      <span>{item.name}</span>
                      {/* Admin notifications badge for mobile */}
                      {item.key === 'admin' && totalAdminNotifications > 0 && (
                        <span
                          style={{
                            backgroundColor: muiTheme.palette.primary.main,
                            color: muiTheme.palette.primary.contrastText,
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {totalAdminNotifications > 99 ? '99+' : totalAdminNotifications}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Mobile User Controls */}
            {session && (
              <div
                style={{
                  marginTop: 'var(--marketing-spacing-6)',
                  paddingTop: 'var(--marketing-spacing-4)',
                  borderTop: `1px solid ${muiTheme.palette.divider}`,
                  padding: 'var(--marketing-spacing-4) var(--marketing-spacing-4) 0'
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--marketing-text-sm)',
                    color: 'var(--marketing-gray-600)',
                    marginBottom: 'var(--marketing-spacing-4)',
                    textAlign: 'center',
                    padding: 'var(--marketing-spacing-3)',
                    backgroundColor: 'var(--marketing-gray-50)',
                    borderRadius: 'var(--marketing-radius-lg)',
                    border: '1px solid var(--marketing-gray-200)'
                  }}
                >
                  👋 Hello, {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}!
                </div>

                <button
                  onClick={handleSignOut}
                  className="marketing-button marketing-button-primary marketing-button-md"
                  style={{
                    width: '100%',
                    borderRadius: 'var(--marketing-radius-lg)',
                    minHeight: '48px'
                  }}
                >
                  <ExitToApp style={{ marginRight: '8px' }} />
                  Sign Out
                </button>
              </div>
            )}

            {!session && (
              <div
                style={{
                  marginTop: 'var(--marketing-spacing-6)',
                  paddingTop: 'var(--marketing-spacing-4)',
                  borderTop: `1px solid ${muiTheme.palette.divider}`,
                  padding: 'var(--marketing-spacing-4) var(--marketing-spacing-4) 0'
                }}
              >
                <a
                  href="/auth/signin"
                  className="marketing-button marketing-button-primary marketing-button-md"
                  style={{
                    width: '100%',
                    borderRadius: 'var(--marketing-radius-lg)',
                    minHeight: '48px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Get Started Free
                </a>
              </div>
            )}
          </div>
          </div>
        </>
      )}

      {/* Click outside to close menus */}
      {accountMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setAccountMenuOpen(false)}
        />
      )}
      {themeMenuOpen && (
        <div
          className="marketing-hidden-mobile"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setThemeMenuOpen(false)}
        />
      )}
    </header>
    </>
  )
}