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
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { FeatureCard, TestimonialCard } from '@/components/marketing/ui/Card'
import { Heading, Text, Highlight, List, ListItem } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'Features - LibraryCard',
  description: 'Community library management features built for shared spaces. ISBN scanning, multi-user access, location tracking, and more. Perfect for apartments, retirement communities, and book clubs.',
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
            Built for <Highlight>Community Libraries</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-8)'
            }}
          >
            Everything you need to manage shared book collections. 
            From ISBN scanning to community management, we've got you covered.
          </Text>

          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="primary" 
              size="lg"
            >
              Try All Features Free
            </Button>
            <Button 
              href="/pricing" 
              variant="secondary" 
              size="lg"
            >
              View Pricing
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
      title: 'Smart ISBN Scanning',
      description: 'Google Books API integration with 97%+ success rate. Automatically download book details, covers, and metadata. Fallback to OpenLibrary for comprehensive coverage.'
    },
    {
      icon: <LocationOn />,
      title: 'Advanced Location Tracking',
      description: 'Know exactly where books are located. Multi-building support for campus libraries and large communities. Track books by room, floor, building, or custom locations.'
    },
    {
      icon: <Security />,
      title: 'Enterprise Security',
      description: '2FA authentication, WebAuthn support, and enterprise-grade security. Your community data stays protected with encryption at rest and in transit.'
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
            Everything you need for community library management, included in every plan
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

function AdvancedFeatures() {
  const features = [
    {
      icon: <Email />,
      title: 'Email Notifications',
      description: 'Automated notifications for due dates, new books, and community updates. Customizable frequency and content.',
      tier: 'Community+'
    },
    {
      icon: <Analytics />,
      title: 'Usage Analytics',
      description: 'Detailed insights into library usage, popular books, and member activity. Export reports for community meetings.',
      tier: 'Community+'
    },
    {
      icon: <Palette />,
      title: 'Custom Branding',
      description: 'Add your community logo, customize colors, and white-label the platform. Perfect for HOAs and organizations.',
      tier: 'Organization'
    },
    {
      icon: <Api />,
      title: 'API Access',
      description: 'RESTful API for custom integrations. Connect to existing community management systems or build custom tools.',
      tier: 'Organization'
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
            Advanced Features
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Premium features for growing communities and organizations
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

function TestimonialsSection() {
  const testimonials = [
    {
      content: "LibraryCard transformed our retirement community. Residents love how easy it is to find and check out books. The location tracking means no more lost books!",
      author: {
        name: "Sarah Johnson",
        title: "Activities Director, Sunrise Manor",
        initials: "SJ"
      }
    },
    {
      content: "Perfect for our apartment building. The invitation system made it easy to onboard new residents, and the mobile app means people can browse books anytime.",
      author: {
        name: "Michael Chen",
        title: "HOA Board Member, Harbor View Condos",
        initials: "MC"
      }
    },
    {
      content: "Our book club network spans 5 locations. LibraryCard's multi-location support and shared recommendations have brought our community closer together.",
      author: {
        name: "Lisa Rodriguez",
        title: "Coordinator, Metro Book Club Network",
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
            What Communities Are Saying
          </Heading>
        </div>

        <Grid cols={1} mdCols={3} gap={8}>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              content={testimonial.content}
              author={testimonial.author}
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
            Start your free community library today. No credit card required, 
            full access to all features.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Start Free Trial
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
              View Pricing Plans
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
      <AdvancedFeatures />
      <UseCaseDetails />
      <TestimonialsSection />
      <CTASection />
    </MarketingLayout>
  )
}