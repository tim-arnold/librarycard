import React from 'react'
import { 
  Groups, 
  Smartphone, 
  QrCodeScanner, 
  LocationOn,
  Security,
  Cloud
} from '@mui/icons-material'
import Container, { Section, Grid } from '../ui/Container'
import { FeatureCard } from '../ui/Card'
import { Heading, Text } from '../ui/Typography'

export default function FeatureGrid() {
  const features = [
    {
      icon: <Groups />,
      title: 'Community Sharing',
      description: 'Invitation-based access with smart permission management. Perfect for apartments, retirement communities, and book clubs.'
    },
    {
      icon: <Smartphone />,
      title: 'Mobile-First Design',
      description: 'Scan books anywhere, access from any device. Native iOS and Android apps with seamless cloud sync.'
    },
    {
      icon: <QrCodeScanner />,
      title: 'Smart ISBN Scanning',
      description: 'Google Books API integration with 97%+ success rate. Automatically download book details, covers, and metadata.'
    },
    {
      icon: <LocationOn />,
      title: 'Location Tracking',
      description: 'Know exactly where books are located. Multi-building support for campus libraries and large communities.'
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: '2FA authentication, WebAuthn support, and enterprise-grade security. Your community data stays protected.'
    },
    {
      icon: <Cloud />,
      title: 'Real-time Sync',
      description: 'Cloud synchronization across all devices. Never lose track of your books, members can access anywhere.'
    }
  ]

  return (
    <Section background="gray-50">
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
            Everything you need for community library management
          </Heading>
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ marginTop: 'var(--marketing-spacing-4)' }}
          >
            Built specifically for shared spaces and community libraries. 
            Simple enough for anyone to use, powerful enough to scale.
          </Text>
        </div>

        {/* Feature grid */}
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