# API Design Documentation

**LibraryCard Worker API** - Comprehensive endpoint reference and design patterns

**Updated**: September 2025
**Architecture**: Cloudflare Workers with modular router system

## Overview

LibraryCard uses a sophisticated API architecture built on Cloudflare Workers, featuring modular routers, comprehensive authentication, and performance-optimized caching. The API serves a React frontend with direct worker calls, bypassing traditional server routing for better performance.

## Direct Worker Architecture

**IMPORTANT**: As of July 2025, all client-side API calls go directly to the Cloudflare Worker, bypassing Next.js API routes entirely.

### Technical Stack
- **Runtime**: Cloudflare Workers (V8 JavaScript engine)
- **Database**: Cloudflare D1 (distributed SQLite)
- **Caching**: Cloudflare KV with intelligent invalidation
- **Authentication**: JWT with multiple verification methods
- **Security**: CSRF protection, rate limiting, CORS policies

### Client Integration
- **Direct Client → Worker**: All book, profile, checkout, genre operations use `getApiBaseUrl()` and call the worker directly
- **Authentication**: Uses `Authorization: Bearer ${session?.user?.email}` headers for worker calls
- **Environment**: Only `NEXT_PUBLIC_API_URL` is needed (removed server-side `API_URL` variable)
- **Next.js API routes**: Only used for auth flows (`/api/auth/*`) and contact form
- **Fallbacks**: localStorage fallbacks maintained for offline functionality

## Router Architecture

The API uses a modular router system with specialized handlers:

- **MainRouter**: Orchestration layer with CORS, rate limiting, and global error handling
- **AuthRouter**: Authentication, 2FA, WebAuthn, and security endpoints
- **BooksRouter**: Book management, checkout system, ratings, and image handling
- **AdminRouter**: Admin analytics, user management, and content moderation
- **LocationsRouter**: Location and shelf management, invitation system
- **ProfileRouter**: User profiles, dashboard data, and notification preferences
- **SeriesRouter**: Book series management with approval workflows

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Health & System
- `GET /health` - Health check endpoint with environment info

#### Authentication & Registration
- `POST /api/auth/register` - Register new user with email/password (supports dual workflow: invitation-based or approval-based)
- `POST /api/auth/verify` - Verify user credentials
- `GET /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/verify-reset-token` - Verify password reset token
- `POST /api/auth/reset-password` - Reset password with valid token
- `POST /api/auth/2fa/complete-login` - Complete login with 2FA verification

#### WebAuthn Authentication (Public)
- `POST /api/auth/webauthn/authenticate/begin` - Start WebAuthn authentication
- `POST /api/auth/webauthn/authenticate/finish` - Complete WebAuthn authentication

#### Public Data Access
- `GET /api/genres` - List active curated genres
- `GET /api/invitations/details` - Get invitation details (for signup flow)
- `POST /api/contact` - Send contact form email

#### User Verification
- `POST /api/users` - Create/update user (OAuth and email/password)
- `GET /api/users/check` - Check if user exists (used in invitation flow)

---

### Protected Endpoints (Authentication Required)

#### Authentication & Security
- `POST /api/auth/change-password` - Change password (authenticated users)
- `POST /api/auth/logout` - Logout and invalidate user cache
- `GET /api/csrf-token` - Get CSRF token for protected operations

#### Two-Factor Authentication
- `GET /api/auth/2fa/status` - Get 2FA status for user
- `GET /api/auth/2fa/setup` - Initialize 2FA setup (get QR code)
- `POST /api/auth/2fa/setup` - Complete 2FA setup with TOTP verification
- `POST /api/auth/2fa/verify` - Verify TOTP code
- `POST /api/auth/2fa/verify-backup` - Verify backup recovery code
- `POST /api/auth/2fa/disable` - Disable 2FA for user
- `POST /api/auth/2fa/backup-codes` - Regenerate backup codes

#### WebAuthn/Passkeys (Protected)
- `POST /api/auth/webauthn/register/begin` - Start passkey registration
- `POST /api/auth/webauthn/register/finish` - Complete passkey registration
- `GET /api/auth/webauthn/credentials` - List user's registered passkeys
- `DELETE /api/auth/webauthn/credentials/:id` - Delete specific passkey

#### Book Management
- `GET /api/books` - List accessible books with caching and filtering
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book location/tags
- `DELETE /api/books/:id` - Remove book
- `GET /api/books/editions` - Get enhanced book editions for cover selection (multi-source)

#### Book Operations
- `GET /api/books/checkout-history` - Get user's checkout history
- `POST /api/books/:id/checkout` - Check out a book
- `POST /api/books/:id/checkin` - Check in a book
- `GET /api/books/:id/checkout-history` - Get specific book's checkout history
- `POST /api/books/:id/rate` - Rate a book (star rating)
- `GET /api/books/:id/rating` - Get user's rating for a book

