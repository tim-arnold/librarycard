import React from 'react'
import MarketingHeader from './MarketingHeader'
import MarketingFooter from './MarketingFooter'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="marketing-page">
      <div className="marketing-content">
        <MarketingHeader />
        <main>
          {children}
        </main>
        <MarketingFooter />
      </div>
    </div>
  )
}