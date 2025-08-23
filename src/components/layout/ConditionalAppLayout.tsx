'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import AppLayoutWithGlobalHeader from '@/components/layout/AppLayoutWithGlobalHeader'

interface ConditionalAppLayoutProps {
  children: React.ReactNode
}

// Pages that should NOT have any layout (raw pages)
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/reset-password',
]

// Marketing pages (public, use marketing layout)
const MARKETING_PAGES = [
  '/',
  '/pricing',
  '/features',
  '/about',
  '/contact',
]

export default function ConditionalAppLayout({ children }: ConditionalAppLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Don't show any layout for auth pages (they need to be completely standalone)
  if (PUBLIC_PAGES.includes(pathname)) {
    return <>{children}</>
  }

  // Marketing pages handle their own layout (including global header)
  if (MARKETING_PAGES.includes(pathname)) {
    return <>{children}</>
  }

  // Show legal pages without layout if not authenticated
  if (!session && (pathname === '/privacy' || pathname === '/terms' || pathname === '/security')) {
    return <>{children}</>
  }

  // If not authenticated and not a marketing/legal/public page, redirect handled by individual pages
  if (!session) {
    return <>{children}</>
  }

  // All authenticated app pages use the new global header layout
  return (
    <AppLayoutWithGlobalHeader>
      {children}
    </AppLayoutWithGlobalHeader>
  )
}