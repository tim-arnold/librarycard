import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getApiBaseUrl } from '@/lib/apiConfig'

export async function POST(request: NextRequest) {
  try {
    // Get session from the request headers or cookies
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      // If no session, still return success (logout is idempotent)
      return NextResponse.json({ message: 'Logged out successfully' })
    }

    // Call the worker API to clear user cache
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.email}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to clear user cache on logout:', await response.text())
      }
    } catch (error) {
      console.error('Error calling worker logout endpoint:', error)
      // Continue with logout even if cache clearing fails
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}