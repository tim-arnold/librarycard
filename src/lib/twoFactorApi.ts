import { getApiBaseUrl } from './apiConfig'
import { TOTPSetupResponse, TwoFactorStatus } from './types'

class TwoFactorAuthAPI {
  private async getAuthHeaders(includeCSRF: boolean = false): Promise<Headers> {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    
    // Get session from NextAuth
    const { getSession } = await import('next-auth/react')
    const session = await getSession()
    
    if (session?.user?.email) {
      headers.set('Authorization', `Bearer ${session.user.email}`)
      
      // Add CSRF token for state-changing operations
      if (includeCSRF) {
        try {
          const csrfResponse = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
            headers: {
              'Authorization': `Bearer ${session.user.email}`
            }
          })
          
          if (csrfResponse.ok) {
            const data = await csrfResponse.json()
            if (data.csrfToken) {
              headers.set('X-CSRF-Token', data.csrfToken)
            }
          }
        } catch (error) {
          console.error('Failed to fetch CSRF token:', error)
        }
      }
    }
    
    return headers
  }

  async getStatus(): Promise<TwoFactorStatus> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/status`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get 2FA status' }))
      throw new Error(error.error || 'Failed to get 2FA status')
    }

    return response.json()
  }

  async initializeSetup(): Promise<TOTPSetupResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/setup`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to initialize 2FA setup' }))
      throw new Error(error.error || 'Failed to initialize 2FA setup')
    }

    return response.json()
  }

  async completeSetup(secret: string, totpCode: string, backupCodes: string[]): Promise<{ message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/setup`, {
      method: 'POST',
      headers: await this.getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({
        secret,
        totpCode,
        backupCodes
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to complete 2FA setup' }))
      throw new Error(error.error || 'Failed to complete 2FA setup')
    }

    return response.json()
  }

  async verifyTOTP(totpCode: string): Promise<{ message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: await this.getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ totpCode })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Invalid TOTP code' }))
      throw new Error(error.error || 'Invalid TOTP code')
    }

    return response.json()
  }

  async verifyBackupCode(backupCode: string): Promise<{ message: string; warning?: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/verify-backup`, {
      method: 'POST',
      headers: await this.getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ backupCode })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Invalid backup code' }))
      throw new Error(error.error || 'Invalid backup code')
    }

    return response.json()
  }

  async disable2FA(password: string): Promise<{ message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/disable`, {
      method: 'POST',
      headers: await this.getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ password })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to disable 2FA' }))
      throw new Error(error.error || 'Failed to disable 2FA')
    }

    return response.json()
  }

  async regenerateBackupCodes(): Promise<{ message: string; backupCodes: string[] }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/backup-codes`, {
      method: 'POST',
      headers: await this.getAuthHeaders(true),
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to regenerate backup codes' }))
      throw new Error(error.error || 'Failed to regenerate backup codes')
    }

    return response.json()
  }
}

export const twoFactorAPI = new TwoFactorAuthAPI()