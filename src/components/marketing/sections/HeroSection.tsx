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
            <Highlight>Community Library</Highlight> Management Beta
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
            Help us build the perfect community library management tool. 
            Join our beta and shape the future of shared book collections.
          </Text>

          {/* CTA buttons */}
          <Flex justify="center" gap={4} className="marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="primary" 
              size="lg"
            >
              Join Beta
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
              Join the beta program and help shape the future
            </Text>
            
            {/* Beta program indicators */}
            <div 
              className="marketing-flex marketing-items-center marketing-justify-center marketing-gap-8"
              style={{ opacity: 0.8 }}
            >
              <div 
                style={{
                  padding: 'var(--marketing-spacing-2) var(--marketing-spacing-4)',
                  background: 'var(--marketing-primary)',
                  color: 'var(--marketing-white)',
                  borderRadius: 'var(--marketing-radius-full)',
                  fontSize: 'var(--marketing-text-sm)',
                  fontWeight: 'var(--marketing-font-medium)'
                }}
              >
                Beta Program
              </div>
              <div 
                style={{
                  padding: 'var(--marketing-spacing-2) var(--marketing-spacing-4)',
                  background: 'var(--marketing-secondary)',
                  color: 'var(--marketing-white)',
                  borderRadius: 'var(--marketing-radius-full)',
                  fontSize: 'var(--marketing-text-sm)',
                  fontWeight: 'var(--marketing-font-medium)'
                }}
                className="marketing-hidden-mobile"
              >
                Free to Join
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