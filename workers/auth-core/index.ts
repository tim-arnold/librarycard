import { Env } from '../types';
import { sendVerificationEmail, notifyAdminsOfSignupRequest, sendPasswordResetEmail } from '../email';
import { generateJWT } from '../auth/jwt';
import { getUserRole } from '../auth/index';
import { parseAndValidateJSON, AuthSchemas, validatePasswordStrength } from '../validation';
import { ErrorCategory, createSecureErrorResponse, withDatabaseErrorHandling } from '../errors';

// Core authentication functions extracted from main worker

export async function createOrUpdateUser(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // This endpoint is used by OAuth flows - validate basic user structure
  const userSchema = {
    id: { required: true, type: 'string' as const, maxLength: 255 },
    email: { required: true, type: 'email' as const, maxLength: 255 },
    first_name: { required: false, type: 'string' as const, maxLength: 50, sanitize: true },
    last_name: { required: false, type: 'string' as const, maxLength: 50, sanitize: true },
    auth_provider: { required: false, type: 'string' as const, allowedValues: ['email', 'google'] },
    email_verified: { required: false, type: 'boolean' as const }
  };
  
  const validation = await parseAndValidateJSON(request, userSchema);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const user = validation.data!;
  
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO users (id, email, first_name, last_name, auth_provider, email_verified, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  await stmt.bind(
    user.id,
    user.email,
    user.first_name || null,
    user.last_name || null,
    user.auth_provider || 'email',
    user.email_verified ? 1 : 0
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function registerUser(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, AuthSchemas.register);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { email, password, first_name, last_name, invitation_token } = validation.data!;
  
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return new Response(JSON.stringify({ error: passwordValidation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if user already exists
  const existingUser = await env.DB.prepare(`
    SELECT email FROM users WHERE email = ?
  `).bind(email).first();
  
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'User already exists' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if there's already a signup request for this email (pending or denied)
  let existingRequest = null;
  try {
    existingRequest = await env.DB.prepare(`
      SELECT email, status FROM signup_approval_requests WHERE email = ? AND status IN ('pending', 'denied')
    `).bind(email).first();
    
    if (existingRequest) {
      const status = (existingRequest as any).status;
      if (status === 'pending') {
        return new Response(JSON.stringify({ error: 'A signup request for this email is already pending admin approval' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (status === 'denied') {
        return new Response(JSON.stringify({ error: 'Your previous signup request was denied. Please contact an administrator if you believe this was an error.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    return createSecureErrorResponse(
      env,
      error,
      ErrorCategory.DATABASE_ERROR,
      { endpoint: '/api/auth/register' }
    );
  }
  
  // Check if user has a valid invitation
  let invitation = null;
  
  if (invitation_token) {
    // If invitation token is provided, look up by token
    invitation = await env.DB.prepare(`
      SELECT li.id, li.location_id, li.invited_by, l.name as location_name
      FROM location_invitations li
      LEFT JOIN locations l ON li.location_id = l.id
      WHERE li.invitation_token = ? AND li.used_at IS NULL AND li.expires_at > datetime('now')
    `).bind(invitation_token).first();
  } else {
    // Fall back to email lookup
    invitation = await env.DB.prepare(`
      SELECT li.id, li.location_id, li.invited_by, l.name as location_name
      FROM location_invitations li
      LEFT JOIN locations l ON li.location_id = l.id
      WHERE li.invited_email = ? AND li.used_at IS NULL AND li.expires_at > datetime('now')
    `).bind(email).first();
  }

  // Hash password for storage
  const passwordHash = await hashPassword(password);
  
  
  if (invitation) {
    // User has valid invitation - proceed with normal registration
    // Generate verification token
    const verificationToken = generateUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Generate user ID
    const userId = generateUUID();
    
    // For invited users, skip email verification since they were already verified by receiving the invitation
    const emailVerified = true; // Invited users are pre-verified
    
    // Create user
    const stmt = env.DB.prepare(`
      INSERT INTO users (
        id, email, first_name, last_name, password_hash, 
        auth_provider, email_verified, email_verification_token, 
        email_verification_expires, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'email', ?, ?, ?, datetime('now'), datetime('now'))
    `);

    await stmt.bind(
      userId,
      email,
      first_name,
      last_name || '',
      passwordHash,
      emailVerified,
      verificationToken,
      verificationExpires
    ).run();

    // Automatically accept the invitation by adding user to location
    try {
      // Add user as location member
      const addMemberStmt = env.DB.prepare(`
        INSERT INTO location_members (location_id, user_id, role, invited_by, joined_at)
        VALUES (?, ?, 'member', ?, datetime('now'))
      `);
      
      await addMemberStmt.bind(
        (invitation as any).location_id,
        userId,
        (invitation as any).invited_by
      ).run();

      // Apply default permissions to the new user
      const { applyDefaultPermissionsToUser } = await import('../locations');
      await applyDefaultPermissionsToUser((invitation as any).location_id, userId, (invitation as any).invited_by, env);

      // Mark invitation as used
      const updateInvitationStmt = env.DB.prepare(`
        UPDATE location_invitations 
        SET used_at = datetime('now')
        WHERE id = ?
      `);
      
      await updateInvitationStmt.bind((invitation as any).id).run();
    } catch (error) {
      console.error('Failed to auto-accept invitation during registration:', error);
      // Don't fail registration if invitation acceptance fails - user can manually accept later
    }

    // No verification email needed for invited users since they're pre-verified
    // await sendVerificationEmail(env, email, first_name, verificationToken);

    const message = `Registration successful! You have been automatically added to "${(invitation as any).location_name}". You can now sign in with your new account.`;

    return new Response(JSON.stringify({ 
      message,
      userId,
      requires_verification: false,
      has_invitation: true,
      location_name: (invitation as any).location_name,
      auto_accepted: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    // No invitation - create signup approval request
    try {
      const stmt = env.DB.prepare(`
        INSERT INTO signup_approval_requests (
          email, first_name, last_name, password_hash, auth_provider, 
          status, requested_at
        )
        VALUES (?, ?, ?, ?, 'email', 'pending', datetime('now'))
      `);

      const result = await stmt.bind(
        email,
        first_name,
        last_name || '',
        passwordHash
      ).run();

      // Notify all admins about the signup request (don't let email failures break the approval flow)
      try {
        await notifyAdminsOfSignupRequest(env, email, first_name, last_name);
      } catch (emailError) {
        console.error('Failed to send admin notification emails, but signup request was created:', emailError);
      }

      return new Response(JSON.stringify({ 
        message: 'Your signup request has been submitted for admin approval. You will receive an email notification once your request is reviewed.',
        requires_approval: true,
        request_id: result.meta.last_row_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to create signup approval request:', error);
      return new Response(JSON.stringify({ 
        error: 'Unable to process signup request. Please try again later or contact an administrator.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
}

export async function verifyCredentials(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, AuthSchemas.login);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { email, password } = validation.data!;
  
  const user = await env.DB.prepare(`
    SELECT id, email, first_name, last_name, password_hash, email_verified, auth_provider, totp_enabled
    FROM users 
    WHERE email = ? AND auth_provider = 'email'
  `).bind(email).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (!user.email_verified) {
    return new Response(JSON.stringify({ error: 'Please verify your email before signing in' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const isValidPassword = await verifyPassword(password, user.password_hash as string);
  
  if (!isValidPassword) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Clear user cache on successful login to ensure fresh data
  try {
    const { invalidateUserCache } = await import('../auth/cached');
    await invalidateUserCache(user.id as string, env);
  } catch (error) {
    console.error('Error clearing user cache on login:', error);
    // Continue with login even if cache clearing fails
  }
  
  // Check if 2FA is enabled for this user
  const is2FAEnabled = user.totp_enabled === 1 || user.totp_enabled === true;
  
  if (is2FAEnabled) {
    // 2FA is enabled - return partial authentication requiring TOTP verification
    return new Response(JSON.stringify({
      requires_2fa: true,
      user_id: user.id,
      email: user.email,
      message: 'Password verified. Please provide your 2FA code to complete login.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // 2FA not enabled - proceed with normal login
  // Get user role for JWT payload
  const userRole = await getUserRole(user.id as string, env);
  
  // Generate JWT token
  const jwt = await generateJWT({
    userId: user.id as string,
    email: user.email as string,
    role: userRole
  }, env);
  
  return new Response(JSON.stringify({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    auth_provider: user.auth_provider,
    access_token: jwt
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function verifyEmail(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Verification token required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const user = await env.DB.prepare(`
    SELECT id, email, email_verification_expires
    FROM users 
    WHERE email_verification_token = ? AND email_verified = FALSE
  `).bind(token).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired verification token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if token is expired
  if (new Date() > new Date(user.email_verification_expires as string)) {
    return new Response(JSON.stringify({ error: 'Verification token has expired' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Mark email as verified
  await env.DB.prepare(`
    UPDATE users 
    SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).bind(user.id).run();
  
  // Check if there are any pending invitations for this email
  const pendingInvitation = await env.DB.prepare(`
    SELECT invitation_token FROM location_invitations 
    WHERE invited_email = ? AND used_at IS NULL AND expires_at > datetime('now')
    ORDER BY created_at DESC 
    LIMIT 1
  `).bind(user.email).first();
  
  const responseData: any = { message: 'Email verified successfully' };
  
  if (pendingInvitation) {
    responseData.pending_invitation = (pendingInvitation as any).invitation_token;
  }
  
  return new Response(JSON.stringify(responseData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Utility functions for authentication
// Note: Password validation is now handled by the validation module

export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to Uint8Array
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Import the password as a key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive 256 bits (32 bytes) using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Combine salt and hash for storage
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Return as base64 string for database storage
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Try new PBKDF2 format first (base64 encoded)
    if (isBase64(storedHash) && storedHash.length > 40) {
      return await verifyPBKDF2Hash(password, storedHash);
    }
    
    // Fall back to old SHA-256 format for backwards compatibility
    return await verifyLegacyHash(password, storedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

async function verifyPBKDF2Hash(password: string, storedHash: string): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = new Uint8Array(
      atob(storedHash).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    
    // Convert password to Uint8Array
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Import the password as a key for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Derive bits using the same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const computedHash = new Uint8Array(derivedBits);
    
    // Compare hashes using constant-time comparison
    return constantTimeEqual(storedHashBytes, computedHash);
  } catch (error) {
    console.error('PBKDF2 verification error:', error);
    return false;
  }
}

async function verifyLegacyHash(password: string, storedHash: string): Promise<boolean> {
  // Legacy SHA-256 with simple salt for backwards compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedHash === storedHash;
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export async function forgotPassword(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, AuthSchemas.forgotPassword);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { email } = validation.data!;
  
  // Look up user by email
  const user = await env.DB.prepare(`
    SELECT id, email, first_name, auth_provider
    FROM users 
    WHERE email = ? AND auth_provider = 'email'
  `).bind(email).first();
  
  // Always return success to prevent user enumeration
  // even if email doesn't exist
  if (!user) {
    return new Response(JSON.stringify({ 
      message: 'If an account with that email exists, you will receive a password reset link shortly.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Generate reset token
  const resetToken = generateUUID();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  
  // Update user with reset token
  await env.DB.prepare(`
    UPDATE users 
    SET password_reset_token = ?, password_reset_expires = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(resetToken, resetExpires, user.id).run();
  
  // Send reset email
  try {
    await sendPasswordResetEmail(env, user.email as string, user.first_name as string, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Still return success to prevent enumeration
  }
  
  return new Response(JSON.stringify({ 
    message: 'If an account with that email exists, you will receive a password reset link shortly.' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function verifyResetToken(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Reset token required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const user = await env.DB.prepare(`
    SELECT id, email, password_reset_expires
    FROM users 
    WHERE password_reset_token = ?
  `).bind(token).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid reset token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if token is expired
  if (new Date() > new Date(user.password_reset_expires as string)) {
    return new Response(JSON.stringify({ error: 'Reset token has expired' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ 
    message: 'Reset token is valid',
    email: user.email
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function resetPassword(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, AuthSchemas.resetPassword);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { token, password } = validation.data!;
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return new Response(JSON.stringify({ error: passwordValidation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const user = await env.DB.prepare(`
    SELECT id, password_hash, password_reset_expires
    FROM users 
    WHERE password_reset_token = ?
  `).bind(token).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid reset token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if token is expired
  if (new Date() > new Date(user.password_reset_expires as string)) {
    return new Response(JSON.stringify({ error: 'Reset token has expired' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if new password is the same as current password
  const isSamePassword = await verifyPassword(password, user.password_hash as string);
  if (isSamePassword) {
    return new Response(JSON.stringify({ error: 'New password cannot be the same as your current password' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Hash new password
  const newPasswordHash = await hashPassword(password);
  
  // Update user password and clear reset token
  await env.DB.prepare(`
    UPDATE users 
    SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newPasswordHash, user.id).run();
  
  return new Response(JSON.stringify({ 
    message: 'Password has been reset successfully. You can now sign in with your new password.' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function changePassword(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, AuthSchemas.changePassword);
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { old_password: currentPassword, new_password: newPassword } = validation.data!;
  
  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return new Response(JSON.stringify({ error: passwordValidation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Get user by ID (from JWT token)
  const user = await env.DB.prepare(`
    SELECT id, password_hash, auth_provider
    FROM users 
    WHERE id = ?
  `).bind(userId).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Only allow password changes for email/password users
  if (user.auth_provider !== 'email') {
    return new Response(JSON.stringify({ error: 'Password changes are only allowed for email/password accounts' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash as string);
  if (!isCurrentPasswordValid) {
    return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check if new password is the same as current password
  const isSamePassword = await verifyPassword(newPassword, user.password_hash as string);
  if (isSamePassword) {
    return new Response(JSON.stringify({ error: 'New password cannot be the same as your current password' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);
  
  // Update user password
  await env.DB.prepare(`
    UPDATE users 
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newPasswordHash, user.id).run();
  
  return new Response(JSON.stringify({ 
    message: 'Password changed successfully!' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function complete2FALogin(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const validation = await parseAndValidateJSON(request, {
    user_id: { required: true, type: 'string' as const, maxLength: 255 },
    totp_code: { required: true, type: 'string' as const, pattern: /^\d{6}$/ }
  });
  
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const { user_id, totp_code } = validation.data!;
  
  // Get user and verify 2FA is enabled
  const user = await env.DB.prepare(`
    SELECT id, email, first_name, last_name, auth_provider, totp_enabled, totp_secret
    FROM users 
    WHERE id = ? AND totp_enabled = 1
  `).bind(user_id).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found or 2FA not enabled' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Import the TOTP service
  const { TOTPService } = await import('../auth/totp');
  const totpService = new TOTPService(env);
  
  // Verify the TOTP code
  const isValidTOTP = totpService.verifyToken(user.totp_secret as string, totp_code);
  
  if (!isValidTOTP) {
    return new Response(JSON.stringify({ error: 'Invalid 2FA code' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // 2FA verification successful - complete login
  // Get user role for JWT payload
  const userRole = await getUserRole(user.id as string, env);
  
  // Generate JWT token
  const jwt = await generateJWT({
    userId: user.id as string,
    email: user.email as string,
    role: userRole
  }, env);
  
  return new Response(JSON.stringify({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    auth_provider: user.auth_provider,
    access_token: jwt
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}