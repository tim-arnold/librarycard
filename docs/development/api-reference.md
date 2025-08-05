# API Reference

This document describes the LibraryCard API endpoints provided by the Cloudflare Worker.

## Base URL

```
https://your-worker-name.your-subdomain.workers.dev
```

## Authentication

The API uses Bearer token authentication with JWT tokens issued by the authentication system. All endpoints (except public auth endpoints) require authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Token Features:**
- 24-hour expiration for security
- Cryptographically signed for integrity
- Includes user ID and session information
- Automatic refresh through frontend authentication flow

**Authentication Flow:**
1. User signs in through NextAuth.js (Google OAuth or email/password)
2. Backend issues JWT token upon successful authentication
3. Frontend includes JWT in Authorization header for all API calls
4. Backend validates JWT signature and expiration on each request

## Authorization

LibraryCard implements role-based access control:

- **Super Admin Users**: Global system administration and location creation
- **Admin Users**: Can create, update, and delete locations and shelves they manage
- **Regular Users**: Can only add, update, and delete books in assigned locations
- All users can view locations and shelves they have access to

The UI automatically hides admin-only buttons for regular users.

## Security Features

### CSRF Protection

All state-changing operations (POST, PUT, PATCH, DELETE) require CSRF token validation:

```http
X-CSRF-Token: abc123...
```

**CSRF Token Workflow:**
1. Frontend requests CSRF token: `GET /api/csrf-token`
2. Backend returns cryptographically secure token with 24-hour expiration
3. Frontend includes token in X-CSRF-Token header for state-changing requests
4. Backend validates token using constant-time comparison

**CSRF Exemptions:**
- Authentication endpoints use alternative CSRF protection methods
- AJAX requests with `X-Requested-With: XMLHttpRequest` header are exempted
- Read-only operations (GET requests) do not require CSRF tokens

### Rate Limiting

The API implements intelligent rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|---------|
| Authentication (login) | 5 attempts | 15 minutes |
| Registration | 3 attempts | 1 hour |
| Password Reset | 3 attempts | 1 hour |
| 2FA Verification | 10 attempts | 15 minutes |
| General API | 100 requests | 1 minute |

**Rate Limiting Features:**
- Per-IP address tracking using Cloudflare KV storage
- Automatic sliding window implementation
- Development environment bypass for testing
- Graceful degradation when rate limiting service is unavailable

### CORS Policy

Cross-Origin Resource Sharing is restricted to authorized domains:

```http
Access-Control-Allow-Origin: https://librarycard.tim52.io
```

**Allowed Origins:**
- Production: `https://librarycard.tim52.io`
- Staging: `https://staging--libarycard.netlify.app`
- Development: `http://localhost:3000`

## Authentication Endpoints

### POST /api/auth/register

Register a new user with email and password.

#### Request
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Response
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid-string"
}
```

### POST /api/auth/verify

Verify user credentials for email/password authentication.

#### Request
```http
POST /api/auth/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "auth_provider": "email"
}
```

### GET /api/auth/verify-email

Verify email address using token from registration email.

#### Request
```http
GET /api/auth/verify-email?token=verification-token
```

#### Response
```json
{
  "message": "Email verified successfully"
}
```

## User Management

### POST /api/users

Create or update a user account. This is called automatically when users sign in with Google OAuth.

#### Request
```http
POST /api/users
Content-Type: application/json

{
  "id": "user@example.com",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Response
```json
{
  "success": true
}
```

## Location Management

### GET /api/locations

Get all locations accessible to the authenticated user (owned or shared).

#### Request
```http
GET /api/locations
Authorization: Bearer user@example.com
```

#### Response
```json
[
  {
    "id": 1,
    "name": "Home Library",
    "description": "Main house book collection",
    "owner_id": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### POST /api/locations

Create a new location. Automatically creates a "my first shelf" shelf.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
POST /api/locations
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "name": "Home Library",
  "description": "Main house book collection"
}
```

#### Response
```json
{
  "id": 1,
  "name": "Home Library",
  "description": "Main house book collection",
  "owner_id": "user@example.com"
}
```

### PUT /api/locations/:id

Update a location's details.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
PUT /api/locations?id=1
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "name": "Updated Library Name",
  "description": "Updated description"
}
```

### DELETE /api/locations/:id

Delete a location and all its shelves.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
DELETE /api/locations?id=1
Authorization: Bearer user@example.com
```

