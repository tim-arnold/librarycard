import React from 'react'
import Container, { Section, Grid } from '../ui/Container'
import { PricingCard } from '../ui/Card'
import { Heading, Text, Highlight } from '../ui/Typography'
import Button from '../ui/Button'

export default function PricingSection() {
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
        { text: 'Mobile access', included: true },
        { text: 'Single location', included: true },
        { text: 'Multi-location support', included: false },
        { text: 'Advanced user roles', included: false }
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
        { text: 'Checkout/lending tracking', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Export functionality', included: true }
      ],
      ctaText: 'Start 14-Day Trial',
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
        { text: 'Advanced user roles', included: true },
        { text: 'Analytics and reporting', included: true },
        { text: 'API access', included: true },
        { text: 'Priority support', included: true },
        { text: 'Custom branding options', included: true }
      ],
      ctaText: 'Contact Sales',
      ctaHref: '/contact',
      featured: false
    }
  ]

  return (
    <Section background="white">
      <Container>
        {/* Section header */}
        <div 
          className="marketing-text-center"
          style={{ 
            marginBottom: 'var(--marketing-spacing-16)',
            maxWidth: '700px',
            margin: '0 auto var(--marketing-spacing-16) auto'
          }}
        >
          <Heading level="2" className="marketing-text-center">
            Simple, transparent pricing
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            <Highlight>63-73% savings</Highlight> compared to professional library management tools. 
            Start free and upgrade as your community grows.
          </Text>
        </div>

        {/* Pricing cards */}
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

        {/* Value proposition */}
        <div 
          className="marketing-text-center"
          style={{ 
            marginTop: 'var(--marketing-spacing-16)',
            padding: 'var(--marketing-spacing-8)',
            background: 'var(--marketing-gray-50)',
            borderRadius: 'var(--marketing-radius-xl)'
          }}
        >
          <Heading level="3" className="marketing-text-center">
            Why choose LibraryCard?
          </Heading>
          <div 
            className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-3 marketing-gap-8"
            style={{ marginTop: 'var(--marketing-spacing-6)' }}
          >
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                vs. Personal Tools
              </Text>
              <Text variant="small" color="muted">
                More features, community focus, shared access
              </Text>
            </div>
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                vs. Professional Tools
              </Text>
              <Text variant="small" color="muted">
                63-73% cost savings, easier setup, community-specific
              </Text>
            </div>
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                vs. Building Custom
              </Text>
              <Text variant="small" color="muted">
                Ready to use, proven reliability, ongoing updates
              </Text>
            </div>
          </div>
        </div>

        {/* FAQ teaser */}
        <div 
          className="marketing-text-center"
          style={{ 
            marginTop: 'var(--marketing-spacing-12)'
          }}
        >
          <Text variant="body" color="muted">
            Have questions about pricing or features?
          </Text>
          <Button 
            href="/contact" 
            variant="outline" 
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Contact Us
          </Button>
        </div>
      </Container>
    </Section>
  )
}