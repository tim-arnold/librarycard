import React from 'react'
import Container, { Section, Grid } from '../ui/Container'
import { PricingCard } from '../ui/Card'
import { Heading, Text, Highlight } from '../ui/Typography'
import Button from '../ui/Button'

export default function PricingSection() {
  const pricingTiers = [
    {
      title: 'Beta Access',
      subtitle: 'Free during development',
      price: {
        amount: 'Free',
        period: 'during beta',
        currency: ''
      },
      features: [
        { text: 'Full access to all beta features', included: true },
        { text: 'Unlimited books and users', included: true },
        { text: 'ISBN scanning and book details', included: true },
        { text: 'Multi-location support', included: true },
        { text: 'User permission management', included: true },
        { text: 'Checkout/lending tracking', included: true },
        { text: 'Direct feedback channel', included: true },
        { text: 'Shape future development', included: true }
      ],
      ctaText: 'Join Beta',
      ctaHref: '/auth/signin?register=true',
      featured: true
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
            <Highlight>Free beta access</Highlight> to help us build the perfect community library tool. 
            No costs during our development phase.
          </Text>
        </div>

        {/* Pricing cards */}
        <div className="marketing-flex marketing-justify-center">
          <div style={{ maxWidth: '400px', width: '100%' }}>
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
          </div>
        </div>

        {/* Beta program benefits */}
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
            Why join our beta program?
          </Heading>
          <div 
            className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-3 marketing-gap-8"
            style={{ marginTop: 'var(--marketing-spacing-6)' }}
          >
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                Shape the Product
              </Text>
              <Text variant="small" color="muted">
                Your feedback directly influences development
              </Text>
            </div>
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                Free Access
              </Text>
              <Text variant="small" color="muted">
                No costs during beta development phase
              </Text>
            </div>
            <div>
              <Text variant="body" style={{ fontWeight: 'var(--marketing-font-semibold)' }}>
                Community First
              </Text>
              <Text variant="small" color="muted">
                Built specifically for shared library needs
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