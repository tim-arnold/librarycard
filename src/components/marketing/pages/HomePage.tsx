import React from 'react'
import MarketingLayout from '../layout/MarketingLayout'
import HeroSection from '../sections/HeroSection'
import FeatureGrid from '../sections/FeatureGrid'
import PricingSection from '../sections/PricingSection'
import Container, { Section } from '../ui/Container'
import { Heading, Text, Highlight } from '../ui/Typography'
import Button from '../ui/Button'

function BetaProgramSection() {
  return (
    <Section background="white">
      <Container>
        <Heading level="2" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          About LibraryCard
        </Heading>
        <div
          className="marketing-grid marketing-grid-cols-1 marketing-grid-lg-cols-2 marketing-gap-16"
          style={{ alignItems: 'center' }}
        >
          {/* What we're building */}
          <div>
            <Heading level="3">
              What We're Building Together
            </Heading>
            <div style={{ marginTop: 'var(--marketing-spacing-6)' }}>
              <Text variant="body-large">
                LibraryCard is a community library management tool designed for shared spaces and small communities.
              </Text>
              <ul 
                style={{ 
                  marginTop: 'var(--marketing-spacing-4)',
                  paddingLeft: 'var(--marketing-spacing-6)' 
                }}
              >
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">ISBN scanning and automatic book details</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Multi-user access and permissions</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Location tracking and checkout system</Text>
                </li>
              </ul>
            </div>
          </div>

          {/* Beta program */}
          <div>
            <Heading level="3">
              Join Our <Highlight>Beta Program</Highlight>
            </Heading>
            <div style={{ marginTop: 'var(--marketing-spacing-6)' }}>
              <Text variant="body-large">
                We're actively developing LibraryCard with community input. 
                <strong>Your feedback shapes what we build next.</strong>
              </Text>
              <ul 
                style={{ 
                  marginTop: 'var(--marketing-spacing-4)',
                  paddingLeft: 'var(--marketing-spacing-6)' 
                }}
              >
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Free beta access</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Direct input on new features</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Help shape the product roadmap</Text>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function UseCasesSection() {
  const useCases = [
    {
      title: 'Apartment Buildings',
      description: 'Perfect for residents who want to share books across units. Simple invitation system and floor-based location tracking.',
      example: 'Great for residential communities'
    },
    {
      title: 'Retirement Communities',
      description: 'Designed with accessibility in mind. Clean interface and easy checkout process for all users.',
      example: 'Multiple common area support'
    },
    {
      title: 'Book Clubs & Networks',
      description: 'Ideal for book clubs that meet in multiple locations or have shared collections.',
      example: 'Multi-location book sharing'
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
            Built for Community Sharing
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            LibraryCard works well for different types of shared spaces and communities.
          </Text>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-3 marketing-gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              style={{
                background: 'var(--marketing-white)',
                padding: 'var(--marketing-spacing-6)',
                borderRadius: 'var(--marketing-radius-lg)',
                border: '1px solid var(--marketing-gray-200)'
              }}
            >
              <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
                {useCase.title}
              </Heading>
              <Text 
                variant="body" 
                style={{ marginBottom: 'var(--marketing-spacing-4)' }}
              >
                {useCase.description}
              </Text>
              <Text 
                variant="small" 
                color="muted"
                style={{ 
                  fontStyle: 'italic',
                  padding: 'var(--marketing-spacing-3)',
                  background: 'var(--marketing-gray-50)',
                  borderRadius: 'var(--marketing-radius-base)',
                  display: 'block'
                }}
              >
                {useCase.example}
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function CTASection() {
  return (
    <Section background="white">
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
            Ready to Join the Beta?
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
            Help us build the best community library management tool. 
            Join our beta program and get started today.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button
              href="/auth/signin?register=true"
              variant="secondary"
              size="lg"
            >
              Join Beta Now
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
              Send Feedback
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <BetaProgramSection />
      <FeatureGrid />
      <UseCasesSection />
      <PricingSection />
      <CTASection />
    </MarketingLayout>
  )
}