-- Location Permission Control - Database Migration
-- Created: July 12, 2025
-- Purpose: Add granular permission tables for location-specific user capabilities

-- Table: location_admin_capabilities
-- Defines what administrative capabilities location admins have been granted by super admins
CREATE TABLE IF NOT EXISTS location_admin_capabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL, -- 'can_control_user_capabilities', 'can_invite_users', 'can_manage_shelves', 'can_manage_location_settings'
  granted_by TEXT NOT NULL, -- Super admin who granted this capability
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, capability)
);

-- Table: location_user_permissions  
-- Defines what user-level permissions have been granted to specific users in specific locations
CREATE TABLE IF NOT EXISTS location_user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL, -- 'can_add_books', 'can_delete_books', 'can_move_books', 'can_create_shelves', 'can_edit_genres'
  granted_by TEXT NOT NULL, -- Admin who granted this permission
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, permission)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_location_user ON location_admin_capabilities(location_id, user_id);
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_user ON location_admin_capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_capability ON location_admin_capabilities(capability);

CREATE INDEX IF NOT EXISTS idx_location_user_permissions_location_user ON location_user_permissions(location_id, user_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_user ON location_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_permission ON location_user_permissions(permission);
