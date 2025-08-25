'use client'

import React, { useState } from 'react'
import { 
  Support, 
  School, 
  Groups,
  Schedule,
  CheckCircle,
  VideoCall,
  Send
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

function SuccessHeader() {
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
            Customer <Highlight>Success</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Let our onboarding specialists help you set up your community library 
            and get your users engaged from day one.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            From initial setup to user training, we'll make sure your library launch 
            is smooth and successful.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function SuccessForm() {
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    organization: '',
    phone: '',
    communityType: '',
    librarySize: '',
    userCount: '',
    timeline: '',
    helpNeeded: [] as string[],
    currentSystem: '',
    additionalInfo: '',
    preferredContact: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const message = `
CUSTOMER SUCCESS REQUEST

Organization: ${formData.organization}
Community Type: ${formData.communityType}
Expected Library Size: ${formData.librarySize}
Expected Users: ${formData.userCount}
Timeline: ${formData.timeline}
${formData.phone ? `Phone: ${formData.phone}` : ''}

HELP NEEDED:
${formData.helpNeeded.length > 0 ? formData.helpNeeded.map(item => `• ${item.replace('-', ' ')}`).join('\n') : 'Not specified'}

${formData.currentSystem ? `CURRENT SYSTEM: ${formData.currentSystem}` : ''}
${formData.additionalInfo ? `ADDITIONAL INFO: ${formData.additionalInfo}` : ''}

Preferred Contact Method: ${formData.preferredContact}
Contact: ${formData.contactName} (${formData.contactEmail})
      `.trim()

      const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.contactName,
          email: formData.contactEmail,
          message: `Subject: [CUSTOMER SUCCESS] Setup Assistance - ${formData.organization}

${message}`
        })
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send request')
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({
      ...formData,
      helpNeeded: e.target.checked 
        ? [...formData.helpNeeded, value]
        : formData.helpNeeded.filter(item => item !== value)
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
          Request Submitted Successfully!
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
          Our customer success team will contact you within 24 hours to schedule 
          your personalized onboarding session.
        </Text>
        <Button 
          onClick={() => setSuccess(false)}
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
        Schedule Setup Assistance
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
              htmlFor="contact-name"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Primary Contact Name *
            </label>
            <input
              type="text"
              id="contact-name"
              name="contactName"
              required
              value={formData.contactName}
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
              htmlFor="contact-email"
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
              id="contact-email"
              name="contactEmail"
              required
              value={formData.contactEmail}
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

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="organization"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Organization/Community Name *
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              required
              value={formData.organization}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-300)',
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="Your community or organization name"
            />
          </div>

          <div>
            <label 
              htmlFor="phone"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-300)',
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="community-type"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Community Type *
            </label>
            <select
              id="community-type"
              name="communityType"
              required
              value={formData.communityType}
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
              <option value="">Select community type</option>
              <option value="neighborhood">Neighborhood/Residential Community</option>
              <option value="workplace">Workplace/Office</option>
              <option value="school">School/Educational Institution</option>
              <option value="church">Church/Religious Organization</option>
              <option value="community-center">Community Center</option>
              <option value="nonprofit">Nonprofit Organization</option>
              <option value="co-op">Co-op/Shared Living Space</option>
              <option value="club">Club/Social Group</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="library-size"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Expected Library Size *
            </label>
            <select
              id="library-size"
              name="librarySize"
              required
              value={formData.librarySize}
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
              <option value="">Select expected size</option>
              <option value="small">Small (Under 500 books)</option>
              <option value="medium">Medium (500-2,000 books)</option>
              <option value="large">Large (2,000-10,000 books)</option>
              <option value="enterprise">Enterprise (10,000+ books)</option>
              <option value="unsure">Not sure yet</option>
            </select>
          </div>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="user-count"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Expected Number of Users *
            </label>
            <select
              id="user-count"
              name="userCount"
              required
              value={formData.userCount}
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
              <option value="">Select user count</option>
              <option value="1-5">1-5 users (Personal tier)</option>
              <option value="6-50">6-50 users (Community tier)</option>
              <option value="51-150">51-150 users (Organization tier)</option>
              <option value="150+">150+ users (Enterprise)</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="timeline"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Launch Timeline *
            </label>
            <select
              id="timeline"
              name="timeline"
              required
              value={formData.timeline}
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
              <option value="">Select your timeline</option>
              <option value="asap">ASAP - Need to launch immediately</option>
              <option value="2-weeks">Within 2 weeks</option>
              <option value="1-month">Within 1 month</option>
              <option value="3-months">Within 3 months</option>
              <option value="planning">Just planning for future</option>
            </select>
          </div>
        </div>

        <div>
          <label 
            htmlFor="help-needed"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            What Help Do You Need? *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--marketing-spacing-2)' }}>
            {[
              { value: 'initial-setup', label: 'Initial system setup and configuration' },
              { value: 'book-import', label: 'Importing existing book data' },
              { value: 'user-onboarding', label: 'User invitation and onboarding process' },
              { value: 'admin-training', label: 'Administrator training and best practices' },
              { value: 'workflow-design', label: 'Checkout/return workflow design' },
              { value: 'mobile-setup', label: 'Mobile app setup and training' },
              { value: 'integration', label: 'Integration with existing systems' },
              { value: 'migration', label: 'Migration from another system' }
            ].map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--marketing-spacing-2)' }}>
                <input
                  type="checkbox"
                  name="helpNeeded"
                  value={option.value}
                  onChange={handleCheckboxChange}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--marketing-primary)'
                  }}
                />
                <Text variant="body">{option.label}</Text>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label 
            htmlFor="current-system"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Current Library Management System
          </label>
          <input
            type="text"
            id="current-system"
            name="currentSystem"
            value={formData.currentSystem}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-300)',
              borderRadius: 'var(--marketing-radius-md)',
              fontSize: 'var(--marketing-text-base)',
              transition: 'border-color 0.2s ease-in-out'
            }}
            placeholder="e.g., Excel spreadsheet, other software, or none"
          />
        </div>

        <div>
          <label 
            htmlFor="additional-info"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Additional Information
          </label>
          <textarea
            id="additional-info"
            name="additionalInfo"
            rows={4}
            value={formData.additionalInfo}
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
            placeholder="Tell us more about your community, specific challenges, or anything else that would help us assist you better."
          />
        </div>

        <div>
          <label 
            htmlFor="preferred-contact"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Preferred Contact Method *
          </label>
          <select
            id="preferred-contact"
            name="preferredContact"
            required
            value={formData.preferredContact}
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
            <option value="">Select contact preference</option>
            <option value="email">Email correspondence</option>
            <option value="phone">Phone call</option>
            <option value="video">Video call (Zoom, Teams, etc.)</option>
            <option value="screen-share">Screen sharing session</option>
          </select>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg"
          loading={loading}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Sending...' : 'Request Customer Success Help'}
        </Button>
      </form>
    </div>
  )
}

