import { Env } from '../types';

// Utility function used by signup approval
function generateUUID(): string {
  return crypto.randomUUID();
}

// Email and notification functions extracted from main worker

export async function sendPasswordResetEmail(env: Env, email: string, firstName: string, resetToken: string) {
  if (!env.APP_URL) {
    throw new Error('APP_URL environment variable is required for password reset emails');
  }
  const appUrl = env.APP_URL;
  const resetUrl = `${appUrl.replace(/\/$/, '')}/auth/reset-password?token=${resetToken}`;
  
  // Use Resend for production email sending
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          to: [email],
          subject: 'Reset Your LibraryCard Password',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password - LibraryCard</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">Reset Your Password</h2>
                  
                  <p style="font-size: 16px; margin-bottom: 20px;">Hello ${firstName || 'there'},</p>
                  
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    We received a request to reset the password for your LibraryCard account. If you made this request, 
                    click the button below to set a new password:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;
                              transition: background-color 0.3s ease;">
                      Reset My Password
                    </a>
                  </div>
                  
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 25px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                      <strong>⚠️ Security Notice:</strong><br>
                      • This link will expire in 1 hour<br>
                      • This link can only be used once<br>
                      • If you didn't request this reset, you can safely ignore this email
                    </p>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 25px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                  </p>
                  <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                    ${resetUrl}
                  </p>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 25px;">
                    If you're having trouble accessing your account, please contact the Head Librarian through the app.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                    This is an automated message from LibraryCard. Please do not reply to this email.<br>
                    If you didn't request this password reset, no action is needed - your account remains secure.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
LibraryCard - Reset Your Password

Hello ${firstName || 'there'},

We received a request to reset the password for your LibraryCard account. If you made this request, 
visit the following link to set a new password:

${resetUrl}

Security Notice:
- This link will expire in 1 hour
- This link can only be used once
- If you didn't request this reset, you can safely ignore this email

If you're having trouble accessing your account, please contact the Head Librarian through the app.

This is an automated message from LibraryCard.
          `
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Password reset email sent successfully via Resend:', result);
      return result;
    } catch (error) {
      console.error('Error sending password reset email via Resend:', error);
      throw error;
    }
  }
  
  // Fallback to Postmark if available
  if (env.POSTMARK_API_TOKEN) {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': env.POSTMARK_API_TOKEN,
        },
        body: JSON.stringify({
          From: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          To: email,
          Subject: 'Reset Your LibraryCard Password',
          HtmlBody: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #673ab7;">📚 LibraryCard - Password Reset</h2>
                  
                  <p>Hello ${firstName || 'there'},</p>
                  
                  <p>We received a request to reset the password for your LibraryCard account.</p>
                  
                  <div style="margin: 30px 0; text-align: center;">
                    <a href="${resetUrl}" 
                       style="background-color: #673ab7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Reset My Password
                    </a>
                  </div>
                  
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p><strong>Security Notice:</strong></p>
                    <p>• This link expires in 1 hour<br>
                    • This link can only be used once<br>
                    • If you didn't request this, ignore this email</p>
                  </div>
                  
                  <p>If the button doesn't work, copy this link: ${resetUrl}</p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #666;">
                    This is an automated message from LibraryCard. If you didn't request this password reset, 
                    no action is needed - your account remains secure.
                  </p>
                </div>
              </body>
            </html>
          `,
          TextBody: `
LibraryCard - Reset Your Password

Hello ${firstName || 'there'},

We received a request to reset the password for your LibraryCard account.

Reset your password: ${resetUrl}

Security Notice:
- This link expires in 1 hour
- This link can only be used once
- If you didn't request this, ignore this email

This is an automated message from LibraryCard.
          `
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Postmark API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Password reset email sent successfully via Postmark:', result);
      return result;
    } catch (error) {
      console.error('Error sending password reset email via Postmark:', error);
      throw error;
    }
  }
  
  // Development fallback - log to console (sanitized)
  if (env.ENVIRONMENT === 'local') {
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Reset URL: [URL_REDACTED]`);
    console.log('==========================');
  }
}

export async function sendInvitationEmail(env: Env, email: string, locationName: string, token: string, invitedBy: string) {
  // Removed sensitive debug logging
  if (!env.APP_URL) {
    throw new Error('APP_URL environment variable is required for invitation emails');
  }
  const appUrl = env.APP_URL;
  // Debug logging only in local environment
  if (env.ENVIRONMENT === 'local') {
    console.log('DEBUG: appUrl =', appUrl);
  }
  
  // Extra defensive check
  if (!appUrl || typeof appUrl !== 'string') {
    throw new Error(`Invalid APP_URL: ${appUrl} (type: ${typeof appUrl})`);
  }
  
  const invitationUrl = `${appUrl.replace(/\/$/, '')}/auth/signin?invitation=${token}`;
  
  // Get inviter name
  const inviterStmt = env.DB.prepare(`
    SELECT first_name, last_name FROM users WHERE id = ?
  `);
  const inviter = await inviterStmt.bind(invitedBy).first();
  const inviterName = inviter ? `${(inviter as any).first_name || ''}`.trim() || 'Someone' : 'Someone';
  
  // Use Resend for production email sending
  if (env.RESEND_API_KEY) {
    try {
      if (env.ENVIRONMENT === 'local') {
        console.log('DEBUG: About to send email via Resend');
        console.log('DEBUG: FROM_EMAIL =', env.FROM_EMAIL);
        console.log('DEBUG: RESEND_API_KEY exists =', !!env.RESEND_API_KEY);
      }
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          to: [email],
          subject: `You're invited to join ${locationName} on LibraryCard`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>LibraryCard Invitation</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: #007bff; margin-bottom: 10px;">📚 LibraryCard</h1>
                <h2 style="color: #333; margin-bottom: 20px;">You're Invited!</h2>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  ${inviterName} has invited you to join the <strong>${locationName}</strong> library on LibraryCard.
                </p>
                <p style="font-size: 16px; margin-bottom: 30px;">
                  LibraryCard helps you organize and share book collections. Join to browse books and add your own to the shared library.
                </p>
                <a href="${invitationUrl}" 
                   style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Accept Invitation
                </a>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  This invitation will expire in 7 days. If you don't have a LibraryCard account, you can create one when you accept the invitation.
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${invitationUrl}" style="color: #007bff; word-break: break-all;">${invitationUrl}</a>
                </p>
              </div>
            </body>
            </html>
          `
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send invitation email:', error);
        throw new Error(`Email service error: ${response.status}`);
      }

      const result = await response.json() as { id: string };
      console.log('Invitation email sent successfully:', result.id);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Don't fail invitation creation if email fails - log and continue
    }
  } else {
    // Fallback for development/staging without email service
    if (env.ENVIRONMENT === 'local') {
      console.log(`Invitation email fallback: ${email} invited to ${locationName}`);
    }
  }
}

export async function sendVerificationEmail(env: Env, email: string, firstName: string, token: string) {
  if (!env.APP_URL) {
    throw new Error('APP_URL environment variable is required for verification emails');
  }
  const appUrl = env.APP_URL;
  const verificationUrl = `${appUrl.replace(/\/$/, '')}/api/auth/verify-email?token=${token}`;
  
  // Use Resend for production email sending
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          to: [email],
          subject: 'Verify your LibraryCard account',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify your LibraryCard account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: #007bff; margin-bottom: 10px;">📚 LibraryCard</h1>
                <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
                <p style="font-size: 16px; margin-bottom: 30px;">
                  Thanks for joining LibraryCard. To complete your registration, please verify your email address by clicking the button below:
                </p>
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  This link will expire in 24 hours. If you didn't create an account with LibraryCard, you can safely ignore this email.
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
                </p>
              </div>
            </body>
            </html>
          `
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send verification email:', error);
        throw new Error(`Email service error: ${response.status}`);
      }

      const result = await response.json() as { id: string };
      console.log('Verification email sent successfully:', result.id);
    } catch (error) {
      console.error('Error sending verification email:', error);
      // Don't fail registration if email fails - log and continue
    }
  } else {
    // Fallback for development/staging without email service
    if (env.ENVIRONMENT === 'local') {
      console.log(`Verification email fallback: ${email}`);
    }
  }
}

