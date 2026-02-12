CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Google user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, password_hash TEXT, auth_provider TEXT DEFAULT 'email', email_verified BOOLEAN DEFAULT FALSE, email_verification_token TEXT, email_verification_expires DATETIME, user_role TEXT DEFAULT 'user', password_reset_token TEXT, password_reset_expires DATETIME, totp_secret TEXT, totp_enabled BOOLEAN DEFAULT FALSE, totp_enabled_at DATETIME, backup_codes TEXT, webauthn_enabled BOOLEAN DEFAULT FALSE, webauthn_enabled_at DATETIME, display_name_preference TEXT DEFAULT 'first_name' CHECK (display_name_preference IN ('first_name', 'full_name', 'email', 'custom_username', 'anonymous')), custom_username VARCHAR(50), is_active BOOLEAN DEFAULT TRUE);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  single_shelf_location BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME, activity_visibility TEXT DEFAULT 'private' CHECK (activity_visibility IN ('private', 'public')), allow_user_exports INTEGER DEFAULT 1,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE shelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE curated_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE genre_requests (
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

CREATE TABLE genre_suggestions (
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

CREATE TABLE books (
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
  cover_selection_date TEXT, added_by_anonymous BOOLEAN DEFAULT FALSE, custom_cover_url TEXT, custom_cover_metadata TEXT,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id)
  -- Note: Removed FOREIGN KEY constraint for added_by to allow NULL
);

CREATE TABLE book_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  UNIQUE(book_id, genre_id)
);

CREATE TABLE book_ratings (
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, reviewer_anonymous BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(book_id, user_id)
);

