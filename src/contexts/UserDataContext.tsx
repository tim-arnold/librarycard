'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/apiConfig'

interface UserData {
  userRole: string | null
  userFirstName: string | null
  userLocation: string | null
  userDataLoaded: boolean
}

interface UserDataContextType extends UserData {
  loadUserData: () => Promise<void>
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const dataLoadedRef = useRef(false)

  const loadUserData = async () => {
    if (!session) return

    try {
      // Fetch both user profile and locations in parallel
      const [profileData, locations] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        fetch(`${getApiBaseUrl()}/api/locations`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json())
      ])

      // Set user role and name from profile
      if (profileData.user_role) {
        setUserRole(profileData.user_role)
      }
      if (profileData.first_name) {
        setUserFirstName(profileData.first_name)
      }

      // Set user location from locations
      if (locations && locations.length > 0) {
        setUserLocation(locations[0].name)
      }

      // Mark data as loaded
      setUserDataLoaded(true)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      setUserDataLoaded(true) // Still mark as loaded to prevent infinite loading
    }
  }

  useEffect(() => {
    if (session && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      loadUserData()
    }
  }, [session])

  // Reset data loaded flag when session changes
  useEffect(() => {
    if (!session) {
      dataLoadedRef.current = false
      setUserDataLoaded(false)
      setUserRole(null)
      setUserFirstName(null)
      setUserLocation(null)
    }
  }, [session])

  const contextValue: UserDataContextType = {
    userRole,
    userFirstName,
    userLocation,
    userDataLoaded,
    loadUserData
  }

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const context = useContext(UserDataContext)
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}