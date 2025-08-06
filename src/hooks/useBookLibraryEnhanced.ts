'use client'

import { useBookLibraryOptimized } from './useBookLibraryOptimized'
import { useBookLibraryQuery, useBackgroundSync } from './useBookLibraryQuery'
import type { EnhancedBook } from '@/lib/types'

interface UseBookLibraryProps {
  initialFilters?: {
    location?: string
    shelf?: string
    status?: string
    searchTerm?: string
    category?: string
  }
  // Feature flag to enable React Query implementation
  useReactQuery?: boolean
}

// Enhanced hook that can use either the current implementation or React Query
export function useBookLibraryEnhanced({ 
  initialFilters, 
  useReactQuery = false 
}: UseBookLibraryProps = {}) {
  
  // Always call all hooks to follow Rules of Hooks
  // Enable background sync when using React Query
  useBackgroundSync(useReactQuery)
  
  // Always call both hooks but only use the results conditionally
  const queryResult = useBookLibraryQuery({
    // Enable automatic background refetch every 3 minutes for active users
    refetchInterval: useReactQuery ? 3 * 60 * 1000 : undefined,
    enabled: useReactQuery, // Only enable the query when flag is set
  })
  
  const optimizedResult = useBookLibraryOptimized({ initialFilters })
  
  // Use React Query implementation if enabled and data is available
  if (useReactQuery) {
    if (queryResult.isLoading) {
      return {
        books: [] as EnhancedBook[],
        shelves: [] as any[],
        userRole: null as string | null,
        currentUserId: null as string | null,
        currentLocation: null,
        allLocations: [] as any[],
        userLocations: [] as any[],
        userPermissions: [] as string[],
        userGlobalPermissions: [] as string[],
        pendingRemovalRequests: {} as Record<string, number>,
        isLoading: true,
        isRefreshing: false,
        permissionsChecked: false,
        dataLoaded: false,
        // Stub functions for compatibility
        handleManualRefresh: async () => ({ success: false }),
        loadPendingRemovalRequests: async () => {},
        switchToLocation: async () => ({ success: false }),
        setBooks: () => {},
        setShelves: () => {},
        setPendingRemovalRequests: () => {},
      }
    }
    
    if (queryResult.error) {
      console.error('React Query error:', queryResult.error)
      // Fallback to current implementation on error
      return optimizedResult
    }
    
    const data = queryResult.data
    if (!data) {
      return optimizedResult
    }
    
    return {
      // Data from React Query
      books: data.books,
      shelves: data.shelves,
      userRole: data.userRole,
      currentUserId: data.currentUserId,
      currentLocation: data.locations.currentLocation,
      allLocations: data.locations.allLocations,
      userLocations: data.locations.userLocations,
      userPermissions: data.userPermissions,
      userGlobalPermissions: data.userGlobalPermissions,
      pendingRemovalRequests: data.pendingRemovalRequests,
      
      // Loading states
      isLoading: false,
      isRefreshing: queryResult.isFetching && !queryResult.isLoading,
      permissionsChecked: true,
      dataLoaded: true,
      
      // Actions - React Query handles refetching automatically
      handleManualRefresh: async () => {
        await queryResult.refetch()
        return { success: true }
      },
      
      // Legacy compatibility functions (limited functionality in React Query mode)
      loadPendingRemovalRequests: async () => {
        // React Query handles this automatically
        await queryResult.refetch()
      },
      
      switchToLocation: async (locationId: number) => {
        // In React Query mode, location switching would need separate implementation
        // For now, just refetch data
        await queryResult.refetch()
        return { success: true }
      },
      
      // Direct state setters (limited in React Query mode - data comes from server)
      setBooks: (books: any[]) => {
        // In React Query mode, we'd use mutations to update server state
        // For now, this is a no-op to maintain compatibility
        console.warn('setBooks called in React Query mode - use mutations instead')
      },
      
      setShelves: (shelves: any[]) => {
        console.warn('setShelves called in React Query mode - use mutations instead')
      },
      
      setPendingRemovalRequests: (requests: Record<string, number>) => {
        console.warn('setPendingRemovalRequests called in React Query mode - use mutations instead')
      },
    }
  }
  
  // Default to current optimized implementation
  return optimizedResult
}