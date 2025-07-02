-- Migration: Add Super Admin Role Support
-- Description: Adds super_admin role support for role separation
-- Date: 2025-07-02

-- Step 1: The database already supports any string value for user_role
-- No schema changes needed - just application-level enforcement

-- Step 2: Promote designated users to super_admin role
-- This will be done manually based on specific user identification

-- Example promotion (replace with actual user IDs):
-- UPDATE users 
-- SET user_role = 'super_admin' 
-- WHERE id IN (
--   'actual-user-id-here',  -- Primary system admin
--   -- Add other designated super admins
-- );

-- Step 3: Verification query to check current admin users
-- SELECT id, email, first_name, last_name, user_role 
-- FROM users 
-- WHERE user_role IN ('admin', 'super_admin')
-- ORDER BY user_role DESC, email;

-- Migration complete
-- Next steps:
-- 1. Deploy updated permission functions
-- 2. Identify and promote specific users to super_admin
-- 3. Test permission boundaries
-- 4. Update frontend with role-based UI