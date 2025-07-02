/**
 * Super Admin Promotion Script
 * 
 * This script helps identify current admin users and provides the SQL commands
 * needed to promote designated users to super_admin role.
 * 
 * Usage:
 * 1. First run this script to see current admin users
 * 2. Identify which users should be super admins
 * 3. Update the SUPER_ADMIN_USERS array below
 * 4. Run the script again to generate promotion SQL
 */

// Configuration: Update this array with user IDs who should be super admins
const SUPER_ADMIN_USERS = [
  // Add user IDs here, e.g.:
  // 'user-id-1',
  // 'user-id-2',
];

console.log('🔧 Super Admin Promotion Script');
console.log('================================\n');

if (SUPER_ADMIN_USERS.length === 0) {
  console.log('📋 Step 1: Identify Current Admin Users');
  console.log('Run this SQL query in your database to see current admin users:\n');
  
  console.log(`SELECT id, email, first_name, last_name, user_role, created_at
FROM users 
WHERE user_role = 'admin'
ORDER BY created_at;`);
  
  console.log('\n📝 Step 2: Configure Super Admins');
  console.log('1. Edit this script file: scripts/promote-super-admin.js');
  console.log('2. Add the user IDs who should be super admins to the SUPER_ADMIN_USERS array');
  console.log('3. Run this script again to generate the promotion SQL\n');
  
  console.log('⚠️  Important Notes:');
  console.log('- Super admins will have access to ALL locations and global system functions');
  console.log('- Regular admins will only be able to manage their owned/assigned locations');
  console.log('- Consider promoting the primary system administrator first');
  console.log('- You can always promote more users later using the updateUserRole API\n');
} else {
  console.log('🚀 Step 3: Execute Super Admin Promotion');
  console.log('Run these SQL commands to promote the designated users:\n');
  
  SUPER_ADMIN_USERS.forEach((userId, index) => {
    console.log(`-- Promote user ${index + 1} to super admin`);
    console.log(`UPDATE users SET user_role = 'super_admin' WHERE id = '${userId}';`);
    console.log('');
  });
  
  console.log('🔍 Verification Query:');
  console.log('After running the promotion commands, verify with:\n');
  
  console.log(`SELECT id, email, first_name, last_name, user_role
FROM users 
WHERE user_role IN ('admin', 'super_admin')
ORDER BY user_role DESC, email;`);
  
  console.log('\n✅ Post-Migration Steps:');
  console.log('1. Test that super admins can access global functions');
  console.log('2. Test that regular admins can only access their locations');
  console.log('3. Update frontend to show appropriate role-based UI');
  console.log('4. Communicate role changes to affected users\n');
  
  console.log('🔄 Rollback (if needed):');
  console.log('To rollback all admins to super admin:');
  console.log("UPDATE users SET user_role = 'super_admin' WHERE user_role = 'admin';\n");
}

console.log('📚 Documentation:');
console.log('- See docs/specs/librarian-plan.md for full implementation details');
console.log('- Regular admins retain all location management capabilities');
console.log('- Super admins have additional global system administration functions');