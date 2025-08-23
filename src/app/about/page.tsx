import React from 'react'
import type { Metadata } from 'next'
import { 
  Groups, 
  AccessibilityNew, 
  Handshake,
  Lightbulb,
  Home,
  School,
  VolunteerActivism
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import { FeatureCard, StatsCard } from '@/components/marketing/ui/Card'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'About - LibraryCard',
  description: 'Learn about LibraryCard\'s mission to make library management accessible to every community. Founded to bridge the gap between personal tools and expensive institutional software.',
}

function AboutHeader() {
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
            Making Library Management <Highlight>Accessible to Every Community</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-8)'
            }}
          >
            LibraryCard was founded on a simple belief: every community deserves access 
            to modern library management tools, regardless of size or budget.
          </Text>

          <Button 
            href="/contact" 
            variant="primary" 
            size="lg"
          >
            Get In Touch
          </Button>
        </div>
      </Container>
    </Section>
  )
}

function MissionSection() {
  return (
    <Section background="gray-50">
      <Container>
        <div 
          className="marketing-grid marketing-grid-cols-1 marketing-grid-lg-cols-2 marketing-gap-16"
          style={{ alignItems: 'center' }}
        >
          <div>
            <Heading level="2">
              Our Mission
            </Heading>
            <Text 
              variant="body-large" 
              style={{ marginTop: 'var(--marketing-spacing-6)' }}
            >
              We believe books should bring communities together, not create barriers. 
              Traditional library management solutions either lack community features or 
              cost thousands of dollars, leaving shared spaces without good options.
            </Text>
            <Text variant="body" style={{ marginTop: 'var(--marketing-spacing-4)' }}>
              LibraryCard bridges this gap by providing professional-grade library management 
              tools designed specifically for communities. From apartment buildings to 
              retirement communities to book clubs, we make it easy to share books 
              and build connections.
            </Text>
          </div>

          <div 
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-8)',
              borderRadius: 'var(--marketing-radius-2xl)',
              border: '1px solid var(--marketing-gray-200)',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
                borderRadius: 'var(--marketing-radius-2xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--marketing-spacing-6) auto'
              }}
            >
              <Groups style={{ fontSize: '3rem', color: 'var(--marketing-white)' }} />
            </div>
            <Heading level="4" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
              Community First
            </Heading>
            <Text variant="body" color="muted">
              Every feature we build starts with the question: 
              "How can this bring communities closer together?"
            </Text>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function ValuesSection() {
  const values = [
    {
      icon: <AccessibilityNew />,
      title: 'Accessibility',
      description: 'Library management should be simple enough for anyone to use, regardless of technical expertise or age.'
    },
    {
      icon: <Handshake />,
      title: 'Community',
      description: 'Books are meant to be shared. We design features that encourage connection and discovery between neighbors.'
    },
    {
      icon: <Lightbulb />,
      title: 'Simplicity',
      description: 'Complex problems need elegant solutions. We prioritize intuitive design over feature bloat.'
    },
    {
      icon: <VolunteerActivism />,
      title: 'Affordability',
      description: 'Good tools shouldn\'t break the budget. We believe in transparent, community-friendly pricing.'
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
            Our Values
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            The principles that guide everything we do
          </Text>
        </div>

        <Grid cols={1} mdCols={2} lgCols={4} gap={6}>
          {values.map((value, index) => (
            <FeatureCard
              key={index}
              icon={value.icon}
              title={value.title}
              description={value.description}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function StorySection() {
  return (
    <Section background="gray-50">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-12)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-12) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Our Story
          </Heading>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-gap-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div 
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-8)',
              borderRadius: 'var(--marketing-radius-xl)',
              border: '1px solid var(--marketing-gray-200)'
            }}
          >
            <Text variant="body-large" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
              LibraryCard started when we noticed a gap in the market. Personal book management 
              apps work great for individuals, but they lack the community features needed for 
              shared libraries. Professional library systems offer advanced features, but cost 
              thousands of dollars and require IT expertise to set up.
            </Text>
            
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
              Meanwhile, apartment buildings, retirement communities, and book clubs were 
              struggling with basic spreadsheets or outdated systems to manage their shared 
              book collections. There had to be a better way.
            </Text>

            <Text variant="body">
              That's when we decided to build LibraryCard: a modern, community-focused 
              library management platform that combines the simplicity of personal tools 
              with the collaborative features communities need, all at an affordable price.
            </Text>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function CommunityImpactSection() {
  const stats = [
    { number: '50+', label: 'Communities Served' },
    { number: '10,000+', label: 'Books Managed' },
    { number: '2,500+', label: 'Active Members' },
    { number: '95%', label: 'Customer Satisfaction' }
  ]

  const communityTypes = [
    {
      icon: <Home />,
      title: 'Residential Communities',
      description: 'Apartment buildings, condos, and HOAs creating shared libraries for residents.'
    },
    {
      icon: <Groups />,
      title: 'Senior Living',
      description: 'Retirement communities and assisted living facilities promoting active reading.'
    },
    {
      icon: <School />,
      title: 'Book Clubs & Networks',
      description: 'Reading groups managing collections across multiple locations.'
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
            Making an Impact
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Communities across the country are using LibraryCard to build 
            stronger connections through shared reading
          </Text>
        </div>

        {/* Stats */}
        <Grid cols={2} mdCols={4} gap={6} style={{ marginBottom: 'var(--marketing-spacing-16)' }}>
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              number={stat.number}
              label={stat.label}
            />
          ))}
        </Grid>

        {/* Community Types */}
        <Grid cols={1} mdCols={3} gap={8}>
          {communityTypes.map((community, index) => (
            <FeatureCard
              key={index}
              icon={community.icon}
              title={community.title}
              description={community.description}
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
            Join Our Community
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
            Whether you're managing books for 10 people or 1,000, we're here to help 
            your community thrive. Start building your shared library today.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Start Your Library
            </Button>
            <Button 
              href="/contact" 
              variant="outline" 
              size="lg"
              style={{
                borderColor: 'var(--marketing-white)',
                color: 'var(--marketing-white)'
              }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default function AboutPage() {
  return (
    <MarketingLayout>
      <AboutHeader />
      <MissionSection />
      <ValuesSection />
      <StorySection />
      <CommunityImpactSection />
      <CTASection />
    </MarketingLayout>
  )
}