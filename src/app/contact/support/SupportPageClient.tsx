'use client'

import React, { useState } from 'react'
import { 
  Bug, 
  Email, 
  Phone,
  AccountCircle,
  Computer,
  ErrorOutline,
  Send
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

function SupportHeader() {
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
            Technical <Highlight>Support</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Having trouble with LibraryCard? We're here to help you get back on track.
            Our technical support team responds to all requests within 24 hours.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            For the fastest resolution, please provide detailed information about your issue 
            using the form below.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function SupportForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountEmail: '',
    issueType: '',
    priority: '',
    browserDevice: '',
    description: '',
    stepsTried: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Build formatted message
      const issueTypeLabels: { [key: string]: string } = {
        'login-account': 'Login/Account Issues',
        'book-management': 'Book Management Problems',
        'scanning-isbn': 'ISBN Scanning Issues',
        'checkout-system': 'Checkout/Return System',
        'mobile-app': 'Mobile App Issues',
        'permissions': 'User Permissions/Invites',
        'data-export': 'Data Import/Export',
        'performance': 'Performance/Loading Issues',
        'billing': 'Billing/Subscription',
        'other': 'Other Technical Issue'
      }

      const priorityLabels: { [key: string]: string } = {
        'low': 'Low - General question or minor issue',
        'medium': 'Medium - Feature not working properly',
        'high': 'High - Major functionality blocked',
        'urgent': 'Urgent - Complete system unavailable'
      }

      const message = `
TECHNICAL SUPPORT REQUEST

Issue Type: ${issueTypeLabels[formData.issueType] || formData.issueType}
Priority: ${priorityLabels[formData.priority] || formData.priority}
${formData.accountEmail ? `LibraryCard Account: ${formData.accountEmail}` : ''}
${formData.browserDevice ? `Browser/Device: ${formData.browserDevice}` : ''}

ISSUE DESCRIPTION:
${formData.description}

${formData.stepsTried ? `TROUBLESHOOTING STEPS ATTEMPTED:
${formData.stepsTried}` : ''}

Contact: ${formData.name} (${formData.email})
      `.trim()

      const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Subject: [SUPPORT] ${issueTypeLabels[formData.issueType] || 'Technical Support Request'} - ${priorityLabels[formData.priority] || formData.priority}

${message}`
        })
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          accountEmail: '',
          issueType: '',
          priority: '',
          browserDevice: '',
          description: '',
          stepsTried: ''
        })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send support request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          Support Request Submitted!
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
          We've received your technical support request and will respond within 24 hours 
          (or faster for high priority issues).
        </Text>
        <Button 
          onClick={() => {
            setSuccess(false)
            setFormData({
              name: '',
              email: '',
              accountEmail: '',
              issueType: '',
              priority: '',
              browserDevice: '',
              description: '',
              stepsTried: ''
            })
          }}
          variant="outline"
        >
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Submit a Support Request
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--marketing-spacing-6)' }}>
        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="name"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Your Name *
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
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Email Address *
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
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <label 
            htmlFor="accountEmail"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            LibraryCard Account Email (if different)
          </label>
          <input
            type="email"
            id="accountEmail"
            name="accountEmail"
            value={formData.accountEmail}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              transition: 'border-color 0.2s ease-in-out'
            }}
            placeholder="account@example.com"
          />
        </div>

        <div>
          <label 
            htmlFor="issueType"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Issue Type *
          </label>
          <select
            id="issueType"
            name="issueType"
            required
            value={formData.issueType}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              backgroundColor: 'var(--marketing-white)',
              transition: 'border-color 0.2s ease-in-out'
            }}
          >
            <option value="">Select an issue type</option>
            <option value="login-account">Login/Account Issues</option>
            <option value="book-management">Book Management Problems</option>
            <option value="scanning-isbn">ISBN Scanning Issues</option>
            <option value="checkout-system">Checkout/Return System</option>
            <option value="mobile-app">Mobile App Issues</option>
            <option value="permissions">User Permissions/Invites</option>
            <option value="data-export">Data Import/Export</option>
            <option value="performance">Performance/Loading Issues</option>
            <option value="billing">Billing/Subscription</option>
            <option value="other">Other Technical Issue</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="priority"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Priority Level *
          </label>
          <select
            id="priority"
            name="priority"
            required
            value={formData.priority}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              backgroundColor: 'var(--marketing-white)',
              transition: 'border-color 0.2s ease-in-out'
            }}
          >
            <option value="">Select priority level</option>
            <option value="low">Low - General question or minor issue</option>
            <option value="medium">Medium - Feature not working properly</option>
            <option value="high">High - Major functionality blocked</option>
            <option value="urgent">Urgent - Complete system unavailable</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="browserDevice"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Browser/Device Information
          </label>
          <input
            type="text"
            id="browserDevice"
            name="browserDevice"
            value={formData.browserDevice}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              transition: 'border-color 0.2s ease-in-out'
            }}
            placeholder="e.g., Chrome on Windows 11, Safari on iPhone 15"
          />
        </div>

        <div>
          <label 
            htmlFor="description"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Detailed Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            value={formData.description}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              resize: 'vertical',
              transition: 'border-color 0.2s ease-in-out'
            }}
            placeholder="Please describe the issue in detail. Include:
• What you were trying to do
• What happened instead
• Any error messages you saw
• Steps to reproduce the problem"
          />
        </div>

        <div>
          <label 
            htmlFor="stepsTried"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Steps You've Already Tried
          </label>
          <textarea
            id="stepsTried"
            name="stepsTried"
            rows={3}
            value={formData.stepsTried}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              resize: 'vertical',
              transition: 'border-color 0.2s ease-in-out'
            }}
            placeholder="Let us know what troubleshooting steps you've already attempted"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg"
          loading={loading}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Sending...' : 'Submit Support Request'}
        </Button>
      </form>
    </div>
  )
}

function SupportInfo() {
  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        What to Expect
      </Heading>

      <div className="marketing-flex marketing-flex-col marketing-gap-6">
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
            <Email />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Response Times
            </Heading>
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              • <strong>Standard:</strong> 24 hours or less
            </Text>
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              • <strong>High Priority:</strong> 4-6 hours during business hours
            </Text>
            <Text variant="body">
              • <strong>Urgent Issues:</strong> Within 2 hours during business hours
            </Text>
          </div>
        </div>

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
            <Computer />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Support Hours
            </Heading>
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              • <strong>Business Hours:</strong> Monday-Friday, 9 AM - 6 PM EST
            </Text>
            <Text variant="body">
              • <strong>Emergency Support:</strong> Available 24/7 for Organization tier customers
            </Text>
          </div>
        </div>

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
            <ErrorOutline />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Before You Submit
            </Heading>
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              • Try refreshing the page or logging out and back in
            </Text>
            <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              • Check if the issue persists in a private/incognito browser window
            </Text>
            <Text variant="body">
              • Clear your browser cache if you're experiencing loading issues
            </Text>
          </div>
        </div>
      </div>

      <div 
        style={{
          marginTop: 'var(--marketing-spacing-8)',
          padding: 'var(--marketing-spacing-6)',
          background: 'var(--marketing-gray-50)',
          borderRadius: 'var(--marketing-radius-lg)',
          border: '1px solid var(--marketing-gray-200)'
        }}
      >
        <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-3)' }}>
          Need Immediate Help?
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          For urgent issues that are blocking your entire library system, Organization tier 
          customers can call our emergency support line.
        </Text>
        <Button href="/contact" variant="outline" size="sm">
          View All Contact Options
        </Button>
      </div>
    </div>
  )
}

export default function SupportPageClient() {
  return (
    <MarketingLayout>
      <SupportHeader />
      <Section background="white">
        <Container>
          <Grid cols={1} lgCols={2} gap={12}>
            <SupportForm />
            <SupportInfo />
          </Grid>
        </Container>
      </Section>
    </MarketingLayout>
  )
}