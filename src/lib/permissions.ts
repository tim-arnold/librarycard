// Permission utilities for role-based access control

export type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * Check if user has admin privileges (either admin or super_admin)
 */
export function isAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'super_admin';
}

/**
 * Check if user can manage locations (super admins can manage all, regular admins can manage their assigned)
 */
export function canManageLocations(userRole: string | null | undefined): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can access global admin functions
 */
export function canAccessGlobalAdmin(userRole: string | null | undefined): boolean {
  return isSuperAdmin(userRole);
}

/**
 * Check if user can add books to the system
 */
export function canAddBooks(userRole: string | null | undefined): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can create series (bypasses approval process)
 */
export function canCreateSeries(userRole: string | null | undefined): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can manage series books (add/remove books to/from any series)
 */
export function canManageSeriesBooks(userRole: string | null | undefined): boolean {
  return isAdmin(userRole);
}

/**
 * Get display name for user role
 */
export function getRoleDisplayName(userRole: string | null | undefined): string {
  switch (userRole) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'user':
      return 'User';
    default:
      return 'User';
  }
}