-- Remove super admin from location_members table
-- Super admins have global access and don't need explicit location assignments

DELETE FROM location_members 
WHERE user_id IN (
  SELECT id FROM users WHERE user_role = 'super_admin'
);