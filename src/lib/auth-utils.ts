import { Session } from 'next-auth'
import { getApiBaseUrl } from '@/lib/apiConfig'

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

async function getCSRFToken(userEmail: string): Promise<string | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
      headers: {
        'Authorization': `Bearer ${userEmail}`
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

  // Use JWT token if available, fallback to email for backward compatibility
  const token = (session as any)?.access_token || session.user.email;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  // Add CSRF token for state-changing operations
  if (method !== 'GET') {
    const csrfToken = await getCSRFToken(session.user.email)
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, fetchOptions)
    
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