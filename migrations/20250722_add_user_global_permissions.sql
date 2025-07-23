-- User Global Permissions - Database Migration
-- Created: July 22, 2025
-- Purpose: Add user-level permissions that apply across all locations (not location-specific)

-- Table: user_global_permissions
-- Defines global permissions that apply to a user across all locations they have access to
-- These are higher-level permissions that override location-specific restrictions
CREATE TABLE IF NOT EXISTS user_global_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL, -- 'can_move_books_between_locations'
  granted_by TEXT NOT NULL, -- Super admin or location admin who granted this permission
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT, -- Optional notes about why this permission was granted
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, permission)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_global_permissions_user ON user_global_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_global_permissions_permission ON user_global_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_global_permissions_granted_by ON user_global_permissions(granted_by);