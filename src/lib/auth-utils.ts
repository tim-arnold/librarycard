import { Session } from 'next-auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.librarycard.tim52.io'

export interface AuthenticatedFetchOptions {
  method?: string
  body?: object
  additionalHeaders?: Record<string, string>
}

export interface AuthenticatedApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function authenticatedFetch<T = unknown>(
  session: Session | null,
  endpoint: string,
  options: AuthenticatedFetchOptions = {}
): Promise<AuthenticatedApiResult<T>> {
  if (!session?.user?.email) {
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  const { method = 'GET', body, additionalHeaders = {} } = options

  const headers = {
    'Authorization': `Bearer ${session.user.email}`,
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  const fetchOptions: RequestInit = {
    method,
    headers
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `Request failed with status ${response.status}`
      }
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

export function requireAuth(session: Session | null): string | null {
  if (!session?.user?.email) {
    return 'Authentication required'
  }
  return null
}