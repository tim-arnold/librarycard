-- LibraryCard 2FA Database Migration
-- Date: August 1, 2025
-- Purpose: Add Two-Factor Authentication support

-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN totp_enabled_at DATETIME;
ALTER TABLE users ADD COLUMN backup_codes TEXT; -- JSON array of hashed backup codes

-- Create recovery codes table for better management
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- JWT session management tables for enhanced security
CREATE TABLE IF NOT EXISTS jwt_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_info TEXT, -- JSON: browser, OS, etc.
  ip_address TEXT,
  location TEXT, -- Country/city if available
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  revoked_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security audit log for authentication events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  event_type TEXT NOT NULL, -- 'login', 'logout', '2fa_enabled', '2fa_disabled', 'password_change', etc.
  event_details TEXT, -- JSON with additional details
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_used ON user_recovery_codes(used_at);

CREATE INDEX IF NOT EXISTS idx_jwt_sessions_user ON jwt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_token ON jwt_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_expires ON jwt_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_revoked ON jwt_sessions(revoked_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON security_audit_log(success);

-- Users with 2FA enabled index
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(totp_enabled);