## Shelf Management

### GET /api/locations/:id/shelves

Get all shelves in a specific location.

#### Request
```http
GET /api/locations/1/shelves
Authorization: Bearer user@example.com
```

#### Response
```json
[
  {
    "id": 1,
    "name": "my first shelf",
    "location_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Fiction",
    "location_id": 1,
    "created_at": "2024-01-15T11:00:00Z"
  }
]
```

### POST /api/locations/:id/shelves

Create a new shelf in a location.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
POST /api/locations/1/shelves
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "name": "Science Fiction"
}
```

#### Response
```json
{
  "id": 3,
  "name": "Science Fiction",
  "location_id": 1,
  "created_at": "2024-01-15T12:00:00Z"
}
```

### PUT /api/shelves/:id

Update a shelf's name.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
PUT /api/locations/1/shelves?shelfId=2
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "name": "Fantasy & Fiction"
}
```

### DELETE /api/shelves/:id

Delete a shelf.

**Admin Only**: This endpoint requires admin privileges.

#### Request
```http
DELETE /api/locations/1/shelves?shelfId=2
Authorization: Bearer user@example.com
```

## Book Management

### GET /api/books

Get all books accessible to the authenticated user.

#### Request
```http
GET /api/books
Authorization: Bearer user@example.com
```

#### Response
```json
[
  {
    "id": 1,
    "isbn": "9780123456789",
    "title": "Example Book",
    "authors": ["John Doe", "Jane Smith"],
    "description": "An example book description...",
    "thumbnail": "https://covers.openlibrary.org/b/id/123-M.jpg",
    "published_date": "2023",
    "categories": ["Fiction", "Mystery"],
    "shelf_id": 1,
    "tags": ["fiction", "favorite"],
    "added_by": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "shelf_name": "Fiction",
    "location_name": "Home Library"
  }
]
```

### POST /api/books

Add a new book to the library.

#### Request
```http
POST /api/books
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "isbn": "9780123456789",
  "title": "Example Book",
  "authors": ["John Doe", "Jane Smith"],
  "description": "An example book description...",
  "thumbnail": "https://covers.openlibrary.org/b/id/123-M.jpg",
  "published_date": "2023",
  "categories": ["Fiction", "Mystery"],
  "shelf_id": 1,
  "tags": ["fiction", "favorite"]
}
```

#### Required Fields
- `isbn`: String - The book's ISBN
- `title`: String - Book title
- `authors`: Array of strings - Book authors

#### Optional Fields
- `description`: String - Book description
- `thumbnail`: String - Cover image URL
- `published_date`: String - Publication date
- `categories`: Array of strings - Book categories/genres
- `shelf_id`: Number - ID of the shelf to place the book
- `tags`: Array of strings - Custom tags

### PUT /api/books/:id

Update an existing book (currently supports shelf_id and tags only).

#### Request
```http
PUT /api/books/1
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "shelf_id": 2,
  "tags": ["fiction", "read", "favorite"]
}
```

### DELETE /api/books/:id

Remove a book from the library.

#### Request
```http
DELETE /api/books/1
Authorization: Bearer user@example.com
```

## Profile Management

### GET /api/profile

Get the current user's profile information including role.

#### Request
```http
GET /api/profile
Authorization: Bearer user@example.com
```

#### Response
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "auth_provider": "email",
  "email_verified": true,
  "user_role": "admin",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### PUT /api/profile

Update the current user's profile information.

