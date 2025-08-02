import { authenticator } from '@otplib/preset-default';
// Using Web Crypto API for performance instead of bcryptjs
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Env } from '../types';

interface BackupCodeRow {
  id: number;
  code_hash: string;
  used_at?: string;
}

interface UserTotpRow {
  totp_enabled: number | boolean;
  totp_secret?: string;
}

interface BackupCodeStats {
  total: number;
  used: number;
}

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface BackupCode {
  code: string;
  codeHash: string;
}

export class TOTPService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code URL for TOTP setup
   */
  async generateQRCodeUrl(email: string, secret: string): Promise<string> {
    const issuer = 'LibraryCard';
    const otpauthUrl = authenticator.keyuri(email, issuer, secret);
    
    try {
      // Generate QR code as SVG string (works in Workers environment)
      const qrCodeSvg = await QRCode.toString(otpauthUrl, {
        type: 'svg',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Convert SVG to data URL
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;
      
      return svgDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token against a secret
   * Uses a time window of ±1 step (30 seconds) for clock drift tolerance
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      // Remove any spaces from the token
      const cleanToken = token.replace(/\s/g, '');
      
      // Verify with a window of ±1 step for clock drift tolerance
      return authenticator.check(cleanToken, secret);
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   * Returns 8 codes in format: XXXX-XXXX
   */
  generateBackupCodes(): BackupCode[] {
    const codes: BackupCode[] = [];
    
    for (let i = 0; i < 8; i++) {
      // Generate 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      
      codes.push({
        code: formattedCode,
        codeHash: '' // Will be hashed when stored
      });
    }
    
    return codes;
  }

  /**
   * Hash backup codes for secure storage using Web Crypto API
   */
  async hashBackupCodes(codes: BackupCode[]): Promise<BackupCode[]> {
    const hashedCodes: BackupCode[] = [];
    
    for (const backupCode of codes) {
      const codeHash = await this.hashPassword(backupCode.code);
      
      hashedCodes.push({
        code: backupCode.code,
        codeHash: codeHash
      });
    }
    
    return hashedCodes;
  }

  /**
   * Hash a password using Web Crypto API with salt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Combine salt and password
    const combined = new Uint8Array(salt.length + data.length);
    combined.set(salt);
    combined.set(data, salt.length);
    
    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Combine salt and hash for storage
    const result = new Uint8Array(salt.length + hashArray.length);
    result.set(salt);
    result.set(hashArray, salt.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Verify a password against a hash using Web Crypto API
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Decode the stored hash
      const stored = new Uint8Array(atob(hash).split('').map(char => char.charCodeAt(0)));
      
      // Extract salt (first 16 bytes)
      const salt = stored.slice(0, 16);
      const storedHash = stored.slice(16);
      
      // Hash the provided password with the same salt
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      
      const combined = new Uint8Array(salt.length + data.length);
      combined.set(salt);
      combined.set(data, salt.length);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
      const hashArray = new Uint8Array(hashBuffer);
      
      // Compare hashes
      if (hashArray.length !== storedHash.length) {
        return false;
      }
      
      for (let i = 0; i < hashArray.length; i++) {
        if (hashArray[i] !== storedHash[i]) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a backup code against stored hashes
   */
  async validateBackupCode(userId: string, inputCode: string): Promise<boolean> {
    try {
      // Clean the input code (remove spaces, convert to uppercase)
      const cleanCode = inputCode.replace(/\s/g, '').toUpperCase();
      
      // Get unused backup codes from database
      const codes = await this.env.DB.prepare(`
        SELECT id, code_hash 
        FROM user_recovery_codes 
        WHERE user_id = ? AND used_at IS NULL
      `).bind(userId).all();

      if (!codes.results || codes.results.length === 0) {
        return false;
      }

      // Check each code
      for (const row of codes.results as BackupCodeRow[]) {
        const isValid = await this.verifyPassword(cleanCode, row.code_hash);
        
        if (isValid) {
          // Mark the code as used
          await this.env.DB.prepare(`
            UPDATE user_recovery_codes 
            SET used_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(row.id).run();
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Backup code validation error:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(userId: string, secret: string, backupCodes: BackupCode[]): Promise<void> {
    try {
      // Hash backup codes
      const hashedCodes = await this.hashBackupCodes(backupCodes);
      
      // Start transaction
      await this.env.DB.prepare(`
        UPDATE users 
        SET totp_secret = ?, 
            totp_enabled = TRUE, 
            totp_enabled_at = CURRENT_TIMESTAMP,
            backup_codes = ?
        WHERE id = ?
      `).bind(
        secret,
        JSON.stringify(hashedCodes.map(c => c.codeHash)),
        userId
      ).run();

      // Store backup codes in recovery table for better management
      for (const code of hashedCodes) {
        await this.env.DB.prepare(`
          INSERT INTO user_recovery_codes (user_id, code_hash)
          VALUES (?, ?)
        `).bind(userId, code.codeHash).run();
      }

      // Log security event
      await this.logSecurityEvent(userId, '2fa_enabled', {
        method: 'totp',
        backup_codes_generated: hashedCodes.length
      });

    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string): Promise<void> {
    try {
      // Clear 2FA data
      await this.env.DB.prepare(`
        UPDATE users 
        SET totp_secret = NULL, 
            totp_enabled = FALSE, 
            totp_enabled_at = NULL,
            backup_codes = NULL
        WHERE id = ?
      `).bind(userId).run();

      // Remove backup codes
      await this.env.DB.prepare(`
        DELETE FROM user_recovery_codes WHERE user_id = ?
      `).bind(userId).run();

      // Log security event
      await this.logSecurityEvent(userId, '2fa_disabled', {
        method: 'totp'
      });

    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT totp_enabled FROM users WHERE id = ?
      `).bind(userId).first() as UserTotpRow | null;

      return result?.totp_enabled === 1 || result?.totp_enabled === true;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Get user's TOTP secret (for verification)
   */
  async getUserTOTPSecret(userId: string): Promise<string | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT totp_secret FROM users WHERE id = ? AND totp_enabled = TRUE
      `).bind(userId).first() as UserTotpRow | null;

      return result?.totp_secret || null;
    } catch (error) {
      console.error('Error getting TOTP secret:', error);
      return null;
    }
  }

  /**
   * Generate new backup codes (replace existing ones)
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      // Generate new codes
      const newCodes = this.generateBackupCodes();
      const hashedCodes = await this.hashBackupCodes(newCodes);

      // Remove old backup codes
      await this.env.DB.prepare(`
        DELETE FROM user_recovery_codes WHERE user_id = ?
      `).bind(userId).run();

      // Update user table
      await this.env.DB.prepare(`
        UPDATE users SET backup_codes = ? WHERE id = ?
      `).bind(
        JSON.stringify(hashedCodes.map(c => c.codeHash)),
        userId
      ).run();

      // Store new backup codes
      for (const code of hashedCodes) {
        await this.env.DB.prepare(`
          INSERT INTO user_recovery_codes (user_id, code_hash)
          VALUES (?, ?)
        `).bind(userId, code.codeHash).run();
      }

      // Log security event
      await this.logSecurityEvent(userId, 'backup_codes_regenerated', {
        codes_count: newCodes.length
      });

      // Return plain text codes for display (only time they're shown)
      return newCodes.map(c => c.code);

    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Get backup codes usage status
   */
  async getBackupCodesStatus(userId: string): Promise<{total: number, used: number, remaining: number}> {
    try {
      const totalResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM user_recovery_codes WHERE user_id = ?
      `).bind(userId).first() as { total: number } | null;

      const usedResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as used FROM user_recovery_codes WHERE user_id = ? AND used_at IS NOT NULL
      `).bind(userId).first() as { used: number } | null;

      const total = totalResult?.total || 0;
      const used = usedResult?.used || 0;
      const remaining = total - used;

      return { total, used, remaining };
    } catch (error) {
      console.error('Error getting backup codes status:', error);
      return { total: 0, used: 0, remaining: 0 };
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(userId: string, eventType: string, details: any, success: boolean = true): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO security_audit_log (user_id, event_type, event_details, success)
        VALUES (?, ?, ?, ?)
      `).bind(
        userId,
        eventType,
        JSON.stringify(details),
        success
      ).run();
    } catch (error) {
      console.error('Error logging security event:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
}