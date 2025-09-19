import React from 'react'
import type { Metadata } from 'next'
import {
  Groups,
  Smartphone,
  QrCodeScanner,
  LocationOn,
  Security,
  Cloud,
  Email,
  Analytics,
  Palette,
  Api,
  School,
  Home
} from '@/components/marketing/ui/Icons'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { FeatureCard, TestimonialCard } from '@/components/marketing/ui/Card'
import { Heading, Text, Highlight, List, ListItem } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'Beta Features - LibraryCard',
  description: 'Explore LibraryCard beta features for community library management. ISBN scanning, multi-user access, location tracking, and more. Join our beta program today.',
}

function FeaturesHeader() {
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
            <Highlight>Beta Features</Highlight> for Community Libraries
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-8)'
            }}
          >
            Explore what's currently available in our beta program. 
            Help us build the perfect community library management tool.
          </Text>

          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="primary" 
              size="lg"
            >
              Join Beta Program
            </Button>
            <Button 
              href="/pricing" 
              variant="secondary" 
              size="lg"
            >
              Learn About Beta
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function CoreFeatures() {
  const features = [
    {
      icon: <Groups />,
      title: 'Community Management',
      description: 'Invitation-based access with smart permission management. Perfect for apartments, retirement communities, and book clubs. Admin and member roles with appropriate access levels.'
    },
    {
      icon: <Smartphone />,
      title: 'Mobile-First Design',
      description: 'Native iOS and Android apps with seamless cloud sync. Scan books anywhere, access from any device. Optimized for both tech-savvy and less technical users.'
    },
    {
      icon: <QrCodeScanner />,
      title: 'ISBN Scanning',
      description: 'Google Books API integration for automatic book details. Scan ISBNs to quickly add books with covers and metadata. OpenLibrary fallback for additional coverage.'
    },
    {
      icon: <LocationOn />,
      title: 'Advanced Location Tracking',
      description: 'Know exactly where books are located. Multi-building support for campus libraries and large communities. Track books by room, floor, building, or custom locations.'
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: 'Your community data stays protected with secure authentication and privacy controls. Currently implementing advanced security features based on beta feedback.'
    },
    {
      icon: <Cloud />,
      title: 'Real-time Synchronization',
      description: 'Cloud synchronization across all devices. Never lose track of your books. Members can access the library from anywhere with automatic updates.'
    }
  ]

  return (
    <Section background="gray-50">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-16)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-16) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Core Features
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Core features available now in our beta program
          </Text>
        </div>

        <Grid cols={1} mdCols={2} lgCols={3} gap={8}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function PlannedFeatures() {
  const features = [
    {
      icon: <Email />,
      title: 'Email Notifications',
      description: 'Automated notifications for due dates, new books, and community updates. Currently under development based on beta feedback.',
      tier: 'Coming Soon'
    },
    {
      icon: <Analytics />,
      title: 'Usage Analytics',
      description: 'Detailed insights into library usage, popular books, and member activity. Planning this feature with community input.',
      tier: 'Planned'
    },
    {
      icon: <Palette />,
      title: 'Customization Options',
      description: 'Community branding and appearance customization. Developing this based on beta user requests and feedback.',
      tier: 'Exploring'
    },
    {
      icon: <Api />,
      title: 'Advanced Integrations',
      description: 'API access and integration capabilities. Will be developed based on beta community needs and use cases.',
      tier: 'Future'
    }
  ]

  return (
    <Section background="white">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-16)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-16) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Planned Features
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Features we're developing with beta community input
          </Text>
        </div>

        <Grid cols={1} mdCols={2} gap={8}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'var(--marketing-white)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-lg)',
                padding: 'var(--marketing-spacing-6)',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: 'var(--marketing-spacing-4)',
                  right: 'var(--marketing-spacing-4)',
                  background: 'var(--marketing-primary)',
                  color: 'var(--marketing-white)',
                  fontSize: 'var(--marketing-text-xs)',
                  padding: 'var(--marketing-spacing-1) var(--marketing-spacing-2)',
                  borderRadius: 'var(--marketing-radius-base)',
                  fontWeight: 'var(--marketing-font-medium)'
                }}
              >
                {feature.tier}
              </div>
              
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
                  marginBottom: 'var(--marketing-spacing-4)'
                }}
              >
                {feature.icon}
              </div>
              
              <Heading level="4" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
                {feature.title}
              </Heading>
              <Text variant="body" color="muted">
                {feature.description}
              </Text>
            </div>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function UseCaseDetails() {
  const useCases = [
    {
      icon: <Home />,
      title: 'Apartment & Condo Buildings',
      description: 'Perfect for residential communities wanting to share books among neighbors.',
      features: [
        'Floor-by-floor location tracking',
        'Invitation system for new residents',
        'Usage analytics for HOA meetings',
        'Simple checkout process via mobile app'
      ],
      example: {
        size: '200-unit building',
        books: '500+ books',
        users: '80+ active readers'
      }
    },
    {
      icon: <Groups />,
      title: 'Retirement Communities',
      description: 'Designed with accessibility in mind for senior living communities.',
      features: [
        'Large print interface options',
        'Simple, intuitive navigation',
        'Email notifications for due dates',
        'Multiple common area locations'
      ],
      example: {
        size: '150 residents',
        books: '1,200+ books',
        users: 'Multiple common areas'
      }
    },
    {
      icon: <School />,
      title: 'Book Clubs & Networks',
      description: 'Manage multiple locations and curated reading lists for book club networks.',
      features: [
        'Multi-location support',
        'Shared recommendations system',
        'Discussion tracking (coming soon)',
        'Curated reading lists'
      ],
      example: {
        size: '5 locations',
        books: '250+ members',
        users: 'Curated reading lists'
      }
    }
  ]

  return (
    <Section background="gray-50">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-16)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-16) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Built for Your Community Type
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            See how communities like yours are creating thriving shared libraries
          </Text>
        </div>

        <Grid cols={1} gap={8}>
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className={`marketing-grid marketing-grid-cols-1 marketing-grid-lg-cols-2 marketing-gap-8`}
              style={{ alignItems: 'center' }}
            >
              <div style={{ order: index % 2 === 1 ? 2 : 1 }}>
                <div className="marketing-flex marketing-items-center marketing-gap-4" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
                      borderRadius: 'var(--marketing-radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--marketing-white)'
                    }}
                  >
                    {useCase.icon}
                  </div>
                  <Heading level="3">{useCase.title}</Heading>
                </div>
                
                <Text 
                  variant="body-large" 
                  style={{ marginBottom: 'var(--marketing-spacing-6)' }}
                >
                  {useCase.description}
                </Text>

                <List variant="check">
                  {useCase.features.map((feature, fIndex) => (
                    <ListItem key={fIndex}>{feature}</ListItem>
                  ))}
                </List>
              </div>

              <div 
                style={{ 
                  order: index % 2 === 1 ? 1 : 2,
                  background: 'var(--marketing-white)',
                  padding: 'var(--marketing-spacing-8)',
                  borderRadius: 'var(--marketing-radius-xl)',
                  border: '1px solid var(--marketing-gray-200)',
                  textAlign: 'center'
                }}
              >
                <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
                  Real Community Example
                </Heading>
                <div className="marketing-grid marketing-grid-cols-1 marketing-gap-4">
                  <div>
                    <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                      {useCase.example.size}
                    </Text>
                  </div>
                  <div>
                    <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                      {useCase.example.books}
                    </Text>
                  </div>
                  <div>
                    <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                      {useCase.example.users}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function BetaFeedbackSection() {
  const feedbackItems = [
    {
      content: "The beta is really promising! The ISBN scanning works great and the interface is intuitive. Looking forward to seeing email notifications added.",
      author: {
        name: "Sarah J.",
        title: "Beta Tester",
        initials: "SJ"
      }
    },
    {
      content: "Perfect for our small community. The invitation system makes it easy to add new members. Would love to see usage analytics in the future.",
      author: {
        name: "Mike C.",
        title: "Beta Community Admin",
        initials: "MC"
      }
    },
    {
      content: "Great potential! The multi-location support works well for our book club. Excited to help shape what features come next.",
      author: {
        name: "Lisa R.",
        title: "Beta Program Participant",
        initials: "LR"
      }
    }
  ]

  return (
    <Section background="white">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-16)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-16) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Beta Program Feedback
          </Heading>
        </div>

        <Grid cols={1} mdCols={3} gap={8}>
          {feedbackItems.map((item, index) => (
            <TestimonialCard
              key={index}
              content={item.content}
              author={item.author}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function CTASection() {
  return (
    <Section background="gray-50">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            maxWidth: '600px',
            margin: '0 auto',
            padding: 'var(--marketing-spacing-12)',
            background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
            borderRadius: 'var(--marketing-radius-2xl)',
            color: 'var(--marketing-white)'
          }}
        >
          <Heading level="2" style={{ color: 'var(--marketing-white)' }}>
            Ready to Try These Features?
          </Heading>
          <Text 
            variant="lead" 
            style={{ 
              marginTop: 'var(--marketing-spacing-4)',
              marginBottom: 'var(--marketing-spacing-8)',
              color: 'var(--marketing-white)',
              opacity: 0.9
            }}
          >
            Join our beta program today. No credit card required, 
            full access to help shape the future of community libraries.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Join Beta Program
            </Button>
            <Button 
              href="/pricing" 
              variant="outline" 
              size="lg"
              style={{
                borderColor: 'var(--marketing-white)',
                color: 'var(--marketing-white)'
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <FeaturesHeader />
      <CoreFeatures />
      <PlannedFeatures />
      <UseCaseDetails />
      <BetaFeedbackSection />
      <CTASection />
    </MarketingLayout>
  )
}