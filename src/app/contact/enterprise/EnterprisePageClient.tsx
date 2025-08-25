'use client'

import React, { useState } from 'react'
import { 
  Business, 
  Security, 
  Hub as Integration,
  Assessment,
  AccountBalance,
  Schedule,
  Phone,
  Send
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

function EnterpriseHeader() {
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
            Enterprise <Highlight>Solutions</Highlight>
          </Heading>
          
          <Text 
            variant="lead" 
            className="marketing-text-center"
            style={{ 
              marginTop: 'var(--marketing-spacing-6)',
              marginBottom: 'var(--marketing-spacing-4)'
            }}
          >
            Custom library management solutions for large institutions, organizations, 
            and enterprises with advanced needs.
          </Text>
          
          <Text 
            variant="body" 
            color="muted"
            className="marketing-text-center"
          >
            From white-labeling to SSO integration, we'll tailor LibraryCard 
            to fit your enterprise requirements.
          </Text>
        </div>
      </Container>
    </Section>
  )
}

function EnterpriseForm() {
  const [formData, setFormData] = useState({
    contactName: '',
    jobTitle: '',
    workEmail: '',
    phone: '',
    company: '',
    companySize: '',
    industry: '',
    expectedUsers: '',
    budgetRange: '',
    enterpriseFeatures: [] as string[],
    timeline: '',
    currentSolution: '',
    requirements: ''
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
ENTERPRISE CONSULTATION REQUEST

Contact: ${formData.contactName} (${formData.jobTitle})
Company: ${formData.company}
Industry: ${formData.industry}
Company Size: ${formData.companySize}
Expected Users: ${formData.expectedUsers}
Implementation Timeline: ${formData.timeline}
${formData.phone ? `Phone: ${formData.phone}` : ''}
${formData.budgetRange ? `Budget Range: ${formData.budgetRange}` : ''}

ENTERPRISE FEATURES NEEDED:
${formData.enterpriseFeatures.length > 0 ? formData.enterpriseFeatures.map(item => `• ${item.replace('-', ' ')}`).join('\n') : 'Not specified'}

${formData.currentSolution ? `CURRENT SOLUTION: ${formData.currentSolution}` : ''}

REQUIREMENTS & QUESTIONS:
${formData.requirements}

Contact: ${formData.contactName} (${formData.workEmail})
      `.trim()

      const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.contactName,
          email: formData.workEmail,
          message: `Subject: [ENTERPRISE] Custom Solutions - ${formData.company}

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
      enterpriseFeatures: e.target.checked 
        ? [...formData.enterpriseFeatures, value]
        : formData.enterpriseFeatures.filter(item => item !== value)
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
          Enterprise Request Submitted!
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
          Our enterprise sales team will contact you within 24 hours to schedule 
          your consultation and discuss your custom requirements.
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
        Request Enterprise Information
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
              Contact Name *
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
              htmlFor="job-title"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Job Title *
            </label>
            <input
              type="text"
              id="job-title"
              name="jobTitle"
              required
              value={formData.jobTitle}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-300)',
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="e.g., IT Director, Library Manager, CTO"
            />
          </div>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="work-email"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Work Email Address *
            </label>
            <input
              type="email"
              id="work-email"
              name="workEmail"
              required
              value={formData.workEmail}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-300)',
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="name@company.com"
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
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
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
              htmlFor="company"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Company/Organization *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              required
              value={formData.company}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-300)',
                borderRadius: 'var(--marketing-radius-md)',
                fontSize: 'var(--marketing-text-base)',
                transition: 'border-color 0.2s ease-in-out'
              }}
              placeholder="Your company or organization name"
            />
          </div>

          <div>
            <label 
              htmlFor="company-size"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Company Size *
            </label>
            <select
              id="company-size"
              name="companySize"
              required
              value={formData.companySize}
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
              <option value="">Select company size</option>
              <option value="100-500">100-500 employees</option>
              <option value="500-1000">500-1,000 employees</option>
              <option value="1000-5000">1,000-5,000 employees</option>
              <option value="5000+">5,000+ employees</option>
            </select>
          </div>
        </div>

        <div className="marketing-grid marketing-grid-cols-1 marketing-grid-md-cols-2 marketing-gap-6">
          <div>
            <label 
              htmlFor="industry"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Industry *
            </label>
            <select
              id="industry"
              name="industry"
              required
              value={formData.industry}
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
              <option value="">Select industry</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="government">Government</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="technology">Technology</option>
              <option value="financial">Financial Services</option>
              <option value="corporate">Corporate/Business</option>
              <option value="real-estate">Real Estate</option>
              <option value="hospitality">Hospitality</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="expected-users"
              style={{
                display: 'block',
                fontWeight: 'var(--marketing-font-semibold)',
                marginBottom: 'var(--marketing-spacing-2)',
                fontSize: 'var(--marketing-text-sm)',
                color: 'var(--marketing-gray-700)'
              }}
            >
              Expected Library Users *
            </label>
            <select
              id="expected-users"
              name="expectedUsers"
              required
              value={formData.expectedUsers}
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
              <option value="100-500">100-500 users</option>
              <option value="500-1000">500-1,000 users</option>
              <option value="1000-5000">1,000-5,000 users</option>
              <option value="5000+">5,000+ users</option>
            </select>
          </div>
        </div>

        <div>
          <label 
            htmlFor="budget-range"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Annual Budget Range
          </label>
          <select
            id="budget-range"
            name="budgetRange"
            value={formData.budgetRange}
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
            <option value="">Select budget range (optional)</option>
            <option value="under-10k">Under $10,000</option>
            <option value="10k-25k">$10,000 - $25,000</option>
            <option value="25k-50k">$25,000 - $50,000</option>
            <option value="50k-100k">$50,000 - $100,000</option>
            <option value="100k+">$100,000+</option>
            <option value="flexible">Flexible based on value</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="enterprise-features"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Enterprise Features Needed *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--marketing-spacing-2)' }}>
            {[
              { value: 'sso', label: 'Single Sign-On (SSO) integration' },
              { value: 'white-labeling', label: 'White-labeling/custom branding' },
              { value: 'api-access', label: 'Advanced API access' },
              { value: 'custom-domain', label: 'Custom domain hosting' },
              { value: 'advanced-permissions', label: 'Advanced user roles & permissions' },
              { value: 'reporting', label: 'Advanced reporting & analytics' },
              { value: 'integrations', label: 'Custom integrations with existing systems' },
              { value: 'support', label: 'Dedicated support & account management' },
              { value: 'sla', label: 'Service Level Agreement (SLA)' },
              { value: 'compliance', label: 'Compliance & security features' },
              { value: 'training', label: 'Enterprise training programs' },
              { value: 'migration', label: 'Data migration assistance' }
            ].map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--marketing-spacing-2)' }}>
                <input
                  type="checkbox"
                  name="enterpriseFeatures"
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
            htmlFor="timeline"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Implementation Timeline *
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
            <option value="">Select timeline</option>
            <option value="q1">Q1 2025 (Jan-Mar)</option>
            <option value="q2">Q2 2025 (Apr-Jun)</option>
            <option value="q3">Q3 2025 (Jul-Sep)</option>
            <option value="q4">Q4 2025 (Oct-Dec)</option>
            <option value="2026">2026</option>
            <option value="flexible">Flexible timeline</option>
            <option value="evaluation">Currently evaluating options</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="current-solution"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Current Library Management Solution
          </label>
          <textarea
            id="current-solution"
            name="currentSolution"
            rows={3}
            value={formData.currentSolution}
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
            placeholder="Describe your current library management system or process. What's working? What are the pain points?"
          />
        </div>

        <div>
          <label 
            htmlFor="requirements"
            style={{
              display: 'block',
              fontWeight: 'var(--marketing-font-semibold)',
              marginBottom: 'var(--marketing-spacing-2)',
              fontSize: 'var(--marketing-text-sm)',
              color: 'var(--marketing-gray-700)'
            }}
          >
            Specific Requirements or Questions *
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows={5}
            required
            value={formData.requirements}
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
            placeholder="Tell us about your specific requirements, integration needs, compliance requirements, or any questions you have about enterprise features and pricing."
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
          {loading ? 'Sending...' : 'Request Enterprise Consultation'}
        </Button>
      </form>
    </div>
  )
}

