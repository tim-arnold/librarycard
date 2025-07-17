'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { EnhancedBook } from '@/lib/types'
import { getBooks } from '@/lib/api'
import { isAdmin } from '@/lib/permissions'
import { authenticatedFetch } from '@/lib/auth-utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

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

export function useBookLibrary({ initialFilters }: UseBookLibraryProps = {}) {
  const { data: session } = useSession()
  
  // Core data state
  const [books, setBooks] = useState<EnhancedBook[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [pendingRemovalRequests, setPendingRemovalRequests] = useState<Record<string, number>>({})
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [permissionsChecked, setPermissionsChecked] = useState(false)

  const loadUserPermissions = async (locationId?: number) => {
    if (!session?.user?.email) {
      setPermissionsChecked(true)
      return
    }

    // For regular users, use the currentLocation or first location
    // For admins, we need to determine which location we're viewing
    let targetLocationId = locationId
    if (!targetLocationId) {
      if (currentLocation) {
        targetLocationId = currentLocation.id
      } else if (allLocations.length > 0) {
        targetLocationId = allLocations[0].id
      } else {
        setPermissionsChecked(true)
        return
      }
    }

    try {
      const result = await authenticatedFetch<{ permissions: string[] }>(
        session,
        `/api/permissions/user?locationId=${targetLocationId}`,
        { method: 'GET' }
      )

      if (result.success && result.data) {
        setUserPermissions(result.data.permissions || [])
      } else {
        console.warn('Failed to load user permissions:', result.error)
        setUserPermissions([])
      }
    } catch (error) {
      console.error('Error loading user permissions:', error)
      setUserPermissions([])
    } finally {
      setPermissionsChecked(true)
    }
  }

  const loadPendingRemovalRequests = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch(`${API_BASE}/api/book-removal-requests`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const requests = await response.json()
        // Create a map of book_id -> request_id for pending requests
        const pendingMap: Record<string, number> = {}
        requests.forEach((request: any) => {
          if (request.status === 'pending') {
            pendingMap[request.book_id.toString()] = request.id
          }
        })
        setPendingRemovalRequests(pendingMap)
      }
    } catch (error) {
      console.error('Failed to load pending removal requests:', error)
    }
  }

  const loadUserData = async () => {
    if (!session?.user?.email) return
    
    setIsLoading(true)
    
    // Load user role and ID first
    let currentUserRole = 'user'
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        currentUserRole = data.user_role || 'user'
        setUserRole(currentUserRole)
        setCurrentUserId(data.id || null)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setUserRole('user')
      setCurrentUserId(null)
    }

    // Load books
    const savedBooks = await getBooks()
    setBooks(savedBooks)

    // Load locations and shelves
    try {
      const response = await fetch(`${API_BASE}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const locations = await response.json()
        if (locations.length > 0) {
          if (isAdmin(currentUserRole)) {
            // Admin users: store all locations and load all shelves
            setAllLocations(locations)
            
            // Load shelves from all locations for admin users
            const allShelves: Shelf[] = []
            for (const location of locations) {
              const shelvesResponse = await fetch(`${API_BASE}/api/locations/${location.id}/shelves`, {
                headers: {
                  'Authorization': `Bearer ${session.user.email}`,
                  'Content-Type': 'application/json',
                },
              })
              if (shelvesResponse.ok) {
                const shelvesData = await shelvesResponse.json()
                allShelves.push(...shelvesData)
              }
            }
            setShelves(allShelves)
            
            // Load user permissions for the first location (admins can see all locations)
            await loadUserPermissions(locations[0].id)
          } else {
            // Regular users: store first location and its shelves only
            setCurrentLocation(locations[0])
            
            const shelvesResponse = await fetch(`${API_BASE}/api/locations/${locations[0].id}/shelves`, {
              headers: {
                'Authorization': `Bearer ${session.user.email}`,
                'Content-Type': 'application/json',
              },
            })
            if (shelvesResponse.ok) {
              const shelvesData = await shelvesResponse.json()
              setShelves(shelvesData)
            }
            
            // Load user permissions for the current location
            await loadUserPermissions(locations[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load locations and shelves:', error)
    }

    // Load pending removal requests for regular users
    if (!isAdmin(currentUserRole)) {
      await loadPendingRemovalRequests()
    }
    
    setIsLoading(false)
  }

  const handleManualRefresh = async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true)
    try {
      await loadUserData()
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
      loadUserData()
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

  return {
    // Data
    books,
    shelves,
    userRole,
    currentUserId,
    currentLocation,
    allLocations,
    userPermissions,
    pendingRemovalRequests,
    
    // Loading states
    isLoading,
    isRefreshing,
    dataLoaded,
    permissionsChecked,
    
    // Actions
    loadUserData,
    handleManualRefresh,
    loadPendingRemovalRequests,
    
    // Updaters
    updateBooks,
    updateShelves,
    updatePendingRemovalRequests,
    setBooks,
    setShelves,
    setPendingRemovalRequests,
  }
}