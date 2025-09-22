'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeContextProvider } from '@/lib/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PerformanceTracker from '@/components/performance/PerformanceTracker'
import inputEventDebug from '@/lib/inputEventDebug'
import { UserDataProvider } from '@/contexts/UserDataContext'
import { useState, useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Input event debugging available in console as window.inputEventDebug
  // Call inputEventDebug.enable() in console to activate debugging if needed

  // Create a stable query client instance with aligned TTLs to prevent corruption
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Align with server-side cache TTLs (reduced to prevent stale data)
        staleTime: 3 * 60 * 1000,      // 3 minutes (was 5)
        // Keep data in cache for shorter time to align with server
        gcTime: 5 * 60 * 1000,         // 5 minutes (was 10)
        // Retry failed requests 2 times
        retry: 2,
        // Enable refetch on window focus for critical data consistency
        refetchOnWindowFocus: true,    // changed from false
        // More aggressive refetch on reconnect to handle stale states
        refetchOnReconnect: true,
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
          <UserDataProvider>
            {children}
            {/* Performance monitoring */}
            <PerformanceTracker />
          </UserDataProvider>
        </ThemeContextProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}