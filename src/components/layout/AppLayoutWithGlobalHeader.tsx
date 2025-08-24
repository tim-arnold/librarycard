'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import { authenticatedFetch } from '@/lib/auth-utils'
import { Container, Box } from '@mui/material'
import Footer from './Footer'
import GlobalHeader from './GlobalHeader'
import HelpModal from '@/components/modals/HelpModal'

interface AppLayoutWithGlobalHeaderProps {
  children: React.ReactNode
}

export default function AppLayoutWithGlobalHeader({ children }: AppLayoutWithGlobalHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const dataLoadedRef = useRef(false)

  useEffect(() => {
    if (session && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      
      // Check for invitation token from Google OAuth redirect
      const invitationToken = searchParams.get('invitation')
      if (invitationToken) {
        handleInvitationAcceptance(invitationToken)
        return
      }

      // Load user data only once
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

  const loadUserData = async () => {
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

  const handleInvitationAcceptance = async (token: string) => {
    try {
      const response = await authenticatedApiCall('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          invitation_token: token,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const url = new URL(window.location.href)
        url.searchParams.delete('invitation')
        window.history.replaceState({}, '', url.toString())
        
        console.log(`Successfully joined ${data.location_name}!`)
        
        // Reload user data after successful invitation acceptance
        await loadUserData()
      } else {
        console.error('Failed to accept invitation:', data.error)
      }
    } catch (error) {
      console.error('Invitation acceptance error:', error)
    }
  }

  return (
    <div>
      <GlobalHeader 
        userRole={userRole}
        userFirstName={userFirstName}
      />
      
      <main>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </main>
      
      <Footer />
      
      <HelpModal 
        open={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
      />
    </div>
  )
}