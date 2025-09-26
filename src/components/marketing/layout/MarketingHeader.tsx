'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CreditCard, Menu, Close, LightMode, DarkMode } from '@mui/icons-material'
import { useTheme } from '@/lib/ThemeContext'
import Button from '../ui/Button'
import Container from '../ui/Container'

export default function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { isDarkMode, toggleTheme } = useTheme()

  const navigation = [
    { name: 'Features', href: '/features' },
    { name: 'Beta', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className="marketing-bg-white" style={{ borderBottom: '1px solid var(--marketing-gray-200)' }}>
      <Container>
        <div 
          className="marketing-flex marketing-items-center marketing-justify-between"
          style={{ padding: 'var(--marketing-spacing-4) 0' }}
        >
          {/* Logo */}
          <Link 
            href="/" 
            className="marketing-flex marketing-items-center marketing-gap-2"
            style={{ textDecoration: 'none', color: 'var(--marketing-gray-900)' }}
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
          </Link>

          {/* Desktop Navigation */}
          <nav className="marketing-hidden-mobile">
            <ul 
              className="marketing-flex marketing-items-center marketing-gap-8"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    style={{
                      color: 'var(--marketing-gray-600)',
                      textDecoration: 'none',
                      fontSize: 'var(--marketing-text-base)',
                      fontWeight: 'var(--marketing-font-medium)',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = 'var(--marketing-primary)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = 'var(--marketing-gray-600)'
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop CTAs */}
          <div className="marketing-hidden-mobile marketing-flex marketing-items-center marketing-gap-4">
            {/* Light/Dark Mode Toggle - only shown when logged out */}
            {!session && (
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
            )}

            {session ? (
              <Button href="/library" variant="primary">
                Go to Library
              </Button>
            ) : (
              <>
                <Button href="/auth/signin" variant="ghost">
                  Sign In
                </Button>
                <Button href="/auth/signin?register=true" variant="primary">
                  Join Beta
                </Button>
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
            {mobileMenuOpen ? <Close /> : <Menu />}
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
                {navigation.map((item) => (
                  <li key={item.name} style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
                    <Link 
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        color: 'var(--marketing-gray-700)',
                        textDecoration: 'none',
                        fontSize: 'var(--marketing-text-lg)',
                        fontWeight: 'var(--marketing-font-medium)',
                        display: 'block',
                        padding: 'var(--marketing-spacing-2) 0'
                      }}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div
              className="marketing-flex marketing-flex-col marketing-gap-4"
              style={{ marginTop: 'var(--marketing-spacing-6)' }}
            >
              {/* Light/Dark Mode Toggle for Mobile - only shown when logged out */}
              {!session && (
                <button
                  onClick={() => {
                    toggleTheme()
                    setMobileMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--marketing-spacing-2)',
                    padding: 'var(--marketing-spacing-3)',
                    background: 'none',
                    border: '1px solid var(--marketing-gray-300)',
                    borderRadius: 'var(--marketing-radius-base)',
                    cursor: 'pointer',
                    color: 'var(--marketing-gray-700)',
                    fontSize: 'var(--marketing-text-base)',
                    fontWeight: 'var(--marketing-font-medium)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDarkMode ? <LightMode /> : <DarkMode />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}

              {session ? (
                <Button href="/library" variant="primary" fullWidth>
                  Go to Library
                </Button>
              ) : (
                <>
                  <Button href="/auth/signin" variant="ghost" fullWidth>
                    Sign In
                  </Button>
                  <Button href="/auth/signin?register=true" variant="primary" fullWidth>
                    Join Beta
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}