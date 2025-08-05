-- WebAuthn/Passkeys Implementation Migration
-- Date: August 5, 2025
-- Purpose: Add WebAuthn/Passkeys support for passwordless authentication
-- Phase 2 of Enhanced Authentication Plan

-- ==============================================
-- WEBAUTHN CREDENTIALS TABLE
-- ==============================================

-- Table for storing WebAuthn credentials (passkeys)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type TEXT CHECK(device_type IN ('platform', 'cross-platform')),
  device_name TEXT, -- User-friendly name (e.g., "iPhone Touch ID", "MacBook Pro")
  transports TEXT, -- JSON array of supported transports
  authenticator_aaguid TEXT, -- Authenticator AAGUID for tracking
  backup_eligible BOOLEAN DEFAULT FALSE,
  backup_state BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn challenges table for registration and authentication flows
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge TEXT UNIQUE NOT NULL,
  user_id TEXT, -- NULL for usernameless authentication
  email TEXT, -- For usernameless flows
  challenge_type TEXT CHECK(challenge_type IN ('registration', 'authentication')) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

-- WebAuthn credentials indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_device_type ON webauthn_credentials(device_type);
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_last_used ON webauthn_credentials(last_used_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_created_at ON webauthn_credentials(created_at);

-- WebAuthn challenges indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_email ON webauthn_challenges(email);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_type ON webauthn_challenges(challenge_type);

-- ==============================================
-- SECURITY ENHANCEMENTS
-- ==============================================

-- Add WebAuthn support flag to users table
ALTER TABLE users ADD COLUMN webauthn_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN webauthn_enabled_at DATETIME;

-- Create index for WebAuthn enabled users
CREATE INDEX IF NOT EXISTS idx_users_webauthn_enabled ON users(webauthn_enabled);

-- ==============================================
-- MAINTENANCE NOTES
-- ==============================================

-- Cleanup procedure for expired challenges (for periodic maintenance)
-- Note: This would typically be run by a scheduled job
-- DELETE FROM webauthn_challenges WHERE expires_at < datetime('now');

-- Security monitoring queries:
-- 
-- Active WebAuthn credentials query:
-- SELECT wc.user_id, u.email, wc.device_name, wc.device_type, wc.created_at, wc.last_used_at
-- FROM webauthn_credentials wc JOIN users u ON wc.user_id = u.id
-- ORDER BY wc.last_used_at DESC;
--
-- Users with passkeys enabled query:
-- SELECT u.email, u.webauthn_enabled_at, COUNT(wc.id) as passkey_count
-- FROM users u LEFT JOIN webauthn_credentials wc ON u.id = wc.user_id
-- WHERE u.webauthn_enabled = TRUE GROUP BY u.id;
--
-- Recent WebAuthn activity query:
-- SELECT u.email, wc.device_name, wc.last_used_at, wc.counter
-- FROM webauthn_credentials wc JOIN users u ON wc.user_id = u.id
-- WHERE wc.last_used_at > datetime('now', '-7 days')
-- ORDER BY wc.last_used_at DESC;