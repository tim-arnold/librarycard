'use client'

import React, { useState } from 'react'
import { Send } from '@mui/icons-material'
import { Heading, Text } from '../ui/Typography'
import Button from '../ui/Button'
import { getApiBaseUrl } from '@/lib/apiConfig'

export default function ContactForm() {
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