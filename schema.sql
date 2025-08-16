-- Updated LibraryCard Database Schema (matches production/staging as of August 2025)

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
  -- WebAuthn support columns
  webauthn_enabled BOOLEAN DEFAULT FALSE,
  webauthn_enabled_at DATETIME,
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
  single_shelf_location BOOLEAN DEFAULT FALSE,
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

-- Location-specific user permissions
CREATE TABLE IF NOT EXISTS location_user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, permission)
);

-- Location admin capabilities
CREATE TABLE IF NOT EXISTS location_admin_capabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, capability)
);

-- Global user permissions
CREATE TABLE IF NOT EXISTS user_global_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, permission)
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

-- Curated genres system
CREATE TABLE IF NOT EXISTS curated_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Genre requests from users
CREATE TABLE IF NOT EXISTS genre_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  genre_name TEXT NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL, -- user ID
  requester_name TEXT,
  requester_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT, -- super admin who reviewed it
  reviewed_at DATETIME,
  notes TEXT -- admin notes when approving/rejecting
);

-- Genre suggestions
CREATE TABLE IF NOT EXISTS genre_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggested_name TEXT NOT NULL,
  description TEXT,
  suggested_by TEXT NOT NULL,
  book_id INTEGER,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Book-to-genre associations
CREATE TABLE IF NOT EXISTS book_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  UNIQUE(book_id, genre_id)
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
  review_status TEXT DEFAULT 'approved',
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_rejection_reason TEXT,
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

-- Authentication audit log for security events
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

-- WebAuthn challenge storage
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

-- WebAuthn credential storage
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

-- Notification system tables
CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  metadata TEXT, -- JSON with additional context (user_id, location_id, etc.)
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  delivery_status TEXT NOT NULL, -- 'sent', 'failed', 'bounced', 'complained'
  provider_id TEXT, -- Email provider's message ID (Resend ID, etc.)
  error_details TEXT,
  user_id TEXT, -- If notification relates to a specific user
  location_id INTEGER, -- If notification relates to a specific location
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'user_registration', 'permission_change', 'book_addition', etc.
  enabled BOOLEAN DEFAULT TRUE,
  location_id INTEGER, -- NULL for global notifications, specific location for location-specific
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(user_id, notification_type, location_id)
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- Same types as email notifications
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Optional URL for "View" or "Manage" button
  action_label TEXT, -- Optional label for action button
  related_user_id TEXT, -- User who triggered the notification
  related_location_id INTEGER, -- Location related to the notification
  metadata TEXT, -- JSON with additional context
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_read_status (
  user_id TEXT PRIMARY KEY,
  last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_unread INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users(password_reset_expires);
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(totp_enabled);
CREATE INDEX IF NOT EXISTS idx_users_webauthn_enabled ON users(webauthn_enabled);

CREATE INDEX IF NOT EXISTS idx_locations_owner ON locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_location_members_location ON location_members(location_id);
CREATE INDEX IF NOT EXISTS idx_location_members_user ON location_members(user_id);
CREATE INDEX IF NOT EXISTS idx_location_invitations_token ON location_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_location_invitations_email ON location_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_location_invitations_location ON location_invitations(location_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_location ON location_user_permissions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_user ON location_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_location ON location_admin_capabilities(location_id);
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_user ON location_admin_capabilities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_global_permissions_user ON user_global_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_global_permissions_permission ON user_global_permissions(permission);

CREATE INDEX IF NOT EXISTS idx_shelves_location ON shelves(location_id);

CREATE INDEX IF NOT EXISTS idx_curated_genres_active ON curated_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_curated_genres_name ON curated_genres(name);

CREATE INDEX IF NOT EXISTS idx_genre_requests_status ON genre_requests(status);
CREATE INDEX IF NOT EXISTS idx_genre_requests_requested_by ON genre_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_checked_out_by ON books(checked_out_by);

CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);

CREATE INDEX IF NOT EXISTS idx_checkout_history_book ON book_checkout_history(book_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_user ON book_checkout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_action ON book_checkout_history(action);
CREATE INDEX IF NOT EXISTS idx_checkout_history_date ON book_checkout_history(action_date);

CREATE INDEX IF NOT EXISTS idx_ratings_book ON book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON book_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_status ON book_ratings(review_status);

CREATE INDEX IF NOT EXISTS idx_removal_requests_book ON book_removal_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_requester ON book_removal_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_status ON book_removal_requests(status);
CREATE INDEX IF NOT EXISTS idx_removal_requests_created ON book_removal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_removal_requests_reviewed_by ON book_removal_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_approval_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_reviewed_by ON signup_approval_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_used ON user_recovery_codes(used_at);

CREATE INDEX IF NOT EXISTS idx_jwt_sessions_user ON jwt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_session_id ON jwt_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_expires ON jwt_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_jwt_sessions_revoked ON jwt_sessions(revoked);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_email ON auth_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_id ON webauthn_credentials(credential_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent ON notification_log(sent_at);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_type ON notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_location ON notification_preferences(location_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_recipient ON in_app_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_type ON in_app_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created ON in_app_notifications(created_at);