function EnterpriseInfo() {
  return (
    <div>
      <Heading level="3" style={{ marginBottom: 'var(--marketing-spacing-6)' }}>
        Enterprise Benefits
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
            <Security />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Enterprise Security
            </Heading>
            <Text variant="body">
              SSO integration, SAML authentication, SOC 2 compliance, and 
              enterprise-grade security controls for your organization.
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
            <Business />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              White-Label Solution
            </Heading>
            <Text variant="body">
              Complete branding customization with your logo, colors, and 
              custom domain. Make LibraryCard look and feel like your own platform.
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
            <Integration />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Custom Integrations
            </Heading>
            <Text variant="body">
              API access and custom integrations with your existing HR, 
              authentication, and business systems for seamless workflows.
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
            <Phone />
          </div>
          
          <div>
            <Heading level="5" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
              Dedicated Support
            </Heading>
            <Text variant="body">
              Dedicated account manager, priority phone support, custom training 
              sessions, and guaranteed response times with SLA agreements.
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
          What Happens Next?
        </Heading>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
          <strong>1. Initial Consultation:</strong> We'll schedule a 30-minute call to understand your needs
        </Text>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
          <strong>2. Custom Proposal:</strong> Receive a tailored proposal with pricing and timeline
        </Text>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-2)' }}>
          <strong>3. Proof of Concept:</strong> Optional trial environment for testing and evaluation
        </Text>
        <Text variant="body" style={{ marginBottom: 'var(--marketing-spacing-4)' }}>
          <strong>4. Implementation:</strong> White-glove setup and migration support
        </Text>
        <Button href="/pricing" variant="outline" size="sm">
          View Standard Pricing
        </Button>
      </div>
    </div>
  )
}

export default function EnterprisePageClient() {
  return (
    <MarketingLayout>
      <EnterpriseHeader />
      <Section background="white">
        <Container>
          <Grid cols={1} lgCols={2} gap={8}>
            <EnterpriseForm />
            <EnterpriseInfo />
          </Grid>
        </Container>
      </Section>
    </MarketingLayout>
  )
}