export async function notifyAdminsOfSignupRequest(env: Env, email: string, firstName: string, lastName?: string) {
  // Get all admin users
  const admins = await env.DB.prepare(`
    SELECT email, first_name FROM users WHERE user_role = 'admin'
  `).all();

  if (admins.results.length === 0) {
    console.log('No admin users found to notify about signup request');
    return;
  }

  // Send notification email to each admin
  for (const admin of admins.results) {
    const adminData = admin as any;
    const adminEmail = adminData.email;
    const adminFirstName = adminData.first_name;
    
    // Don't fail the signup if email notification fails
    try {
      if (env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
            to: [adminEmail],
            subject: 'LibraryCard: New Signup Request Pending Approval',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LibraryCard Signup Request</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New Signup Request</p>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 40px 30px;">
                    <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">Approval Required</h2>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${adminFirstName},</p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                      A new user has requested to join LibraryCard and is waiting for admin approval:
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #673ab7; padding: 20px; margin: 25px 0; border-radius: 5px;">
                      <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📧 Email:</strong> ${email}</p>
                      <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>👤 Name:</strong> ${firstName}${lastName ? ` ${lastName}` : ''}</p>
                      <p style="margin: 0; font-size: 14px; color: #666;"><strong>🕒 Requested:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 25px;">
                      Please log in to the LibraryCard admin panel to review and approve or deny this signup request.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${env.APP_URL}" 
                         style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                                text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;
                                transition: background-color 0.3s ease;">
                        Review Signup Request
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 25px;">
                      This user cannot access the system until approved by an admin.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                      This is an automated message from LibraryCard. Please do not reply to this email.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `
LibraryCard Signup Request

Hello ${adminFirstName},

A new user has requested to join LibraryCard and is waiting for admin approval:

Email: ${email}
Name: ${firstName}${lastName ? ` ${lastName}` : ''}
Requested At: ${new Date().toLocaleString()}

Please log in to the LibraryCard admin panel to review and approve or deny this signup request.

Visit: ${env.APP_URL}

This is an automated message from LibraryCard. This user cannot access the system until approved by an admin.
            `
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to send signup notification to admin ${adminEmail}:`, error);
        } else {
          const result = await response.json() as { id: string };
          console.log(`Signup notification sent to admin ${adminEmail}:`, result.id);
        }
      } else {
        // Fallback for development/staging without email service
        if (env.ENVIRONMENT === 'local') {
          console.log(`Signup notification fallback to admin: ${adminEmail}`);
        }
      }
    } catch (error) {
      console.error(`Error sending signup notification to admin ${adminEmail}:`, error);
      // Continue to next admin - don't fail the signup process
    }
  }
}

export async function sendSignupApprovalEmail(env: Env, email: string, firstName: string, verificationToken: string | null, approved: boolean, comment?: string) {
  try {
    if (env.RESEND_API_KEY) {
      const isProduction = env.ENVIRONMENT === 'production';
      if (!env.APP_URL) {
        throw new Error('APP_URL environment variable is required for admin notifications');
      }
      const baseUrl = env.APP_URL;
      
      let subject: string;
      let htmlBody: string;
      let textBody: string;

      if (approved && verificationToken) {
        const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
        subject = 'LibraryCard: Account Approved - Please Verify Your Email';
        htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #673ab7;">📚 LibraryCard Account Approved!</h2>
                
                <p>Hello ${firstName},</p>
                
                <p>Great news! Your LibraryCard signup request has been approved by our administrator.</p>
                
                <div style="background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
                  <p><strong>✅ Your account has been created!</strong></p>
                  <p>Email: ${email}</p>
                </div>
                
                <p>To complete your registration, please verify your email address by clicking the button below:</p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${verificationUrl}" 
                     style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                
                <p>Once verified, you can sign in and start managing your book collection!</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                  This verification link will expire in 24 hours. If you need assistance, please contact support.
                </p>
              </div>
            </body>
          </html>
        `;
        textBody = `
LibraryCard Account Approved!

Hello ${firstName},

Great news! Your LibraryCard signup request has been approved by our administrator.

Your account has been created for: ${email}

To complete your registration, please verify your email address by visiting:
${verificationUrl}

Once verified, you can sign in and start managing your book collection!

This verification link will expire in 24 hours. If you need assistance, please contact support.
        `;
      } else {
        subject = 'LibraryCard: Signup Request Decision';
        htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #673ab7;">📚 LibraryCard Signup Request Update</h2>
                
                <p>Hello ${firstName},</p>
                
                <p>Thank you for your interest in LibraryCard. After reviewing your signup request, we're unable to approve your account at this time.</p>
                
                <div style="background-color: #ffeaea; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
                  <p><strong>❌ Request Status: Denied</strong></p>
                  <p>Email: ${email}</p>
                  ${comment ? `<p><strong>Admin Note:</strong> ${comment}</p>` : ''}
                </div>
                
                <p>If you believe this is an error or have questions about this decision, please feel free to contact us.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                  This is an automated message from LibraryCard.
                </p>
              </div>
            </body>
          </html>
        `;
        textBody = `
LibraryCard Signup Request Update

Hello ${firstName},

Thank you for your interest in LibraryCard. After reviewing your signup request, we're unable to approve your account at this time.

Request Status: Denied
Email: ${email}
${comment ? `Admin Note: ${comment}` : ''}

If you believe this is an error or have questions about this decision, please feel free to contact us.

This is an automated message from LibraryCard.
        `;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          to: [email],
          subject: subject,
          html: htmlBody,
          text: textBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send signup approval email:', error);
      } else {
        const result = await response.json() as { id: string };
        console.log('Signup approval email sent successfully:', result.id);
      }
    } else {
      // Fallback for development/staging without email service
      if (env.ENVIRONMENT === 'local') {
        console.log(`Signup approval email fallback: ${email} - Approved: ${approved}`);
      }
    }
  } catch (error) {
    console.error('Error sending signup approval email:', error);
    // Don't fail the approval process if email fails
  }
}

export async function sendContactEmail(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const { name, email, message }: {
      name: string;
      email: string;
      message: string;
    } = await request.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    if (!email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email using Resend (same system as invitations)
    if (env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
            to: ['contact@tim52.io'],
            reply_to: [email],
            subject: `LibraryCard Contact: Message from ${name}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LibraryCard Contact Form</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                  <h1 style="color: #007bff; margin-bottom: 10px;">📚 LibraryCard Contact</h1>
                  <h2 style="color: #333; margin-bottom: 20px;">New message from ${name}</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="font-size: 16px; margin-bottom: 10px;"><strong>From:</strong> ${name}</p>
                    <p style="font-size: 16px; margin-bottom: 10px;"><strong>Email:</strong> ${email}</p>
                    <p style="font-size: 16px; margin-bottom: 15px;"><strong>Message:</strong></p>
                    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 3px;">
                      ${message.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
                    </div>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    You can reply directly to this email to respond to ${name}.
                  </p>
                </div>
              </body>
              </html>
            `
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to send contact email:', error);
          throw new Error(`Email service error: ${response.status}`);
        }

        const result = await response.json() as { id: string };
        console.log('Contact email sent successfully:', result.id);

        return new Response(JSON.stringify({ 
          message: 'Message sent successfully!',
          id: result.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error sending contact email:', error);
        return new Response(JSON.stringify({ error: 'Failed to send message' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Fallback for development without email service
      if (env.ENVIRONMENT === 'local') {
        console.log(`Contact form fallback from: ${name} (${email})`);
      }
      
      return new Response(JSON.stringify({ 
        message: 'Message received! (Development mode - no email sent)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Contact form processing error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process contact form' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function sendLocationAccessNotification(
  env: Env, 
  recipientEmail: string, 
  recipientName: string,
  locationName: string, 
  granted: boolean,
  grantedBy: string
) {
  const action = granted ? 'granted' : 'revoked';
  const subject = `LibraryCard: Location access ${action} for ${locationName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LibraryCard Location Access Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Location Access ${granted ? 'Granted' : 'Revoked'}</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">${granted ? '🎉' : '⚠️'} Access Update</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${recipientName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your access to the <strong>${locationName}</strong> library has been ${action} by ${grantedBy}.
          </p>
          <div style="background-color: ${granted ? '#e8f5e8' : '#ffeaea'}; border-left: 4px solid ${granted ? '#4caf50' : '#f44336'}; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>📍 Location:</strong> ${locationName}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 ${granted ? 'Granted' : 'Revoked'} by:</strong> ${grantedBy}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>🕒 ${granted ? 'Granted' : 'Revoked'} at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          ${granted 
            ? `<p style="font-size: 16px; margin-bottom: 25px;">You can now access this library and its collection through LibraryCard.</p>`
            : `<p style="font-size: 16px; margin-bottom: 25px;">You no longer have access to this library. Any books you may have checked out should be returned.</p>`
          }
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_URL}" 
               style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              View LibraryCard
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from LibraryCard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LibraryCard Location Access ${granted ? 'Granted' : 'Revoked'}

Hello ${recipientName},

Your access to the ${locationName} library has been ${action} by ${grantedBy}.

Location: ${locationName}
${granted ? 'Granted' : 'Revoked'} by: ${grantedBy}
${granted ? 'Granted' : 'Revoked'} at: ${new Date().toLocaleString()}

${granted 
  ? 'You can now access this library and its collection through LibraryCard.'
  : 'You no longer have access to this library. Any books you may have checked out should be returned.'
}

Visit: ${env.APP_URL}

This is an automated message from LibraryCard.
  `;

  return await sendEmailWithFallback(env, recipientEmail, subject, htmlBody, textBody);
}

export async function sendPermissionChangeNotification(
  env: Env,
  recipientEmail: string,
  recipientName: string,
  locationName: string,
  permission: string,
  granted: boolean,
  changedBy: string
) {
  const action = granted ? 'granted' : 'revoked';
  const subject = `LibraryCard: Permission ${action} in ${locationName}`;
  
  const permissionNames: Record<string, string> = {
    'can_add_books': 'Add Books',
    'can_delete_books': 'Delete Books',
    'can_move_books': 'Move Books',
    'can_create_shelves': 'Create Shelves',
    'can_edit_genres': 'Edit Genres',
    'can_create_series': 'Create Series',
    'can_control_user_capabilities': 'Control User Permissions',
    'can_invite_users': 'Invite Users',
    'can_manage_shelves': 'Manage Shelves',
    'can_manage_location_settings': 'Manage Location Settings'
  };

  const permissionDisplay = permissionNames[permission] || permission;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LibraryCard Permission Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Permission ${granted ? 'Granted' : 'Revoked'}</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">${granted ? '🔓' : '🔒'} Permission Update</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${recipientName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your <strong>${permissionDisplay}</strong> permission in <strong>${locationName}</strong> has been ${action} by ${changedBy}.
          </p>
          <div style="background-color: ${granted ? '#e8f5e8' : '#ffeaea'}; border-left: 4px solid ${granted ? '#4caf50' : '#f44336'}; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>📍 Location:</strong> ${locationName}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>🔑 Permission:</strong> ${permissionDisplay}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 ${granted ? 'Granted' : 'Revoked'} by:</strong> ${changedBy}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>🕒 Changed at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size: 16px; margin-bottom: 25px;">
            ${granted 
              ? `You can now use the ${permissionDisplay} feature in ${locationName}.`
              : `You can no longer use the ${permissionDisplay} feature in ${locationName}.`
            }
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_URL}" 
               style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              View LibraryCard
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from LibraryCard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LibraryCard Permission ${granted ? 'Granted' : 'Revoked'}

Hello ${recipientName},

Your ${permissionDisplay} permission in ${locationName} has been ${action} by ${changedBy}.

Location: ${locationName}
Permission: ${permissionDisplay}
${granted ? 'Granted' : 'Revoked'} by: ${changedBy}
Changed at: ${new Date().toLocaleString()}

${granted 
  ? `You can now use the ${permissionDisplay} feature in ${locationName}.`
  : `You can no longer use the ${permissionDisplay} feature in ${locationName}.`
}

Visit: ${env.APP_URL}

This is an automated message from LibraryCard.
  `;

  return await sendEmailWithFallback(env, recipientEmail, subject, htmlBody, textBody);
}

export async function sendBookActionNotification(
  env: Env,
  recipientEmail: string,
  recipientName: string,
  bookTitle: string,
  bookAuthors: string,
  locationName: string,
  action: 'added' | 'removed',
  actionBy: string
) {
  const subject = `LibraryCard: Book ${action} in ${locationName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LibraryCard Book Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Book ${action === 'added' ? 'Added' : 'Removed'}</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">${action === 'added' ? '📖' : '🗑️'} Book ${action === 'added' ? 'Added' : 'Removed'}</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${recipientName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            A book has been ${action} ${action === 'added' ? 'to' : 'from'} <strong>${locationName}</strong> by ${actionBy}.
          </p>
          <div style="background-color: ${action === 'added' ? '#e8f5e8' : '#ffeaea'}; border-left: 4px solid ${action === 'added' ? '#4caf50' : '#f44336'}; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>📖 Title:</strong> ${bookTitle}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>✍️ Authors:</strong> ${bookAuthors}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>📍 Location:</strong> ${locationName}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 ${action === 'added' ? 'Added' : 'Removed'} by:</strong> ${actionBy}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>🕒 ${action === 'added' ? 'Added' : 'Removed'} at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_URL}" 
               style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              View LibraryCard
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from LibraryCard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LibraryCard Book ${action === 'added' ? 'Added' : 'Removed'}

Hello ${recipientName},

A book has been ${action} ${action === 'added' ? 'to' : 'from'} ${locationName} by ${actionBy}.

Title: ${bookTitle}
Authors: ${bookAuthors}
Location: ${locationName}
${action === 'added' ? 'Added' : 'Removed'} by: ${actionBy}
${action === 'added' ? 'Added' : 'Removed'} at: ${new Date().toLocaleString()}

Visit: ${env.APP_URL}

This is an automated message from LibraryCard.
  `;

  return await sendEmailWithFallback(env, recipientEmail, subject, htmlBody, textBody);
}

export async function sendBookReviewNotification(
  env: Env,
  recipientEmail: string,
  recipientName: string,
  bookTitle: string,
  bookAuthors: string,
  reviewText: string,
  reviewerName: string,
  locationName: string,
  action: 'submitted' | 'approved' | 'rejected',
  reviewedBy?: string,
  comment?: string
) {
  let subject: string;
  let actionText: string;
  
  switch (action) {
    case 'submitted':
      subject = `LibraryCard: New book review submitted - ${bookTitle}`;
      actionText = 'submitted';
      break;
    case 'approved':
      subject = `LibraryCard: Your book review was approved - ${bookTitle}`;
      actionText = 'approved';
      break;
    case 'rejected':
      subject = `LibraryCard: Book review update - ${bookTitle}`;
      actionText = 'rejected';
      break;
  }
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LibraryCard Book Review Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Book Review ${action === 'submitted' ? 'Submission' : (action === 'approved' ? 'Approved' : 'Update')}</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">
            ${action === 'submitted' ? '📝' : (action === 'approved' ? '✅' : '📋')} 
            Book Review ${action === 'submitted' ? 'Submitted' : (action === 'approved' ? 'Approved' : 'Update')}
          </h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${recipientName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${action === 'submitted' 
              ? `${reviewerName} has submitted a new book review that requires moderation.`
              : action === 'approved'
              ? `Your book review has been approved and is now visible to other users.`
              : `Your book review has been reviewed by an administrator.`
            }
          </p>
          <div style="background-color: ${action === 'approved' ? '#e8f5e8' : (action === 'rejected' ? '#ffeaea' : '#fff3cd')}; border-left: 4px solid ${action === 'approved' ? '#4caf50' : (action === 'rejected' ? '#f44336' : '#ffc107')}; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>📖 Book:</strong> ${bookTitle}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>✍️ Authors:</strong> ${bookAuthors}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>📍 Location:</strong> ${locationName}</p>
            ${action === 'submitted' ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 Reviewer:</strong> ${reviewerName}</p>` : ''}
            ${reviewedBy && action !== 'submitted' ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 Reviewed by:</strong> ${reviewedBy}</p>` : ''}
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>🕒 ${action === 'submitted' ? 'Submitted' : 'Reviewed'} at:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin: 15px 0 0 0; padding: 15px; background-color: rgba(255,255,255,0.7); border-radius: 3px;">
              <p style="margin: 0; font-size: 14px;"><strong>📝 Review:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px; font-style: italic;">"${reviewText.length > 200 ? reviewText.substring(0, 200) + '...' : reviewText}"</p>
            </div>
            ${comment ? `<p style="margin: 15px 0 0 0; font-size: 14px;"><strong>💬 Admin Comment:</strong> ${comment}</p>` : ''}
          </div>
          ${action === 'submitted' 
            ? '<p style="font-size: 16px; margin-bottom: 25px;">Please review this submission in the admin panel to approve or reject it.</p>'
            : action === 'approved'
            ? '<p style="font-size: 16px; margin-bottom: 25px;">Thank you for contributing to our book community! Other users can now see your review.</p>'
            : '<p style="font-size: 16px; margin-bottom: 25px;">If you have questions about this decision, please contact an administrator.</p>'
          }
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_URL}${action === 'submitted' ? '/admin/reviews' : `/library?search=${encodeURIComponent(bookTitle)}`}" 
               style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              ${action === 'submitted' ? 'Review Submissions' : 'View Book'}
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from LibraryCard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LibraryCard Book Review ${action === 'submitted' ? 'Submission' : (action === 'approved' ? 'Approved' : 'Update')}

Hello ${recipientName},

${action === 'submitted' 
  ? `${reviewerName} has submitted a new book review that requires moderation.`
  : action === 'approved'
  ? `Your book review has been approved and is now visible to other users.`
  : `Your book review has been reviewed by an administrator.`
}

Book: ${bookTitle}
Authors: ${bookAuthors}
Location: ${locationName}
${action === 'submitted' ? `Reviewer: ${reviewerName}` : ''}
${reviewedBy && action !== 'submitted' ? `Reviewed by: ${reviewedBy}` : ''}
${action === 'submitted' ? 'Submitted' : 'Reviewed'} at: ${new Date().toLocaleString()}

Review: "${reviewText.length > 200 ? reviewText.substring(0, 200) + '...' : reviewText}"
${comment ? `Admin Comment: ${comment}` : ''}

${action === 'submitted' 
  ? 'Please review this submission in the admin panel to approve or reject it.'
  : action === 'approved'
  ? 'Thank you for contributing to our book community! Other users can now see your review.'
  : 'If you have questions about this decision, please contact an administrator.'
}

Visit: ${env.APP_URL}${action === 'submitted' ? '/admin/reviews' : `/library?search=${encodeURIComponent(bookTitle)}`}

This is an automated message from LibraryCard.
  `;

  return await sendEmailWithFallback(env, recipientEmail, subject, htmlBody, textBody);
}

export async function sendGenreSuggestionNotification(
  env: Env,
  recipientEmail: string,
  recipientName: string,
  genreName: string,
  action: 'suggested' | 'approved' | 'rejected',
  suggestedBy?: string,
  reviewedBy?: string,
  comment?: string
) {
  let subject: string;
  let actionText: string;
  
  switch (action) {
    case 'suggested':
      subject = `LibraryCard: New genre suggestion - ${genreName}`;
      actionText = 'suggested';
      break;
    case 'approved':
      subject = `LibraryCard: Genre approved - ${genreName}`;
      actionText = 'approved';
      break;
    case 'rejected':
      subject = `LibraryCard: Genre rejected - ${genreName}`;
      actionText = 'rejected';
      break;
  }
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LibraryCard Genre Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Genre ${action === 'suggested' ? 'Suggestion' : (action === 'approved' ? 'Approved' : 'Rejected')}</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #673ab7; margin-top: 0; font-size: 24px;">
            ${action === 'suggested' ? '💡' : (action === 'approved' ? '✅' : '❌')} 
            Genre ${action === 'suggested' ? 'Suggested' : (action === 'approved' ? 'Approved' : 'Rejected')}
          </h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${recipientName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${action === 'suggested' 
              ? `A new genre has been suggested by ${suggestedBy}.`
              : `A genre suggestion has been ${actionText} by ${reviewedBy}.`
            }
          </p>
          <div style="background-color: ${action === 'approved' ? '#e8f5e8' : (action === 'rejected' ? '#ffeaea' : '#fff3cd')}; border-left: 4px solid ${action === 'approved' ? '#4caf50' : (action === 'rejected' ? '#f44336' : '#ffc107')}; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>🏷️ Genre:</strong> ${genreName}</p>
            ${suggestedBy ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 Suggested by:</strong> ${suggestedBy}</p>` : ''}
            ${reviewedBy ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>👤 Reviewed by:</strong> ${reviewedBy}</p>` : ''}
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>🕒 ${action === 'suggested' ? 'Suggested' : 'Reviewed'} at:</strong> ${new Date().toLocaleString()}</p>
            ${comment ? `<p style="margin: 15px 0 0 0; font-size: 14px;"><strong>💬 Comment:</strong> ${comment}</p>` : ''}
          </div>
          ${action === 'suggested' 
            ? '<p style="font-size: 16px; margin-bottom: 25px;">Please review this suggestion in the admin panel.</p>'
            : action === 'approved'
            ? '<p style="font-size: 16px; margin-bottom: 25px;">This genre is now available for use in LibraryCard.</p>'
            : '<p style="font-size: 16px; margin-bottom: 25px;">This genre suggestion was not approved at this time.</p>'
          }
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_URL}" 
               style="display: inline-block; background-color: #673ab7; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              View LibraryCard
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from LibraryCard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LibraryCard Genre ${action === 'suggested' ? 'Suggestion' : (action === 'approved' ? 'Approved' : 'Rejected')}

Hello ${recipientName},

${action === 'suggested' 
  ? `A new genre has been suggested by ${suggestedBy}.`
  : `A genre suggestion has been ${actionText} by ${reviewedBy}.`
}

Genre: ${genreName}
${suggestedBy ? `Suggested by: ${suggestedBy}` : ''}
${reviewedBy ? `Reviewed by: ${reviewedBy}` : ''}
${action === 'suggested' ? 'Suggested' : 'Reviewed'} at: ${new Date().toLocaleString()}
${comment ? `Comment: ${comment}` : ''}

${action === 'suggested' 
  ? 'Please review this suggestion in the admin panel.'
  : action === 'approved'
  ? 'This genre is now available for use in LibraryCard.'
  : 'This genre suggestion was not approved at this time.'
}

Visit: ${env.APP_URL}

This is an automated message from LibraryCard.
  `;

  return await sendEmailWithFallback(env, recipientEmail, subject, htmlBody, textBody);
}

async function sendEmailWithFallback(
  env: Env, 
  email: string, 
  subject: string, 
  htmlBody: string, 
  textBody: string
) {
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'LibraryCard <noreply@tim52.io>',
          to: [email],
          subject: subject,
          html: htmlBody,
          text: textBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send notification email:', error);
        throw new Error(`Email service error: ${response.status}`);
      }

      const result = await response.json() as { id: string };
      console.log('Notification email sent successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  } else if (env.ENVIRONMENT === 'local') {
    console.log(`Notification email fallback: ${email} - ${subject}`);
    return { id: 'local-fallback' };
  } else {
    throw new Error('No email service configured');
  }
}