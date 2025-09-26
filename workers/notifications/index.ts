import { Env } from '../types';
import {
  sendLocationAccessNotification,
  sendPermissionChangeNotification,
  sendBookActionNotification,
  sendGenreSuggestionNotification,
  sendBookReviewNotification
} from '../email/index';
import { getWorkerFromEmail } from '../utils/domainConfig';

export type NotificationType =
  | 'user_registration'
  | 'location_access_granted'
  | 'location_access_revoked'
  | 'permission_granted'
  | 'permission_revoked'
  | 'book_added'
  | 'book_removed'
  | 'book_review_submitted'
  | 'book_review_approved'
  | 'book_review_rejected'
  | 'genre_suggestion'
  | 'genre_approved'
  | 'genre_rejected'
  | 'appeal_submitted'
  | 'system_maintenance';

interface NotificationContext {
  userId?: string;
  locationId?: number;
  locationName?: string;
  permission?: string;
  bookTitle?: string;
  bookAuthors?: string;
  genreName?: string;
  actionBy?: string;
  comment?: string;
  [key: string]: any;
}

export async function shouldSendNotification(
  env: Env,
  userId: string,
  notificationType: NotificationType,
  locationId?: number
): Promise<boolean> {
  try {
    const preference = await env.DB.prepare(`
      SELECT enabled FROM notification_preferences 
      WHERE user_id = ? AND notification_type = ? AND (location_id = ? OR location_id IS NULL)
      ORDER BY location_id DESC LIMIT 1
    `).bind(userId, notificationType, locationId || null).first() as any;

    return preference?.enabled === 1;
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return true;
  }
}

export async function getNotificationRecipients(
  env: Env,
  notificationType: NotificationType,
  locationId?: number
): Promise<Array<{ userId: string; email: string; firstName: string; }>> {
  try {
    let query = `
      SELECT DISTINCT u.id as userId, u.email, u.first_name as firstName
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id 
        AND np.notification_type = ? 
        AND (np.location_id = ? OR np.location_id IS NULL)
      WHERE u.user_role IN ('admin', 'super_admin')
        AND (np.enabled = 1 OR np.enabled IS NULL)
    `;

    if (locationId) {
      query += `
        AND (u.id IN (
          SELECT lm.user_id FROM location_members lm WHERE lm.location_id = ?
        ) OR u.id IN (
          SELECT l.owner_id FROM locations l WHERE l.id = ?
        ) OR u.user_role = 'super_admin')
      `;
      
      const recipients = await env.DB.prepare(query)
        .bind(notificationType, locationId, locationId, locationId)
        .all();
      
      return recipients.results as Array<{ userId: string; email: string; firstName: string; }>;
    } else {
      const recipients = await env.DB.prepare(query)
        .bind(notificationType, null)
        .all();
      
      return recipients.results as Array<{ userId: string; email: string; firstName: string; }>;
    }
  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return [];
  }
}

