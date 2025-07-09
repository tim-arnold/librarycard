// API endpoints for book-genre management
// GET /api/books/[id]/genres - Get genres assigned to a book
// POST /api/books/[id]/genres - Assign genre to book
// PUT /api/books/[id]/genres - Update all genres for a book
// DELETE /api/books/[id]/genres/[genreId] - Remove genre from book

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const API_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:8787'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookId = params.id

    const response = await fetch(`${API_BASE}/books/${bookId}/genres`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user.email}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Worker API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch book genres' },
        { status: response.status }
      )
    }

    const bookGenres = await response.json()
    return NextResponse.json(bookGenres)

  } catch (error) {
    console.error('Error fetching book genres:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookId = params.id
    const body = await request.json()
    const { genreId, isAutoAssigned } = body

    if (!genreId || typeof genreId !== 'number') {
      return NextResponse.json(
        { error: 'Valid genre ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE}/books/${bookId}/genres`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user.email}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        genreId,
        isAutoAssigned: isAutoAssigned || false
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Worker API error:', errorText)
      
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Genre already assigned to this book' },
          { status: 409 }
        )
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Book or genre not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to assign genre to book' },
        { status: response.status }
      )
    }

    const bookGenre = await response.json()
    return NextResponse.json(bookGenre, { status: 201 })

  } catch (error) {
    console.error('Error assigning genre to book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookId = params.id
    const body = await request.json()
    const { genres } = body

    if (!Array.isArray(genres)) {
      return NextResponse.json(
        { error: 'Genres must be an array' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE}/books/${bookId}/genres`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.user.email}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ genreIds: genres.map(genre => genre.id) }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Worker API error:', errorText)
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update book genres' },
        { status: response.status }
      )
    }

    const updatedGenres = await response.json()
    return NextResponse.json(updatedGenres)

  } catch (error) {
    console.error('Error updating book genres:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}