#### Image Management
- `POST /api/books/images/upload` - Upload custom book cover image with AI verification
- `DELETE /api/books/:id/images` - Delete custom cover image
- `GET /api/books/:id/images` - List all images for a book

#### Genre Management
- `POST /api/books/:id/genres` - Assign genre to book
- `DELETE /api/books/:id/genres/:genreId` - Remove genre from book

#### Book Removal System
- `POST /api/book-removal-requests` - Create book removal request (users)
- `GET /api/book-removal-requests` - List pending removal requests (admin)
- `POST /api/book-removal-requests/:id/approve` - Approve removal request (admin)
- `POST /api/book-removal-requests/:id/deny` - Deny removal request (admin)
- `DELETE /api/book-removal-requests/:id` - Delete removal request (admin)

#### Location Management
- `GET /api/locations` - List accessible locations
- `POST /api/locations` - Create new location (admin)
- `PUT /api/locations/:id` - Update location details (admin)
- `DELETE /api/locations/:id` - Delete location (admin)

#### Shelf Management
- `GET /api/locations/:id/shelves` - List shelves in location
- `POST /api/locations/:id/shelves` - Create new shelf (admin)
- `PUT /api/shelves/:id` - Update shelf name (admin)
- `DELETE /api/shelves/:id` - Delete shelf (admin)

#### Invitation System
- `POST /api/invitations/accept` - Accept location invitation
- `POST /api/locations/{id}/invite` - Create location invitation (admin)
- `GET /api/locations/{id}/invitations` - List location invitations (admin)
- `DELETE /api/invitations/{id}/revoke` - Revoke invitation (admin)

#### Series Management
- `GET /api/series` - List approved series for user
- `POST /api/series` - Create new series (pending approval)
- `PUT /api/series/:id` - Update series details
- `DELETE /api/series/:id` - Delete series
- `POST /api/series/:id/books` - Add books to series
- `DELETE /api/series/:id/books/:bookId` - Remove book from series
- `GET /api/series/:id/books` - Get paginated books in series

#### User Profile & Dashboard
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/dashboard` - Get user dashboard data and statistics
- `GET /api/user/rejected-reviews` - Get user's rejected reviews

#### Notification System
- `GET /api/notifications` - Get in-app notifications for user
- `GET /api/notifications/unread-count` - Get count of unread notifications
- `POST /api/notifications/:id/read` - Mark specific notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `GET /api/user/notification-preferences` - Get user notification preferences
- `PUT /api/user/notification-preferences` - Update notification preferences
- `POST /api/user/notification-preferences/reset` - Reset to default preferences

#### Permission Management
- `GET /api/permissions/can-manage` - Check permission management access
- `GET /api/permissions/check` - Check specific permission
- `GET /api/permissions/user` - Get all user permissions for location
- `GET /api/user/global-permissions` - Get user's global permissions

---

### Admin-Only Endpoints

#### Signup Approval System
- `GET /api/signup-requests` - List pending signup approval requests
- `POST /api/signup-requests/{id}/approve` - Approve signup request and create user account
- `POST /api/signup-requests/{id}/deny` - Deny signup request with optional comment

#### Series Administration
- `GET /api/admin/series/pending` - List pending series for approval
- `POST /api/admin/series/:id/approve` - Approve/reject series

#### Review Moderation
- `GET /api/admin/reviews/pending` - List pending reviews for moderation
- `POST /api/admin/reviews/:id/moderate` - Approve/reject book review

#### Admin Analytics & Management
- `GET /api/admin/analytics` - Get comprehensive admin analytics and metrics
- `GET /api/admin/users` - List all users with management capabilities
- `PUT /api/admin/users/:id/role` - Update user role (super admin only)
- `GET /api/admin/available-admins` - Get list of available admin users
- `GET /api/admin/users/:id/assignments` - Get user's location assignments
- `POST /api/admin/users/:id/assign-location` - Assign user to location
- `DELETE /api/admin/users/:id/unassign-location` - Remove user from location

#### Admin Utilities
- `POST /api/admin/cleanup-user` - Clean up user data (super admin only)
- `GET /api/admin/debug-users` - Debug user information (development only)
- `POST /api/admin/cache/warm` - Warm admin analytics cache
- `GET /api/admin/cache/metrics` - Get cache performance metrics
- `POST /api/admin/notifications/test` - Create test notification

#### Permission Administration
- `GET /api/admin/location-admin-capabilities` - View admin capabilities for location
- `POST /api/admin/location-admin-capabilities` - Grant admin capability
- `DELETE /api/admin/location-admin-capabilities` - Revoke admin capability
- `GET /api/admin/location-user-permissions` - View user permissions for location
- `POST /api/admin/location-user-permissions` - Grant user permission
- `DELETE /api/admin/location-user-permissions` - Revoke user permission
- `POST /api/admin/global-permissions` - Grant global permission (super admin only)
- `DELETE /api/admin/global-permissions` - Revoke global permission (super admin only)

#### Analytics & Monitoring
- `GET /api/admin/session-analytics` - Get session analytics
- `POST /api/admin/session-analytics` - Log session analytics

---

## Authentication & Security

### Authentication Methods
1. **Email/Password**: Traditional username/password with secure hashing
2. **Google OAuth**: Seamless integration with Google accounts
3. **Two-Factor Authentication**: TOTP-based 2FA with backup codes
4. **WebAuthn/Passkeys**: Modern passwordless authentication

### Security Features
- **CSRF Protection**: Token-based protection for state-changing operations
- **Rate Limiting**: Configurable rate limits for sensitive endpoints
- **Input Validation**: Server-side validation of all inputs
- **Error Handling**: Secure error responses without information disclosure
- **Permission Enforcement**: Role-based access control with hierarchical permissions

### CORS Configuration
```javascript
{
  'Access-Control-Allow-Origin': allowedOrigin,  // Dynamic based on environment
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
}
```

## Performance & Caching

### Caching Strategy
- **Authentication Cache**: 30-minute TTL for user authentication data
- **Book Operations**: 10-minute TTL for book metadata and operations
- **External API Cache**: 24-hour TTL for Google Books and OpenLibrary data
- **Genre Data**: 1-hour TTL for genre classifications
- **Admin Analytics**: 1-hour TTL for dashboard data

### Cache Invalidation
- **Smart Invalidation**: Targeted cache clearing based on data changes
- **User-Scoped**: User-specific cache invalidation for personalized data
- **Global Cache**: System-wide cache warming for common operations

### Performance Optimizations
- **Field Selection**: GraphQL-style field selection for minimal data transfer
- **Pagination**: Efficient pagination for large datasets
- **Batch Operations**: Bulk operations where applicable
- **Connection Pooling**: Optimized database connection management

## Error Handling

### Error Categories
- **Authentication Errors**: 401 Unauthorized with specific auth failure reasons
- **Authorization Errors**: 403 Forbidden for permission violations
- **Validation Errors**: 400 Bad Request with detailed field validation
- **Not Found Errors**: 404 for missing resources
- **Rate Limit Errors**: 429 Too Many Requests with retry information
- **Server Errors**: 500 Internal Server Error with secure error responses

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation_error_message"
  },
  "timestamp": "2025-09-23T10:30:00Z"
}
```

