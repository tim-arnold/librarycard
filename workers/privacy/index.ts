// Privacy Helper Functions - LCWEB-174
// Core privacy and display name logic for user activity visibility

import { Env, User, Location, DisplayNamePreference, ActivityVisibility, ActivityType, UserDisplayInfo } from '../types';
import { isUserAdmin, isUserSuperAdmin } from '../auth';

/**
 * Determine if a user can view real names in a given location
 * Admins/SuperAdmins can always see real names regardless of privacy settings
 */
export async function canViewRealNames(userId: string, locationId: number, env: Env): Promise<boolean> {
  // Check if user is admin or super admin
  const isAdmin = await isUserAdmin(userId, env);
  const isSuperAdmin = await isUserSuperAdmin(userId, env);

  return isAdmin || isSuperAdmin;
}

/**
 * Check if user activity should be visible to other users in a location
 * Returns false if location is set to private, true if public (with individual controls)
 */
export async function canViewUserActivity(viewerUserId: string, locationId: number, env: Env): Promise<boolean> {
  // Get location privacy settings
  const locationStmt = env.DB.prepare(`
    SELECT activity_visibility FROM locations WHERE id = ?
  `);
  const location = await locationStmt.bind(locationId).first() as any;

  if (!location) {
    return false;
  }

  // If location is private, only admins can see user activity
  if (location.activity_visibility === 'private') {
    return await canViewRealNames(viewerUserId, locationId, env);
  }

  // If location is public, all users can see activity (with individual privacy controls)
  return true;
}

/**
 * Check if a specific activity should be displayed as anonymous
 */
export async function isActivityAnonymous(
  activityType: ActivityType,
  activityId: string,
  actorUserId: string,
  locationId: number,
  env: Env
): Promise<boolean> {
  // Get location privacy settings
  const locationStmt = env.DB.prepare(`
    SELECT activity_visibility FROM locations WHERE id = ?
  `);
  const location = await locationStmt.bind(locationId).first() as any;

  // If location is private, everything is anonymous
  if (!location || location.activity_visibility === 'private') {
    return true;
  }

  // Check for per-action privacy override first
  const overrideStmt = env.DB.prepare(`
    SELECT is_anonymous FROM user_activity_privacy
    WHERE user_id = ? AND activity_type = ? AND activity_id = ?
  `);
  const override = await overrideStmt.bind(actorUserId, activityType, activityId).first() as any;

  if (override) {
    return override.is_anonymous;
  }

  // Check for direct privacy flags on activity tables (performance optimization)
  switch (activityType) {
    case 'book_addition':
      const bookStmt = env.DB.prepare(`
        SELECT added_by_anonymous FROM books WHERE id = ? AND added_by = ?
      `);
      const book = await bookStmt.bind(activityId, actorUserId).first() as any;
      if (book && book.added_by_anonymous !== null) {
        return book.added_by_anonymous;
      }
      break;

    case 'review':
      const reviewStmt = env.DB.prepare(`
        SELECT reviewer_anonymous FROM book_ratings WHERE id = ? AND user_id = ?
      `);
      const review = await reviewStmt.bind(activityId, actorUserId).first() as any;
      if (review && review.reviewer_anonymous !== null) {
        return review.reviewer_anonymous;
      }
      break;

    case 'checkout':
      // TODO: Implement checkout privacy when checkout system is expanded
      break;
  }

  // Check user's default display preference
  const userStmt = env.DB.prepare(`
    SELECT display_name_preference FROM users WHERE id = ?
  `);
  const user = await userStmt.bind(actorUserId).first() as any;

  // If user preference is 'anonymous', default to anonymous
  return user?.display_name_preference === 'anonymous';
}

/**
 * Get the display name for a user based on their preferences and privacy settings
 */
