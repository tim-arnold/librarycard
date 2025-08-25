import React from 'react'
import Button from '../ui/Button'
import Container, { Section } from '../ui/Container'
import { Heading, Text, Highlight } from '../ui/Typography'
import { Flex } from '../ui/Container'

export default function HeroSection() {
  return (
    <Section background="white" size="lg">
      <Container>
        <div 
          className="marketing-text-center"
          style={{ 
            maxWidth: '900px', 
            margin: '0 auto',
            paddingTop: 'var(--marketing-spacing-8)'
          }}
        >
          {/* Main headline */}
          <Heading level="display" className="marketing-text-center">
            <Highlight>Community-First</Highlight> Library Management
          </Heading>
          
          {/* Subheading */}
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-8)',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Bridge the gap between personal collection tools and expensive institutional software. 
            Perfect for apartments, retirement communities, book clubs, and shared spaces.
          </Text>

          {/* CTA buttons */}
          <Flex justify="center" gap={4} className="marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="primary" 
              size="lg"
            >
              Start Free
            </Button>
            <Button 
              href="/features" 
              variant="secondary" 
              size="lg"
            >
              See Features
            </Button>
          </Flex>

          {/* Trust indicators */}
          <div 
            style={{ 
              marginTop: 'var(--marketing-spacing-12)',
              paddingTop: 'var(--marketing-spacing-8)',
              borderTop: '1px solid var(--marketing-gray-200)'
            }}
          >
            <Text 
              variant="small" 
              color="muted" 
              className="marketing-text-center"
              style={{ marginBottom: 'var(--marketing-spacing-6)' }}
            >
              Trusted by communities across the country
            </Text>
            
            {/* Placeholder for customer logos - will add real ones later */}
            <div 
              className="marketing-flex marketing-items-center marketing-justify-center marketing-gap-8"
              style={{ opacity: 0.6 }}
            >
              <div 
                style={{
                  width: '120px',
                  height: '40px',
                  background: 'var(--marketing-gray-200)',
                  borderRadius: 'var(--marketing-radius-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--marketing-text-sm)',
                  color: 'var(--marketing-gray-500)'
                }}
              >
                Customer Logo
              </div>
              <div 
                style={{
                  width: '120px',
                  height: '40px',
                  background: 'var(--marketing-gray-200)',
                  borderRadius: 'var(--marketing-radius-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--marketing-text-sm)',
                  color: 'var(--marketing-gray-500)'
                }}
              >
                Customer Logo
              </div>
              <div 
                style={{
                  width: '120px',
                  height: '40px',
                  background: 'var(--marketing-gray-200)',
                  borderRadius: 'var(--marketing-radius-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--marketing-text-sm)',
                  color: 'var(--marketing-gray-500)'
                }}
                className="marketing-hidden-mobile"
              >
                Customer Logo
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

// Add responsive styles
const styles = `
@media (min-width: 768px) {
  .marketing-flex-md-row {
    flex-direction: row !important;
  }
}
`

if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}