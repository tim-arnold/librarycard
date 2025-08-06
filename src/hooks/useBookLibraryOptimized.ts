'use client'

import { useState, useEffect } from 'react'
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

interface UseBookLibraryProps {
  initialFilters?: {
    location?: string
    shelf?: string
    status?: string
    searchTerm?: string
    category?: string
  }
}

// Optimized version using batched dashboard API
export function useBookLibraryOptimized({ initialFilters }: UseBookLibraryProps = {}) {
  const { data: session, status } = useSession()
  
  // Data state
  const [books, setBooks] = useState<EnhancedBook[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [userLocations, setUserLocations] = useState<Location[]>([])
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [userGlobalPermissions, setUserGlobalPermissions] = useState<string[]>([])
  const [pendingRemovalRequests, setPendingRemovalRequests] = useState<Record<string, number>>({})
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [permissionsChecked, setPermissionsChecked] = useState(false)

  const loadDashboardData = async () => {
    if (!session?.user?.email) return
    
    setIsLoading(true)
    
    try {
      const dashboardData = await getDashboardData()
      
      if (!dashboardData) {
        console.error('Failed to fetch dashboard data')
        setIsLoading(false)
        return
      }

      // Set all data from batched API call (using the same data flow as original useBookLibrary)
      const { profile, locations, books, shelves, permissions, pendingRemovalRequests } = dashboardData
      
      // Set user profile data
      const currentUserRole = profile.user_role || 'user'
      setUserRole(currentUserRole)
      setCurrentUserId(profile.id || null)
      
      // Set books (already in the format the frontend expects)
      setBooks(books || [])
      
      // Set shelves
      setShelves(shelves || [])
      
      // Set locations based on user role (following the same logic as original)
      if (isAdmin(currentUserRole)) {
        // Admin users: store all locations in both places (needed for different logic paths)
        setAllLocations(locations || [])
        setUserLocations(locations || [])
      } else {
        // Regular users: store accessible locations and set first as current
        setUserLocations(locations || [])
        setCurrentLocation((locations && locations.length > 0) ? locations[0] : null)
      }
      
      // Set permissions (using the same structure as original)
      setUserPermissions(permissions.user || [])
      setUserGlobalPermissions(permissions.global || [])
      
      // Set pending removal requests
      setPendingRemovalRequests(pendingRemovalRequests || {})
      
      setPermissionsChecked(true)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setUserRole('user')
      setCurrentUserId(null)
      setUserPermissions([])
      setUserGlobalPermissions([])
      setPermissionsChecked(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await loadDashboardData()
      return { success: true }
    } catch (error) {
      console.error('Error refreshing library:', error)
      return { success: false, error }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initialize data loading
  useEffect(() => {
    if (session?.user && !dataLoaded) {
      loadDashboardData()
      setDataLoaded(true)
    } else if (session === null) {
      // Session loading is complete but user is not logged in
      setIsLoading(false)
      setDataLoaded(false)
    }
  }, [session, dataLoaded])

  const updateBooks = (updatedBooks: EnhancedBook[]) => {
    setBooks(updatedBooks)
  }

  const updateShelves = (updatedShelves: Shelf[]) => {
    setShelves(updatedShelves)
  }

  const updatePendingRemovalRequests = (updatedRequests: Record<string, number>) => {
    setPendingRemovalRequests(updatedRequests)
  }

  const switchToLocation = async (locationId: number) => {
    if (!session?.user?.email) return { success: false, error: 'No session' }
    
    const targetLocation = userLocations.find(loc => loc.id === locationId) || 
                          allLocations.find(loc => loc.id === locationId)
    if (!targetLocation) return { success: false, error: 'Location not found' }

    setCurrentLocation(targetLocation)
    
    // TODO: Load location-specific permissions from cached dashboard data
    // For now, we'll need to make a separate call, but this could be optimized further
    
    return { success: true }
  }

  return {
    // Data
    books,
    shelves,
    allLocations,
    userLocations,
    currentLocation,
    userRole,
    currentUserId,
    userPermissions,
    userGlobalPermissions,
    pendingRemovalRequests,
    
    // Loading states
    isLoading,
    isRefreshing,
    permissionsChecked,
    
    // Actions
    handleManualRefresh,
    updateBooks,
    updateShelves, 
    updatePendingRemovalRequests,
    switchToLocation,
    
    // Direct setters (for compatibility with useBookActions)
    setBooks,
    setShelves,
    setPendingRemovalRequests,
    loadPendingRemovalRequests: async () => {
      // TODO: Implement if needed, or remove from useBookActions dependency
    }
  }
}