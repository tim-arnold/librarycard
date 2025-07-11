'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

interface ConditionalAppLayoutProps {
  children: React.ReactNode
}

// Pages that should NOT have the AppLayout
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/reset-password',
  '/privacy',
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

  // Don't show AppLayout for public pages or when not authenticated
  if (!session || PUBLIC_PAGES.includes(pathname) || pathname === '/') {
    return <>{children}</>
  }

  const currentPage = getCurrentPageFromPath(pathname)

  return (
    <AppLayout currentPage={currentPage}>
      {children}
    </AppLayout>
  )
}