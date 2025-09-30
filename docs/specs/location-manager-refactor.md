# LocationManager Refactoring Plan

**Jira Issue**: TBD
**Status**: Planning
**Created**: 2025-09-30

## Problem Statement

The `LocationManager.tsx` component is 1,014 lines, making it the largest admin component after the AdminUserManager refactoring. It handles multiple distinct domains (location management, shelf management, permissions, UI rendering) all in a single file.

## Current Issues

- **Size**: 1,014 lines in a single component file
- **Complexity**: Three distinct business domains mixed together
- **Maintainability**: Difficult to locate and modify specific features
- **Testing**: Hard to unit test individual features in isolation
- **Reusability**: Location/shelf logic could be useful in other contexts
- **Modal sharing**: Same issue as AdminUserManager - needs prop passing

## Goals

1. **Reduce main file size**: From 1,014 lines → ~250 lines orchestrator
2. **Improve maintainability**: Each file <300 lines with single responsibility
3. **Enable testing**: Isolated hooks and components easier to unit test
4. **Enhance reusability**: Location and shelf logic usable elsewhere
5. **Consistent patterns**: Match AdminUserManager refactoring approach

## Analysis: Component Breakdown

### 1. Location Management (Core - ~350 lines)
- **Lines 115-133**: `loadUserRole` - Get current user's role
- **Lines 135-166**: `loadLocations` - Fetch all locations
- **Lines 196-231**: `createLocation` - Create new location with validation
- **Lines 233-266**: `updateLocation` - Update existing location
- **Lines 268-319**: `deleteLocation` - Delete with confirmation and animation
- **Lines 384-393**: `startEditLocation` - Prepare location for editing

### 2. Shelf Management (Subsystem - ~250 lines)
- **Lines 168-188**: `loadShelves` - Fetch shelves for location
- **Lines 396-422**: `createShelf` - Create new shelf
- **Lines 424-451**: `updateShelf` - Update existing shelf
- **Lines 453-500**: `deleteShelf` - Delete with book checking
- **Lines 502-506**: `startEditShelf` - Prepare shelf for editing

### 3. Permission Management (~150 lines)
- **Lines 321-349**: `checkAllLocationPermissions` - Bulk permission check
- **Lines 351-378**: `checkLocationManagePermission` - Single location check
- **Lines 380-382**: `canManageLocationSettings` - Helper function

### 4. UI Rendering (~450 lines)
- **Lines 509-525**: Loading state
- **Lines 544-561**: Empty state
- **Lines 563-723**: Location list rendering with delete animation
- **Lines 725-809**: Shelf list rendering with permission manager
- **Lines 813-924**: Location form dialog
- **Lines 926-973**: Shelf form dialog
- **Lines 977-1000**: Modal components
- **Lines 1002-1011**: Onboarding stepper

### 5. State Management (22 state variables!)
Too many state variables in main component - needs organization

## Proposed File Structure

```
src/components/admin/
├── LocationManager.tsx (~250 lines)
│   └── Main orchestrator component
│
├── locations/
│   ├── useLocationManagement.ts (~200 lines)
│   │   └── Hook for location CRUD operations
│   ├── useShelfManagement.ts (~150 lines)
│   │   └── Hook for shelf CRUD operations
│   ├── useLocationPermissions.ts (~100 lines)
│   │   └── Hook for permission checking
│   ├── LocationList.tsx (~200 lines)
│   │   └── Location list with delete animation
│   ├── ShelfList.tsx (~150 lines)
│   │   └── Shelf list rendering
│   ├── LocationFormDialog.tsx (~150 lines)
│   │   └── Create/edit location dialog
│   ├── ShelfFormDialog.tsx (~100 lines)
│   │   └── Create/edit shelf dialog
│   └── EmptyLocationState.tsx (~50 lines)
│       └── Empty state for no locations
│
└── shared/
    └── types.ts (updated)
        └── Add Location, Shelf interfaces
```

## Detailed Breakdown

### useLocationManagement.ts (~200 lines)
**Responsibilities:**
- Load locations (with role and permissions)
- Create location with validation
- Update location
- Delete location with confirmation
- Start edit mode
- Track deletion animation state

**State:**
- `locations: Location[]`
- `loading: boolean`
- `error: string`
- `deletingLocationId: number | null`

**Props needed:**
- `confirmAsync` - from parent useModal
- `alert` - from parent useModal

**Returns:**
- All locations state
- All CRUD functions
- `deletingLocationId` for animation

### useShelfManagement.ts (~150 lines)
**Responsibilities:**
- Load shelves for a location
- Create shelf
- Update shelf
- Delete shelf with book validation
- Start edit mode

**State:**
- `shelves: Shelf[]`

**Props needed:**
- `confirmAsync` - from parent useModal
- `alert` - from parent useModal

**Returns:**
- Shelves state
- All CRUD functions

### useLocationPermissions.ts (~100 lines)
**Responsibilities:**
- Check bulk permissions for all locations
- Check individual location permissions
- Determine if user can manage location settings

