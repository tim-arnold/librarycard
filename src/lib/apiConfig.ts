// Centralized API configuration
// This ensures consistent API URL handling across all routes

export const getApiBaseUrl = (): string => {
  // In production, require the environment variable to be set
  if (process.env.NODE_ENV === 'production') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required in production')
    }
    return apiUrl
  }
  
  // In development, fallback to localhost if not set
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
}

export const API_BASE_URL = getApiBaseUrl()