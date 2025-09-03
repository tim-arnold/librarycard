import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/apiConfig'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate required fields
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Forward to Workers API
    console.log('🐛 DEBUG: API_BASE_URL() =', API_BASE_URL())
    console.log('🐛 DEBUG: Full URL =', `${API_BASE_URL()}/api/auth/forgot-password`)
    const response = await fetch(`${API_BASE_URL()}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim() }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: data.error || 'Failed to send reset email' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Forgot password route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}