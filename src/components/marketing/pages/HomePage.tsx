import React from 'react'
import MarketingLayout from '../layout/MarketingLayout'
import HeroSection from '../sections/HeroSection'
import FeatureGrid from '../sections/FeatureGrid'
import PricingSection from '../sections/PricingSection'
import Container, { Section } from '../ui/Container'
import { Heading, Text, Highlight } from '../ui/Typography'
import Button from '../ui/Button'

function ProblemSolutionSection() {
  return (
    <Section background="white">
      <Container>
        <div 
          className="marketing-grid marketing-grid-cols-1 marketing-grid-lg-cols-2 marketing-gap-16"
          style={{ alignItems: 'center' }}
        >
          {/* Problem */}
          <div>
            <Heading level="2">
              The Problem with Current Solutions
            </Heading>
            <div style={{ marginTop: 'var(--marketing-spacing-6)' }}>
              <Text variant="body-large">
                Most library tools target <strong>individuals OR</strong> cost thousands for institutions.
              </Text>
              <ul 
                style={{ 
                  marginTop: 'var(--marketing-spacing-4)',
                  paddingLeft: 'var(--marketing-spacing-6)' 
                }}
              >
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Personal tools lack community features</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Professional tools cost $360-720+ annually</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Complex setup requires IT expertise</Text>
                </li>
              </ul>
            </div>
          </div>

          {/* Solution */}
          <div>
            <Heading level="2">
              Our <Highlight>Community-First</Highlight> Solution
            </Heading>
            <div style={{ marginTop: 'var(--marketing-spacing-6)' }}>
              <Text variant="body-large">
                LibraryCard serves the gap: <strong>communities that need more than personal tools 
                but can't afford institutional software.</strong>
              </Text>
              <ul 
                style={{ 
                  marginTop: 'var(--marketing-spacing-4)',
                  paddingLeft: 'var(--marketing-spacing-6)' 
                }}
              >
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">Perfect for 6-150 users</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">63-73% cost savings vs. alternatives</Text>
                </li>
                <li style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  <Text variant="body">5-minute setup, no IT required</Text>
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
      description: 'Residents share books across units. Easy invitation system, location tracking per floor.',
      example: '200-unit building, 500+ books, 80+ active readers'
    },
    {
      title: 'Retirement Communities',
      description: 'Simple interface for less tech-savvy residents. Large print options, easy checkout process.',
      example: '150 residents, 1,200+ books, multiple common areas'
    },
    {
      title: 'Book Clubs & Networks',
      description: 'Multiple locations, shared recommendations, discussion tracking.',
      example: '5 locations, 250+ members, curated reading lists'
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
            Built for Real Communities
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            See how communities like yours are using LibraryCard to create 
            thriving shared library spaces.
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
              <Heading level="4" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
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
            Ready to Build Your Community Library?
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
            Join communities across the country who are making books more accessible. 
            Start your free library today.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Start Free Now
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
              Contact Sales
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
      <ProblemSolutionSection />
      <FeatureGrid />
      <UseCasesSection />
      <PricingSection />
      <CTASection />
    </MarketingLayout>
  )
}