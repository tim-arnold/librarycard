import React from 'react'
import type { Metadata } from 'next'
import SuccessPageClient from './SuccessPageClient'
import { 
  Support, 
  Schedule,
  VideoCall
} from '@mui/icons-material'
import Container, { Section } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'Customer Success - LibraryCard',
  description: 'Get help setting up your community library and onboarding users. Our customer success team will guide you through every step.',
}

function SuccessHeader() {
  return (
    <Section background="white" size="lg">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <Heading level="display" className="marketing-text-center">
            Customer <Highlight>Success</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Let our onboarding specialists help you set up your community library 
            and get your users engaged from day one.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            From initial setup to user training, we'll make sure your library launch 
            is smooth and successful.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function SuccessInfo() {
  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        How We Help You Succeed
      </Heading>

      <div className="marketing-flex marketing-flex-col marketing-gap-6">
        <div className="marketing-flex marketing-items-start marketing-gap-4">
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
              borderRadius: 'var(--marketing-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--marketing-white)',
              flexShrink: 0
            }}
          >
            <Schedule />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Personalized Onboarding Plan
            </Heading>
            <Text variant="body">
              We create a customized setup plan based on your community size, timeline, 
              and specific needs. No cookie-cutter approach.
            </Text>
          </div>
        </div>

        <div className="marketing-flex marketing-items-start marketing-gap-4">
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
              borderRadius: 'var(--marketing-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--marketing-white)',
              flexShrink: 0
            }}
          >
            <VideoCall />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              One-on-One Training Sessions
            </Heading>
            <Text variant="body">
              Live training sessions with your team to ensure everyone knows how to 
              use the system effectively. We adapt to your schedule.
            </Text>
          </div>
        </div>

        <div className="marketing-flex marketing-items-start marketing-gap-4">
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
              borderRadius: 'var(--marketing-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--marketing-white)',
              flexShrink: 0
            }}
          >
            <Support />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Ongoing Support & Optimization
            </Heading>
            <Text variant="body">
              We don't disappear after setup. Get ongoing support to optimize your 
              library operations and increase user engagement.
            </Text>
          </div>
        </div>
      </div>

      <div 
        style={{
          marginTop: 'var(--marketing-spacing-8)',
          padding: 'var(--marketing-spacing-6)',
          background: 'var(--marketing-gray-50)',
          borderRadius: 'var(--marketing-radius-xl)',
          border: '1px solid var(--marketing-gray-200)',
          textAlign: 'center'
        }}
      >
        <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
          Success Guarantee
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          We don't consider our job done until your community is actively using and 
          loving their new library system. That's our promise to you.
        </Text>
        <Button href="/pricing" variant="outline" size="sm">
          View Pricing & Plans
        </Button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <SuccessPageClient />
}