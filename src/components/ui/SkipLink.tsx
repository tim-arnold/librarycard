import React from 'react'
import { Box, Link } from '@mui/material'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export default function SkipLink({ href, children }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    // Get the target element
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      // Get header height from CSS variable or fallback to 80px
      const headerHeight = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--header-height') || '80px')

      // Calculate scroll position accounting for header height + small padding
      const elementPosition = targetElement.offsetTop
      const offsetPosition = elementPosition - headerHeight - 16 // 16px additional padding

      // Smooth scroll to target with offset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Focus the target element for screen readers after scroll completes
      setTimeout(() => {
        // Make element focusable if it isn't already
        if (!targetElement.hasAttribute('tabindex')) {
          targetElement.setAttribute('tabindex', '-1')
        }
        targetElement.focus({ preventScroll: true })
      }, 300) // Small delay to allow smooth scroll to complete
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: 1,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
        fontWeight: 'bold',
        borderRadius: 1,
        '&:focus': {
          left: '1rem',
          top: '1rem',
        },
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '1rem'
        e.currentTarget.style.top = '1rem'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px'
        e.currentTarget.style.top = 'auto'
      }}
    >
      {children}
    </Link>
  )
}

interface SkipLinksProps {
  additionalLinks?: Array<{
    href: string
    label: string
  }>
}

export function SkipLinks({ additionalLinks = [] }: SkipLinksProps) {
  return (
    <Box component="nav" aria-label="Skip navigation links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      {additionalLinks.map((link) => (
        <SkipLink key={link.href} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
      <SkipLink href="#main-navigation">Skip to navigation</SkipLink>
    </Box>
  )
}