-- JWT Session Management Migration
-- Adds session tracking for JWT authentication with security features

-- JWT Sessions table for token revocation and audit tracking
CREATE TABLE IF NOT EXISTS jwt_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  token_hash TEXT NOT NULL,
  issued_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME,
  revoked_by TEXT,
  revoked_reason TEXT,
  auth_method TEXT DEFAULT 'password',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (revoked_by) REFERENCES users(id)
);

-- Security audit log for authentication events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  auth_method TEXT,
  failure_reason TEXT,
  session_id TEXT,
  additional_data TEXT,
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

-- Note: Views are not supported in Cloudflare D1, so they have been removed
-- Security monitoring queries can be run manually when needed:
-- 
-- Active sessions query:
-- SELECT js.user_id, u.email, js.session_id, js.issued_at, js.expires_at, js.last_accessed_at
-- FROM jwt_sessions js JOIN users u ON js.user_id = u.id
-- WHERE js.revoked = FALSE AND js.expires_at > datetime('now');
--
-- Recent auth events query:
-- SELECT aal.email, aal.event_type, aal.auth_method, aal.ip_address, aal.created_at
-- FROM auth_audit_log aal LEFT JOIN users u ON aal.user_id = u.id
-- WHERE aal.created_at > datetime('now', '-7 days') ORDER BY aal.created_at DESC;