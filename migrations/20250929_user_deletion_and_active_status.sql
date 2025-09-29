-- MIGRATION: User Deletion Foreign Key Strategy + Active Status Flag
-- Description: Implements CASCADE/SET NULL for safe user deletion + adds is_active flag for enable/disable
-- Related: LCWEB-171, docs/specs/user-deletion-strategy.md
-- Date: 2025-09-29

-- ============================================================================
-- PART 1: User Active Status Flag
-- Add is_active column for enable/disable functionality (separate from deletion)
-- ============================================================================

-- NOTE: is_active column addition is commented out for staging recovery
-- The column was partially added in a previous failed migration attempt
-- If running on a fresh database, uncomment the ALTER TABLE line below

-- Add is_active column to users table (default TRUE for existing users)
-- ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Create index for filtering active users (IF NOT EXISTS handles idempotency)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update any existing 'disabled' role users to be marked as inactive
-- (These were soft-deleted users from the old system)
-- Only update if is_active column exists (safe for both fresh and recovery scenarios)
UPDATE users
SET is_active = COALESCE(is_active, TRUE)
WHERE is_active IS NULL;

UPDATE users
SET is_active = FALSE
WHERE user_role = 'disabled';

-- Clean up the 'disabled' role - convert back to 'user' role
-- Since we now have a proper is_active flag
UPDATE users SET user_role = 'user' WHERE user_role = 'disabled';

-- ============================================================================
-- PART 2: Foreign Key Strategy for User Deletion (Hybrid Approach)
-- PHASE 1: SET NULL for Historical/Audit Records
-- These preserve valuable data while anonymizing user references
-- ============================================================================

