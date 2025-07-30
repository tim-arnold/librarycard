# Location Permission Control Specification

**Issue**: #31  
**Status**: ✅ COMPLETED - July 13, 2025  
**Created**: July 2025  
**Last Updated**: July 13, 2025

## Overview

This specification defines a granular permission control system that allows super administrators and location administrators to manage specific capabilities for users within locations. This extends the current role-based system with fine-grained, location-specific permissions.

## Background

Currently, LibraryCard uses a simple role-based permission system:
- **Super Admin**: Global administrative privileges
- **Admin**: Can manage locations they own or are members of
- **User**: Basic library access

This system lacks granular control over what users can do within specific locations. The new system will allow:
- Super admins to control what administrative capabilities location admins have
- Location admins to control what capabilities regular users have within their locations

## Requirements

### User Stories

#### As a Super Administrator
- I want to control whether location admins can manage user permissions in their locations
- I want to control whether location admins can invite new users to their locations
- I want to ensure location admins always have full user-level capabilities in their locations
- I want to maintain global oversight over all permission changes

#### As a Location Administrator
- I want to control whether users in my location can add books
- I want to control whether users in my location can delete books
- I want to control whether users in my location can move books between shelves
- I want to control whether users in my location can create new shelves
- I want to control whether users in my location can edit genre assignments
- I want these controls to only be available if the super admin has granted me permission management capabilities

#### As a Regular User
- I want to understand what I can and cannot do in each location I'm a member of
- I want these permissions to be clearly communicated in the user interface
- I want consistent behavior based on my granted permissions

## Permission Structure

### Permission Hierarchy

```
Super Admin (global)
├── Location Admin Capabilities (toggleable by super admin)
│   ├── can_control_user_capabilities
│   ├── can_invite_users  
│   ├── can_manage_shelves (advanced shelf operations)
│   └── can_manage_location_settings
│
└── User Permissions (automatic for location admins, toggleable for users)
    ├── can_add_books
    ├── can_delete_books
    ├── can_move_books (only available if location has multiple shelves)
    ├── can_create_shelves
    └── can_edit_genres
```

### Permission Matrix

| Permission | Super Admin | Location Admin (with capability) | Location Admin (without capability) | User (granted) | User (not granted) |
|------------|-------------|-----------------------------------|-------------------------------------|----------------|-------------------|
| **Administrative Capabilities** |
| Control user permissions | ✅ | ✅ (if granted) | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ (if granted) | ❌ | ❌ | ❌ |
| Manage location settings | ✅ | ✅ (if granted) | ❌ | ❌ | ❌ |
| **User-Level Capabilities** |
| Add books | ✅ | ✅ (inherited) | ✅ (inherited) | ✅ (if granted) | ❌ |
| Delete books | ✅ | ✅ (inherited) | ✅ (inherited) | ✅ (if granted) | ❌ |
| Move books between shelves | ✅ | ✅ (inherited) | ✅ (inherited) | ✅ (if granted) | ❌ |
| Create shelves | ✅ | ✅ (inherited) | ✅ (inherited) | ✅ (if granted) | ❌ |
| Edit genres | ✅ | ✅ (inherited) | ✅ (inherited) | ✅ (if granted) | ❌ |

## Database Schema

### New Tables

#### location_admin_capabilities
Defines what administrative capabilities location admins have been granted by super admins.

```sql
CREATE TABLE IF NOT EXISTS location_admin_capabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL, -- 'can_control_user_capabilities', 'can_invite_users', etc.
  granted_by TEXT NOT NULL, -- Super admin who granted this capability
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, capability)
);
```

#### location_user_permissions
Defines what user-level permissions have been granted to specific users in specific locations.

```sql
CREATE TABLE IF NOT EXISTS location_user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL, -- 'can_add_books', 'can_delete_books', etc.
  granted_by TEXT NOT NULL, -- Admin who granted this permission
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(location_id, user_id, permission)
);
```

### Schema Changes

#### Updated location_members table
No changes required - existing structure supports the permission system.

### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_location_user ON location_admin_capabilities(location_id, user_id);
CREATE INDEX IF NOT EXISTS idx_location_admin_capabilities_user ON location_admin_capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_location_user ON location_user_permissions(location_id, user_id);
CREATE INDEX IF NOT EXISTS idx_location_user_permissions_user ON location_user_permissions(user_id);
```

## API Specification

### Location Admin Capabilities Management

#### GET /api/admin/location-admin-capabilities?location_id={id}
Get administrative capabilities for location admins in a specific location.

**Authorization**: Super admin only

**Response**:
```json
{
  "capabilities": [
    {
      "userId": "user-123",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "capabilities": ["can_control_user_capabilities", "can_invite_users"],
      "grantedBy": "superadmin-456",
      "grantedAt": "2025-07-12T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/location-admin-capabilities
Grant administrative capability to a location admin.

**Authorization**: Super admin only

**Request**:
```json
{
  "locationId": 1,
  "userId": "user-123",
  "capability": "can_control_user_capabilities"
}
```

#### DELETE /api/admin/location-admin-capabilities
Revoke administrative capability from a location admin.

**Authorization**: Super admin only

**Request**:
```json
{
  "locationId": 1,
  "userId": "user-123", 
  "capability": "can_control_user_capabilities"
}
```

### User Permission Management

#### GET /api/admin/location-user-permissions?location_id={id}
Get user permissions for a specific location.

**Authorization**: Super admin OR location admin with `can_control_user_capabilities`

**Response**:
```json
{
  "permissions": [
    {
      "userId": "user-789",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "permissions": ["can_add_books", "can_edit_genres"],
      "grantedBy": "admin-123",
      "grantedAt": "2025-07-12T11:00:00Z"
    }
  ]
}
```

#### POST /api/admin/location-user-permissions
Grant permission to a user in a location.

**Authorization**: Super admin OR location admin with `can_control_user_capabilities`

**Request**:
```json
{
  "locationId": 1,
  "userId": "user-789",
  "permission": "can_add_books"
}
```

#### DELETE /api/admin/location-user-permissions
Revoke permission from a user in a location.

**Authorization**: Super admin OR location admin with `can_control_user_capabilities`

**Request**:
```json
{
  "locationId": 1,
  "userId": "user-789",
  "permission": "can_add_books"
}
```

### Permission Checking

#### GET /api/permissions/check
Check if current user has specific permission in a location.

**Authorization**: Authenticated user

**Query Parameters**:
- `locationId`: Location ID
- `permission`: Permission to check

**Response**:
```json
{
  "hasPermission": true,
  "reason": "user_granted" | "admin_inherited" | "super_admin"
}
```

## Business Rules

### Permission Inheritance
1. Super admins have all permissions in all locations
2. Location admins inherit all user-level permissions automatically
3. Location admins must be explicitly granted administrative capabilities
4. Regular users must be explicitly granted each permission

### Default Permissions
1. New users have no permissions by default (beyond viewing)
2. New location admins have no administrative capabilities by default
3. Location owners automatically receive all administrative capabilities

### Permission Dependencies
1. `can_move_books` is only available if the location has multiple shelves
2. Administrative capabilities can only be granted by super admins
3. User permissions can only be granted by location admins with `can_control_user_capabilities`

### Edge Cases
1. If a location admin loses `can_control_user_capabilities`, existing user permissions remain but cannot be modified
2. If a user is removed from a location, all their permissions for that location are deleted
3. If a location is deleted, all associated permissions are cascade deleted
4. Location owners cannot have their administrative capabilities revoked

## UI/UX Requirements

### Location Member Management Interface

#### For Super Admins
- View all location admins and their capabilities
- Toggle administrative capabilities for location admins
- Override any permission settings
- Bulk permission management tools

#### For Location Admins (with can_control_user_capabilities)
- View all location members and their permissions
- Toggle user permissions for location members
- Clear indication of which permissions they can control
- Batch permission updates for multiple users

#### For All Users
- Clear display of their permissions in each location
- Contextual help explaining what each permission allows
- Visual indicators in the UI showing available/unavailable actions

### Permission Display Patterns

#### Action Button States
- **Available**: Full color, clickable
- **Restricted**: Grayed out with tooltip explaining required permission
- **Hidden**: Not displayed if user lacks fundamental access

#### Permission Lists
- Checkboxes for toggleable permissions
- Lock icons for inherited permissions
- Clear labels and descriptions for each permission

## Implementation Considerations

### Performance
- Cache permission lookups for frequently accessed locations
- Optimize permission checking queries with proper indexes
- Consider permission materialization for complex inheritance

### Security
- All permission changes must be audited
- Validate permission hierarchy on every grant/revoke operation
- Ensure location admins cannot escalate their own privileges

### Migration Strategy
- Create new tables without affecting existing functionality
- Gradually migrate existing admin capabilities to new system
- Provide data migration tools for existing installations

## Acceptance Criteria

### Core Functionality
- [ ] Super admins can grant/revoke administrative capabilities to location admins
- [ ] Location admins can grant/revoke user permissions (if they have the capability)
- [ ] Permission checking works correctly for all API endpoints
- [ ] UI correctly displays available actions based on permissions

### Permission Inheritance
- [ ] Location admins automatically inherit all user-level permissions
- [ ] Super admins can perform all actions regardless of permission settings
- [ ] Permission hierarchy is enforced consistently

### User Experience
- [ ] Clear visual indicators for permission state in UI
- [ ] Helpful error messages when actions are restricted
- [ ] Intuitive permission management interfaces for admins

### Data Integrity
- [ ] Permissions are properly cleaned up when users/locations are deleted
- [ ] No orphaned permission records exist
- [ ] All permission changes are properly audited

## Future Considerations

### Potential Enhancements
- Role templates for common permission combinations
- Time-based permissions (temporary access)
- Permission inheritance between related locations
- Advanced audit logging and permission history

### Monitoring
- Track permission usage patterns
- Monitor for unusual permission escalation attempts
- Report on permission distribution across locations

## ✅ Implementation Status - COMPLETED July 13, 2025

### Successfully Implemented Features
- ✅ **Database Schema**: Created `location_admin_capabilities` and `location_user_permissions` tables with proper indexes
- ✅ **API Endpoints**: All permission management APIs implemented and tested
- ✅ **Super Admin Controls**: Complete admin capability management for location administrators
- ✅ **Location Admin Controls**: User permission management with proper capability validation
- ✅ **Frontend Interface**: LocationPermissionManager component with dual-tier permission management
- ✅ **Permission Inheritance**: Location admins automatically inherit all user-level permissions
- ✅ **Super Admin Universal Access**: Global permission management across all locations
- ✅ **Read-Only Permission Viewing**: Location admins can view permissions without management capability
- ✅ **Bulk Permission Controls**: Grant/revoke permissions for multiple users simultaneously
- ✅ **Real-Time UI Updates**: Immediate feedback with loading states and disabled controls

### Key Bug Fixes Resolved
- ✅ **Super Admin Access**: Fixed access denied errors in multi-location permission management
- ✅ **Admin Validation**: Resolved "Target user must be a location admin" error
- ✅ **API Race Conditions**: Eliminated duplicate API calls and hanging spinner issues
- ✅ **Universal Shelf Access**: Super admins can now access shelves in all locations
- ✅ **User Loading**: Fixed user permission data loading in secondary locations

### Implementation Highlights
- **Dual-Tier Architecture**: Super admins → Location admin capabilities → User permissions
- **Location-Specific Isolation**: All permissions scoped to individual locations
- **Intelligent UI States**: Disabled controls for read-only access with helpful messaging
- **Hierarchical Validation**: Proper permission checking at API and UI levels
- **Zero Breaking Changes**: Existing functionality preserved while adding granular controls

The granular permission control system is now fully operational and provides comprehensive access management for multi-location library environments.