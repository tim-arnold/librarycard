# LCWEB-174: Location Privacy & User Display Settings

**Jira Issue**: [LCWEB-174](https://tim52.atlassian.net/browse/LCWEB-174)
**Created**: December 2024
**Status**: In Progress

## Overview

Add comprehensive privacy controls for user activity visibility, with location-level settings and individual user preferences for name display. Currently, names are only displayed to admins and superadmins. This feature enables user activity visibility to regular users with proper privacy controls.

## Requirements

### Location-Level Privacy Settings
**Access**: Admin/SuperAdmin with "manage location" permission

- **Public**: User activity visible to all members with privacy controls
- **Private**: All activity anonymous, no user override possible

### User Activity Areas (when location is public)
1. Book additions ("Added by...")
2. Reviews (sidebar + "more details" modal)
3. Book checkouts ("Checked out by...")
4. Other activity areas to be identified

### User Privacy Controls (when location is public)
- **Per-action anonymity**: Users can choose "anonymous" when performing actions
- **Retroactive privacy**: Users can make previously public actions anonymous
- **Display name preference**: User profile setting for name display format

### Name Display Options (WordPress-style dropdown)
1. First name only (`"John"`)
2. First name + Last name (`"John Doe"`)
3. Email (`"john@example.com"`)
4. Custom username (`"BookLover123"`)
5. Anonymous (`"Library Member"`)

### Default Behavior
- Public locations: Default to first name only
- Private locations: Always "Library Member"
- User actions: Default to user's profile preference, with option to override per-action

## Database Changes

### 1. Location Privacy Settings
```sql
-- Add to locations table
ALTER TABLE locations ADD COLUMN activity_visibility TEXT DEFAULT 'private' CHECK (activity_visibility IN ('private', 'public'));
```

### 2. User Display Preferences
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN display_name_preference TEXT DEFAULT 'first_name' CHECK (display_name_preference IN ('first_name', 'full_name', 'email', 'custom_username', 'anonymous'));
ALTER TABLE users ADD COLUMN custom_username VARCHAR(50);
```

### 3. Per-Action Privacy Overrides
```sql
-- New table for activity privacy overrides
CREATE TABLE IF NOT EXISTS user_activity_privacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('book_addition', 'review', 'checkout')),
  activity_id TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, activity_type, activity_id)
);

-- Add privacy flags to existing tables
ALTER TABLE books ADD COLUMN added_by_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE book_ratings ADD COLUMN reviewer_anonymous BOOLEAN DEFAULT FALSE;
-- Note: checkouts table would need similar column if it doesn't exist
```

## Backend Implementation

### 1. Location Management (`workers/locations/index.ts`)
- Update `Location` interface with `activity_visibility` field
- Add privacy settings to location update/create endpoints
- Add permission checking for "manage location" capability
- Validate that only users with proper permissions can modify privacy settings

### 2. User Profile Management
- New endpoints for user display preferences
- Custom username validation and uniqueness checking
- Retroactive privacy toggle endpoints for past activities
- Handle custom username conflicts

### 3. Activity Query Updates
- Modify all activity queries to respect location privacy settings
- Apply user display preferences when location is public
- Handle per-action anonymity overrides
- Return "Library Member" for anonymous users
- Ensure admin/superadmin always see real names

### 4. Privacy Helper Functions
```typescript
// Core privacy functions to implement
getUserDisplayName(user, locationSettings, activityPrivacy)
canViewUserActivity(viewerUserId, locationId, env)
isActivityAnonymous(activityType, activityId, userId, env)
formatUserDisplayName(user, preference, isAnonymous)
```

## Frontend Implementation

### 1. Location Privacy Settings UI
- Add "Privacy Settings" section to location management interface
- Toggle for "Public Activity Display" vs "Private/Anonymous"
- Clear explanation of what each setting means
- Restrict access to users with location management permissions
- Warning about changing from public to private

### 2. User Profile Display Preferences
- Add new section in user profile settings
- Dropdown with display name options:
  - "First name only"
  - "First and last name"
  - "Email address"
  - "Custom username" (with text input and validation)
  - "Always anonymous"
- Real-time preview of how name will appear
- Custom username input with availability checking

### 3. Per-Action Privacy Controls
- Add "Post anonymously" checkbox to:
  - Book addition forms
  - Review submission forms
  - Checkout actions (if applicable)
- "Make anonymous" toggle for existing user activities
- Bulk privacy management for user's past activities

### 4. Display Components Updates
- `RecentReviews.tsx`: Apply privacy logic and display preferences
- `NewlyAdded.tsx`: Handle "Added by" privacy with conditional display
- Book details modal: Apply review privacy settings
- Checkout history: Handle checkout privacy
- Admin components: Always show full names regardless of privacy settings
- Activity feeds: Respect privacy settings throughout

### 5. Privacy Utilities
- `formatUserDisplayName()` helper function
- `useLocationPrivacySettings()` hook for location privacy state
- `useUserPrivacyControls()` hook for individual privacy management
- `useDisplayNamePreference()` hook for user preference management

## TypeScript Interface Updates

```typescript
// Update Location interface
interface Location {
  // existing fields...
  activity_visibility?: 'private' | 'public';
}