function SuccessInfo() {
  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        How We Help You Succeed
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
            <Schedule />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Personalized Onboarding Plan
            </Heading>
            <Text variant="body">
              We create a customized setup plan based on your community size, timeline, 
              and specific needs. No cookie-cutter approach.
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
            <VideoCall />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Live Training Sessions
            </Heading>
            <Text variant="body">
              Screen-sharing sessions to walk you through setup, user management, 
              and best practices. Record sessions for your team reference.
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
            <Groups />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              User Adoption Strategy
            </Heading>
            <Text variant="body">
              Get your community excited about the new library system with proven 
              engagement strategies and rollout best practices.
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
            <CheckCircle />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Ongoing Support
            </Heading>
            <Text variant="body">
              30-day post-launch check-ins to ensure everything is running smoothly 
              and your users are happy with the system.
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
          Success Guarantee
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          We don't consider our job done until your community is actively using and 
          loving their new library system. That's our promise to you.
        </Text>
        <Button href="/pricing" variant="outline" size="sm">
          View Pricing & Plans
        </Button>
      </div>
    </div>
  )
}

export default function SuccessPageClient() {
  return (
    <MarketingLayout>
      <SuccessHeader />
      <Section background="white">
        <Container>
          <Grid cols={1} lgCols={2} gap={12}>
            <SuccessForm />
            <SuccessInfo />
          </Grid>
        </Container>
      </Section>
    </MarketingLayout>
  )
}