CREATE TABLE user_recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE auth_audit_log (
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

CREATE TABLE webauthn_challenges (
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

CREATE TABLE webauthn_credentials (
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

CREATE TABLE notification_queue (
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

CREATE TABLE notification_log (
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

CREATE TABLE notification_preferences (
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

CREATE TABLE in_app_notifications (
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

CREATE TABLE notification_read_status (
  user_id TEXT PRIMARY KEY,
  last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_unread INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE migrations_applied (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL DEFAULT 0,
        batch_id TEXT NOT NULL
      );

CREATE TABLE series (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Optional hex color for visual distinction
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    approval_status TEXT DEFAULT 'pending', -- pending/approved/rejected
    approved_by TEXT, -- Admin user ID who approved/rejected
    approved_at DATETIME, -- Timestamp of approval/rejection
    rejection_reason TEXT, location_id INTEGER, -- Optional reason for rejection
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE book_series (
    book_id TEXT NOT NULL,
    series_id TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, series_id),
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "migration_batches" (
    id TEXT PRIMARY KEY,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT NOT NULL DEFAULT 'running',
    total_migrations INTEGER NOT NULL DEFAULT 0,
    successful_migrations INTEGER NOT NULL DEFAULT 0,
    failed_migration TEXT,
    error_message TEXT,
    environment TEXT NOT NULL,
    rollback_target TEXT
);

CREATE TABLE migration_rollbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    rolled_back_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rollback_batch_id TEXT NOT NULL,
    original_batch_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activity_privacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('book_addition', 'review', 'checkout')),
  activity_id TEXT NOT NULL, -- References the specific book_id, rating_id, checkout_id, etc.
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, activity_type, activity_id)
);

CREATE TABLE ai_classification_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE, -- AI classification label to allow
  confidence_threshold REAL DEFAULT 0.2, -- Minimum confidence to accept this label
  added_by TEXT, -- Admin who added this label (NULL for system-seeded entries)
  added_from_appeal_id INTEGER, -- Reference to the appeal that triggered this addition
  reason TEXT, -- Why this label was added to allowlist
  is_active BOOLEAN DEFAULT TRUE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (added_from_appeal_id) REFERENCES book_cover_appeals(id) ON DELETE SET NULL
);

CREATE TABLE appeal_resolution_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appeal_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approved_image', 'added_to_allowlist', 'rejected_appeal', 'admin_note')),
  action_details TEXT, -- JSON with specific details of the action
  performed_by TEXT NOT NULL,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (appeal_id) REFERENCES book_cover_appeals(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE book_cover_appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  appeal_reason TEXT, -- User's explanation of why they believe it's legitimate
  image_data_url TEXT NOT NULL, -- Base64 data URL of the rejected image
  image_metadata TEXT, -- JSON metadata (size, format, dimensions)
  ai_classification_results TEXT, -- JSON of AI results (detected labels and confidence scores)
  rejection_reason TEXT NOT NULL, -- Original AI rejection reason

  -- Appeal status and resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  admin_notes TEXT, -- Admin comments on the decision
  resolved_by TEXT, -- Admin user ID who resolved the appeal
  resolved_at DATETIME,

  -- Timestamps
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE location_default_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  permission TEXT NOT NULL, -- 'can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'
  permission_type TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user' - type of permission (for future admin default capabilities)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(location_id, permission, permission_type)
);

CREATE TABLE IF NOT EXISTS "book_checkout_history" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id TEXT, -- Changed from NOT NULL
  action TEXT NOT NULL,
  action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "book_images" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL,
  storage_provider TEXT DEFAULT 'r2',
  storage_key TEXT,
  file_size INTEGER,
  image_format TEXT,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_by TEXT, -- Changed from NOT NULL
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "jwt_sessions" (
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
  FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "signup_approval_requests" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  password_hash TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_comment TEXT,
  created_user_id TEXT,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "book_removal_requests" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  requester_id TEXT,
  reason TEXT NOT NULL,
  reason_details TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "location_invitations" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  invited_email TEXT NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "location_admin_capabilities" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  granted_by TEXT,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(location_id, user_id, capability)
);

CREATE TABLE IF NOT EXISTS "location_user_permissions" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(location_id, user_id, permission)
);

CREATE TABLE IF NOT EXISTS "user_global_permissions" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, permission)
);

CREATE TABLE IF NOT EXISTS "location_members" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(location_id, user_id)
);

CREATE INDEX idx_migrations_applied_batch_id ON migrations_applied(batch_id);

CREATE INDEX idx_migrations_applied_applied_at ON migrations_applied(applied_at);

CREATE INDEX idx_series_user_id ON series(user_id);

CREATE INDEX idx_series_sort_order ON series(sort_order);

CREATE INDEX idx_series_created_at ON series(created_at);

CREATE INDEX idx_series_approval_status ON series(approval_status);

CREATE INDEX idx_book_series_book_id ON book_series(book_id);

CREATE INDEX idx_book_series_series_id ON book_series(series_id);

CREATE INDEX idx_book_series_added_at ON book_series(added_at);

CREATE INDEX idx_migrations_applied_filename ON migrations_applied(filename);

CREATE INDEX idx_migrations_applied_batch ON migrations_applied(batch_id);

CREATE INDEX idx_migrations_applied_date ON migrations_applied(applied_at);

CREATE INDEX idx_migration_batches_status ON migration_batches(status);

CREATE INDEX idx_migration_batches_started_at ON migration_batches(started_at);

CREATE INDEX idx_migration_rollbacks_filename ON migration_rollbacks(filename);

CREATE INDEX idx_migration_rollbacks_batch ON migration_rollbacks(rollback_batch_id);

CREATE INDEX idx_migration_rollbacks_date ON migration_rollbacks(rolled_back_at);

CREATE INDEX idx_series_location_id ON series(location_id);

CREATE INDEX idx_locations_activity_visibility ON locations(activity_visibility);

CREATE INDEX idx_users_display_preference ON users(display_name_preference);

CREATE UNIQUE INDEX idx_users_custom_username_unique ON users(custom_username) WHERE custom_username IS NOT NULL;

CREATE INDEX idx_user_activity_privacy_user_id ON user_activity_privacy(user_id);

CREATE INDEX idx_user_activity_privacy_activity ON user_activity_privacy(activity_type, activity_id);

CREATE INDEX idx_books_added_by_anonymous ON books(added_by_anonymous);

CREATE INDEX idx_book_ratings_reviewer_anonymous ON book_ratings(reviewer_anonymous);

CREATE INDEX idx_books_custom_cover ON books(custom_cover_url);

CREATE INDEX idx_ai_allowlist_label ON ai_classification_allowlist(label);

CREATE INDEX idx_ai_allowlist_active ON ai_classification_allowlist(is_active);

CREATE INDEX idx_appeal_actions_appeal_id ON appeal_resolution_actions(appeal_id);

CREATE INDEX idx_appeal_actions_performed_at ON appeal_resolution_actions(performed_at);

CREATE INDEX idx_book_cover_appeals_user_id ON book_cover_appeals(user_id);

CREATE INDEX idx_book_cover_appeals_status ON book_cover_appeals(status);

CREATE INDEX idx_book_cover_appeals_submitted_at ON book_cover_appeals(submitted_at);

CREATE INDEX idx_location_default_permissions_location ON location_default_permissions(location_id);

CREATE INDEX idx_location_default_permissions_type ON location_default_permissions(permission_type);

CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_checkout_history_action ON book_checkout_history(action);

CREATE INDEX idx_checkout_history_book ON book_checkout_history(book_id);

CREATE INDEX idx_checkout_history_book_date ON book_checkout_history(book_id, action_date DESC);

CREATE INDEX idx_checkout_history_date ON book_checkout_history(action_date);

CREATE INDEX idx_checkout_history_user ON book_checkout_history(user_id);

CREATE INDEX idx_book_images_book ON book_images(book_id);

CREATE INDEX idx_book_images_primary ON book_images(is_primary);

CREATE INDEX idx_book_images_type ON book_images(image_type);

CREATE INDEX idx_book_images_uploaded_by ON book_images(uploaded_by);

CREATE INDEX idx_jwt_sessions_expires_at ON jwt_sessions(expires_at);

CREATE INDEX idx_jwt_sessions_last_accessed ON jwt_sessions(last_accessed_at);

CREATE INDEX idx_jwt_sessions_revoked ON jwt_sessions(revoked);

CREATE INDEX idx_jwt_sessions_session_id ON jwt_sessions(session_id);

CREATE INDEX idx_jwt_sessions_token_hash ON jwt_sessions(token_hash);

CREATE INDEX idx_jwt_sessions_user_id ON jwt_sessions(user_id);

CREATE INDEX idx_signup_requests_email ON signup_approval_requests(email);

CREATE INDEX idx_signup_requests_requested_at ON signup_approval_requests(requested_at);

CREATE INDEX idx_signup_requests_reviewed_by ON signup_approval_requests(reviewed_by);

CREATE INDEX idx_signup_requests_status ON signup_approval_requests(status);

CREATE INDEX idx_removal_requests_book ON book_removal_requests(book_id);

CREATE INDEX idx_removal_requests_created ON book_removal_requests(created_at);

CREATE INDEX idx_removal_requests_requester ON book_removal_requests(requester_id);

CREATE INDEX idx_removal_requests_reviewed_by ON book_removal_requests(reviewed_by);

CREATE INDEX idx_removal_requests_status ON book_removal_requests(status);

CREATE INDEX idx_location_invitations_email ON location_invitations(invited_email);

CREATE INDEX idx_location_invitations_location ON location_invitations(location_id);

CREATE INDEX idx_location_invitations_token ON location_invitations(invitation_token);

CREATE INDEX idx_location_admin_capabilities_capability ON location_admin_capabilities(capability);

CREATE INDEX idx_location_admin_capabilities_location_user ON location_admin_capabilities(location_id, user_id);

CREATE INDEX idx_location_admin_capabilities_user ON location_admin_capabilities(user_id);

CREATE INDEX idx_location_user_permissions_location_user ON location_user_permissions(location_id, user_id);

CREATE INDEX idx_location_user_permissions_permission ON location_user_permissions(permission);

CREATE INDEX idx_location_user_permissions_user ON location_user_permissions(user_id);

CREATE INDEX idx_user_global_permissions_granted_by ON user_global_permissions(granted_by);

CREATE INDEX idx_user_global_permissions_permission ON user_global_permissions(permission);

CREATE INDEX idx_user_global_permissions_user ON user_global_permissions(user_id);

CREATE INDEX idx_location_members_location ON location_members(location_id);

CREATE INDEX idx_location_members_user ON location_members(user_id);

CREATE INDEX idx_location_members_user_location ON location_members(user_id, location_id);

CREATE VIEW library_ratings_agg AS
WITH location_users AS (
  SELECT DISTINCT
    l.id as location_id,
    u.id as user_id
  FROM locations l
  LEFT JOIN location_members lm ON l.id = lm.location_id
  LEFT JOIN users u ON lm.user_id = u.id OR l.owner_id = u.id
  WHERE u.id IS NOT NULL
)
SELECT
  b.id as book_id,
  l.id as location_id,
  AVG(CAST(br.rating AS REAL)) as library_average_rating,
  COUNT(br.rating) as library_rating_count
FROM books b
JOIN shelves s ON b.shelf_id = s.id
JOIN locations l ON s.location_id = l.id
LEFT JOIN book_ratings br ON b.id = br.book_id
LEFT JOIN location_users lu ON l.id = lu.location_id AND br.user_id = lu.user_id
GROUP BY b.id, l.id;

