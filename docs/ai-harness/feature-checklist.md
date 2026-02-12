# Feature Checklist

Comprehensive checklist for tracking feature implementation and quality. Per [Anthropic's harness architecture](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), this prevents premature "victory declarations" by ensuring all requirements are explicitly tracked.

---

## Active Development

### Theme Consolidation
**Spec**: `docs/specs/theme-consolidation-analysis.md`, `docs/specs/theme-consolidation-phase2.md`
**Status**: Planned

- [ ] Extend MUI theme to generate CSS variables for marketing components
- [ ] Migrate GlobalHeader to use MUI theme
- [ ] Migrate marketing buttons to hybrid MUI/CSS approach
- [ ] Migrate typography components
- [ ] Migrate layout components (Container/Grid/Flex)
- [ ] Migrate card components
- [ ] Migrate form components
- [ ] Remove redundant marketing CSS variables
- [ ] Enable dark mode for marketing pages
- [ ] Verify all 6 color variants work across marketing pages

### User Deletion Strategy
**Spec**: `docs/specs/user-deletion-strategy.md`
**Status**: Approved for implementation

- [ ] Create migration: Add CASCADE/SET NULL to low-risk FK constraints
  - [ ] `jwt_sessions.revoked_by` -> SET NULL
  - [ ] `signup_approval_requests.reviewed_by` -> SET NULL
  - [ ] `book_removal_requests.requester_id` -> SET NULL
  - [ ] `book_removal_requests.reviewed_by` -> SET NULL
  - [ ] `location_invitations.invited_by` -> SET NULL
  - [ ] `book_checkout_history.user_id` -> SET NULL
  - [ ] `book_images.uploaded_by` -> SET NULL
  - [ ] `location_members.user_id` -> CASCADE
  - [ ] `location_members.invited_by` -> SET NULL
- [ ] Implement location ownership transfer UI (smart transfer when deleting owner)
- [ ] Test deletion workflow end-to-end
- [ ] Deploy migration to staging
- [ ] Verify on staging

### Admin User Manager Refactor
**Spec**: `docs/specs/admin-user-manager-refactor.md`
**Jira**: LCWEB-200
**Status**: Complete (Phase 1-4 done)

- [x] Extract shared types to `shared/types.ts`
- [x] Extract utility functions to `shared/utils.ts`
- [x] Create invitation subsystem (hook, filters, list, dialog, manager)
- [x] Create location assignment (hook, dialog, permissions section)
- [x] Create user management (hook, table, actions menu, dialogs)
- [x] Refine orchestrator component
- [x] Build and lint verification
- [ ] Add lazy loading for dialogs (Phase 5 optimization)

### Location Manager Refactor
**Spec**: `docs/specs/location-manager-refactor.md`
**Jira**: LCWEB-201
**Status**: Initial extraction done

- [x] Break LocationManager into modular components
- [ ] Extract `useLocationManagement.ts` hook
- [ ] Extract `useShelfManagement.ts` hook
- [ ] Extract `useLocationPermissions.ts` hook
- [ ] Extract `LocationList.tsx`
- [ ] Extract `ShelfList.tsx`
- [ ] Extract `LocationFormDialog.tsx`
- [ ] Extract `ShelfFormDialog.tsx`
- [ ] Verify all modal confirmations work (prop passing)
- [ ] Build and lint verification

---

## Future / Planned

### React Native Mobile App
**Spec**: `docs/specs/react-native-mobile-app-specification.md`
**Status**: Specification complete, not started

- [ ] React Native project setup
- [ ] ISBN barcode scanning (camera integration)
- [ ] Authentication (shared with web)
- [ ] Book browsing and search
- [ ] Book detail views
- [ ] Checkout/return functionality
- [ ] Push notifications

### Homepage & Marketing Polish
**Status**: Ongoing as needed

- [x] Homepage hero accessibility (LCWEB-204)
- [x] Critical CSS inlining (LCWEB-204)
- [x] Font/image loading optimization (LCWEB-204)
- [x] GlobalHeader on sign-in page (LCWEB-205)
- [x] GlobalHeader on privacy/terms pages (LCWEB-206)
- [ ] Header-specific mobile breakpoint refinement
- [ ] Additional accessibility audit items

---

## Maintenance Checklist

Use this for each development session:

### Session Startup
- [ ] Read `progress.md` for context
- [ ] Check git log for recent changes
- [ ] Run `npm run build && npm run lint` to verify build
- [ ] Review this checklist for current priorities

### Session Closeout
- [ ] Update `progress.md` with work completed
- [ ] Update this checklist if items completed
- [ ] Commit changes with descriptive message
- [ ] Note any blockers or new issues discovered
