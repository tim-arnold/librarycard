// Admin API endpoints for genre management
// POST /api/admin/genres - Create new curated genre (super admin only)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const API_BASE = process.env.CLOUDFLARE_WORKER_URL || 'http://localhost:8787'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Genre name is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE}/admin/genres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': session.user.email,
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || null
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Worker API error:', errorText)
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Super admin required.' },
          { status: 403 }
        )
      }
      
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Genre with this name already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create genre' },
        { status: response.status }
      )
    }

    const newGenre = await response.json()
    return NextResponse.json(newGenre, { status: 201 })

  } catch (error) {
    console.error('Error creating genre:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}