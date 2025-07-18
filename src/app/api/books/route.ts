import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Check both server-side and client-side environment variables
const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  // Try NextAuth session first, then fall back to Bearer token
  let userEmail = session?.user?.email
  
  if (!userEmail) {
    // Check for Bearer token as fallback
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userEmail = authHeader.substring(7)
    }
  }
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_BASE}/api/books`, {
      headers: {
        'Authorization': `Bearer ${userEmail}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch books:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE}/api/books`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user.email}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to create book:', error)
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 })
  }
}