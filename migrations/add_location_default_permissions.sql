-- Location Default Permissions - Database Migration
-- Created: July 29, 2025
-- Purpose: Store default permissions that should be applied to new users joining each location

-- Table: location_default_permissions
-- Stores the default user permissions that should be granted when someone joins a location
CREATE TABLE IF NOT EXISTS location_default_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  permission TEXT NOT NULL, -- 'can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'
  permission_type TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user' - type of permission (for future admin default capabilities)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(location_id, permission, permission_type)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_location_default_permissions_location ON location_default_permissions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_default_permissions_type ON location_default_permissions(permission_type);