import { TOTPService } from './totp';
// Removed bcryptjs import - using Web Crypto API instead
import { verifyPassword } from '../auth-core';
import { 
  Env, 
  TOTPSetupRequest, 
  TOTPSetupResponse, 
  TOTPVerifyRequest, 
  TOTPDisableRequest,
  BackupCodeVerifyRequest,
  TwoFactorStatus 
} from '../types';
import { CommonErrors } from '../errors';

interface UserEmailRow {
  email: string;
}

interface UserPasswordRow {
  password_hash: string;
  email: string;
}

interface UserTotpStatusRow {
  totp_enabled: number | boolean;
  totp_enabled_at?: string;
}

export class TwoFactorAuth {
  private totpService: TOTPService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.totpService = new TOTPService(env);
  }

  /**
   * Initialize 2FA setup - generate secret and QR code
   */
  async initializeSetup(userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Check if user already has 2FA enabled
      const is2FAEnabled = await this.totpService.is2FAEnabled(userId);
      if (is2FAEnabled) {
        return new Response(JSON.stringify({
          error: '2FA is already enabled for this account'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user email for QR code
      const user = await this.env.DB.prepare(
        'SELECT email FROM users WHERE id = ?'
      ).bind(userId).first() as UserEmailRow | null;

      if (!user) {
        return CommonErrors.NOT_FOUND(this.env, corsHeaders);
      }

      // Generate secret and QR code URL
      const secret = this.totpService.generateSecret();
      const qrCodeUrl = await this.totpService.generateQRCodeUrl(user.email, secret);

      // Generate backup codes
      const backupCodes = this.totpService.generateBackupCodes();

      return new Response(JSON.stringify({
        secret,
        qrCodeUrl,
        backupCodes: backupCodes.map(c => c.code) // Return unhashed codes for display
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('2FA initialization error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to initialize 2FA setup'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Complete 2FA setup - verify TOTP code and enable 2FA
   */
  async completeSetup(request: Request, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as { secret: string; totpCode: string; backupCodes: string[] };
      const { secret, totpCode, backupCodes } = body;

      if (!secret || !totpCode || !backupCodes) {
        return new Response(JSON.stringify({
          error: 'Secret, TOTP code, and backup codes are required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify the TOTP code
      const isValidToken = this.totpService.verifyToken(secret, totpCode);
      if (!isValidToken) {
        return new Response(JSON.stringify({
          error: 'Invalid TOTP code. Please check your authenticator app and try again.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Convert backup codes to the format expected by TOTPService
      const backupCodeObjects = backupCodes.map((code: string) => ({
        code,
        codeHash: '' // Will be hashed by the service
      }));

      // Enable 2FA
      await this.totpService.enable2FA(userId, secret, backupCodeObjects);

      return new Response(JSON.stringify({
        message: '2FA has been successfully enabled for your account',
        enabled: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('2FA setup completion error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to complete 2FA setup'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTOTP(request: Request, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as TOTPVerifyRequest;
      const { totpCode } = body;

      if (!totpCode) {
        return new Response(JSON.stringify({
          error: 'TOTP code is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user's TOTP secret
      const secret = await this.totpService.getUserTOTPSecret(userId);
      if (!secret) {
        return new Response(JSON.stringify({
          error: '2FA is not enabled for this account'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify the TOTP code
      const isValid = this.totpService.verifyToken(secret, totpCode);
      
      if (isValid) {
        return new Response(JSON.stringify({
          message: 'TOTP verification successful',
          verified: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'Invalid TOTP code'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('TOTP verification error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to verify TOTP code'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(request: Request, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as BackupCodeVerifyRequest;
      const { backupCode } = body;

      if (!backupCode) {
        return new Response(JSON.stringify({
          error: 'Backup code is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify the backup code
      const isValid = await this.totpService.validateBackupCode(userId, backupCode);
      
      if (isValid) {
        // Get remaining backup codes count
        const status = await this.totpService.getBackupCodesStatus(userId);
        
        return new Response(JSON.stringify({
          message: 'Backup code verification successful',
          verified: true,
          warning: status.remaining <= 2 ? 'You have few backup codes remaining. Consider regenerating them in your security settings.' : undefined
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'Invalid or already used backup code'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('Backup code verification error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to verify backup code'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  async disable2FA(request: Request, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as TOTPDisableRequest;
      const { password } = body;

      if (!password) {
        return new Response(JSON.stringify({
          error: 'Password confirmation is required to disable 2FA'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user's password hash
      const user = await this.env.DB.prepare(
        'SELECT password_hash, email FROM users WHERE id = ?'
      ).bind(userId).first() as UserPasswordRow | null;

      if (!user || !user.password_hash) {
        return new Response(JSON.stringify({
          error: 'Cannot disable 2FA for OAuth-only accounts'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify password using the same function as login
      const isValidPassword = await verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        return new Response(JSON.stringify({
          error: 'Invalid password'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Disable 2FA
      await this.totpService.disable2FA(userId);

      return new Response(JSON.stringify({
        message: '2FA has been disabled for your account',
        enabled: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('2FA disable error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to disable 2FA'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const user = await this.env.DB.prepare(`
        SELECT totp_enabled, totp_enabled_at 
        FROM users 
        WHERE id = ?
      `).bind(userId).first() as UserTotpStatusRow | null;

      if (!user) {
        return CommonErrors.NOT_FOUND(this.env, corsHeaders);
      }

      const isEnabled = user.totp_enabled === 1 || user.totp_enabled === true;
      let backupCodes = { total: 0, used: 0, remaining: 0 };

      if (isEnabled) {
        backupCodes = await this.totpService.getBackupCodesStatus(userId);
      }

      const status: TwoFactorStatus = {
        enabled: isEnabled,
        enabledAt: user.totp_enabled_at || null,
        backupCodes
      };

      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('2FA status error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to get 2FA status'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Check if 2FA is enabled
      const is2FAEnabled = await this.totpService.is2FAEnabled(userId);
      if (!is2FAEnabled) {
        return new Response(JSON.stringify({
          error: '2FA must be enabled to regenerate backup codes'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Regenerate backup codes
      const newCodes = await this.totpService.regenerateBackupCodes(userId);

      return new Response(JSON.stringify({
        message: 'New backup codes generated successfully',
        backupCodes: newCodes
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to regenerate backup codes'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}