export function formatUserDisplayName(
  user: User,
  preference?: DisplayNamePreference,
  isAnonymous?: boolean,
  customUsername?: string
): string {
  // If explicitly set to anonymous, return generic label
  if (isAnonymous) {
    return 'Library Member';
  }

  // Use provided preference or user's default preference
  const displayPref = preference || user.display_name_preference || 'first_name';

  switch (displayPref) {
    case 'first_name':
      return user.first_name || 'Library Member';

    case 'full_name':
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Library Member';

    case 'email':
      return user.email || 'Library Member';

    case 'custom_username':
      return customUsername || user.custom_username || user.first_name || 'Library Member';

    case 'anonymous':
    default:
      return 'Library Member';
  }
}

/**
 * Get comprehensive display information for a user in a specific context
 */
export async function getUserDisplayInfo(
  user: User,
  viewerUserId: string,
  locationId: number,
  activityType?: ActivityType,
  activityId?: string,
  env?: Env
): Promise<UserDisplayInfo> {
  // Default fallback when env is not provided
  if (!env) {
    return {
      displayName: formatUserDisplayName(user),
      isAnonymous: true,
      canViewRealName: false
    };
  }

  const canViewReal = await canViewRealNames(viewerUserId, locationId, env);

  // If viewer can see real names (admin), always show full name
  if (canViewReal) {
    return {
      displayName: formatUserDisplayName(user, 'full_name', false),
      isAnonymous: false,
      canViewRealName: true
    };
  }

  // Check if activity should be anonymous
  let isAnonymous = true;
  if (activityType && activityId) {
    isAnonymous = await isActivityAnonymous(activityType, activityId, user.id, locationId, env);
  } else {
    // Check location and user default preferences
    isAnonymous = !(await canViewUserActivity(viewerUserId, locationId, env)) ||
                  user.display_name_preference === 'anonymous';
  }

  return {
    displayName: formatUserDisplayName(user, user.display_name_preference, isAnonymous, user.custom_username),
    isAnonymous,
    canViewRealName: canViewReal
  };
}

/**
 * Set per-action privacy override for a user activity
 */
export async function setActivityPrivacy(
  userId: string,
  activityType: ActivityType,
  activityId: string,
  isAnonymous: boolean,
  env: Env
): Promise<void> {
  // Insert or update privacy override
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO user_activity_privacy
    (user_id, activity_type, activity_id, is_anonymous, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  await stmt.bind(userId, activityType, activityId, isAnonymous).run();

  // Also update the direct privacy flag on the relevant table for performance
  switch (activityType) {
    case 'book_addition':
      await env.DB.prepare(`
        UPDATE books SET added_by_anonymous = ? WHERE id = ? AND added_by = ?
      `).bind(isAnonymous, activityId, userId).run();
      break;

    case 'review':
      await env.DB.prepare(`
        UPDATE book_ratings SET reviewer_anonymous = ? WHERE id = ? AND user_id = ?
      `).bind(isAnonymous, activityId, userId).run();
      break;

    case 'checkout':
      // TODO: Implement checkout privacy updates when checkout system is expanded
      break;
  }
}

/**
 * Get all privacy overrides for a user (for management interface)
 */
export async function getUserPrivacyOverrides(userId: string, env: Env): Promise<any[]> {
  const stmt = env.DB.prepare(`
    SELECT * FROM user_activity_privacy
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `);

  const result = await stmt.bind(userId).all();
  return result.results || [];
}

/**
 * Validate custom username uniqueness and format
 */
export async function validateCustomUsername(
  username: string,
  userId: string,
  env: Env
): Promise<{ isValid: boolean; error?: string }> {
  // Basic format validation
  if (!username || username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Username must be 50 characters or less' };
  }

  // Allow letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Check for uniqueness
  const stmt = env.DB.prepare(`
    SELECT id FROM users WHERE custom_username = ? AND id != ?
  `);
  const existing = await stmt.bind(username, userId).first();

  if (existing) {
    return { isValid: false, error: 'This username is already taken' };
  }

  return { isValid: true };
}