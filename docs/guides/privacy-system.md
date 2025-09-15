# Privacy and User Display System

**Feature**: LCWEB-174 - Location Privacy & User Display Settings
**Status**: ✅ Complete
**Added**: September 2025

## Overview

The Privacy and User Display System provides comprehensive privacy controls for both location administrators and individual users, allowing fine-grained control over how user information is displayed throughout the application.

## Architecture

### Two-Tier Privacy System

#### 1. Location-Level Privacy Settings (Admin Controlled)
- **Activity Visibility**: Whether library activity is visible to location members
- **Default Display Preferences**: Baseline privacy settings for the location
- **Review Visibility**: Control over review display and attribution

#### 2. User-Level Display Preferences (User Controlled)
- **Personal Display Name**: How the user's name appears in activities
- **Activity Participation**: Whether user participates in activity feeds
- **Review Attribution**: How reviews are attributed to the user

## Features

### Location Privacy Settings

#### Admin Controls
Location administrators can configure:
```typescript
interface LocationPrivacySettings {
  activity_visibility: 'public' | 'private'
  default_display_preference: DisplayPreference
  enforce_privacy_policy: boolean
}
```

#### Activity Visibility Options
- **Public**: Activity visible to all location members
- **Private**: Activity hidden or anonymized

### User Display Preferences

#### Five Display Name Options
1. **First Name Only**: "John" (most private, recommended)
2. **Full Name**: "John Doe"
3. **Email Address**: "john@example.com"
4. **Custom Username**: User-defined display name
5. **Anonymous**: No name shown, displayed as "Anonymous"

#### Configuration Interface
```typescript
interface UserDisplayPreference {
  display_type: 'first_name' | 'full_name' | 'email' | 'username' | 'anonymous'
  custom_username?: string
  show_in_activity: boolean
}
```

## Technical Implementation

### Database Schema

