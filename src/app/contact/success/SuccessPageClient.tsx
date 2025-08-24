'use client'

import React, { useState } from 'react'
import { 
  Support, 
  School, 
  Groups,
  Schedule,
  CheckCircle,
  VideoCall,
  Send
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

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
        Contact customer success for setup assistance.
      </Heading>
      <Text variant="body">
        Our customer success team will help you get your library up and running.
      </Text>
    </div>
  )
}

export default function SuccessPageClient() {
  return (
    <MarketingLayout>
      <SuccessHeader />
      <Section background="white">
        <Container>
          <Grid cols={1} lgCols={2} gap={8}>
            <div>
              <Text variant="body">Customer Success form coming soon.</Text>
            </div>
            <SuccessInfo />
          </Grid>
        </Container>
      </Section>
    </MarketingLayout>
  )
}