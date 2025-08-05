import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server'
import {
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/browser'

interface DatabaseBinding {
  prepare(query: string): any
}

interface WebAuthnCredential {
  id: number
  user_id: string
  credential_id: string
  public_key: string
  counter: number
  device_type: 'platform' | 'cross-platform'
  device_name: string | null
  transports: string | null
  authenticator_aaguid: string | null
  backup_eligible: boolean
  backup_state: boolean
  created_at: string
  last_used_at: string | null
}

interface WebAuthnChallenge {
  id: number
  challenge: string
  user_id: string | null
  email: string | null
  challenge_type: 'registration' | 'authentication'
  expires_at: string
  used_at: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export class WebAuthnService {
  private db: DatabaseBinding
  private rpName: string
  private rpID: string
  private origin: string

  constructor(db: DatabaseBinding, rpName: string, rpID: string, origin: string) {
    this.db = db
    this.rpName = rpName
    this.rpID = rpID
    this.origin = origin
  }

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(
    userId: string,
    email: string,
    displayName: string
  ): Promise<any> {
    try {
      // Get user's existing credentials to exclude them
      const existingCredentials = await this.getUserCredentials(userId)
      
      const opts: GenerateRegistrationOptionsOpts = {
        rpName: this.rpName,
        rpID: this.rpID,
        userID: new TextEncoder().encode(userId),
        userName: email,
        userDisplayName: displayName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: existingCredentials.map(cred => ({
          id: new TextEncoder().encode(cred.credential_id),
          type: 'public-key',
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        })),
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
      }

      const options = await generateRegistrationOptions(opts)
      
      // Store challenge in database
      await this.storeChallenge(
        options.challenge,
        userId,
        email,
        'registration'
      )

      return options
    } catch (error) {
      console.error('Error generating registration options:', error)
      throw new Error('Failed to generate registration options')
    }
  }

  /**
   * Verify registration response and store credential
   */
  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
    deviceName?: string
  ): Promise<{ success: boolean; credentialId?: string }> {
    try {
      // Get and verify challenge
      const challenge = await this.getChallenge(response.response.clientDataJSON)
      if (!challenge || challenge.user_id !== userId || challenge.challenge_type !== 'registration') {
        throw new Error('Invalid or expired challenge')
      }

      const opts: VerifyRegistrationResponseOpts = {
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      }

      const verification = await verifyRegistrationResponse(opts)

      if (!verification.verified || !verification.registrationInfo) {
        return { success: false }
      }

      const { registrationInfo } = verification
      
      // Store credential in database
      // registrationInfo.credential.id is already base64url encoded, convert to standard base64
      const credentialIdBase64 = registrationInfo.credential.id.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - registrationInfo.credential.id.length % 4) % 4)
      const credentialId = await this.storeCredential({
        userId,
        credentialId: credentialIdBase64,
        publicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64'),
        counter: registrationInfo.credential.counter,
        deviceType: 'platform', // Default to platform for now
        deviceName: deviceName || 'Unknown Device',
        transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
        authenticatorAAGUID: registrationInfo.aaguid ? Buffer.from(registrationInfo.aaguid).toString('hex') : null,
        backupEligible: registrationInfo.credentialBackedUp || false,
        backupState: registrationInfo.credentialDeviceType !== 'singleDevice',
      })

      // Mark challenge as used
      await this.markChallengeUsed(challenge.challenge)

      // Enable WebAuthn for user
      await this.enableWebAuthnForUser(userId)

      return { success: true, credentialId }
    } catch (error) {
      console.error('Error verifying registration response:', error)
      return { success: false }
    }
  }

  /**
   * Generate authentication options for existing passkeys
   */
  async generateAuthenticationOptions(
    userId?: string,
    email?: string
  ): Promise<any> {
    try {
      let allowCredentials: any[] = []

      // If userId provided, get their specific credentials
      if (userId) {
        const userCredentials = await this.getUserCredentials(userId)
        allowCredentials = userCredentials.map(cred => ({
          id: new TextEncoder().encode(cred.credential_id),
          type: 'public-key',
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        }))
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'required',
        rpID: this.rpID,
      }

      const options = await generateAuthenticationOptions(opts)

      // Store challenge
      await this.storeChallenge(
        options.challenge,
        userId || null,
        email || null,
        'authentication'
      )

      return options
    } catch (error) {
      console.error('Error generating authentication options:', error)
      throw new Error('Failed to generate authentication options')
    }
  }

  /**
   * Verify authentication response
   */
  async verifyAuthenticationResponse(
    response: AuthenticationResponseJSON
  ): Promise<{ success: boolean; userId?: string }> {
    try {
      // Get challenge
      const challenge = await this.getChallenge(response.response.clientDataJSON)
      if (!challenge || challenge.challenge_type !== 'authentication') {
        throw new Error('Invalid or expired challenge')
      }

      // Get credential from database
      // response.id is base64url encoded, but we store as standard base64
      const credentialId = response.id.replace(/-/g, '+').replace(/_/g, '/')
      // Add padding if needed
      const paddedCredentialId = credentialId + '='.repeat((4 - credentialId.length % 4) % 4)
      const credential = await this.getCredentialById(paddedCredentialId)
      
      if (!credential) {
        throw new Error('Credential not found')
      }

      const opts: VerifyAuthenticationResponseOpts = {
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: credential.credential_id,
          publicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64')),
          counter: credential.counter,
          transports: credential.transports ? JSON.parse(credential.transports) : undefined,
        },
        requireUserVerification: true,
      }

      const verification = await verifyAuthenticationResponse(opts)

      if (!verification.verified) {
        return { success: false }
      }

      // Update credential counter and last used
      await this.updateCredentialCounter(credential.credential_id, verification.authenticationInfo.newCounter)
      
      // Mark challenge as used
      await this.markChallengeUsed(challenge.challenge)

      return { success: true, userId: credential.user_id }
    } catch (error) {
      console.error('Error verifying authentication response:', error)
      return { success: false }
    }
  }

  /**
   * Get user's WebAuthn credentials
   */
  async getUserCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM webauthn_credentials WHERE user_id = ? ORDER BY created_at DESC'
    )
    const result = await stmt.bind(userId).all()
    return result.results || []
  }

  /**
   * Delete a credential
   */
  async deleteCredential(userId: string, credentialId: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        'DELETE FROM webauthn_credentials WHERE user_id = ? AND credential_id = ?'
      )
      await stmt.bind(userId, credentialId).run()
      return true
    } catch (error) {
      console.error('Error deleting credential:', error)
      return false
    }
  }

  /**
   * Store challenge in database
   */
  private async storeChallenge(
    challenge: string,
    userId: string | null,
    email: string | null,
    type: 'registration' | 'authentication',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    
    const stmt = this.db.prepare(`
      INSERT INTO webauthn_challenges 
      (challenge, user_id, email, challenge_type, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    await stmt.bind(challenge, userId, email, type, expiresAt, ipAddress || null, userAgent || null).run()
  }

  /**
   * Get challenge from database
   */
  private async getChallenge(clientDataJSON: string): Promise<WebAuthnChallenge | null> {
    try {
      const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString())
      const challenge = clientData.challenge
      
      const stmt = this.db.prepare(`
        SELECT * FROM webauthn_challenges 
        WHERE challenge = ? AND used_at IS NULL AND expires_at > datetime('now')
      `)
      
      const result = await stmt.bind(challenge).first()
      return result || null
    } catch (error) {
      console.error('Error getting challenge:', error)
      return null
    }
  }

  /**
   * Mark challenge as used
   */
  private async markChallengeUsed(challenge: string): Promise<void> {
    const stmt = this.db.prepare(
      'UPDATE webauthn_challenges SET used_at = datetime("now") WHERE challenge = ?'
    )
    await stmt.bind(challenge).run()
  }

  /**
   * Store credential in database
   */
  private async storeCredential(data: {
    userId: string
    credentialId: string
    publicKey: string
    counter: number
    deviceType: 'platform' | 'cross-platform'
    deviceName: string
    transports: string | null
    authenticatorAAGUID: string | null
    backupEligible: boolean
    backupState: boolean
  }): Promise<string> {
    const stmt = this.db.prepare(`
      INSERT INTO webauthn_credentials 
      (user_id, credential_id, public_key, counter, device_type, device_name, 
       transports, authenticator_aaguid, backup_eligible, backup_state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    await stmt.bind(
      data.userId,
      data.credentialId,
      data.publicKey,
      data.counter,
      data.deviceType,
      data.deviceName,
      data.transports,
      data.authenticatorAAGUID,
      data.backupEligible,
      data.backupState
    ).run()
    
    return data.credentialId
  }

  /**
   * Get credential by ID
   */
  private async getCredentialById(credentialId: string): Promise<WebAuthnCredential | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM webauthn_credentials WHERE credential_id = ?'
    )
    const result = await stmt.bind(credentialId).first()
    return result || null
  }

  /**
   * Update credential counter
   */
  private async updateCredentialCounter(credentialId: string, newCounter: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE webauthn_credentials 
      SET counter = ?, last_used_at = datetime('now')
      WHERE credential_id = ?
    `)
    await stmt.bind(newCounter, credentialId).run()
  }

  /**
   * Enable WebAuthn for user
   */
  private async enableWebAuthnForUser(userId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET webauthn_enabled = TRUE, webauthn_enabled_at = datetime('now')
      WHERE id = ?
    `)
    await stmt.bind(userId).run()
  }
}