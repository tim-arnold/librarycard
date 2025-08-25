'use client'

import React, { useState } from 'react'
import { Send } from '@mui/icons-material'
import { Heading, Text } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

export default function SuccessForm() {
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--marketing-spacing-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Your Name *
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Email Address *
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--marketing-spacing-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Organization Name *
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--marketing-spacing-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Community Type *
            </label>
            <select
              name="communityType"
              value={formData.communityType}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)',
                background: 'white'
              }}
            >
              <option value="">Select community type</option>
              <option value="school">School</option>
              <option value="public-library">Public Library</option>
              <option value="community-center">Community Center</option>
              <option value="religious-organization">Religious Organization</option>
              <option value="corporate">Corporate Library</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Expected Library Size *
            </label>
            <select
              name="librarySize"
              value={formData.librarySize}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)',
                background: 'white'
              }}
            >
              <option value="">Select library size</option>
              <option value="under-100">Under 100 books</option>
              <option value="100-500">100-500 books</option>
              <option value="500-2000">500-2,000 books</option>
              <option value="2000-10000">2,000-10,000 books</option>
              <option value="over-10000">Over 10,000 books</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--marketing-spacing-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Expected Users *
            </label>
            <select
              name="userCount"
              value={formData.userCount}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)',
                background: 'white'
              }}
            >
              <option value="">Select user count</option>
              <option value="under-25">Under 25 users</option>
              <option value="25-100">25-100 users</option>
              <option value="100-500">100-500 users</option>
              <option value="500-2000">500-2,000 users</option>
              <option value="over-2000">Over 2,000 users</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
              Timeline *
            </label>
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--marketing-spacing-3)',
                border: '1px solid var(--marketing-gray-200)',
                borderRadius: 'var(--marketing-radius-base)',
                fontSize: 'var(--marketing-font-size-base)',
                background: 'white'
              }}
            >
              <option value="">Select timeline</option>
              <option value="asap">ASAP (Within 2 weeks)</option>
              <option value="1-month">Within 1 month</option>
              <option value="2-3-months">Within 2-3 months</option>
              <option value="6-months">Within 6 months</option>
              <option value="exploring">Just exploring options</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-3)', fontWeight: 'var(--marketing-font-medium)' }}>
            What areas would you like help with? (Select all that apply)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--marketing-spacing-2)' }}>
            {[
              { value: 'initial-setup', label: 'Initial Setup & Configuration' },
              { value: 'data-migration', label: 'Data Migration from Current System' },
              { value: 'user-training', label: 'User Training & Onboarding' },
              { value: 'book-scanning', label: 'Book Scanning & Cataloging' },
              { value: 'user-management', label: 'User Management & Permissions' },
              { value: 'integration', label: 'System Integration' }
            ].map(option => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--marketing-spacing-2)' }}>
                <input
                  type="checkbox"
                  value={option.value}
                  checked={formData.helpNeeded.includes(option.value)}
                  onChange={handleCheckboxChange}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
            Current System (if any)
          </label>
          <input
            type="text"
            name="currentSystem"
            value={formData.currentSystem}
            onChange={handleChange}
            placeholder="e.g., Excel spreadsheets, paper cards, Koha, Alexandria"
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-200)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-font-size-base)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
            Additional Information
          </label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us more about your needs, challenges, or specific requirements..."
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-200)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-font-size-base)',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--marketing-spacing-2)', fontWeight: 'var(--marketing-font-medium)' }}>
            Preferred Contact Method *
          </label>
          <select
            name="preferredContact"
            value={formData.preferredContact}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: 'var(--marketing-spacing-3)',
              border: '1px solid var(--marketing-gray-200)',
              borderRadius: 'var(--marketing-radius-base)',
              fontSize: 'var(--marketing-font-size-base)',
              background: 'white'
            }}
          >
            <option value="">Select preferred method</option>
            <option value="email">Email</option>
            <option value="phone">Phone Call</option>
            <option value="video">Video Call (Zoom/Meet)</option>
          </select>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </div>
  )
}