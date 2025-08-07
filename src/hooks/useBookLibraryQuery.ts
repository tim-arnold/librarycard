'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getDashboardData } from '@/lib/api'
import { isAdmin } from '@/lib/permissions'
import type { EnhancedBook } from '@/lib/types'
import type { FieldSet } from '@/lib/fieldSelection'

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}

interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
}

interface DashboardData {
  profile: {
    id: string
    user_role: string
  }
  books: EnhancedBook[]
  locations: Location[]
  shelves: Shelf[]
  permissions: {
    user: string[]
    global: string[]
  }
  pendingRemovalRequests: Record<string, number>
}

// Query Keys - Centralized for consistency with field set support
export const queryKeys = {
  dashboard: (fieldSet?: FieldSet) => 
    fieldSet ? ['dashboard', fieldSet] : ['dashboard'] as const,
  books: ['books'] as const,
  locations: ['locations'] as const,
  shelves: (locationId?: number) => 
    locationId ? ['shelves', locationId] : ['shelves'] as const,
  permissions: (locationId?: number) => 
    locationId ? ['permissions', locationId] : ['permissions'] as const,
  profile: ['profile'] as const,
}

// Main dashboard query hook with field selection optimization
export function useBookLibraryQuery(options?: {
  enabled?: boolean
  refetchInterval?: number
  fieldSet?: FieldSet
  viewMode?: 'grid' | 'list' | 'detail'
}) {
  const { data: session } = useSession()
  
  // Determine optimal field set based on context
  const { getOptimalFieldSet } = require('@/lib/fieldSelection')
  const fieldSet = options?.fieldSet || getOptimalFieldSet({
    viewMode: options?.viewMode || 'grid',
    userRole: (session?.user as any)?.role || 'user',
    isAdmin: (session?.user as any)?.role === 'admin' || (session?.user as any)?.role === 'super_admin',
    hasSearchQuery: false // TODO: Add search context support
  })
  
  return useQuery({
    queryKey: queryKeys.dashboard(fieldSet),
    queryFn: async () => {
      // Log payload optimization stats in development
      if (process.env.NODE_ENV === 'development') {
        const { logPayloadStats } = await import('@/lib/fieldSelection')
        console.group(`🚀 Dashboard API Call (${fieldSet} fields)`)
        console.log(`📊 Query key:`, queryKeys.dashboard(fieldSet))
      }
      
      const data = await getDashboardData(fieldSet)
      if (!data) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      // Log payload statistics in development
      if (process.env.NODE_ENV === 'development') {
        const { logPayloadStats } = await import('@/lib/fieldSelection')
        logPayloadStats(data.books || [], fieldSet)
        console.groupEnd()
      }
      
      return data as DashboardData
    },
    enabled: !!session?.user?.email && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000, // 3 minutes for dashboard data
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchInterval: options?.refetchInterval,
    // Enable background refetch on window focus for critical data
    refetchOnWindowFocus: true,
    // Retry important queries more aggressively
    retry: 3,
    select: (data: DashboardData) => {
      const currentUserRole = data.profile?.user_role || 'user'
      const currentUserId = data.profile?.id || null
      
      return {
        // Raw data
        rawData: data,
        
        // Processed data for easy consumption
        books: data.books || [],
        shelves: data.shelves || [],
        userRole: currentUserRole,
        currentUserId,
        userPermissions: data.permissions?.user || [],
        userGlobalPermissions: data.permissions?.global || [],
        pendingRemovalRequests: data.pendingRemovalRequests || {},
        
        // Location data processed based on user role
        locations: (() => {
          const locations = data.locations || []
          if (isAdmin(currentUserRole)) {
            return {
              allLocations: locations,
              userLocations: locations,
              currentLocation: locations[0] || null
            }
          } else {
            return {
              allLocations: [],
              userLocations: locations,
              currentLocation: locations[0] || null
            }
          }
        })(),
        
        // Loading states
        isLoading: false,
        isRefreshing: false,
        permissionsChecked: true,
        dataLoaded: true,
      }
    },
  })
}

// Book-specific operations with optimistic updates
export function useBookMutations() {
  const queryClient = useQueryClient()
  
  const updateBook = useMutation({
    mutationFn: async ({ bookId, updates }: { bookId: string; updates: Partial<EnhancedBook> }) => {
      // This would be implemented with actual API call
      throw new Error('Update book mutation not implemented yet')
    },
    onMutate: async ({ bookId, updates }) => {
      // Cancel any outgoing refetches for all dashboard variations
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })
      
      // Snapshot the previous value (get the first matching dashboard cache)
      const previousDashboard = queryClient.getQueriesData({ queryKey: ['dashboard'] })[0]?.[1]
      
      // Optimistically update all dashboard cache variations
      queryClient.setQueriesData({ queryKey: ['dashboard'] }, (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          books: old.books.map((book: EnhancedBook) =>
            book.id === bookId ? { ...book, ...updates } : book
          )
        }
      })
      
      return { previousDashboard }
    },
    onError: (err, variables, context) => {
      // Rollback on error - invalidate all dashboard caches to force refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  
  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      // This would be implemented with actual API call
      throw new Error('Delete book mutation not implemented yet')
    },
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })
      
      const previousDashboard = queryClient.getQueriesData({ queryKey: ['dashboard'] })[0]?.[1]
      
      // Optimistically remove the book from all dashboard cache variations
      queryClient.setQueriesData({ queryKey: ['dashboard'] }, (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          books: old.books.filter((book: EnhancedBook) => book.id !== bookId)
        }
      })
      
      return { previousDashboard }
    },
    onError: (err, variables, context) => {
      // Rollback on error - invalidate all dashboard caches to force refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  
  return {
    updateBook,
    deleteBook,
  }
}

// Manual refresh with optimized cache invalidation
export function useLibraryRefresh() {
  const queryClient = useQueryClient()
  
  const refreshLibrary = useMutation({
    mutationFn: async () => {
      // Force refetch of all dashboard data variations
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      return queryClient.refetchQueries({ queryKey: ['dashboard'] })
    },
  })
  
  return {
    refreshLibrary: refreshLibrary.mutate,
    isRefreshing: refreshLibrary.isPending,
  }
}

// Background sync for keeping data fresh
export function useBackgroundSync(enabled: boolean = true) {
  const queryClient = useQueryClient()
  
  // Periodically sync in background when user is active
  useQuery({
    queryKey: ['background-sync'],
    queryFn: async () => {
      // Invalidate and refetch critical data
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      return true
    },
    enabled,
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    refetchIntervalInBackground: false, // Only when tab is active
    retry: false, // Don't retry background syncs
  })
}