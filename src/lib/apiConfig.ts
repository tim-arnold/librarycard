// Centralized API configuration
// This ensures consistent API URL handling across all routes
//
// LCWEB-184: Enhanced with centralized domain configuration

import { getApiBaseUrl as getDomainApiBaseUrl, validateDomainConfig } from './domainConfig'

export const getApiBaseUrl = (): string => {
  // Use centralized domain configuration
  return getDomainApiBaseUrl()
}

// Export function wrapper to avoid build-time evaluation issues
export const API_BASE_URL = () => getApiBaseUrl()

// Legacy compatibility export
export { getApiBaseUrl as getDomainApiBaseUrl } from './domainConfig'

/**
 * Validate API configuration for debugging
 * Usage: console.log(validateApiConfig())
 */
export const validateApiConfig = () => {
  const validation = validateDomainConfig()
  return {
    ...validation,
    apiUrl: getApiBaseUrl(),
    message: validation.isValid
      ? 'API configuration is valid'
      : `API configuration issues: ${validation.warnings.join(', ')}`
  }
}