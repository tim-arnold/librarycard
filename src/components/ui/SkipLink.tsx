import React from 'react'
import { Box, Link } from '@mui/material'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export default function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <Link
      href={href}
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

export function SkipLinks() {
  return (
    <Box component="nav" aria-label="Skip navigation links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#main-navigation">Skip to navigation</SkipLink>
    </Box>
  )
}