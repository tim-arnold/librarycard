import React, { useState } from 'react'
import type { Metadata } from 'next'
import { 
  Email, 
  Phone, 
  LocationOn,
  Send,
  Support,
  QuestionAnswer,
  Business
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import { FeatureCard } from '@/components/marketing/ui/Card'
import Button from '@/components/marketing/ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

export const metadata: Metadata = {
  title: 'Contact - LibraryCard',
  description: 'Get in touch with the LibraryCard team. We\'re here to help with questions about community library management, pricing, and getting started.',
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
            Have questions about LibraryCard? We'd love to hear from you. 
            Reach out to discuss how we can help your community.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            Whether you're interested in our community features, need help getting started, 
            or want to discuss custom solutions, we're here to help.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Subject: ${formData.subject}\n\n${formData.message}`
        })
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (success) {
    return (
      <div 
        style={{
          textAlign: 'center',
          padding: 'var(--marketing-spacing-12)',
          background: 'var(--marketing-gray-50)',
          borderRadius: 'var(--marketing-radius-xl)',
          border: '1px solid var(--marketing-gray-200)'
        }}
      >
        <div 
          style={{
            width: '80px',
            height: '80px',
            background: 'var(--marketing-success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--marketing-spacing-6) auto'
          }}
        >
          <Send style={{ fontSize: '2rem', color: 'var(--marketing-white)' }} />
        </div>
        <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          Message Sent Successfully!
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
          Thank you for reaching out. We'll get back to you within 24 hours.
        </Text>
        <Button 
          onClick={() => {
            setSuccess(false)
            setFormData({ name: '', email: '', subject: '', message: '' })
          }}
          variant="outline"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <div 
      style={{
        background: 'var(--marketing-white)',
        padding: 'var(--marketing-spacing-8)',
        borderRadius: 'var(--marketing-radius-xl)',
        border: '1px solid var(--marketing-gray-200)'
      }}
    >
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Send us a Message
      </Heading>

      {error && (
        <div 
          style={{
            background: 'var(--marketing-error)',
            color: 'var(--marketing-white)',
            padding: 'var(--marketing-spacing-4)',
            borderRadius: 'var(--marketing-radius-base)',
            marginBottom: 'var(--marketing-spacing-6)'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          <label 
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: 'var(--marketing-spacing-2)',
              fontWeight: 'var(--marketing-font-medium)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-text-base)',
              fontFamily: 'var(--marketing-font-primary)'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          <label 
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: 'var(--marketing-spacing-2)',
              fontWeight: 'var(--marketing-font-medium)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-text-base)',
              fontFamily: 'var(--marketing-font-primary)'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          <label 
            htmlFor="subject"
            style={{
              display: 'block',
              marginBottom: 'var(--marketing-spacing-2)',
              fontWeight: 'var(--marketing-font-medium)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            placeholder="How can we help you?"
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-text-base)',
              fontFamily: 'var(--marketing-font-primary)'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
          <label 
            htmlFor="message"
            style={{
              display: 'block',
              marginBottom: 'var(--marketing-spacing-2)',
              fontWeight: 'var(--marketing-font-medium)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your community and how LibraryCard can help..."
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-text-base)',
              fontFamily: 'var(--marketing-font-primary)',
              resize: 'vertical'
            }}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  )
}

function ContactInfo() {
  const contactMethods = [
    {
      icon: <Email />,
      title: 'Email Support',
      description: 'Get help with technical questions, account issues, or general inquiries.',
      info: 'contact@tim52.io',
      action: 'mailto:contact@tim52.io'
    },
    {
      icon: <Support />,
      title: 'Customer Success',
      description: 'Need help setting up your community library or onboarding users?',
      info: 'We typically respond within 4-6 hours',
      action: null
    },
    {
      icon: <Business />,
      title: 'Enterprise Sales',
      description: 'Interested in custom solutions or enterprise features?',
      info: 'Schedule a call to discuss your needs',
      action: null
    }
  ]

  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Other Ways to Reach Us
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
              
              <div>
                <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
                  {method.title}
                </Heading>
                <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
                  {method.description}
                </Text>
                <Text variant="small" color="primary" style={{ fontWeight: 'var(--marketing-font-medium)' }}>
                  {method.action ? (
                    <a href={method.action} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {method.info}
                    </a>
                  ) : (
                    method.info
                  )}
                </Text>
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
      question: "How quickly do you respond to support requests?",
      answer: "We typically respond to all inquiries within 24 hours. For urgent technical issues, we aim for a 4-6 hour response time during business hours."
    },
    {
      question: "Do you offer phone support?",
      answer: "Currently, we provide support primarily through email and our contact form. For Organization tier customers, we can schedule calls for complex setup or training needs."
    },
    {
      question: "Can you help us migrate from our existing system?",
      answer: "Yes! We can provide guidance and tools to help you import existing book data. Contact us to discuss your specific migration needs."
    },
    {
      question: "Do you offer training for administrators?",
      answer: "We provide comprehensive documentation and can schedule training sessions for Organization tier customers. Community tier customers have access to detailed guides and email support."
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
        <Grid cols={1} lgCols={2} gap={12}>
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
            Don't wait - start building your community library today. 
            It only takes a few minutes to get up and running.
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