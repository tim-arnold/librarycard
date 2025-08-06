import type { EnhancedBook } from '@/lib/types'
import { getSession } from 'next-auth/react'

async function getCSRFToken(): Promise<string | null> {
  try {
    const session = await getSession()
    if (!session?.user?.email) return null
    
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const response = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
      headers: {
        'Authorization': `Bearer ${session.user.email}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.csrfToken
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
  }
  return null
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session?.user?.email) {
    headers['Authorization'] = `Bearer ${session.user.email}`
    
    // Add CSRF token for state-changing operations
    const csrfToken = await getCSRFToken()
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }
  
  return headers
}

// Export a generic CSRF-enabled fetch helper for use throughout the app
export async function authenticatedApiCall(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const { getApiBaseUrl } = await import('@/lib/apiConfig')
  const headers = await getAuthHeaders()
  
  return fetch(`${getApiBaseUrl()}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
}

export async function saveBook(book: Omit<EnhancedBook, 'id'>): Promise<boolean> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${getApiBaseUrl()}/api/books`, {
      method: 'POST',
      headers,
      body: JSON.stringify(book),
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to save book:', error)
    
    // Fallback to localStorage
    const existingBooks = JSON.parse(localStorage.getItem('library') || '[]')
    const bookWithId = { ...book, id: `${book.isbn}-${Date.now()}` }
    const updatedBooks = [...existingBooks, bookWithId]
    localStorage.setItem('library', JSON.stringify(updatedBooks))
    return true
  }
}

// Batched dashboard API call - replaces multiple sequential calls
export async function getDashboardData(): Promise<{
  profile: any,
  locations: any[],
  books: EnhancedBook[],
  shelves: any[],
  permissions: {
    global: string[],
    user: string[]
  },
  pendingRemovalRequests: Record<string, number>,
  csrfToken: string
} | null> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${getApiBaseUrl()}/api/dashboard`, {
      headers,
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
  
  return null
}

export async function getBooks(): Promise<EnhancedBook[]> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${getApiBaseUrl()}/api/books`, {
      headers,
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch books:', error)
  }
  
  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('library') || '[]')
}

export async function updateBook(id: string | number, updates: Partial<EnhancedBook>): Promise<boolean> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${getApiBaseUrl()}/api/books/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    })
    
    if (!response.ok) {
      // Log the actual error response for debugging
      const errorText = await response.text()
      console.error(`Book update failed with status ${response.status}:`, errorText)
    }
    
    return response.ok
  } catch (error) {
    console.error('Failed to update book:', error)
    
    // Fallback to localStorage
    const existingBooks = JSON.parse(localStorage.getItem('library') || '[]')
    const updatedBooks = existingBooks.map((book: EnhancedBook) =>
      book.id === id ? { ...book, ...updates } : book
    )
    localStorage.setItem('library', JSON.stringify(updatedBooks))
    return true
  }
}

export async function deleteBook(id: string | number): Promise<boolean> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${getApiBaseUrl()}/api/books/${id}`, {
      method: 'DELETE',
      headers,
    })
    return response.ok
  } catch (error) {
    console.error('Failed to delete book:', error)
    
    // Fallback to localStorage
    const existingBooks = JSON.parse(localStorage.getItem('library') || '[]')
    const updatedBooks = existingBooks.filter((book: EnhancedBook) => book.id !== id)
    localStorage.setItem('library', JSON.stringify(updatedBooks))
    return true
  }
}

export async function getBooksWithRatings(): Promise<EnhancedBook[]> {
  const { getApiBaseUrl } = await import('@/lib/apiConfig')
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${getApiBaseUrl()}/api/books`, {
    headers,
  })
  if (!response.ok) {
    throw new Error('Failed to fetch books')
  }
  return response.json()
}

export async function getUserLocationName(): Promise<string | null> {
  try {
    const { getApiBaseUrl } = await import('@/lib/apiConfig')
    const response = await fetch(`${getApiBaseUrl()}/api/locations`)
    if (!response.ok) {
      return null
    }
    const locations = await response.json()
    return locations.length > 0 ? locations[0].name : null
  } catch (error) {
    console.error('Failed to fetch location name:', error)
    return null
  }
}