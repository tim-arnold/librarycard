'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeContextProvider } from '@/lib/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import PerformanceTracker from '@/components/performance/PerformanceTracker'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a stable query client instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus by default (can be overridden per query)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeContextProvider>
          {children}
          {/* Performance monitoring */}
          <PerformanceTracker />
          {/* Only show devtools in development */}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </ThemeContextProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}