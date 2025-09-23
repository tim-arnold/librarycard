/**
 * Centralized Domain Configuration System
 *
 * Single source of truth for all domain-related configuration.
 * Enables easy domain switching via environment variables.
 *
 * LCWEB-184: Centralized Domain Configuration System
 */

export type Environment = 'local' | 'staging' | 'production'

export interface DomainConfig {
  /** Base domain (e.g., 'librarycard.tim52.io') */
  domain: string
  /** API subdomain override (e.g., 'api') */
  apiSubdomain?: string
  /** Email domain for FROM addresses (e.g., 'tim52.io') */
  emailDomain?: string
  /** Current environment */
  environment: Environment
}

export interface ComputedDomainUrls {
  /** Frontend application URL */
  frontendUrl: string
  /** API/Worker URL */
  apiUrl: string
  /** FROM email address for system emails */
  fromEmail: string
  /** Support email address */
  supportEmail: string
  /** Admin notification email */
  adminEmail: string
}

/**
 * Detect current environment based on available variables
 */
export function detectEnvironment(): Environment {
  // Check for explicit environment variable first
  const explicitEnv = process.env.ENVIRONMENT?.toLowerCase()
  if (explicitEnv === 'local' || explicitEnv === 'staging' || explicitEnv === 'production') {
    return explicitEnv as Environment
  }

  // Fallback detection based on URLs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  if (apiUrl.includes('localhost')) {
    return 'local'
  } else if (apiUrl.includes('staging')) {
    return 'staging'
  } else {
    return 'production'
  }
}

/**
 * Get domain configuration for current environment
 */
export function getDomainConfig(): DomainConfig {
  const environment = detectEnvironment()

  switch (environment) {
    case 'local':
      return {
        domain: 'localhost',
        environment: 'local'
      }

    case 'staging':
      return {
        domain: process.env.DOMAIN || 'staging--libarycard.netlify.app',
        apiSubdomain: process.env.API_SUBDOMAIN,
        emailDomain: process.env.EMAIL_DOMAIN || 'tim52.io',
        environment: 'staging'
      }

    case 'production':
      return {
        domain: process.env.DOMAIN || 'librarycard.tim52.io',
        apiSubdomain: process.env.API_SUBDOMAIN, // Only use if explicitly set
        emailDomain: process.env.EMAIL_DOMAIN || 'tim52.io',
        environment: 'production'
      }
  }
}

/**
 * Compute all URLs and email addresses from domain configuration
 */
export function getComputedUrls(): ComputedDomainUrls {
  const config = getDomainConfig()

  switch (config.environment) {
    case 'local':
      return {
        frontendUrl: 'http://localhost:3000',
        apiUrl: 'http://localhost:8787',
        fromEmail: 'LibraryCard <noreply@localhost>',
        supportEmail: 'support@localhost',
        adminEmail: 'admin@localhost'
      }

    case 'staging':
      const stagingApiUrl = process.env.NEXT_PUBLIC_API_URL ||
        `https://librarycard-api-staging.librarycard-staging.workers.dev`

      return {
        frontendUrl: config.domain.startsWith('http') ? config.domain : `https://${config.domain}`,
        apiUrl: stagingApiUrl,
        fromEmail: `LibraryCard <librarian@${config.emailDomain}>`,
        supportEmail: `support@${config.emailDomain}`,
        adminEmail: `admin@${config.emailDomain}`
      }

    case 'production':
      const productionApiUrl = config.apiSubdomain
        ? `https://${config.apiSubdomain}.${config.domain}`
        : process.env.NEXT_PUBLIC_API_URL || `https://librarycard-api-production.tim-arnold.workers.dev`

      return {
        frontendUrl: `https://${config.domain}`,
        apiUrl: productionApiUrl,
        fromEmail: `LibraryCard <librarian@${config.emailDomain}>`,
        supportEmail: `support@${config.emailDomain}`,
        adminEmail: `admin@${config.emailDomain}`
      }
  }
}

/**
 * Get API base URL (enhanced version of existing function)
 * Maintains backward compatibility with existing code
 */
export function getApiBaseUrl(): string {
  return getComputedUrls().apiUrl
}

/**
 * Get frontend URL for the current environment
 */
export function getFrontendUrl(): string {
  return getComputedUrls().frontendUrl
}

/**
 * Get FROM email address for system emails
 */
export function getFromEmail(): string {
  return getComputedUrls().fromEmail
}

/**
 * Get support email address
 */
export function getSupportEmail(): string {
  return getComputedUrls().supportEmail
}

/**
 * Get admin notification email address
 */
export function getAdminEmail(): string {
  return getComputedUrls().adminEmail
}

/**
 * Validate that domain configuration is properly set up
 * Useful for debugging and environment verification
 */
export function validateDomainConfig(): {
  isValid: boolean
  warnings: string[]
  config: DomainConfig
  urls: ComputedDomainUrls
} {
  const warnings: string[] = []
  const config = getDomainConfig()
  const urls = getComputedUrls()

  // Check for missing environment variables in production
  if (config.environment === 'production') {
    if (!process.env.DOMAIN && !process.env.NEXT_PUBLIC_API_URL) {
      warnings.push('Production environment should have DOMAIN or NEXT_PUBLIC_API_URL set')
    }
    if (!config.emailDomain) {
      warnings.push('EMAIL_DOMAIN should be set for production email delivery')
    }
  }

  // Check for localhost in non-local environments
  if (config.environment !== 'local') {
    if (urls.apiUrl.includes('localhost')) {
      warnings.push('Non-local environment is using localhost API URL')
    }
    if (urls.frontendUrl.includes('localhost')) {
      warnings.push('Non-local environment is using localhost frontend URL')
    }
  }

  // Check for HTTPS in production
  if (config.environment === 'production') {
    if (!urls.frontendUrl.startsWith('https://')) {
      warnings.push('Production frontend URL should use HTTPS')
    }
    if (!urls.apiUrl.startsWith('https://')) {
      warnings.push('Production API URL should use HTTPS')
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    config,
    urls
  }
}

/**
 * Get domain configuration as environment variables
 * Useful for generating deployment configurations
 */
export function getDomainEnvironmentVariables(): Record<string, string> {
  const urls = getComputedUrls()

  return {
    NEXT_PUBLIC_API_URL: urls.apiUrl,
    APP_URL: urls.frontendUrl,
    FROM_EMAIL: urls.fromEmail,
    SUPPORT_EMAIL: urls.supportEmail,
    ADMIN_EMAIL: urls.adminEmail
  }
}