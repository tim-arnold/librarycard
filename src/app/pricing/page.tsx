import React from 'react'
import type { Metadata } from 'next'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { PricingCard } from '@/components/marketing/ui/Card'
import { Heading, Text, Highlight, List, ListItem } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'

export const metadata: Metadata = {
  title: 'Pricing - LibraryCard',
  description: 'Simple, transparent pricing for community library management. 63-73% savings vs. professional alternatives. Start free and upgrade as your community grows.',
}

function PricingHeader() {
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
            Simple, Transparent Pricing
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            <Highlight>63-73% savings</Highlight> compared to professional library management tools. 
            Start free and upgrade as your community grows.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            No hidden fees. No per-user charges. Cancel anytime.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function PricingTiers() {
  const pricingTiers = [
    {
      title: 'Personal',
      subtitle: 'Perfect for families',
      price: {
        amount: 'Free',
        period: '',
        currency: ''
      },
      features: [
        { text: '1-5 users', included: true },
        { text: 'Up to 1,000 books', included: true },
        { text: 'Basic library management', included: true },
        { text: 'ISBN scanning', included: true },
        { text: 'Mobile access (iOS & Android)', included: true },
        { text: 'Basic location tracking', included: true },
        { text: 'Export functionality', included: true },
        { text: 'Community email support', included: true },
        { text: 'Multi-location support', included: false },
        { text: 'User permission management', included: false },
        { text: 'Advanced checkout tracking', included: false },
        { text: 'Email notifications', included: false }
      ],
      ctaText: 'Start Free',
      ctaHref: '/auth/signin',
      featured: false
    },
    {
      title: 'Community',
      subtitle: 'Most popular for shared spaces',
      price: {
        amount: '29',
        period: 'month',
        currency: '$'
      },
      features: [
        { text: '6-50 users', included: true },
        { text: 'Unlimited books', included: true },
        { text: 'All Personal features', included: true },
        { text: 'Multi-location support', included: true },
        { text: 'User permission management', included: true },
        { text: 'Advanced checkout/lending tracking', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Invitation system', included: true },
        { text: 'Usage analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Custom branding options', included: false },
        { text: 'API access', included: false }
      ],
      ctaText: 'Start 14-Day Free Trial',
      ctaHref: '/auth/signin?plan=community',
      featured: true
    },
    {
      title: 'Organization',
      subtitle: 'For larger communities',
      price: {
        amount: '79',
        period: 'month',
        currency: '$'
      },
      features: [
        { text: '51-150 users', included: true },
        { text: 'Unlimited books', included: true },
        { text: 'All Community features', included: true },
        { text: 'Advanced user roles & permissions', included: true },
        { text: 'Detailed analytics & reporting', included: true },
        { text: 'API access for integrations', included: true },
        { text: 'Custom branding & white-labeling', included: true },
        { text: 'SSO integration (SAML)', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Phone & priority support', included: true },
        { text: '99.9% SLA guarantee', included: true },
        { text: 'Custom training sessions', included: true }
      ],
      ctaText: 'Contact Sales',
      ctaHref: '/contact',
      featured: false
    }
  ]

  return (
    <Section background="gray-50">
      <Container>
        <Grid cols={1} mdCols={3} gap={8}>
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={index}
              title={tier.title}
              subtitle={tier.subtitle}
              price={tier.price}
              features={tier.features}
              ctaText={tier.ctaText}
              ctaHref={tier.ctaHref}
              featured={tier.featured}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function ComparisonSection() {
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
            How LibraryCard Compares
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            See why communities choose LibraryCard over alternatives
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
              <Heading level="4" style={{ color: 'var(--marketing-success)' }}>
                vs. Personal Tools
              </Heading>
              <Text variant="small" color="muted">
                BookBuddy, CLZ Books, etc.
              </Text>
            </div>
            <List variant="check">
              <ListItem>Community features included</ListItem>
              <ListItem>Multi-user access & permissions</ListItem>
              <ListItem>Invitation system</ListItem>
              <ListItem>Cross-platform compatibility</ListItem>
              <ListItem>Professional support</ListItem>
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
              <Heading level="4" style={{ color: 'var(--marketing-success)' }}>
                vs. Professional Tools
              </Heading>
              <Text variant="small" color="muted">
                WikiLibrary, Koha, etc.
              </Text>
            </div>
            <List variant="check">
              <ListItem>63-73% cost savings</ListItem>
              <ListItem>5-minute setup (no IT required)</ListItem>
              <ListItem>Community-focused features</ListItem>
              <ListItem>Modern, intuitive interface</ListItem>
              <ListItem>Cloud-based reliability</ListItem>
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
              <Heading level="4" style={{ color: 'var(--marketing-success)' }}>
                vs. Building Custom
              </Heading>
              <Text variant="small" color="muted">
                Internal development
              </Text>
            </div>
            <List variant="check">
              <ListItem>Ready to use immediately</ListItem>
              <ListItem>Proven reliability & security</ListItem>
              <ListItem>Ongoing updates & improvements</ListItem>
              <ListItem>No development or maintenance costs</ListItem>
              <ListItem>Professional support included</ListItem>
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
      question: "How does community access work?",
      answer: "Admins can invite members via email. Each member gets their own account with appropriate permissions to browse, check out, and return books. Admins can manage locations, add books, and oversee the library."
    },
    {
      question: "Can we customize the platform for our brand?",
      answer: "Yes! Organization tier includes custom branding and white-labeling options. You can add your logo, customize colors, and even use a custom domain name."
    },
    {
      question: "What happens if we need to upgrade or downgrade?",
      answer: "You can change plans anytime. Upgrades take effect immediately. Downgrades take effect at your next billing cycle. Your data is always preserved."
    },
    {
      question: "Do you offer discounts for nonprofits?",
      answer: "Yes! We offer 20% discounts for registered nonprofits, educational institutions, and community organizations. Contact us for details."
    },
    {
      question: "Is there a setup fee or contract required?",
      answer: "No setup fees, no contracts. Pay monthly or save with annual billing. Cancel anytime with 30 days notice. Your data export is always available."
    },
    {
      question: "How does the 14-day trial work?",
      answer: "Full access to all Community features for 14 days. No credit card required to start. You can invite members and add books during the trial. Convert to paid plan anytime."
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
            Join hundreds of communities managing their libraries with LibraryCard. 
            Start your free account today.
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
              href="/features" 
              variant="outline" 
              size="lg"
              style={{
                borderColor: 'var(--marketing-white)',
                color: 'var(--marketing-white)'
              }}
            >
              See All Features
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
      <PricingHeader />
      <PricingTiers />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}