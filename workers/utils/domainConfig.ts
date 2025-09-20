/**
 * Worker-side Domain Configuration
 *
 * Provides centralized domain configuration for Cloudflare Workers.
 * Mirrors the frontend domain configuration system.
 *
 * LCWEB-184: Centralized Domain Configuration System
 */

import { Env } from '../types'

export type Environment = 'local' | 'staging' | 'production'

export interface WorkerDomainUrls {
  frontendUrl: string
  fromEmail: string
  supportEmail: string
  adminEmail: string
}

/**
 * Detect environment from worker environment variables
 */
export function detectWorkerEnvironment(env: Env): Environment {
  // Check explicit environment variable
  const explicitEnv = env.ENVIRONMENT?.toLowerCase()
  if (explicitEnv === 'local' || explicitEnv === 'staging' || explicitEnv === 'production') {
    return explicitEnv as Environment
  }

  // Fallback detection based on APP_URL
  const appUrl = env.APP_URL || ''

  if (appUrl.includes('localhost')) {
    return 'local'
  } else if (appUrl.includes('staging')) {
    return 'staging'
  } else {
    return 'production'
  }
}

/**
 * Get computed domain URLs for workers
 * Uses environment variables with smart defaults based on environment
 */
export function getWorkerDomainUrls(env: Env): WorkerDomainUrls {
  const environment = detectWorkerEnvironment(env)

  // If we have explicit configuration, use it
  if (env.APP_URL && env.FROM_EMAIL) {
    return {
      frontendUrl: env.APP_URL,
      fromEmail: env.FROM_EMAIL,
      supportEmail: env.FROM_EMAIL.replace('librarian@', 'support@'),
      adminEmail: env.FROM_EMAIL.replace('librarian@', 'admin@')
    }
  }

  // Otherwise, compute based on environment and available variables
  switch (environment) {
    case 'local':
      return {
        frontendUrl: 'http://localhost:3000',
        fromEmail: 'LibraryCard <noreply@localhost>',
        supportEmail: 'support@localhost',
        adminEmail: 'admin@localhost'
      }

    case 'staging':
      const stagingDomain = env.DOMAIN || 'staging--libarycard.netlify.app'
      const stagingEmailDomain = env.EMAIL_DOMAIN || 'tim52.io'

      return {
        frontendUrl: stagingDomain.startsWith('http') ? stagingDomain : `https://${stagingDomain}`,
        fromEmail: `LibraryCard <librarian@${stagingEmailDomain}>`,
        supportEmail: `support@${stagingEmailDomain}`,
        adminEmail: `admin@${stagingEmailDomain}`
      }

    case 'production':
      const productionDomain = env.DOMAIN || 'librarycard.tim52.io'
      const productionEmailDomain = env.EMAIL_DOMAIN || 'tim52.io'

      return {
        frontendUrl: `https://${productionDomain}`,
        fromEmail: `LibraryCard <librarian@${productionEmailDomain}>`,
        supportEmail: `support@${productionEmailDomain}`,
        adminEmail: `admin@${productionEmailDomain}`
      }
  }
}

/**
 * Get frontend URL for current environment
 */
export function getWorkerFrontendUrl(env: Env): string {
  return getWorkerDomainUrls(env).frontendUrl
}

/**
 * Get FROM email address for current environment
 */
export function getWorkerFromEmail(env: Env): string {
  return getWorkerDomainUrls(env).fromEmail
}

/**
 * Get support email address for current environment
 */
export function getWorkerSupportEmail(env: Env): string {
  return getWorkerDomainUrls(env).supportEmail
}

/**
 * Get admin email address for current environment
 */
export function getWorkerAdminEmail(env: Env): string {
  return getWorkerDomainUrls(env).adminEmail
}

/**
 * Validate worker domain configuration
 */
export function validateWorkerDomainConfig(env: Env): {
  isValid: boolean
  warnings: string[]
  environment: Environment
  urls: WorkerDomainUrls
} {
  const warnings: string[] = []
  const environment = detectWorkerEnvironment(env)
  const urls = getWorkerDomainUrls(env)

  // Check for required variables in production
  if (environment === 'production') {
    if (!env.APP_URL && !env.DOMAIN) {
      warnings.push('Production environment should have APP_URL or DOMAIN set')
    }
    if (!env.FROM_EMAIL && !env.EMAIL_DOMAIN) {
      warnings.push('Production environment should have FROM_EMAIL or EMAIL_DOMAIN set')
    }
  }

  // Check for HTTPS in production
  if (environment === 'production' && !urls.frontendUrl.startsWith('https://')) {
    warnings.push('Production frontend URL should use HTTPS')
  }

  // Check for localhost in non-local environments
  if (environment !== 'local' && urls.frontendUrl.includes('localhost')) {
    warnings.push('Non-local environment is using localhost URL')
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    environment,
    urls
  }
}

/**
 * Legacy compatibility function
 * Provides fallback to existing env.APP_URL pattern
 */
export function getAppUrl(env: Env): string {
  return env.APP_URL || getWorkerFrontendUrl(env)
}

/**
 * Legacy compatibility function
 * Provides fallback to existing env.FROM_EMAIL pattern
 */
export function getFromEmail(env: Env): string {
  return env.FROM_EMAIL || getWorkerFromEmail(env)
}