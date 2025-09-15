'use client'

import React from 'react'
import { useUserData } from '@/contexts/UserDataContext'
import GlobalHeader from '@/components/layout/GlobalHeader'
import MarketingFooter from './MarketingFooter'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const { userRole, userFirstName } = useUserData()

  return (
    <div>
      <GlobalHeader
        userRole={userRole}
        userFirstName={userFirstName}
      />
      <div className="marketing-page">
        <div className="marketing-content">
          <main>
            {children}
          </main>
          <MarketingFooter />
        </div>
      </div>
    </div>
  )
}