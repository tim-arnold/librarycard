-- Fix Google OAuth users verification status
-- Google OAuth users should always be email verified since Google accounts are pre-verified
-- This migration ensures all Google OAuth users have email_verified = true

UPDATE users 
SET email_verified = true 
WHERE auth_provider = 'google' 
AND email_verified = false;