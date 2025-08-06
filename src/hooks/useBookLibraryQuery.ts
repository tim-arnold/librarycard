'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getDashboardData } from '@/lib/api'
import { isAdmin } from '@/lib/permissions'
import type { EnhancedBook } from '@/lib/types'

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

// Query Keys - Centralized for consistency
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  books: ['books'] as const,
  locations: ['locations'] as const,
  shelves: (locationId?: number) => 
    locationId ? ['shelves', locationId] : ['shelves'] as const,
  permissions: (locationId?: number) => 
    locationId ? ['permissions', locationId] : ['permissions'] as const,
  profile: ['profile'] as const,
}

// Main dashboard query hook
export function useBookLibraryQuery(options?: {
  enabled?: boolean
  refetchInterval?: number
}) {
  const { data: session } = useSession()
  
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const data = await getDashboardData()
      if (!data) {
        throw new Error('Failed to fetch dashboard data')
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard })
      
      // Snapshot the previous value
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard)
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.dashboard, (old: any) => {
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
      // Rollback on error
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard)
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
  
  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      // This would be implemented with actual API call
      throw new Error('Delete book mutation not implemented yet')
    },
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard })
      
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard)
      
      // Optimistically remove the book
      queryClient.setQueryData(queryKeys.dashboard, (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          books: old.books.filter((book: EnhancedBook) => book.id !== bookId)
        }
      })
      
      return { previousDashboard }
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
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
      // Force refetch of dashboard data
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      return queryClient.refetchQueries({ queryKey: queryKeys.dashboard })
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      return true
    },
    enabled,
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    refetchIntervalInBackground: false, // Only when tab is active
    retry: false, // Don't retry background syncs
  })
}