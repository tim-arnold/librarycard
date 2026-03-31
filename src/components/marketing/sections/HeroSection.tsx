'use client'

import React from 'react'
import Image from 'next/image'
import Button from '../ui/Button'
import Container, { Section } from '../ui/Container'
import { Heading, Text, Highlight } from '../ui/Typography'
import { Flex } from '../ui/Container'

export default function HeroSection() {
  return (
    <Section
      background="white"
      size="lg"
      className="hero-background-section"
      style={{
        position: 'relative',
        minHeight: '80vh'
      }}
      role="banner"
      aria-label="Hero section with community library management information"
    >
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
      <div
        className="hero-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      />

      {/* Content container with higher z-index */}
      <div style={{ position: 'relative', zIndex: 2 }}>
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
          <Heading
            level="display"
            className="marketing-text-center"
            style={{ color: 'white' }}
          >
            <span style={{ color: 'var(--marketing-primary-light)' }}>Community Library</span> Management Beta
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
              marginRight: 'auto',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            Help us build the perfect community library management tool.
            Join our beta and shape the future of shared book collections.
          </Text>

          {/* CTA buttons */}
          <Flex justify="center" gap={4} className="marketing-flex-md-row">
            <Button
              href="/auth/signin?register=true"
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
              borderTop: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Text
              variant="small"
              className="marketing-text-center"
              style={{
                marginBottom: 'var(--marketing-spacing-6)',
                color: 'rgba(255, 255, 255, 0.8)'
              }}
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
      </div>
    </Section>
  )
}
