import React from 'react'
import GlobalHeader from '@/components/layout/GlobalHeader'
import MarketingFooter from './MarketingFooter'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="marketing-page">
      <div className="marketing-content">
        <GlobalHeader />
        <main>
          {children}
        </main>
        <MarketingFooter />
      </div>
    </div>
  )
}