#### Request
```http
PUT /api/profile
Authorization: Bearer user@example.com
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe Updated"
}
```

#### Response
```json
{
  "message": "Profile updated successfully"
}
```

## Data Types

### User Object
```typescript
interface User {
  id: string;                    // User ID (email for OAuth, UUID for email auth)
  email: string;                 // Email address
  first_name?: string;           // First name
  last_name?: string;            // Last name
  password_hash?: string;        // For email authentication
  auth_provider?: string;        // 'google' or 'email'
  email_verified?: boolean;      // Email verification status
  user_role?: string;            // 'admin' or 'user'
  created_at?: string;           // Timestamp
  updated_at?: string;           // Timestamp
}
```

### Location Object
```typescript
interface Location {
  id?: number;             // Auto-generated ID
  name: string;            // Location name
  description?: string;    // Optional description
  owner_id: string;        // User email who owns this location
  created_at?: string;     // Timestamp
}
```

### Shelf Object
```typescript
interface Shelf {
  id?: number;             // Auto-generated ID
  name: string;            // Shelf name
  location_id: number;     // Parent location ID
  created_at?: string;     // Timestamp
}
```

### Book Object
```typescript
interface Book {
  id?: number;              // Auto-generated ID
  isbn: string;             // 13-digit ISBN
  title: string;            // Book title
  authors: string[];        // Array of author names
  description?: string;     // Book description
  thumbnail?: string;       // Cover image URL
  published_date?: string;  // Publication date
  categories?: string[];    // Genres/categories
  shelf_id?: number;        // Shelf ID where book is located
  tags?: string[];          // Custom tags
  added_by: string;         // User email who added the book
  created_at?: string;      // Timestamp
  shelf_name?: string;      // Shelf name (populated in GET responses)
  location_name?: string;   // Location name (populated in GET responses)
}
```

## Error Responses

### General Error Format
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200 OK`: Success
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Access denied to resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Database or server error

## CORS

The API includes CORS headers to allow browser requests:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Examples

### Complete Workflow Example

```bash
# 1. Create a user (called automatically by OAuth)
curl -X POST https://your-worker-name.your-subdomain.workers.dev/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user@example.com",
    "email": "user@example.com", 
    "first_name": "John",
    "last_name": "Doe"
  }'

# 2. Create a location
curl -X POST https://your-worker-name.your-subdomain.workers.dev/api/locations \
  -H "Authorization: Bearer user@example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home Library",
    "description": "Main collection at home"
  }'

# 3. Add a shelf to the location
curl -X POST https://your-worker-name.your-subdomain.workers.dev/api/locations/1/shelves \
  -H "Authorization: Bearer user@example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Science Fiction"
  }'

# 4. Add a book to the shelf
curl -X POST https://your-worker-name.your-subdomain.workers.dev/api/books \
  -H "Authorization: Bearer user@example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9780451524935",
    "title": "1984",
    "authors": ["George Orwell"],
    "description": "A dystopian social science fiction novel...",
    "categories": ["Fiction", "Dystopian"],
    "shelf_id": 1,
    "tags": ["classic", "dystopian"]
  }'

# 5. Get all books
curl -H "Authorization: Bearer user@example.com" \
  https://your-worker-name.your-subdomain.workers.dev/api/books
```

## Security Considerations

### Authentication
- Currently uses email as Bearer token for simplicity
- Production should implement proper JWT verification
- All endpoints except `/api/users` require authentication

### Authorization
- Role-based access control with admin and user roles
- Admin users can create, update, and delete locations and shelves
- Regular users can only manage books
- Users can only access their own locations and books
- Location owners have full control over their locations and shelves
- Future: implement location sharing between users

### Data Privacy
- User emails are used only for identification
- No sensitive personal data is stored
- Book data is public information (ISBN lookups)
- Users have full control over their data

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider:
- Request rate limits per user
- Bulk operation limits
- API key management for external integrations