'use client'

import React from 'react'
import Link from 'next/link'
import { CreditCard } from '@mui/icons-material'
import Container from '../ui/Container'
import { Flex } from '../ui/Container'

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear()

  const footerSections = {
    product: {
      title: 'Product',
      links: [
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Sign Up', href: '/auth/signin?register=true' },
      ]
    },
    company: {
      title: 'Company', 
      links: [
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ]
    },
    legal: {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Security', href: '/security' },
      ]
    }
  }

  return (
    <footer className="marketing-bg-gray-50" style={{ borderTop: '1px solid var(--marketing-gray-200)' }}>
      <Container>
        <div style={{ padding: 'var(--marketing-spacing-16) 0 var(--marketing-spacing-8) 0' }}>
          {/* Main footer content */}
          <div 
            className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-grid-lg-cols-4 marketing-gap-8"
            style={{ marginBottom: 'var(--marketing-spacing-12)' }}
          >
            {/* Brand section */}
            <div>
              <Link 
                href="/" 
                className="marketing-flex marketing-items-center marketing-gap-2"
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--marketing-gray-900)',
                  marginBottom: 'var(--marketing-spacing-4)'
                }}
              >
                <CreditCard 
                  style={{ 
                    color: 'var(--marketing-primary)',
                    fontSize: '1.75rem'
                  }} 
                />
                <span 
                  style={{ 
                    fontSize: 'var(--marketing-text-lg)',
                    fontWeight: 'var(--marketing-font-bold)',
                    color: 'var(--marketing-gray-900)'
                  }}
                >
                  LibraryCard
                </span>
              </Link>
              <p 
                style={{
                  color: 'var(--marketing-gray-600)',
                  fontSize: 'var(--marketing-text-sm)',
                  lineHeight: 'var(--marketing-leading-relaxed)',
                  margin: 0,
                  maxWidth: '280px'
                }}
              >
                Community-first library management platform. 
                Making shared book collections accessible and affordable.
              </p>
            </div>

            {/* Footer links */}
            {Object.entries(footerSections).map(([key, section]) => (
              <div key={key}>
                <h3 
                  style={{
                    color: 'var(--marketing-gray-900)',
                    fontSize: 'var(--marketing-text-sm)',
                    fontWeight: 'var(--marketing-font-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--marketing-spacing-4)',
                    marginTop: 0
                  }}
                >
                  {section.title}
                </h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {section.links.map((link) => (
                    <li key={link.name} style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
                      <Link 
                        href={link.href}
                        style={{
                          color: 'var(--marketing-gray-600)',
                          fontSize: 'var(--marketing-text-sm)',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = 'var(--marketing-primary)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'var(--marketing-gray-600)'
                        }}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom section */}
          <div 
            style={{
              borderTop: '1px solid var(--marketing-gray-200)',
              paddingTop: 'var(--marketing-spacing-8)'
            }}
          >
            <Flex 
              justify="between" 
              align="center"
              direction="col"
              className="marketing-flex-md-row"
              gap={4}
            >
              <p 
                style={{
                  color: 'var(--marketing-gray-500)',
                  fontSize: 'var(--marketing-text-sm)',
                  margin: 0
                }}
              >
                © {currentYear} LibraryCard. All rights reserved.
              </p>
              
              <div className="marketing-flex marketing-items-center marketing-gap-6">
                <Link 
                  href="/privacy"
                  style={{
                    color: 'var(--marketing-gray-500)',
                    fontSize: 'var(--marketing-text-sm)',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-gray-500)'
                  }}
                >
                  Privacy
                </Link>
                <Link 
                  href="/terms"
                  style={{
                    color: 'var(--marketing-gray-500)',
                    fontSize: 'var(--marketing-text-sm)',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-gray-500)'
                  }}
                >
                  Terms
                </Link>
                <Link 
                  href="/security"
                  style={{
                    color: 'var(--marketing-gray-500)',
                    fontSize: 'var(--marketing-text-sm)',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--marketing-gray-500)'
                  }}
                >
                  Security
                </Link>
              </div>
            </Flex>
          </div>
        </div>
      </Container>
    </footer>
  )
}

// Responsive CSS for mobile flex direction
const styles = `
@media (min-width: 768px) {
  .marketing-flex-md-row {
    flex-direction: row !important;
  }
}
`

// Inject styles (in a real app, this would be in a CSS file)
if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}