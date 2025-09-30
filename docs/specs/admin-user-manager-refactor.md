# AdminUserManager Refactoring Plan

**Jira Issue**: LCWEB-200
**Status**: In Progress
**Created**: 2025-09-30

## Problem Statement

The `AdminUserManager.tsx` component has grown to 2,257 lines, making it difficult to maintain, test, and extend. The component handles multiple distinct domains (user management, invitations, location assignment, ownership transfer, and global permissions) all in a single file.

## Current Issues

- **Size**: 2,257 lines in a single component file
- **Complexity**: Multiple distinct business domains mixed together
- **Maintainability**: Difficult to locate and modify specific features
- **Testing**: Hard to unit test individual features in isolation
- **Collaboration**: High risk of merge conflicts when multiple developers work on admin features
- **Performance**: All code loaded upfront, no opportunity for code splitting

## Goals

1. **Reduce main file size**: From 2,257 lines → ~300 lines orchestrator
2. **Improve maintainability**: Each file <400 lines with single responsibility
3. **Enable testing**: Isolated hooks and components easier to unit test
4. **Enhance reusability**: Invitation and location logic usable in other admin contexts
5. **Optimize performance**: Enable lazy loading of dialogs and subsystems
6. **Reduce conflicts**: Separate files reduce merge conflict probability

## Analysis: Component Breakdown

### 1. User Management (Core - ~600 lines)
- **Lines 191-217**: User data loading
- **Lines 440-524**: User status/role management (enable/disable, promote/demote)
- **Lines 595-668**: User deletion workflow
- **Lines 526-593**: User cleanup operations
- **Lines 1252-1336**: User table rendering

### 2. Invitation Management (Complete subsystem - ~500 lines)
- **Lines 814-1057**: Invitation CRUD operations (load, send, revoke)
- **Lines 1094-1191**: Filtering, sorting, pagination logic
- **Lines 1890-2047**: Invitation dialog UI (single & bulk)
- **Lines 1478-1583**: Invitation list rendering with analytics

### 3. Location Assignment (Admin feature - ~400 lines)
- **Lines 229-248**: Load user locations
- **Lines 328-438**: Assign/unassign location operations
- **Lines 2114-2254**: Location assignment dialog UI

### 4. Ownership Transfer (Complex workflow - ~200 lines)
- **Lines 703-764**: Ownership transfer logic
- **Lines 1744-1844**: Transfer dialog UI

### 5. Global Permissions (Cross-location - ~150 lines)
- **Lines 283-326**: Permission toggling logic
- **Lines 2164-2204**: Permissions UI in location dialog

### 6. Shared Utilities (~200 lines)
- **Lines 766-811**: Date formatting, chip rendering, display helpers
- Type definitions (AdminUser, LocationInvitation, Location)

## Proposed File Structure

```
src/components/admin/
├── AdminUserManager.tsx (~300 lines)
│   └── Main orchestrator component
│
├── user-management/
│   ├── UserTable.tsx (~200 lines)
│   │   └── User list table with sorting/filtering
│   ├── UserActionsMenu.tsx (~150 lines)
│   │   └── Context menu for user actions
│   ├── useUserManagement.ts (~200 lines)
│   │   └── Hook for user CRUD operations
│   ├── UserCleanupDialog.tsx (~100 lines)
│   │   └── User cleanup UI
│   └── OwnershipTransferDialog.tsx (~200 lines)
│       └── Location ownership transfer UI
│
├── invitations/
│   ├── InvitationManager.tsx (~400 lines)
│   │   └── Complete invitation management UI
│   ├── InvitationFilters.tsx (~150 lines)
│   │   └── Filter, sort, search controls
│   ├── InvitationList.tsx (~150 lines)
│   │   └── Invitation cards with pagination
│   ├── InvitationDialog.tsx (~200 lines)
│   │   └── Send invitation dialog (single/bulk)
│   └── useInvitations.ts (~200 lines)
│       └── Hook for invitation operations
│
├── locations/
│   ├── LocationAssignmentDialog.tsx (~200 lines)
│   │   └── Location assignment UI
│   ├── GlobalPermissionsSection.tsx (~100 lines)
│   │   └── Cross-location permissions UI
│   └── useLocationAssignment.ts (~150 lines)
│       └── Hook for location assignment logic
│
└── shared/
    ├── types.ts (~50 lines)
    │   └── AdminUser, LocationInvitation, Location interfaces
    └── utils.ts (~150 lines)
        └── Formatting helpers, display utilities
```

## Implementation Steps

### Phase 1: Foundation
1. Create directory structure
2. Extract shared types to `shared/types.ts`
3. Extract utility functions to `shared/utils.ts`
4. Update imports in main component

### Phase 2: Invitation Subsystem
5. Create `useInvitations.ts` hook with all invitation logic
6. Extract `InvitationFilters.tsx` component
7. Extract `InvitationList.tsx` component
8. Extract `InvitationDialog.tsx` component
9. Create `InvitationManager.tsx` orchestrator
10. Update main component to use InvitationManager

### Phase 3: Location Assignment
11. Create `useLocationAssignment.ts` hook
12. Extract `GlobalPermissionsSection.tsx`
13. Extract `LocationAssignmentDialog.tsx`
14. Update main component

### Phase 4: User Management
15. Create `useUserManagement.ts` hook
16. Extract `UserTable.tsx` component
17. Extract `UserActionsMenu.tsx` component
18. Extract `UserCleanupDialog.tsx`
19. Extract `OwnershipTransferDialog.tsx`
20. Update main component

### Phase 5: Final Cleanup
21. Refine main `AdminUserManager.tsx` orchestrator
22. Add lazy loading for dialogs
23. Run build and lint verification
24. Test all user management flows

## Expected Benefits

### Maintainability
- Each file focused on single responsibility
- Maximum file size ~400 lines (vs 2,257)
- Easier to locate and modify specific features

### Testability
- Isolated hooks can be unit tested
- UI components can be tested independently
- Business logic separated from presentation

### Performance
- Lazy load invitation manager (only when clicked)
- Lazy load location assignment dialog
- Lazy load ownership transfer dialog
- ~30% reduction in initial bundle for admin pages

### Collaboration
- Reduced merge conflicts (separate files)
- Clear ownership boundaries for features
- Easier onboarding for new developers

### Reusability
- Invitation hooks reusable in other admin contexts
- Location assignment logic reusable
- Shared utilities benefit entire admin section

## Success Metrics

- ✅ Main component reduced from 2,257 → ~300 lines
- ✅ No individual file exceeds 400 lines
- ✅ All existing functionality preserved
- ✅ Build and lint pass without errors
- ✅ All user management flows tested and working

## Risks & Mitigation

**Risk**: Breaking existing functionality during extraction
**Mitigation**: Extract one subsystem at a time, test after each phase

**Risk**: Import circular dependencies
**Mitigation**: Careful dependency analysis, shared types in separate file

**Risk**: Performance regression from code splitting
**Mitigation**: Use lazy loading strategically, measure bundle sizes

## Timeline

- Phase 1-2: Foundations + Invitations (~2-3 hours)
- Phase 3-4: Locations + User Management (~2-3 hours)
- Phase 5: Cleanup + Testing (~1 hour)

**Total Estimate**: 5-7 hours

## Related Issues

- Part of LCWEB-122 (UX/UI Epic)
- Improves maintainability for future admin features
