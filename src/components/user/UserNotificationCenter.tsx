'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material'
import {
  Notifications,
  CheckCircle,
  ErrorOutline,
  Refresh,
  Star,
  Book,
  Edit
} from '@mui/icons-material'
import { useNotifications } from '@/hooks/useNotifications'
import { useRejectedReviewNotifications } from '@/hooks/useRejectedReviewNotifications'

export default function UserNotificationCenter() {
  const { data: session } = useSession()
  const router = useRouter()
  const { 
    notifications, 
    loading: notificationsLoading, 
    error: notificationsError, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications()
  
  const { 
    rejectedReviews, 
    loading: rejectedLoading, 
    error: rejectedError, 
    refreshRejectedReviews 
  } = useRejectedReviewNotifications()

  if (!session?.user?.email) {
    return null
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId)
      
      // Refresh both general notifications and rejected reviews to update read status and counts
      await refreshNotifications()
      await refreshRejectedReviews()
      
      // Dispatch custom event to notify AppLayout badge to refresh
      window.dispatchEvent(new CustomEvent('notificationUpdated'))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Backend now handles both general and rejected review notifications
      await markAllAsRead()
      
      await refreshNotifications() // Refresh general notifications to update read status
      await refreshRejectedReviews() // Refresh rejected reviews to update read status
      
      // Dispatch custom event to notify AppLayout badge to refresh
      window.dispatchEvent(new CustomEvent('notificationUpdated'))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleRefresh = async () => {
    await refreshNotifications()
    await refreshRejectedReviews()
  }

  const handleEditReview = (bookTitle: string, bookAuthors: string) => {
    // Navigate to library with search for the book title
    const searchQuery = encodeURIComponent(bookTitle)
    router.push(`/library?search=${searchQuery}`)
  }

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} /> Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            size="small"
            disabled={notificationsLoading || rejectedLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<CheckCircle />}
            onClick={handleMarkAllAsRead}
            size="small"
            disabled={notificationsLoading || rejectedLoading}
          >
            Mark All Read
          </Button>
        </Box>
      </Box>

      {(notificationsError || rejectedError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {notificationsError || rejectedError}
        </Alert>
      )}

      {/* Rejected Reviews Section */}
      {rejectedReviews.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorOutline color="error" />
              Rejected Reviews
              <Chip 
                label={rejectedReviews.filter(r => !r.is_notification_read).length} 
                color="error" 
                size="small" 
              />
            </Typography>
            <List>
              {rejectedReviews.map((review, index) => (
                <div key={review.id}>
                  <ListItem 
                    sx={{ 
                      pl: 0,
                      backgroundColor: !review.is_notification_read ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      <Book color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" component="div">
                            {review.book_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            by {review.book_authors}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="error.main" gutterBottom>
                            <strong>Rejection Reason:</strong> {review.review_rejection_reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rejected {formatNotificationDate(review.rejected_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEditReview(review.book_title, review.book_authors)}
                        startIcon={<Edit />}
                      >
                        Edit Review
                      </Button>
                      {!review.is_notification_read && review.notification_id && (
                        <Button
                          size="small"
                          onClick={() => handleMarkAsRead(review.notification_id!)}
                          startIcon={<CheckCircle />}
                        >
                          Mark Read
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                  {index < rejectedReviews.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* General Notifications */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Notifications
          </Typography>
          
          {notificationsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!notificationsLoading && notifications.length === 0 && rejectedReviews.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No notifications at this time.
            </Typography>
          )}

          {!notificationsLoading && notifications.length > 0 && (
            <List>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <ListItem 
                    sx={{ 
                      pl: 0,
                      backgroundColor: !notification.is_read ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      {notification.notification_type === 'book_review_approved' ? (
                        <Star color="primary" />
                      ) : (
                        <Notifications color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationDate(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    {!notification.is_read && (
                      <Button
                        size="small"
                        onClick={() => handleMarkAsRead(notification.id)}
                        startIcon={<CheckCircle />}
                      >
                        Mark Read
                      </Button>
                    )}
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}