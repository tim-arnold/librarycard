'use client'

import React from 'react'
import { 
  Business, 
  Security, 
  Integration,
  Assessment,
  AccountBalance,
  Schedule,
  Phone
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

function EnterpriseHeader() {
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
            Enterprise <Highlight>Solutions</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Custom library management solutions for large institutions, organizations, 
            and enterprises with advanced needs.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            From white-labeling to SSO integration, we'll tailor LibraryCard 
            to fit your enterprise requirements.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function EnterpriseInfo() {
  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Contact enterprise sales for custom solutions.
      </Heading>
      <Text variant="body">
        Our enterprise team will discuss custom pricing and features.
      </Text>
    </div>
  )
}

export default function EnterprisePageClient() {
  return (
    <MarketingLayout>
      <EnterpriseHeader />
      <Section background="white">
        <Container>
          <Grid cols={1} lgCols={2} gap={12}>
            <div>
              <Text variant="body">Enterprise Sales form coming soon.</Text>
            </div>
            <EnterpriseInfo />
          </Grid>
        </Container>
      </Section>
    </MarketingLayout>
  )
}