#### Location Privacy Table
```sql
CREATE TABLE location_privacy_settings (
  location_id INTEGER PRIMARY KEY,
  activity_visibility TEXT DEFAULT 'public',
  default_display_preference TEXT DEFAULT 'first_name',
  enforce_privacy_policy BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### User Display Preferences Table
```sql
CREATE TABLE user_display_preferences (
  user_id TEXT PRIMARY KEY,
  display_type TEXT DEFAULT 'first_name',
  custom_username TEXT,
  show_in_activity BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Privacy Management
```typescript
// Location privacy settings (admin only)
GET /api/admin/locations/:id/privacy
PUT /api/admin/locations/:id/privacy

// User display preferences
GET /api/user/display-preferences
PUT /api/user/display-preferences
```

#### Privacy-Aware Data Retrieval
```typescript
// Activity feeds with privacy-aware names
GET /api/library/activity/:locationId
// Returns activity with properly formatted display names

// Book details with privacy-aware attribution
GET /api/books/:id
// Includes privacy-aware reviewer names
```

### Privacy Helper Functions

#### Display Name Resolution
```typescript
function getDisplayName(
  user: User,
  preferences: UserDisplayPreference,
  locationSettings: LocationPrivacySettings
): string {
  switch (preferences.display_type) {
    case 'first_name':
      return user.first_name || 'User'
    case 'full_name':
      return `${user.first_name} ${user.last_name}`.trim() || 'User'
    case 'email':
      return user.email
    case 'username':
      return preferences.custom_username || user.first_name || 'User'
    case 'anonymous':
      return 'Anonymous'
    default:
      return user.first_name || 'User'
  }
}
```

#### Privacy-Aware Query Building
```typescript
function buildPrivacyAwareQuery(locationId: number, requestingUserId: string) {
  return `
    SELECT
      b.*,
      CASE
        WHEN udp.display_type = 'anonymous' THEN 'Anonymous'
        WHEN udp.display_type = 'first_name' THEN u.first_name
        WHEN udp.display_type = 'full_name' THEN u.first_name || ' ' || u.last_name
        WHEN udp.display_type = 'email' THEN u.email
        WHEN udp.display_type = 'username' THEN COALESCE(udp.custom_username, u.first_name)
        ELSE u.first_name
      END as display_name
    FROM books b
    LEFT JOIN users u ON b.added_by = u.id
    LEFT JOIN user_display_preferences udp ON u.id = udp.user_id
    WHERE b.location_id = ?
  `
}
```

## User Interface

### Admin Privacy Settings

#### Location Management Interface
```typescript
<LocationPrivacySettings
  locationId={locationId}
  settings={privacySettings}
  onUpdate={handlePrivacyUpdate}
>
  <FormControl>
    <InputLabel>Activity Visibility</InputLabel>
    <Select value={settings.activity_visibility}>
      <MenuItem value="public">Public - Show activity to all members</MenuItem>
      <MenuItem value="private">Private - Hide activity details</MenuItem>
    </Select>
  </FormControl>

  <FormControl>
    <InputLabel>Default Display Preference</InputLabel>
    <Select value={settings.default_display_preference}>
      <MenuItem value="first_name">First Name Only (Recommended)</MenuItem>
      <MenuItem value="full_name">Full Name</MenuItem>
      <MenuItem value="anonymous">Anonymous</MenuItem>
    </Select>
  </FormControl>
</LocationPrivacySettings>
```

### User Display Preferences

#### Profile Settings Interface
```typescript
<UserDisplayPreferences
  preferences={userPreferences}
  onUpdate={handlePreferenceUpdate}
>
  <RadioGroup value={preferences.display_type}>
    <FormControlLabel
      value="first_name"
      control={<Radio />}
      label="First Name Only (Recommended for Privacy)"
    />
    <FormControlLabel
      value="full_name"
      control={<Radio />}
      label="Full Name"
    />
    <FormControlLabel
      value="email"
      control={<Radio />}
      label="Email Address"
    />
    <FormControlLabel
      value="username"
      control={<Radio />}
      label="Custom Username"
    />
    <FormControlLabel
      value="anonymous"
      control={<Radio />}
      label="Anonymous (No Name Shown)"
    />
  </RadioGroup>

  {preferences.display_type === 'username' && (
    <TextField
      label="Custom Username"
      value={preferences.custom_username}
      onChange={handleUsernameChange}
      placeholder="Enter your preferred display name"
    />
  )}
</UserDisplayPreferences>
```

### Success Feedback
- Success confirmation positioned directly above Save Changes button
- 5-second auto-dismiss with manual close option
- Clear feedback for privacy setting changes

## Integration Points

### Activity Feed Integration
- **Library Sidebar**: Shows privacy-aware names in recent activity
- **Book Details**: Review attribution respects display preferences
- **Activity Notifications**: Names formatted according to settings

### Review System Integration
- **Review Display**: Author names follow privacy preferences
- **Review Moderation**: Admin can see actual names regardless of display settings
- **Review History**: Maintains privacy settings over time

### Search and Discovery
- **Book Attribution**: "Added by" information respects privacy
- **Activity Filtering**: Privacy-aware search and filtering
- **Member Directory**: Optional member visibility controls

## Privacy Compliance

### Data Protection Principles
- **Minimal Data Exposure**: Only show necessary information
- **User Control**: Users control their own display preferences
- **Admin Oversight**: Location admins can set privacy baselines
- **Audit Trail**: Privacy setting changes are logged

### GDPR Considerations
- **Right to Privacy**: Users can choose anonymous display
- **Data Minimization**: Only store necessary preference data
- **User Control**: Easy-to-access privacy controls
- **Data Portability**: Privacy preferences included in user data exports

## Security Considerations

### Authentication & Authorization
- **Admin-Only Controls**: Location privacy settings require admin privileges
- **User-Only Controls**: Display preferences require user authentication
- **Permission Validation**: All privacy operations validate user permissions

### Data Security
- **Secure Storage**: Privacy preferences stored securely in database
- **CSRF Protection**: All preference updates protected against CSRF
- **Input Validation**: Custom usernames validated and sanitized

## Migration & Backward Compatibility

### Database Migration
```sql
-- Migration adds privacy tables with sensible defaults
-- Existing functionality preserved during migration
-- Progressive rollout possible location by location
```

### Fallback Behavior
- **Missing Preferences**: Default to first name display
- **Missing Privacy Settings**: Default to public visibility
- **Legacy Data**: Existing reviews maintain attribution

## Usage Analytics

### Privacy Metrics
- **Adoption Rates**: Track privacy feature usage
- **Preference Distribution**: Monitor display preference choices
- **Location Adoption**: Track location privacy setting adoption

### User Behavior
- **Setting Changes**: Monitor preference change frequency
- **Feature Usage**: Track privacy feature engagement
- **Support Metrics**: Monitor privacy-related support requests

## Future Enhancements

### Planned Features
- **Group Privacy Settings**: Privacy settings for user groups
- **Time-Based Privacy**: Temporary privacy settings
- **Advanced Anonymization**: More sophisticated privacy options
- **Privacy Recommendations**: Smart privacy setting suggestions

### Integration Opportunities
- **Social Features**: Privacy-aware social functionality
- **Recommendation Engine**: Privacy-aware book recommendations
- **Analytics Dashboard**: Privacy-respecting usage analytics

---

**Implementation Date**: September 2025
**Developer**: Tim Arnold
**Related Issues**: LCWEB-174, LCWEB-172 (Activity Feed Integration)
**Dependencies**: User management system, Location management system