export async function queueNotification(
  env: Env,
  notificationType: NotificationType,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  metadata?: NotificationContext
) {
  try {
    await env.DB.prepare(`
      INSERT INTO notification_queue 
      (notification_type, recipient_email, recipient_name, subject, html_body, text_body, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationType,
      recipientEmail,
      recipientName,
      subject,
      htmlBody,
      textBody,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    console.log(`Notification queued: ${notificationType} to ${recipientEmail}`);
  } catch (error) {
    console.error('Error queuing notification:', error);
    throw error;
  }
}

export async function createInAppNotification(
  env: Env,
  recipientUserId: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
  relatedUserId?: string,
  relatedLocationId?: number,
  metadata?: NotificationContext
) {
  try {
    await env.DB.prepare(`
      INSERT INTO in_app_notifications
      (recipient_user_id, notification_type, title, message, action_url, action_label, related_user_id, related_location_id, metadata, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      recipientUserId,
      notificationType,
      title,
      message,
      actionUrl || null,
      actionLabel || null,
      relatedUserId || null,
      relatedLocationId || null,
      metadata ? JSON.stringify(metadata) : null,
      0, // is_read = false
      new Date().toISOString() // created_at = current timestamp
    ).run();

    // Update unread count
    await env.DB.prepare(`
      INSERT OR IGNORE INTO notification_read_status (user_id, total_unread) VALUES (?, 1)
    `).bind(recipientUserId).run();

    await env.DB.prepare(`
      UPDATE notification_read_status 
      SET total_unread = total_unread + 1 
      WHERE user_id = ?
    `).bind(recipientUserId).run();

    console.log(`In-app notification created: ${notificationType} for ${recipientUserId}`);
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }
}

export async function markNotificationAsRead(env: Env, notificationId: number, userId: string) {
  try {
    const result = await env.DB.prepare(`
      UPDATE in_app_notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND recipient_user_id = ? AND is_read = FALSE
    `).bind(notificationId, userId).run();

    if (result.changes > 0) {
      // Decrease unread count
      await env.DB.prepare(`
        UPDATE notification_read_status 
        SET total_unread = MAX(0, total_unread - 1) 
        WHERE user_id = ?
      `).bind(userId).run();
    }

    return result.changes > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(env: Env, userId: string) {
  try {
    await env.DB.prepare(`
      UPDATE in_app_notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
      WHERE recipient_user_id = ? AND is_read = FALSE
    `).bind(userId).run();

    await env.DB.prepare(`
      UPDATE notification_read_status 
      SET total_unread = 0, last_checked_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).bind(userId).run();

    console.log(`All notifications marked as read for user: ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

export async function getUserNotifications(
  env: Env,
  userId: string,
  limit: number = 50,
  offset: number = 0,
  unreadOnly: boolean = false
) {
  try {
    let query = `
      SELECT 
        n.*,
        u.first_name || ' ' || COALESCE(u.last_name, '') as related_user_name,
        l.name as related_location_name
      FROM in_app_notifications n
      LEFT JOIN users u ON n.related_user_id = u.id
      LEFT JOIN locations l ON n.related_location_id = l.id
      WHERE n.recipient_user_id = ? AND n.notification_type != 'book_review_rejected'
    `;

    if (unreadOnly) {
      query += ` AND n.is_read = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;

    const notifications = await env.DB.prepare(query)
      .bind(userId, limit, offset)
      .all();

    return notifications.results;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

export async function getUnreadNotificationCount(env: Env, userId: string): Promise<number> {
  try {
    // Count unread notifications directly from in_app_notifications table
    // This is more accurate than relying on the cached notification_read_status table
    // Exclude book_review_rejected notifications to avoid double-counting with rejected reviews
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM in_app_notifications 
      WHERE recipient_user_id = ? AND is_read = FALSE AND notification_type != 'book_review_rejected'
    `).bind(userId).first() as any;

    return result?.count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

export async function logNotificationDelivery(
  env: Env,
  notificationType: NotificationType,
  recipientEmail: string,
  subject: string,
  deliveryStatus: 'sent' | 'failed' | 'bounced' | 'complained',
  providerId?: string,
  errorDetails?: string,
  userId?: string,
  locationId?: number
) {
  try {
    await env.DB.prepare(`
      INSERT INTO notification_log 
      (notification_type, recipient_email, subject, delivery_status, provider_id, error_details, user_id, location_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationType,
      recipientEmail,
      subject,
      deliveryStatus,
      providerId || null,
      errorDetails || null,
      userId || null,
      locationId || null
    ).run();

    console.log(`Notification delivery logged: ${deliveryStatus} for ${notificationType} to ${recipientEmail}`);
  } catch (error) {
    console.error('Error logging notification delivery:', error);
  }
}

export async function sendLocationAccessUpdate(
  env: Env,
  targetUserId: string,
  locationId: number,
  granted: boolean,
  grantedBy: string
) {
  try {
    const targetUser = await env.DB.prepare(`
      SELECT email, first_name FROM users WHERE id = ?
    `).bind(targetUserId).first() as any;

    const location = await env.DB.prepare(`
      SELECT name FROM locations WHERE id = ?
    `).bind(locationId).first() as any;

    const granterUser = await env.DB.prepare(`
      SELECT first_name, last_name FROM users WHERE id = ?
    `).bind(grantedBy).first() as any;

    if (!targetUser || !location || !granterUser) {
      console.error('Missing data for location access notification');
      return;
    }

    const granterName = `${granterUser.first_name} ${granterUser.last_name || ''}`.trim();
    const targetName = targetUser.first_name || 'User';

    // Create in-app notification
    const title = granted 
      ? `Location Access Granted` 
      : `Location Access Revoked`;
    const message = granted
      ? `You now have access to ${location.name} (granted by ${granterName})`
      : `Your access to ${location.name} has been removed (by ${granterName})`;
    
    await createInAppNotification(
      env,
      targetUserId,
      granted ? 'location_access_granted' : 'location_access_revoked',
      title,
      message,
      '/locations',
      'View Locations',
      grantedBy,
      locationId
    );

    // Send email notification
    try {
      const result = await sendLocationAccessNotification(
        env,
        targetUser.email,
        targetName,
        location.name,
        granted,
        granterName
      );

      await logNotificationDelivery(
        env,
        granted ? 'location_access_granted' : 'location_access_revoked',
        targetUser.email,
        `LibraryCard: Location access ${granted ? 'granted' : 'revoked'} for ${location.name}`,
        'sent',
        result.id,
        undefined,
        targetUserId,
        locationId
      );
    } catch (error) {
      await logNotificationDelivery(
        env,
        granted ? 'location_access_granted' : 'location_access_revoked',
        targetUser.email,
        `LibraryCard: Location access ${granted ? 'granted' : 'revoked'} for ${location.name}`,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
        targetUserId,
        locationId
      );
      // Don't throw error for email failures - in-app notification was successful
      console.error('Email notification failed, but in-app notification was created:', error);
    }
  } catch (error) {
    console.error('Error sending location access notification:', error);
  }
}

export async function sendPermissionUpdate(
  env: Env,
  targetUserId: string,
  locationId: number,
  permission: string,
  granted: boolean,
  changedBy: string
) {
  try {
    const targetUser = await env.DB.prepare(`
      SELECT email, first_name FROM users WHERE id = ?
    `).bind(targetUserId).first() as any;

    const location = await env.DB.prepare(`
      SELECT name FROM locations WHERE id = ?
    `).bind(locationId).first() as any;

    const changerUser = await env.DB.prepare(`
      SELECT first_name, last_name FROM users WHERE id = ?
    `).bind(changedBy).first() as any;

    if (!targetUser || !location || !changerUser) {
      console.error('Missing data for permission change notification');
      return;
    }

    const changerName = `${changerUser.first_name} ${changerUser.last_name || ''}`.trim();
    const targetName = targetUser.first_name || 'User';

    // Map permission keys to readable names
    const permissionNames: Record<string, string> = {
      'can_add_books': 'Add Books',
      'can_delete_books': 'Delete Books',
      'can_move_books': 'Move Books',
      'can_create_shelves': 'Create Shelves',
      'can_edit_genres': 'Edit Genres',
      'can_create_series': 'Create Series',
      'can_control_user_capabilities': 'Control User Permissions',
      'can_invite_users': 'Invite Users',
      'can_manage_shelves': 'Manage Shelves',
      'can_manage_location_settings': 'Manage Location Settings'
    };

    const permissionDisplay = permissionNames[permission] || permission;

    // Create in-app notification
    const title = granted 
      ? `Permission Granted` 
      : `Permission Revoked`;
    const message = granted
      ? `You now have "${permissionDisplay}" permission in ${location.name} (granted by ${changerName})`
      : `Your "${permissionDisplay}" permission in ${location.name} has been removed (by ${changerName})`;
    
    await createInAppNotification(
      env,
      targetUserId,
      granted ? 'permission_granted' : 'permission_revoked',
      title,
      message,
      `/admin/locations`,
      'Manage Permissions',
      changedBy,
      locationId
    );

    // Send email notification
    try {
      const result = await sendPermissionChangeNotification(
        env,
        targetUser.email,
        targetName,
        location.name,
        permission,
        granted,
        changerName
      );

      await logNotificationDelivery(
        env,
        granted ? 'permission_granted' : 'permission_revoked',
        targetUser.email,
        `LibraryCard: Permission ${granted ? 'granted' : 'revoked'} in ${location.name}`,
        'sent',
        result.id,
        undefined,
        targetUserId,
        locationId
      );
    } catch (error) {
      await logNotificationDelivery(
        env,
        granted ? 'permission_granted' : 'permission_revoked',
        targetUser.email,
        `LibraryCard: Permission ${granted ? 'granted' : 'revoked'} in ${location.name}`,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
        targetUserId,
        locationId
      );
      // Don't throw error for email failures - in-app notification was successful
      console.error('Email notification failed, but in-app notification was created:', error);
    }
  } catch (error) {
    console.error('Error sending permission change notification:', error);
  }
}

export async function sendBookUpdate(
  env: Env,
  bookTitle: string,
  bookAuthors: string,
  locationId: number,
  action: 'added' | 'removed',
  actionBy: string
) {
  try {
    const location = await env.DB.prepare(`
      SELECT name FROM locations WHERE id = ?
    `).bind(locationId).first() as any;

    const actorUser = await env.DB.prepare(`
      SELECT first_name, last_name FROM users WHERE id = ?
    `).bind(actionBy).first() as any;

    if (!location || !actorUser) {
      console.error('Missing data for book update notification');
      return;
    }

    const actorName = `${actorUser.first_name} ${actorUser.last_name || ''}`.trim();
    
    const recipients = await getNotificationRecipients(
      env,
      action === 'added' ? 'book_added' : 'book_removed',
      locationId
    );

    for (const recipient of recipients) {
      if (await shouldSendNotification(env, recipient.userId, action === 'added' ? 'book_added' : 'book_removed', locationId)) {
        try {
          const result = await sendBookActionNotification(
            env,
            recipient.email,
            recipient.firstName || 'User',
            bookTitle,
            bookAuthors,
            location.name,
            action,
            actorName
          );

          await logNotificationDelivery(
            env,
            action === 'added' ? 'book_added' : 'book_removed',
            recipient.email,
            `LibraryCard: Book ${action} in ${location.name}`,
            'sent',
            result.id,
            undefined,
            recipient.userId,
            locationId
          );
        } catch (error) {
          await logNotificationDelivery(
            env,
            action === 'added' ? 'book_added' : 'book_removed',
            recipient.email,
            `LibraryCard: Book ${action} in ${location.name}`,
            'failed',
            undefined,
            error instanceof Error ? error.message : 'Unknown error',
            recipient.userId,
            locationId
          );
        }
      }
    }
  } catch (error) {
    console.error('Error sending book update notifications:', error);
  }
}

export async function sendBookReviewUpdate(
  env: Env,
  bookTitle: string,
  bookAuthors: string,
  reviewText: string,
  reviewerUserId: string,
  locationId: number,
  action: 'submitted' | 'approved' | 'rejected',
  reviewedBy?: string,
  comment?: string
) {
  try {
    const location = await env.DB.prepare(`
      SELECT name FROM locations WHERE id = ?
    `).bind(locationId).first() as any;

    const reviewerUser = await env.DB.prepare(`
      SELECT first_name, last_name, email FROM users WHERE id = ?
    `).bind(reviewerUserId).first() as any;

    if (!location || !reviewerUser) {
      console.error('Missing data for book review notification');
      return;
    }

    const reviewerName = `${reviewerUser.first_name} ${reviewerUser.last_name || ''}`.trim();

    if (action === 'submitted') {
      // Notify admins about new review submission
      const recipients = await getNotificationRecipients(env, 'book_review_submitted', locationId);

      for (const recipient of recipients) {
        if (await shouldSendNotification(env, recipient.userId, 'book_review_submitted', locationId)) {
          // Create in-app notification
          const title = 'New Book Review Submitted';
          const message = `${reviewerName} submitted a review for "${bookTitle}" in ${location.name}`;
          
          await createInAppNotification(
            env,
            recipient.userId,
            'book_review_submitted',
            title,
            message,
            '/admin/reviews',
            'Review Submissions',
            reviewerUserId,
            locationId,
            { bookTitle, bookAuthors, reviewText: reviewText.substring(0, 100) + '...' }
          );

          // Send email notification if enabled
          try {
            const result = await sendBookReviewNotification(
              env,
              recipient.email,
              recipient.firstName || 'Admin',
              bookTitle,
              bookAuthors,
              reviewText,
              reviewerName,
              location.name,
              action,
              reviewedBy,
              comment
            );

            await logNotificationDelivery(
              env,
              'book_review_submitted',
              recipient.email,
              `LibraryCard: New book review submitted for "${bookTitle}"`,
              'sent',
              result.id,
              undefined,
              recipient.userId,
              locationId
            );
          } catch (error) {
            await logNotificationDelivery(
              env,
              'book_review_submitted',
              recipient.email,
              `LibraryCard: New book review submitted for "${bookTitle}"`,
              'failed',
              undefined,
              error instanceof Error ? error.message : 'Unknown error',
              recipient.userId,
              locationId
            );
            console.error('Email notification failed, but in-app notification was created:', error);
          }
        }
      }
    } else {
      // Notify the reviewer about approval/rejection
      const title = action === 'approved' ? 'Book Review Approved' : 'Book Review Rejected';
      const message = action === 'approved'
        ? `Your review for "${bookTitle}" has been approved and is now visible to other users.`
        : `Your review for "${bookTitle}" was not approved. ${comment || ''}`;

      await createInAppNotification(
        env,
        reviewerUserId,
        action === 'approved' ? 'book_review_approved' : 'book_review_rejected',
        title,
        message,
        `/library?search=${encodeURIComponent(bookTitle)}`,
        'View Book',
        reviewedBy,
        locationId,
        { bookTitle, bookAuthors, comment }
      );

      // Send email notification if enabled
      try {
        const result = await sendBookReviewNotification(
          env,
          reviewerUser.email,
          reviewerUser.first_name || 'User',
          bookTitle,
          bookAuthors,
          reviewText,
          reviewerName,
          location.name,
          action,
          reviewedBy,
          comment
        );

        await logNotificationDelivery(
          env,
          action === 'approved' ? 'book_review_approved' : 'book_review_rejected',
          reviewerUser.email,
          `LibraryCard: Book review ${action} - "${bookTitle}"`,
          'sent',
          result.id,
          undefined,
          reviewerUserId,
          locationId
        );
      } catch (error) {
        await logNotificationDelivery(
          env,
          action === 'approved' ? 'book_review_approved' : 'book_review_rejected',
          reviewerUser.email,
          `LibraryCard: Book review ${action} - "${bookTitle}"`,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error',
          reviewerUserId,
          locationId
        );
        console.error('Email notification failed, but in-app notification was created:', error);
      }
    }
  } catch (error) {
    console.error('Error sending book review notifications:', error);
  }
}

export async function sendGenreUpdate(
  env: Env,
  genreName: string,
  action: 'suggested' | 'approved' | 'rejected',
  suggestedBy?: string,
  reviewedBy?: string,
  comment?: string
) {
  try {
    const recipients = await getNotificationRecipients(env, 'genre_suggestion');

    for (const recipient of recipients) {
      if (await shouldSendNotification(env, recipient.userId, 'genre_suggestion')) {
        try {
          const result = await sendGenreSuggestionNotification(
            env,
            recipient.email,
            recipient.firstName || 'User',
            genreName,
            action,
            suggestedBy,
            reviewedBy,
            comment
          );

          await logNotificationDelivery(
            env,
            'genre_suggestion',
            recipient.email,
            `LibraryCard: Genre ${action} - ${genreName}`,
            'sent',
            result.id,
            undefined,
            recipient.userId
          );
        } catch (error) {
          await logNotificationDelivery(
            env,
            'genre_suggestion',
            recipient.email,
            `LibraryCard: Genre ${action} - ${genreName}`,
            'failed',
            undefined,
            error instanceof Error ? error.message : 'Unknown error',
            recipient.userId
          );
        }
      }
    }
  } catch (error) {
    console.error('Error sending genre update notifications:', error);
  }
}

export async function processNotificationQueue(env: Env, batchSize = 10) {
  try {
    const notifications = await env.DB.prepare(`
      SELECT * FROM notification_queue 
      WHERE status = 'pending' 
      ORDER BY scheduled_at ASC 
      LIMIT ?
    `).bind(batchSize).all();

    for (const notification of notifications.results) {
      const notif = notification as any;
      
      try {
        await env.DB.prepare(`
          UPDATE notification_queue 
          SET status = 'processing' 
          WHERE id = ?
        `).bind(notif.id).run();

        const result = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: getWorkerFromEmail(env),
            to: [notif.recipient_email],
            subject: notif.subject,
            html: notif.html_body,
            text: notif.text_body || undefined
          })
        });

        if (result.ok) {
          const emailResult = await result.json() as { id: string };
          
          await env.DB.prepare(`
            UPDATE notification_queue 
            SET status = 'sent', processed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(notif.id).run();

          await logNotificationDelivery(
            env,
            notif.notification_type,
            notif.recipient_email,
            notif.subject,
            'sent',
            emailResult.id
          );
        } else {
          throw new Error(`Email API error: ${result.status}`);
        }
      } catch (error) {
        const attempts = notif.attempts + 1;
        
        if (attempts >= notif.max_attempts) {
          await env.DB.prepare(`
            UPDATE notification_queue 
            SET status = 'failed', attempts = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(attempts, error instanceof Error ? error.message : 'Unknown error', notif.id).run();
        } else {
          await env.DB.prepare(`
            UPDATE notification_queue 
            SET status = 'pending', attempts = ?, error_message = ? 
            WHERE id = ?
          `).bind(attempts, error instanceof Error ? error.message : 'Unknown error', notif.id).run();
        }

        await logNotificationDelivery(
          env,
          notif.notification_type,
          notif.recipient_email,
          notif.subject,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  } catch (error) {
    console.error('Error processing notification queue:', error);
  }
}