**State:**
- `locationPermissions: Record<number, boolean>`
- `canManageLocationPermissions: boolean`
- `userRole: string | null`

**Returns:**
- Permission states
- Helper functions

### LocationList.tsx (~200 lines)
**Props:**
- `locations: Location[]`
- `selectedLocation: Location | null`
- `onSelectLocation: (location: Location) => void`
- `onEditLocation: (location: Location) => void`
- `onDeleteLocation: (id: number, name: string) => void`
- `userRole: string | null`
- `locationPermissions: Record<number, boolean>`
- `deletingLocationId: number | null`

**Features:**
- Renders location cards with stats
- Delete animation handling
- Edit/delete action buttons
- Role-based permission display

### ShelfList.tsx (~150 lines)
**Props:**
- `shelves: Shelf[]`
- `locationName: string`
- `onEditShelf: (shelf: Shelf) => void`
- `onDeleteShelf: (id: number, name: string) => void`
- `onAddShelf: () => void`
- `isAdmin: boolean`

**Features:**
- Renders shelf cards with book counts
- Edit/delete action buttons
- Add shelf button

### LocationFormDialog.tsx (~150 lines)
**Props:**
- `open: boolean`
- `onClose: () => void`
- `editingLocation: Location | null`
- `onCreate: (data: LocationFormData) => Promise<void>`
- `onUpdate: (data: LocationFormData) => Promise<void>`
- `existingShelves?: Shelf[]`

**Features:**
- Name and description fields
- Single shelf toggle (with validation)
- Activity visibility radio buttons
- Form validation

### ShelfFormDialog.tsx (~100 lines)
**Props:**
- `open: boolean`
- `onClose: () => void`
- `editingShelf: Shelf | null`
- `onCreate: (name: string) => Promise<void>`
- `onUpdate: (name: string) => Promise<void>`

**Features:**
- Simple shelf name form
- Create/edit mode

### EmptyLocationState.tsx (~50 lines)
**Props:**
- `userRole: string | null`
- `onCreateLocation: () => void`

**Features:**
- Conditional message based on role
- Create button for super admins

## Implementation Steps

### Phase 1: Foundation
1. Create directory structure
2. Update `shared/types.ts` with Location and Shelf interfaces
3. Extract `EmptyLocationState.tsx` (simplest first)

### Phase 2: Hooks
4. Create `useLocationPermissions.ts` (no dependencies)
5. Create `useShelfManagement.ts` (passes modal props)
6. Create `useLocationManagement.ts` (passes modal props)
7. Update main component to use new hooks

### Phase 3: UI Components
8. Extract `ShelfFormDialog.tsx`
9. Extract `LocationFormDialog.tsx`
10. Extract `ShelfList.tsx`
11. Extract `LocationList.tsx`
12. Update main component

### Phase 4: Final Cleanup
13. Refine main `LocationManager.tsx` orchestrator
14. Verify all modal confirmations work (pass props correctly!)
15. Run build and lint verification
16. Test all location/shelf flows

## Expected Benefits

### Maintainability
- Each file focused on single responsibility
- Maximum file size ~200 lines (vs 1,014)
- Easier to locate and modify specific features

### Testability
- Isolated hooks can be unit tested
- UI components can be tested independently
- Business logic separated from presentation

### Performance
- Potential for lazy loading dialogs
- Smaller components = faster re-renders

### Collaboration
- Reduced merge conflicts (separate files)
- Clear ownership boundaries for features

### Reusability
- Location hooks reusable in other admin contexts
- Shelf management logic reusable
- Dialog components potentially reusable

## Success Metrics

- ✅ Main component reduced from 1,014 → ~250 lines
- ✅ No individual file exceeds 300 lines
- ✅ All existing functionality preserved
- ✅ Modal confirmations work correctly (prop passing!)
- ✅ Build and lint pass without errors
- ✅ All location and shelf management flows tested and working

## Risks & Mitigation

**Risk**: Breaking existing functionality during extraction
**Mitigation**: Extract one subsystem at a time, test after each phase

**Risk**: Modal prop passing issues (same as AdminUserManager)
**Mitigation**: Pass confirmAsync and alert from parent, learned from previous refactor

**Risk**: Permission checking breaks
**Mitigation**: Extract permissions hook first before touching CRUD operations

**Risk**: Delete animation breaks during refactor
**Mitigation**: Keep deletingLocationId in parent, pass to LocationList

## Timeline

- Phase 1: Foundation (~30 min)
- Phase 2: Hooks (~2 hours)
- Phase 3: UI Components (~2 hours)
- Phase 4: Cleanup + Testing (~1 hour)

**Total Estimate**: 5-6 hours

## Related Issues

- Builds on patterns from LCWEB-200 (AdminUserManager refactor)
- Part of overall admin component maintainability initiative
- Will inform future refactors of other large admin components

## Notes

- LocationPermissionManager component (768 lines) remains separate for now
- LocationOnboardingStepper already separated, no changes needed
- Delete animation needs special handling in LocationList
- Must pass modal functions as props (learned from AdminUserManager)
