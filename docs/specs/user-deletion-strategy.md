# User Deletion Strategy - Hybrid Schema & Manual Transfer Approach

**Created**: September 2025
**Status**: Approved for Implementation
**Related**: LCWEB-171 Admin UI Data Synchronization

## Problem Statement

User deletion currently fails due to foreign key constraints in the database. Many tables reference `users(id)` without proper `ON DELETE CASCADE` or `ON DELETE SET NULL` clauses, causing constraint violations when attempting to delete users.

## Root Cause Analysis

Analysis of production database schema revealed 12+ tables with foreign key references to `users(id)` that lack proper deletion handling:

### Tables Currently Using CASCADE/SET NULL ✅
- `location_admin_capabilities`, `location_user_permissions`, `user_global_permissions`
- `book_ratings`, `jwt_sessions`, `notification_preferences`
- `in_app_notifications`, `user_recovery_codes`, `webauthn_*`
- `auth_audit_log`, `notification_log` (SET NULL)

### Problem Tables (No CASCADE/SET NULL) ❌
- `book_checkout_history.user_id`
- `signup_approval_requests.reviewed_by`
- `location_members.user_id`, `location_members.invited_by`
- `location_invitations.invited_by`
- `locations.owner_id` ⚠️ **HIGH RISK**
- `jwt_sessions.revoked_by`
- `book_removal_requests.requester_id`, `book_removal_requests.reviewed_by`
- `book_images.uploaded_by`
- Various `granted_by` fields

## Solution: Hybrid Approach

### Schema Changes (Low/Medium Risk)
Create migrations to add appropriate CASCADE/SET NULL behavior:

| Table | Field | Action | Rationale |
|-------|-------|--------|-----------|
| `jwt_sessions` | `revoked_by` | SET NULL | Session revocation history preserved |
| `signup_approval_requests` | `reviewed_by` | SET NULL | Request decision preserved, reviewer lost |
| `book_removal_requests` | `requester_id` | SET NULL | Request preserved, requester anonymized |
| `book_removal_requests` | `reviewed_by` | SET NULL | Decision preserved, reviewer lost |
| `location_invitations` | `invited_by` | SET NULL | Invitation valid, sender lost |
| `book_checkout_history` | `user_id` | SET NULL | Checkout facts preserved, user anonymized |
| `book_images` | `uploaded_by` | SET NULL | Images valuable for books, uploader lost |
| `location_members` | `user_id` | CASCADE | User removed from all locations |
| `location_members` | `invited_by` | SET NULL | Membership preserved, inviter lost |

### Manual Transfer Cases (High Risk)
Keep RESTRICT behavior and handle manually:

| Table | Field | Strategy | UI Treatment |
|-------|-------|----------|---------------|
| `locations` | `owner_id` | Smart Transfer | Prompt for ownership transfer if members exist |

## Implementation Details

### 1. Location Ownership Transfer Logic

**When deleting a location owner:**
1. **Check location membership**: Query `location_members` for other users
2. **If members exist**: Show transfer UI with member dropdown
3. **If no members OR admin skips**: SET `owner_id` to NULL (orphaned)
4. **If transfer selected**: UPDATE to new owner before user deletion

**UI Flow:**
```
┌─ User Deletion Confirmation ─┐
│ Delete user "john@example.com"? │
│                                 │
│ ⚠️  This user owns 2 locations:  │
│   • "Office Library" (3 members)│
│   • "Book Club" (0 members)     │
│                                 │
│ Transfer ownership?             │
│ ☐ Office Library → [dropdown]  │
│   (Sarah, Mike, Janet)          │
│ ☐ Book Club → (no members)     │
│                                 │
│ [ Cancel ] [ Delete User ]     │
└─────────────────────────────────┘
```

### 2. Orphaned Location Management

**Admin Dashboard Enhancement:**
- Add "Orphaned Locations" filter/view
- Show locations with `owner_id IS NULL`
- Display member count, book count, last activity
- Provide bulk cleanup tools for truly abandoned locations

### 3. Migration Strategy

**Phase 1: Safe Schema Changes**
```sql
-- Add CASCADE/SET NULL to safe foreign keys
ALTER TABLE jwt_sessions DROP CONSTRAINT IF EXISTS jwt_sessions_revoked_by_fkey;
ALTER TABLE jwt_sessions ADD CONSTRAINT jwt_sessions_revoked_by_fkey
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;

-- Repeat for all safe changes identified above
```

**Phase 2: Enhanced Deletion Logic**
- Update `AdminUserManager.tsx` to detect location ownership
- Add location transfer UI components
- Implement transfer logic in cleanup endpoint
- Add ownership validation before deletion

**Phase 3: Production Testing**
- Test with staging data
- Verify cascade behavior
- Validate UI flows
- Confirm orphaned location detection

## Data Preservation Priorities

### ✅ Preserve These (SET NULL)
- **Book checkout history**: Analytics value, anonymize users
- **Book images**: Visual assets valuable independent of uploader
- **Approval/review decisions**: Administrative audit trail
- **Permission records**: Keep permissions active, lose attribution

### ❌ Remove These (CASCADE)
- **Location memberships**: User being deleted, remove from locations
- **User-specific settings**: No value without the user

### 🔒 Protect These (RESTRICT + Manual)
- **Location ownership**: Prevent accidental library deletion
- **Critical business data**: Books, shelves, genre data

## Benefits

1. **Data Safety**: No accidental deletion of libraries or books
2. **Audit Preservation**: Maintain historical records where valuable
3. **User Experience**: Smart prompts for complex cases
4. **Administrative Control**: Manual oversight for high-risk operations
5. **Future Flexibility**: Schema supports both automatic and manual cleanup

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema migration failures | High | Staged rollout, backup verification |
| Orphaned locations accumulate | Medium | Admin dashboard alerts, cleanup tools |
| Performance impact | Low | Indexed foreign keys, batch operations |
| Complex UI flows | Medium | Progressive disclosure, clear messaging |

## Testing Strategy

1. **Unit Tests**: Foreign key constraint handling
2. **Integration Tests**: Full deletion workflow with transfers
3. **UI Tests**: Location ownership transfer flows
4. **Load Tests**: Batch user deletion scenarios
5. **Rollback Tests**: Migration reversal procedures

## Future Considerations

- **Bulk user deletion**: Extend transfer logic for multiple users
- **Location archiving**: Alternative to deletion for inactive locations
- **Audit log enhancement**: Track ownership transfers and deletions
- **API endpoints**: Programmatic user management for integrations

---

**Implementation Priority**: High
**Estimated Effort**: 2-3 days (migration + UI + testing)
**Dependencies**: Database migration system, admin UI framework