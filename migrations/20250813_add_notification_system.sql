-- Complete Notification System - Database Migration
-- Created: August 13, 2025
-- Purpose: Add comprehensive notification system with email preferences and in-app notifications

-- ===== EMAIL NOTIFICATION SYSTEM =====

-- Table: notification_preferences
-- Stores user notification preferences for various event types
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

-- Table: notification_queue
-- Queue for batch email operations to prevent blocking
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

-- Table: notification_log
-- Track email delivery for audit and troubleshooting
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

-- ===== IN-APP NOTIFICATION SYSTEM =====

-- Table: in_app_notifications
-- Stores notifications that appear in the admin interface
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

-- Table: notification_read_status
-- Track when users last checked notifications to show "new since last login"
CREATE TABLE IF NOT EXISTS notification_read_status (
  user_id TEXT PRIMARY KEY,
  last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_unread INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Email notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_location ON notification_preferences(location_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_location ON notification_log(location_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);

-- In-app notification indexes
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_recipient ON in_app_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_type ON in_app_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created ON in_app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_location ON in_app_notifications(related_location_id);

-- ===== DEFAULT DATA FOR EXISTING USERS =====

-- Insert default notification preferences for all existing admin users
INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'user_registration', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'location_access_granted', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'location_access_revoked', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'permission_granted', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'permission_revoked', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'book_added', FALSE  -- Default to disabled for book additions (can be high volume)
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'book_removed', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'book_review_submitted', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'book_review_approved', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'book_review_rejected', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'genre_suggestion', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled)
SELECT u.id, 'system_maintenance', TRUE
FROM users u WHERE u.user_role IN ('admin', 'super_admin');

-- Initialize notification read status for all existing admin users
INSERT OR IGNORE INTO notification_read_status (user_id, last_checked_at, total_unread)
SELECT id, CURRENT_TIMESTAMP, 0
FROM users 
WHERE user_role IN ('admin', 'super_admin');