## API Versioning

### Current Version
- **Version**: v1 (implicit)
- **Stability**: Production-ready
- **Backward Compatibility**: Maintained for all public endpoints

### Future Versioning Strategy
- **Path-based versioning**: `/api/v2/` when needed
- **Header-based versioning**: For gradual migrations
- **Deprecation Policy**: 6-month deprecation notices for breaking changes

## Development & Testing

### Development Tools
- **Debug Endpoints**: Available in development environment only
- **Health Checks**: Comprehensive system health monitoring
- **Analytics**: Request tracing and performance monitoring
- **Cache Metrics**: Cache hit rates and performance data

### Testing Considerations
- **Rate Limiting**: Disabled or relaxed in development
- **CORS**: Permissive policies for local development
- **Error Handling**: Detailed error information in development
- **Database**: Local SQLite for development, D1 for staging/production

## Integration Guidelines

### Frontend Integration
```typescript
// API configuration
import { getApiBaseUrl } from '@/lib/apiConfig';

// Authenticated API call
const response = await fetch(`${getApiBaseUrl()}/api/books`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session?.user?.email}`,
    'Content-Type': 'application/json',
  },
});
```

### Error Handling Best Practices
```typescript
try {
  const response = await apiCall();
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  return await response.json();
} catch (error) {
  // Handle network errors, JSON parsing errors, etc.
  console.error('API Error:', error);
  throw error;
}
```

### Authentication Flow
```typescript
// Check authentication status
const user = await getUserFromRequest(request, env);
if (!user) {
  return new Response(JSON.stringify({ error: 'Authentication required' }), {
    status: 401,
    headers: corsHeaders,
  });
}
```

## Monitoring & Analytics

### Available Metrics
- **Request Volume**: Requests per second/minute/hour
- **Response Times**: P50, P95, P99 latency measurements
- **Error Rates**: Error percentage by endpoint and error type
- **Cache Performance**: Hit rates, miss rates, invalidation frequency
- **Authentication**: Login success/failure rates, 2FA usage
- **Database Performance**: Query execution times, connection usage

### Logging
- **Request Logging**: Method, path, response time, status code
- **Error Logging**: Detailed error information with stack traces
- **Security Logging**: Authentication attempts, permission violations
- **Performance Logging**: Slow queries, cache misses, timeouts

---

For implementation details and database schema information, see:
- **[Database Schema](./database-schema.md)** - Complete database structure
- **[Database Migrations](./database-migrations.md)** - Migration system documentation
- **[Architecture Overview](./architecture.md)** - High-level system architecture