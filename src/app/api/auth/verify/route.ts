import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/apiConfig'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // For development - call the worker instead of using mock
    // (Development mock disabled to use real worker authentication)

    // Call the workers API to verify credentials
    const response = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      const result = await response.json()
      
      // Check if 2FA is required
      if (result.requires_2fa) {
        return NextResponse.json(result, { status: 200 })
      }
      
      // Normal login (no 2FA required)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}