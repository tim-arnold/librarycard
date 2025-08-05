-- Updated LibraryCard Database Schema (matches production as of July 2025)

-- Users table for multiple auth providers
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID for email/password users, Google ID for OAuth users
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT, -- NULL for OAuth users
  auth_provider TEXT DEFAULT 'email', -- 'email' or 'google'
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires DATETIME,
  user_role TEXT DEFAULT 'user', -- 'admin' or 'user'
  password_reset_token TEXT,
  password_reset_expires DATETIME,
  -- 2FA support columns
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_enabled_at DATETIME,
  backup_codes TEXT, -- JSON array of hashed backup codes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Signup approval requests (for admin approval workflow)
CREATE TABLE IF NOT EXISTS signup_approval_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  password_hash TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT, -- Admin who approved/denied
  reviewed_at DATETIME, -- When the request was reviewed
  review_comment TEXT, -- Admin's comment on the decision
  created_user_id TEXT, -- User ID created after approval (for tracking)
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Locations (e.g., "Finsbury Road", "Office Building")
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Location members (invited users)
CREATE TABLE IF NOT EXISTS location_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'member'
  invited_by TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (invited_by) REFERENCES users(id),
  UNIQUE(location_id, user_id)
);

-- Location invitations (for inviting users to locations)
CREATE TABLE IF NOT EXISTS location_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  invited_email TEXT NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  invited_by TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

-- Shelves (formerly "location" - basement, Tim's room, etc.)
CREATE TABLE IF NOT EXISTS shelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Updated books table (with all enhancements)
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL, -- JSON array
  description TEXT,
  thumbnail TEXT,
  published_date TEXT,
  categories TEXT, -- JSON array
  shelf_id INTEGER, -- Reference to shelves table
  tags TEXT, -- JSON array
  added_by TEXT, -- NOW NULLABLE (was NOT NULL)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'available',
  checked_out_by TEXT,
  checked_out_date DATETIME,
  due_date DATETIME,
  extended_description TEXT,
  subjects TEXT,
  page_count INTEGER,
  average_rating REAL,
  ratings_count INTEGER,
  publisher_info TEXT,
  open_library_key TEXT,
  enhanced_genres TEXT,
  series TEXT,
  series_number TEXT,
  rating_count INTEGER DEFAULT 0,
  rating_updated_at DATETIME,
  user_rating INTEGER,
  google_average_rating REAL,
  google_ratings_count INTEGER,
  assigned_genres TEXT,
  alternative_covers TEXT,
  selected_cover_source TEXT,
  cover_selection_date TEXT,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id)
  -- Note: Removed FOREIGN KEY constraint for added_by to allow NULL
);

-- Book checkout history
CREATE TABLE IF NOT EXISTS book_checkout_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id TEXT NOT NULL, -- User who checked out the book
  action TEXT NOT NULL, -- 'checkout' or 'return'
  action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME, -- Due date when checked out
  notes TEXT, -- Optional notes from user or admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Book ratings system
CREATE TABLE IF NOT EXISTS book_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(book_id, user_id)
);

-- Book removal requests table for admin approval workflow
CREATE TABLE IF NOT EXISTS book_removal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  requester_id TEXT NOT NULL, -- User who requested removal
  reason TEXT NOT NULL, -- 'lost', 'damaged', 'missing', 'other'
  reason_details TEXT, -- Additional details/comments from user
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by TEXT, -- Admin who approved/denied
  review_comment TEXT, -- Admin's comment on the decision
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME, -- When the request was reviewed
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- 2FA recovery codes table for better management
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users(password_reset_expires);

CREATE INDEX IF NOT EXISTS idx_locations_owner ON locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_location_members_location ON location_members(location_id);
CREATE INDEX IF NOT EXISTS idx_location_members_user ON location_members(user_id);
CREATE INDEX IF NOT EXISTS idx_location_invitations_token ON location_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_location_invitations_email ON location_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_location_invitations_location ON location_invitations(location_id);

CREATE INDEX IF NOT EXISTS idx_shelves_location ON shelves(location_id);

CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_checked_out_by ON books(checked_out_by);

CREATE INDEX IF NOT EXISTS idx_checkout_history_book ON book_checkout_history(book_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_user ON book_checkout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_action ON book_checkout_history(action);
CREATE INDEX IF NOT EXISTS idx_checkout_history_date ON book_checkout_history(action_date);

CREATE INDEX IF NOT EXISTS idx_ratings_book ON book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON book_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_removal_requests_book ON book_removal_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_requester ON book_removal_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_status ON book_removal_requests(status);
CREATE INDEX IF NOT EXISTS idx_removal_requests_created ON book_removal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_removal_requests_reviewed_by ON book_removal_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_approval_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_reviewed_by ON signup_approval_requests(reviewed_by);

-- 2FA and security indexes
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(totp_enabled);

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