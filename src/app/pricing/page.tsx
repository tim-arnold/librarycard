import React from 'react'
import type { Metadata } from 'next'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { PricingCard } from '@/components/marketing/ui/Card'
import { Heading, Text, Highlight, List, ListItem } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'Join Beta - LibraryCard',
  description: 'Join the LibraryCard beta program and help us build the perfect community library management tool. Free access during development.',
}

function BetaHeader() {
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
            Join the Beta Program
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            <Highlight>Free beta access</Highlight> to LibraryCard while we build the perfect community library tool together. 
            Your feedback shapes what we build next.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            No costs during development. No commitments. Just help us build something great.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function BetaAccess() {
  return (
    <Section background="gray-50">
      <Container>
        <div className="marketing-flex marketing-justify-center">
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <PricingCard
              title="Beta Program"
              subtitle="Free access during development"
              price={{
                amount: 'Free',
                period: 'during beta',
                currency: ''
              }}
              features={[
                { text: 'Full access to all beta features', included: true },
                { text: 'Unlimited books and users', included: true },
                { text: 'ISBN scanning and automatic book details', included: true },
                { text: 'Multi-location support', included: true },
                { text: 'User permission management', included: true },
                { text: 'Checkout and lending tracking', included: true },
                { text: 'Mobile access (iOS & Android)', included: true },
                { text: 'Export functionality', included: true },
                { text: 'Direct feedback channel to developers', included: true },
                { text: 'Help shape future features', included: true },
                { text: 'Early access to new capabilities', included: true },
                { text: 'Community support and discussions', included: true }
              ]}
              ctaText="Join Beta Program"
              ctaHref="/auth/signin?register=true"
              featured={true}
            />
          </div>
        </div>
      </Container>
    </Section>
  )
}

function BetaFeaturesSection() {
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
            What's Included in Beta
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Full access to all current features while we continue development
          </Text>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-lg-cols-3 marketing-gap-8">
          <div 
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-6)',
              borderRadius: 'var(--marketing-radius-lg)',
              border: '1px solid var(--marketing-gray-200)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--marketing-spacing-4)' }}>
              <Heading level="4" style={{ color: 'var(--marketing-primary)' }}>
                Core Features
              </Heading>
              <Text variant="small" color="muted">
                Essential library management
              </Text>
            </div>
            <List variant="check">
              <ListItem>ISBN scanning & book details</ListItem>
              <ListItem>Multi-user access & permissions</ListItem>
              <ListItem>Location & shelf tracking</ListItem>
              <ListItem>Checkout & lending system</ListItem>
              <ListItem>Mobile-responsive interface</ListItem>
            </List>
          </div>

          <div 
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-6)',
              borderRadius: 'var(--marketing-radius-lg)',
              border: '1px solid var(--marketing-gray-200)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--marketing-spacing-4)' }}>
              <Heading level="4" style={{ color: 'var(--marketing-primary)' }}>
                Community Features  
              </Heading>
              <Text variant="small" color="muted">
                Built for sharing
              </Text>
            </div>
            <List variant="check">
              <ListItem>Invitation system for members</ListItem>
              <ListItem>Multiple locations support</ListItem>
              <ListItem>User role management</ListItem>
              <ListItem>Community book collections</ListItem>
              <ListItem>Export & backup options</ListItem>
            </List>
          </div>

          <div 
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-6)',
              borderRadius: 'var(--marketing-radius-lg)',
              border: '1px solid var(--marketing-gray-200)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--marketing-spacing-4)' }}>
              <Heading level="4" style={{ color: 'var(--marketing-primary)' }}>
                Beta Perks
              </Heading>
              <Text variant="small" color="muted">
                Shape the future
              </Text>
            </div>
            <List variant="check">
              <ListItem>Direct feedback to developers</ListItem>
              <ListItem>Influence feature development</ListItem>
              <ListItem>Early access to new features</ListItem>
              <ListItem>Beta community discussions</ListItem>
              <ListItem>No cost during development</ListItem>
            </List>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function FAQSection() {
  const faqs = [
    {
      question: "What does beta access include?",
      answer: "Full access to all current LibraryCard features including ISBN scanning, multi-user access, location tracking, checkout system, and more. No limits during the beta period."
    },
    {
      question: "How long will the beta program last?",
      answer: "We're actively developing based on user feedback. Beta participants will get advance notice before any transition to paid plans, and existing beta users will receive special pricing."
    },
    {
      question: "Will my beta data be preserved?",
      answer: "Absolutely! All your books, locations, and user data will be preserved as we move from beta to full release. You own your data and can export it anytime."
    },
    {
      question: "How can I provide feedback?",
      answer: "We have built-in feedback tools and direct communication channels with our development team. Your input directly influences what features we build next."
    },
    {
      question: "Is there any cost during beta?",
      answer: "No costs whatsoever during the beta program. We're focused on building the best product with community input, not generating revenue during development."
    },
    {
      question: "Can I invite others to join my library?",
      answer: "Yes! The invitation system is fully functional. Invite family members, neighbors, or community members to join your shared library space during beta."
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
            Frequently Asked Questions
          </Heading>
        </div>

        <div 
          className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-8"
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          {faqs.map((faq, index) => (
            <div 
              key={index}
              style={{
                background: 'var(--marketing-white)',
                padding: 'var(--marketing-spacing-6)',
                borderRadius: 'var(--marketing-radius-lg)',
                border: '1px solid var(--marketing-gray-200)'
              }}
            >
              <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
                {faq.question}
              </Heading>
              <Text variant="body" color="muted">
                {faq.answer}
              </Text>
            </div>
          ))}
        </div>

        <div 
          className="marketing-text-center"
          style={{ marginTop: 'var(--marketing-spacing-12)' }}
        >
          <Text variant="body" color="muted" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
            Have more questions?
          </Text>
          <Button href="/contact" variant="outline">
            Contact Our Team
          </Button>
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
            Ready to Get Started?
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
            Join the beta program and help build the perfect community library tool. 
            Start your free beta account today.
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
              href="/features" 
              variant="outline" 
              size="lg"
              style={{
                borderColor: 'var(--marketing-white)',
                color: 'var(--marketing-white)'
              }}
            >
              See Beta Features
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default function PricingPage() {
  return (
    <MarketingLayout>
      <BetaHeader />
      <BetaAccess />
      <BetaFeaturesSection />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}