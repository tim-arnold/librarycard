-- Add can_create_series permission support
-- Migration for LCWEB-13 series system enhancement
-- Allows specific users to create series without approval workflow

-- This migration adds support for the can_create_series permission
-- Users with this permission can create series that are automatically approved
-- Users without this permission create series in pending status requiring admin approval

-- Note: This is a schema enhancement - the permission itself is granted through the admin UI
-- The permission 'can_create_series' is now available to be assigned to users via:
-- - Location Permission Manager in admin interface
-- - Location Onboarding Stepper during location setup
-- - Direct database assignment for existing users

-- No actual data changes needed - this documents the new permission availability
-- The permission will be recognized by the series creation workflow in workers/series/index.ts

-- Validation: Ensure the new permission is properly handled
-- The following locations reference this permission:
-- - src/components/admin/LocationPermissionManager.tsx
-- - src/components/admin/LocationOnboardingStepper.tsx  
-- - src/components/admin/PermissionsStep.tsx
-- - workers/series/index.ts (createSeries function)