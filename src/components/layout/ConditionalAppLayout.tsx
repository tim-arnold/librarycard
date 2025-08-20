'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'

interface ConditionalAppLayoutProps {
  children: React.ReactNode
}

// Pages that should NOT have the AppLayout
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/reset-password',
]

// Function to determine current page from pathname
function getCurrentPageFromPath(pathname: string): 'library' | 'add-books' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/add-books')) return 'add-books'
  return 'library' // default, includes /library and /profile
}

export default function ConditionalAppLayout({ children }: ConditionalAppLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Use ref to store stable currentPage value - only update when main section changes
  const currentPageRef = useRef<'library' | 'add-books' | 'admin'>('library')
  
  const newCurrentPage = getCurrentPageFromPath(pathname)
  if (currentPageRef.current !== newCurrentPage) {
    currentPageRef.current = newCurrentPage
  }
  
  const currentPage = currentPageRef.current

  // Don't show AppLayout for public pages or home page when not authenticated
  if (PUBLIC_PAGES.includes(pathname) || pathname === '/') {
    return <>{children}</>
  }

  // Show legal pages without AppLayout if not authenticated
  if (!session && (pathname === '/privacy' || pathname === '/terms')) {
    return <>{children}</>
  }

  // If not authenticated and not a legal/public page, show without layout
  if (!session) {
    return <>{children}</>
  }

  return (
    <AppLayout currentPage={currentPage}>
      {children}
    </AppLayout>
  )
}