// Update User interface
interface User {
  // existing fields...
  display_name_preference?: 'first_name' | 'full_name' | 'email' | 'custom_username' | 'anonymous';
  custom_username?: string;
}

// New interface for activity privacy
interface UserActivityPrivacy {
  id: number;
  user_id: string;
  activity_type: 'book_addition' | 'review' | 'checkout';
  activity_id: string;
  is_anonymous: boolean;
  created_at: string;
}
```

## Permission & Access Control

### Location Privacy Settings
- Requires "manage location" permission (`can_manage_location_settings`)
- Super admins can modify any location's privacy settings
- Regular admins can only modify locations they have permission to manage

### User Display Preferences
- Users can only modify their own display preferences
- No special permissions required for basic preference changes
- Custom username must be validated for uniqueness and appropriateness

### Per-Action Privacy
- Users can only modify privacy settings for their own activities
- Cannot make anonymous activities public if location is set to private
- Historical activities can be toggled between public and anonymous

### Admin Override
- Admins and SuperAdmins always see real user identities
- Privacy settings don't apply to admin/management interfaces
- Admin actions are logged with full user identification

## Implementation Phases

### Phase 1: Database & Core Backend
1. Create database migrations for new columns and tables
2. Update TypeScript interfaces
3. Implement core privacy helper functions
4. Add location privacy settings to location management endpoints

### Phase 2: User Preference Management
1. Add user display preference endpoints
2. Implement custom username validation
3. Add per-action privacy override functionality
4. Update activity queries to respect privacy settings

### Phase 3: Frontend Privacy Controls
1. Add location privacy settings to admin interface
2. Implement user profile display preference UI
3. Add per-action privacy controls to forms
4. Create privacy management utilities and hooks

### Phase 4: Display Component Updates
1. Update all activity display components
2. Implement privacy-aware name formatting
3. Add retroactive privacy management interface
4. Ensure admin interfaces always show full information

### Phase 5: Testing & Refinement
1. Comprehensive testing of privacy logic
2. Screenshot testing for UI changes
3. Performance testing for privacy queries
4. User acceptance testing for privacy controls

## Edge Cases & Considerations

### Data Handling
- Handle users with no first_name/last_name gracefully
- Custom username uniqueness validation (global or per-location?)
- Performance impact of privacy queries on large datasets
- Migration strategy for existing user activities

### User Experience
- Clear explanations of privacy implications
- Warning when changing location from public to private
- Batch operations for retroactive privacy changes
- Preview functionality for display name changes

### Security & Privacy
- Ensure admin bypass doesn't leak through API responses
- Validate that private location settings are truly enforced
- Audit logging for privacy setting changes
- Consider GDPR/privacy regulation compliance

### Technical Considerations
- Caching implications for privacy-aware queries
- Database query optimization for privacy checks
- API response consistency between public and private modes
- Backward compatibility for existing integrations

## Success Criteria

1. **Location Privacy**: Admins can set location-wide privacy settings
2. **User Control**: Users can set display preferences and per-action privacy
3. **Retroactive Management**: Users can change privacy of past activities
4. **Admin Visibility**: Admins always see full user information
5. **Performance**: Privacy checks don't significantly impact query performance
6. **User Experience**: Clear, intuitive privacy controls with helpful explanations

## Testing Strategy

### Unit Tests
- Privacy helper functions
- Display name formatting
- Permission checking logic

### Integration Tests
- Location privacy setting enforcement
- User preference application
- Admin override functionality

### UI Tests
- Privacy control interfaces
- Display name preview functionality
- Retroactive privacy management

### Performance Tests
- Privacy query impact measurement
- Large dataset privacy filtering
- Cache effectiveness with privacy settings

---

**Note**: This plan will be updated as implementation progresses and requirements are refined based on user feedback and technical constraints.