-- book_checkout_history.user_id → SET NULL (preserve checkout history, anonymize user)
CREATE TABLE book_checkout_history_new (
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

INSERT INTO book_checkout_history_new SELECT * FROM book_checkout_history;
DROP TABLE book_checkout_history;
ALTER TABLE book_checkout_history_new RENAME TO book_checkout_history;

-- Recreate indexes for book_checkout_history
CREATE INDEX idx_checkout_history_action ON book_checkout_history(action);
CREATE INDEX idx_checkout_history_book ON book_checkout_history(book_id);
CREATE INDEX idx_checkout_history_book_date ON book_checkout_history(book_id, action_date DESC);
CREATE INDEX idx_checkout_history_date ON book_checkout_history(action_date);
CREATE INDEX idx_checkout_history_user ON book_checkout_history(user_id);

-- book_images.uploaded_by → SET NULL (preserve images, lose uploader)
CREATE TABLE book_images_new (
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

INSERT INTO book_images_new SELECT * FROM book_images;
DROP TABLE book_images;
ALTER TABLE book_images_new RENAME TO book_images;

-- Recreate indexes for book_images
CREATE INDEX idx_book_images_book ON book_images(book_id);
CREATE INDEX idx_book_images_primary ON book_images(is_primary);
CREATE INDEX idx_book_images_type ON book_images(image_type);
CREATE INDEX idx_book_images_uploaded_by ON book_images(uploaded_by);

-- jwt_sessions.revoked_by → SET NULL (preserve session history, lose admin who revoked)
CREATE TABLE jwt_sessions_new (
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

INSERT INTO jwt_sessions_new SELECT * FROM jwt_sessions;
DROP TABLE jwt_sessions;
ALTER TABLE jwt_sessions_new RENAME TO jwt_sessions;

-- Recreate indexes for jwt_sessions
CREATE INDEX idx_jwt_sessions_expires_at ON jwt_sessions(expires_at);
CREATE INDEX idx_jwt_sessions_last_accessed ON jwt_sessions(last_accessed_at);
CREATE INDEX idx_jwt_sessions_revoked ON jwt_sessions(revoked);
CREATE INDEX idx_jwt_sessions_session_id ON jwt_sessions(session_id);
CREATE INDEX idx_jwt_sessions_token_hash ON jwt_sessions(token_hash);
CREATE INDEX idx_jwt_sessions_user_id ON jwt_sessions(user_id);

-- signup_approval_requests.reviewed_by → SET NULL (preserve request, lose reviewer)
CREATE TABLE signup_approval_requests_new (
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

INSERT INTO signup_approval_requests_new SELECT * FROM signup_approval_requests;
DROP TABLE signup_approval_requests;
ALTER TABLE signup_approval_requests_new RENAME TO signup_approval_requests;

-- Recreate indexes for signup_approval_requests
CREATE INDEX idx_signup_requests_email ON signup_approval_requests(email);
CREATE INDEX idx_signup_requests_requested_at ON signup_approval_requests(requested_at);
CREATE INDEX idx_signup_requests_reviewed_by ON signup_approval_requests(reviewed_by);
CREATE INDEX idx_signup_requests_status ON signup_approval_requests(status);

-- book_removal_requests.requester_id → SET NULL (preserve request, anonymize requester)
-- book_removal_requests.reviewed_by → SET NULL (preserve decision, lose reviewer)
CREATE TABLE book_removal_requests_new (
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

INSERT INTO book_removal_requests_new SELECT * FROM book_removal_requests;
DROP TABLE book_removal_requests;
ALTER TABLE book_removal_requests_new RENAME TO book_removal_requests;

-- Recreate indexes for book_removal_requests
CREATE INDEX idx_removal_requests_book ON book_removal_requests(book_id);
CREATE INDEX idx_removal_requests_created ON book_removal_requests(created_at);
CREATE INDEX idx_removal_requests_requester ON book_removal_requests(requester_id);
CREATE INDEX idx_removal_requests_reviewed_by ON book_removal_requests(reviewed_by);
CREATE INDEX idx_removal_requests_status ON book_removal_requests(status);

-- location_invitations.invited_by → SET NULL (invitation valid, sender lost)
CREATE TABLE location_invitations_new (
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

INSERT INTO location_invitations_new SELECT * FROM location_invitations;
DROP TABLE location_invitations;
ALTER TABLE location_invitations_new RENAME TO location_invitations;

-- Recreate indexes for location_invitations
CREATE INDEX idx_location_invitations_email ON location_invitations(invited_email);
CREATE INDEX idx_location_invitations_location ON location_invitations(location_id);
CREATE INDEX idx_location_invitations_token ON location_invitations(invitation_token);

-- location_admin_capabilities.granted_by → SET NULL (preserve capability, lose granter)
CREATE TABLE location_admin_capabilities_new (
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

INSERT INTO location_admin_capabilities_new SELECT * FROM location_admin_capabilities;
DROP TABLE location_admin_capabilities;
ALTER TABLE location_admin_capabilities_new RENAME TO location_admin_capabilities;

-- Recreate indexes for location_admin_capabilities
CREATE INDEX idx_location_admin_capabilities_capability ON location_admin_capabilities(capability);
CREATE INDEX idx_location_admin_capabilities_location_user ON location_admin_capabilities(location_id, user_id);
CREATE INDEX idx_location_admin_capabilities_user ON location_admin_capabilities(user_id);

-- location_user_permissions.granted_by → SET NULL (preserve permission, lose granter)
CREATE TABLE location_user_permissions_new (
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

INSERT INTO location_user_permissions_new SELECT * FROM location_user_permissions;
DROP TABLE location_user_permissions;
ALTER TABLE location_user_permissions_new RENAME TO location_user_permissions;

-- Recreate indexes for location_user_permissions
CREATE INDEX idx_location_user_permissions_location_user ON location_user_permissions(location_id, user_id);
CREATE INDEX idx_location_user_permissions_permission ON location_user_permissions(permission);
CREATE INDEX idx_location_user_permissions_user ON location_user_permissions(user_id);

-- user_global_permissions.granted_by → SET NULL (preserve permission, lose granter)
CREATE TABLE user_global_permissions_new (
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

INSERT INTO user_global_permissions_new SELECT * FROM user_global_permissions;
DROP TABLE user_global_permissions;
ALTER TABLE user_global_permissions_new RENAME TO user_global_permissions;

-- Recreate indexes for user_global_permissions
CREATE INDEX idx_user_global_permissions_granted_by ON user_global_permissions(granted_by);
CREATE INDEX idx_user_global_permissions_permission ON user_global_permissions(permission);
CREATE INDEX idx_user_global_permissions_user ON user_global_permissions(user_id);

-- ============================================================================
-- PHASE 2: CASCADE for User-Specific Data
-- Remove data that only makes sense with the user
-- ============================================================================

-- Drop view that depends on location_members before modifying the table
DROP VIEW IF EXISTS library_ratings_agg;

-- location_members.user_id → CASCADE (user removed from all locations)
-- location_members.invited_by → SET NULL (membership preserved, inviter lost)
CREATE TABLE location_members_new (
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

INSERT INTO location_members_new SELECT * FROM location_members;
DROP TABLE location_members;
ALTER TABLE location_members_new RENAME TO location_members;

-- Recreate indexes for location_members
CREATE INDEX idx_location_members_location ON location_members(location_id);
CREATE INDEX idx_location_members_user ON location_members(user_id);
CREATE INDEX idx_location_members_user_location ON location_members(user_id, location_id);

-- Recreate the library_ratings_agg view with updated location_members table
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

-- ============================================================================
-- PHASE 3: RESTRICT for High-Risk Cases (locations.owner_id)
-- Keep RESTRICT behavior - handle manually in application code
-- No migration needed - already has RESTRICT by default
-- ============================================================================

-- locations.owner_id remains without CASCADE/SET NULL
-- Application code will handle ownership transfer UI before deletion
-- See: AdminUserManager.tsx and user deletion endpoint

-- END OF MIGRATION

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- ROLLBACK for is_active:
--   ALTER TABLE users DROP COLUMN is_active;
--   DROP INDEX IF EXISTS idx_users_is_active;
--
-- ROLLBACK for foreign keys:
--   Reverting these changes requires recreating tables without ON DELETE clauses
--   This is complex and should be done with extreme caution
--   Recommend database backup before applying this migration