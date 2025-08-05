import { getApiBaseUrl } from './apiConfig'
import {
  startRegistration,
  startAuthentication,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/browser'

export interface WebAuthnCredential {
  id: number
  device_name: string | null
  device_type: 'platform' | 'cross-platform'
  created_at: string
  last_used_at: string | null
}

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types'

/**
 * WebAuthn API client for managing passkeys
 */
export class WebAuthnAPI {
  private baseUrl = getApiBaseUrl()

  /**
   * Get user's WebAuthn credentials
   */
  async getCredentials(userEmail: string): Promise<WebAuthnCredential[]> {
    const response = await fetch(`${this.baseUrl}/api/auth/webauthn/credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userEmail}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get credentials')
    }

    return response.json()
  }

  /**
   * Start passkey registration process
   */
  async startRegistration(userEmail: string): Promise<RegistrationResponseJSON> {
    // Get registration options from server
    const optionsResponse = await fetch(`${this.baseUrl}/api/auth/webauthn/register/begin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userEmail}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json()
      throw new Error(error.error || 'Failed to start registration')
    }

    const options: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json()

    // Start registration with browser WebAuthn API
    const registrationResponse = await startRegistration({ optionsJSON: options })
    
    return registrationResponse
  }

  /**
   * Complete passkey registration
   */
  async completeRegistration(
    userEmail: string, 
    registrationResponse: RegistrationResponseJSON,
    deviceName?: string
  ): Promise<{ success: boolean; credentialId?: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/webauthn/register/finish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userEmail}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: registrationResponse,
        deviceName,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to complete registration')
    }

    return response.json()
  }

  /**
   * Start passkey authentication process
   */
  async startAuthentication(email?: string): Promise<AuthenticationResponseJSON> {
    // Get authentication options from server
    const optionsResponse = await fetch(`${this.baseUrl}/api/auth/webauthn/authenticate/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json()
      throw new Error(error.error || 'Failed to start authentication')
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json()

    // Start authentication with browser WebAuthn API
    const authenticationResponse = await startAuthentication({ optionsJSON: options })
    
    return authenticationResponse
  }

  /**
   * Complete passkey authentication
   */
  async completeAuthentication(
    authenticationResponse: AuthenticationResponseJSON
  ): Promise<{ success: boolean; token?: string; userId?: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/webauthn/authenticate/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authenticationResponse),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Authentication failed')
    }

    return response.json()
  }

  /**
   * Delete a passkey credential
   */
  async deleteCredential(userEmail: string, credentialId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/auth/webauthn/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userEmail}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete credential')
    }

    const result = await response.json()
    return result.success
  }

  /**
   * Check if WebAuthn is supported in current browser
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           'credentials' in navigator &&
           typeof PublicKeyCredential !== 'undefined'
  }

  /**
   * Check if platform authenticator (Touch ID, Face ID, Windows Hello) is available
   */
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }

  /**
   * Get user-friendly device name based on platform
   */
  static getDeviceName(): string {
    if (typeof window === 'undefined') return 'Unknown Device'
    
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('mac')) {
      return 'Mac Touch ID'
    } else if (userAgent.includes('win')) {
      return 'Windows Hello'
    } else if (userAgent.includes('iphone')) {
      return 'iPhone Face ID/Touch ID'
    } else if (userAgent.includes('android')) {
      return 'Android Biometric'
    } else {
      return 'Biometric Authentication'
    }
  }
}