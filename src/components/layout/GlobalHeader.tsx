'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { 
  CreditCard, 
  Menu, 
  X, 
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
  DarkMode
} from '@mui/icons-material'
import { isAdmin } from '@/lib/permissions'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useRejectedReviewNotifications } from '@/hooks/useRejectedReviewNotifications'

interface GlobalHeaderProps {
  userRole?: string | null
  userFirstName?: string | null
}

export default function GlobalHeader({ userRole, userFirstName }: GlobalHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { isDarkMode, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const { unreadCount } = useUnreadNotificationCount()
  const { unreadRejectedCount } = useRejectedReviewNotifications()

  const totalNotifications = unreadCount + unreadRejectedCount

  // Define navigation items based on authentication state
  const getNavigationItems = () => {
    if (session) {
      // Authenticated: Functional navigation
      const items = [
        { name: 'My Library', href: '/library', key: 'library' },
        { name: 'Add Books', href: '/add-books', key: 'add-books' },
      ]

      // Add admin navigation for admin users
      if (isAdmin(userRole)) {
        items.push({ name: 'Admin', href: '/admin', key: 'admin' })
      }

      // Add account and support items
      items.push(
        { name: 'Account', href: '/profile', key: 'account' },
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
    router.push(href)
    setMobileMenuOpen(false)
  }

  const isActivePath = (href: string, key: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    
    // Special handling for library routes
    if (key === 'library' && (pathname === '/library' || pathname === '/')) return session ? true : false
    
    return false
  }

  return (
    <header 
      className="marketing-bg-white" 
      style={{ 
        borderBottom: '1px solid var(--marketing-gray-200)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      <div className="marketing-container marketing-container-xl">
        <div 
          className="marketing-flex marketing-items-center marketing-justify-between"
          style={{ padding: 'var(--marketing-spacing-4) 0' }}
        >
          {/* Logo */}
          <div 
            className="marketing-flex marketing-items-center marketing-gap-2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavClick(session ? '/library' : '/')}
          >
            <CreditCard 
              style={{ 
                color: 'var(--marketing-primary)',
                fontSize: '2rem'
              }} 
            />
            <span 
              style={{ 
                fontSize: 'var(--marketing-text-xl)',
                fontWeight: 'var(--marketing-font-bold)',
                color: 'var(--marketing-gray-900)'
              }}
            >
              LibraryCard
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="marketing-hidden-mobile">
            <ul 
              className="marketing-flex marketing-items-center marketing-gap-8"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {navigationItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActivePath(item.href, item.key) 
                        ? 'var(--marketing-primary)' 
                        : 'var(--marketing-gray-600)',
                      textDecoration: 'none',
                      fontSize: 'var(--marketing-text-base)',
                      fontWeight: isActivePath(item.href, item.key) 
                        ? 'var(--marketing-font-semibold)' 
                        : 'var(--marketing-font-medium)',
                      transition: 'color 0.2s ease',
                      padding: 'var(--marketing-spacing-2)',
                      borderRadius: 'var(--marketing-radius-base)'
                    }}
                    onMouseOver={(e) => {
                      if (!isActivePath(item.href, item.key)) {
                        e.currentTarget.style.color = 'var(--marketing-primary)'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActivePath(item.href, item.key)) {
                        e.currentTarget.style.color = 'var(--marketing-gray-600)'
                      }
                    }}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop User Controls */}
          <div className="marketing-hidden-mobile marketing-flex marketing-items-center marketing-gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
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
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--marketing-primary)'
                e.currentTarget.style.color = 'var(--marketing-primary)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--marketing-gray-300)'
                e.currentTarget.style.color = 'var(--marketing-gray-600)'
              }}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </button>

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
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 'var(--marketing-spacing-2)',
                      borderRadius: 'var(--marketing-radius-base)',
                      position: 'relative'
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
                            backgroundColor: 'var(--marketing-error)',
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
                                    backgroundColor: 'var(--marketing-error)',
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
                            borderBottom: index < 6 ? '1px solid var(--marketing-gray-100)' : 'none',
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
                <button
                  onClick={() => router.push('/auth/signin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--marketing-gray-600)',
                    fontSize: 'var(--marketing-text-base)',
                    fontWeight: 'var(--marketing-font-medium)',
                    cursor: 'pointer',
                    padding: 'var(--marketing-spacing-2)',
                    borderRadius: 'var(--marketing-radius-base)',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-gray-600)'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="marketing-button marketing-button-primary marketing-button-md"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="marketing-hidden-desktop"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--marketing-gray-600)',
              padding: 'var(--marketing-spacing-2)',
              borderRadius: 'var(--marketing-radius-base)'
            }}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            className="marketing-hidden-desktop"
            style={{
              borderTop: '1px solid var(--marketing-gray-200)',
              paddingTop: 'var(--marketing-spacing-4)',
              paddingBottom: 'var(--marketing-spacing-6)'
            }}
          >
            <nav>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {navigationItems.map((item) => (
                  <li key={item.key} style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                    <button
                      onClick={() => handleNavClick(item.href)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActivePath(item.href, item.key) 
                          ? 'var(--marketing-primary)' 
                          : 'var(--marketing-gray-700)',
                        fontSize: 'var(--marketing-text-lg)',
                        fontWeight: isActivePath(item.href, item.key) 
                          ? 'var(--marketing-font-semibold)' 
                          : 'var(--marketing-font-medium)',
                        padding: 'var(--marketing-spacing-3) 0'
                      }}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Mobile User Controls */}
            <div 
              style={{
                marginTop: 'var(--marketing-spacing-6)',
                paddingTop: 'var(--marketing-spacing-4)',
                borderTop: '1px solid var(--marketing-gray-200)'
              }}
            >
              <div className="marketing-flex marketing-items-center marketing-justify-between marketing-gap-4">
                <button
                  onClick={toggleTheme}
                  className="marketing-button marketing-button-outline marketing-button-sm"
                  style={{ flex: 1 }}
                >
                  {isDarkMode ? <LightMode style={{ marginRight: '8px' }} /> : <DarkMode style={{ marginRight: '8px' }} />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>

                {session ? (
                  <button
                    onClick={handleSignOut}
                    className="marketing-button marketing-button-primary marketing-button-sm"
                    style={{ flex: 1 }}
                  >
                    <ExitToApp style={{ marginRight: '8px' }} />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('/auth/signin')}
                    className="marketing-button marketing-button-primary marketing-button-sm"
                    style={{ flex: 1 }}
                  >
                    Get Started
                  </button>
                )}
              </div>

              {session && (
                <div style={{ marginTop: 'var(--marketing-spacing-4)' }}>
                  <div 
                    style={{ 
                      fontSize: 'var(--marketing-text-sm)',
                      color: 'var(--marketing-gray-600)',
                      marginBottom: 'var(--marketing-spacing-3)'
                    }}
                  >
                    Signed in as {userFirstName || session?.user?.name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="marketing-flex marketing-flex-col marketing-gap-2">
                    {[
                      { label: 'Profile', action: () => router.push('/profile') },
                      { label: 'Notifications', action: () => router.push('/notifications'), badge: totalNotifications },
                      { label: 'Locations', action: () => router.push('/locations') },
                      { label: 'Security', action: () => router.push('/security') },
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.action()
                          setMobileMenuOpen(false)
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--marketing-gray-200)',
                          borderRadius: 'var(--marketing-radius-base)',
                          padding: 'var(--marketing-spacing-2) var(--marketing-spacing-3)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: 'var(--marketing-text-sm)',
                          color: 'var(--marketing-gray-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        {item.label}
                        {item.badge && item.badge > 0 && (
                          <span
                            style={{
                              backgroundColor: 'var(--marketing-error)',
                              color: 'var(--marketing-white)',
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
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close account menu */}
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
    </header>
  )
}