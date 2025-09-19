import React from 'react'
import type { Metadata } from 'next'
import {
  Email,
  Phone,
  LocationOn,
  Send,
  Support,
  QuestionAnswer,
  Business
} from '@/components/marketing/ui/Icons'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import { FeatureCard } from '@/components/marketing/ui/Card'
import Button from '@/components/marketing/ui/Button'
import ContactForm from '@/components/marketing/forms/ContactForm'

export const metadata: Metadata = {
  title: 'Contact - LibraryCard',
  description: 'Get in touch with the LibraryCard beta team. We\'re here to help with questions about the beta program and community library management.',
}

function ContactHeader() {
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
            Get in <Highlight>Touch</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Questions about our beta program? We'd love to hear from you. 
            Reach out with feedback, questions, or feature requests.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            Whether you're interested in joining the beta, need help getting started, 
            or want to share feedback, we're here to help.
          </Text>
        </div>
      </Container>
    </Section>
  )
}


function ContactInfo() {
  const contactMethods = [
    {
      icon: <Email />,
      title: 'Beta Support',
      description: 'Get help with technical questions, account issues, or beta-related inquiries.',
      info: 'Submit a support request with detailed information',
      action: '/contact/support',
      ctaText: 'Get Beta Help'
    },
    {
      icon: <Support />,
      title: 'Getting Started',
      description: 'Need help setting up your community library or onboarding users during beta?',
      info: 'Connect with our beta support team',
      action: '/contact/success',
      ctaText: 'Get Setup Help'
    },
    {
      icon: <QuestionAnswer />,
      title: 'Beta Feedback',
      description: 'Share your thoughts, feature requests, or suggestions for improvement.',
      info: 'Help us build the perfect community library tool',
      action: 'mailto:beta@librarycard.com',
      ctaText: 'Send Feedback'
    }
  ]

  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Beta Program Support
      </Heading>

      <div className="marketing-grid marketing-grid-cols-1 marketing-gap-6">
        {contactMethods.map((method, index) => (
          <div
            key={index}
            style={{
              background: 'var(--marketing-white)',
              padding: 'var(--marketing-spacing-6)',
              borderRadius: 'var(--marketing-radius-lg)',
              border: '1px solid var(--marketing-gray-200)'
            }}
          >
            <div className="marketing-flex marketing-items-start marketing-gap-4">
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)',
                  borderRadius: 'var(--marketing-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--marketing-white)',
                  flexShrink: 0
                }}
              >
                {method.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  {method.title}
                </Heading>
                <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
                  {method.description}
                </Text>
                <Text variant="small" color="muted" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
                  {method.info}
                </Text>
                <Button 
                  href={method.action}
                  variant="outline" 
                  size="sm"
                >
                  {method.ctaText}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    {
      question: "How quickly do you respond to beta support requests?",
      answer: "We typically respond to all beta program inquiries within 24-48 hours. We prioritize feedback and feature requests from beta participants."
    },
    {
      question: "How can I provide feedback during the beta?",
      answer: "You can use the contact form, email us directly, or use any feedback features built into the application. We read and consider all beta feedback."
    },
    {
      question: "Can you help us migrate existing book data into the beta?",
      answer: "Yes! We can help with basic data imports during the beta. Contact us with details about your current system and we'll work with you."
    },
    {
      question: "Is there training available for beta users?",
      answer: "We provide documentation and can offer guided setup sessions for beta communities. Your feedback helps us improve our onboarding process."
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
      </Container>
    </Section>
  )
}

function ContactContent() {
  return (
    <Section background="white">
      <Container>
        <Grid cols={1} lgCols={2} gap={8}>
          <ContactForm />
          <ContactInfo />
        </Grid>
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
            Ready to join the beta program? 
            Help us build the perfect community library tool.
          </Text>
          
          <div className="marketing-flex marketing-justify-center marketing-gap-4 marketing-flex-col marketing-flex-md-row">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Join Beta Program
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

export default function ContactPage() {
  return (
    <MarketingLayout>
      <ContactHeader />
      <ContactContent />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}