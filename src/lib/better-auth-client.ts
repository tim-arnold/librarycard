/**
 * Better Auth Client Configuration
 *
 * Client-side configuration for Better Auth PoC.
 * This provides the frontend authentication methods.
 */

import { createAuthClient } from "better-auth/react";
import type { Session } from "./better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000/api/better-auth-poc",
});

// Export hooks for easy use in components
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;

// Helper function to check if user has specific role
export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.user) return false;
  const userRole = (session.user as any).user_role || "user";

  // Role hierarchy: super_admin > admin > user
  const roleHierarchy = ["user", "admin", "super_admin"];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(role);

  return userRoleIndex >= requiredRoleIndex;
}

// Helper function to check if user is admin
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, "admin");
}

// Helper function to check if user is super admin
export function isSuperAdmin(session: Session | null): boolean {
  return hasRole(session, "super_admin");
}