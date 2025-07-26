import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/apiConfig'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const response = await fetch(`${getApiBaseUrl()}/api/users`, {
      method: 'POST',
      headers: {
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
    console.error('Failed to create/update user:', error)
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 })
  }
}