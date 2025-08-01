-- JWT Session Management Migration
-- Adds session tracking for JWT authentication with security features

-- JWT Sessions table for token revocation and audit tracking
CREATE TABLE IF NOT EXISTS jwt_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL, -- JWT session identifier (jti claim)
  token_hash TEXT NOT NULL, -- SHA-256 hash of the JWT token (for revocation without storing full token)
  issued_at DATETIME NOT NULL, -- When the token was issued
  expires_at DATETIME NOT NULL, -- When the token expires
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Track session activity
  user_agent TEXT, -- Client user agent (for security auditing)
  ip_address TEXT, -- Client IP address (for security auditing)
  revoked BOOLEAN DEFAULT FALSE, -- Manual token revocation
  revoked_at DATETIME, -- When the token was revoked
  revoked_by TEXT, -- Who revoked the token (admin user ID)
  revoked_reason TEXT, -- Reason for revocation
  auth_method TEXT DEFAULT 'password', -- 'password', 'google', 'password_reset'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (revoked_by) REFERENCES users(id)
);

-- Security audit log for authentication events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT, -- NULL for failed login attempts
  email TEXT NOT NULL, -- Email used in auth attempt
  event_type TEXT NOT NULL, -- 'login_success', 'login_failure', 'logout', 'token_refresh', 'password_reset'
  ip_address TEXT,
  user_agent TEXT,
  auth_method TEXT, -- 'password', 'google', 'jwt_refresh'
  failure_reason TEXT, -- For failed attempts: 'invalid_password', 'user_not_found', 'account_locked', etc.
  session_id TEXT, -- Link to jwt_sessions table
  additional_data TEXT, -- JSON for additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance and security queries
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_user_id ON jwt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_session_id ON jwt_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_token_hash ON jwt_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_expires_at ON jwt_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_revoked ON jwt_sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_last_accessed ON jwt_sessions(last_accessed_at);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_email ON auth_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip_address ON auth_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_session_id ON auth_audit_log(session_id);

-- Cleanup procedure for expired sessions (for periodic maintenance)
-- Note: This would typically be run by a scheduled job
-- DELETE FROM jwt_sessions WHERE expires_at < datetime('now') AND revoked = FALSE;

-- Optional views for security monitoring
CREATE VIEW IF NOT EXISTS active_sessions AS
SELECT 
  js.user_id,
  u.email,
  u.first_name,
  u.last_name,
  js.session_id,
  js.issued_at,
  js.expires_at,
  js.last_accessed_at,
  js.ip_address,
  js.user_agent,
  js.auth_method
FROM jwt_sessions js
JOIN users u ON js.user_id = u.id
WHERE js.revoked = FALSE 
  AND js.expires_at > datetime('now');

CREATE VIEW IF NOT EXISTS recent_auth_events AS
SELECT 
  aal.email,
  aal.event_type,
  aal.auth_method,
  aal.ip_address,
  aal.failure_reason,
  aal.created_at,
  u.first_name,
  u.last_name
FROM auth_audit_log aal
LEFT JOIN users u ON aal.user_id = u.id
WHERE aal.created_at > datetime('now', '-7 days')
ORDER BY aal.created_at DESC;