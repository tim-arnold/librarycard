// API endpoints for genre management
// GET /api/genres - Get all active curated genres
// This is a public endpoint used by all users for genre selection

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.CLOUDFLARE_WORKER_URL || 'http://localhost:8787'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching genres from:', `${API_BASE}/genres`)
    const response = await fetch(`${API_BASE}/genres`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Worker API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch genres' },
        { status: response.status }
      )
    }

    const genres = await response.json()
    console.log('Received genres from worker:', genres.length)
    return NextResponse.json(genres)

  } catch (error) {
    console.error('Error fetching genres:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}