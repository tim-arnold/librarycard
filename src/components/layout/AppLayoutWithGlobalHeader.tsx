'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { authenticatedApiCall } from '@/lib/api'
import { authenticatedFetch } from '@/lib/auth-utils'
import { useUserData } from '@/contexts/UserDataContext'
import { Container, Box } from '@mui/material'
import Footer from './Footer'
import GlobalHeader from './GlobalHeader'
import HelpModal from '@/components/modals/HelpModal'
import TourProvider from '@/components/tour/TourProvider'
import TourOverlay from '@/components/tour/TourOverlay'

interface AppLayoutWithGlobalHeaderProps {
  children: React.ReactNode
}

export default function AppLayoutWithGlobalHeader({ children }: AppLayoutWithGlobalHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userRole, userFirstName, userLocation, userDataLoaded, loadUserData } = useUserData()
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
    }
  }, [session])

  // Reset data loaded flag when session changes
  useEffect(() => {
    if (!session) {
      dataLoadedRef.current = false
    }
  }, [session])

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
    <TourProvider>
      <div>
        <GlobalHeader 
          userRole={userRole}
          userFirstName={userFirstName}
        />
        
        <main data-tour="main-content">
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
      
      <TourOverlay />
    </TourProvider>
  )
}