# Database Schema

LibraryCard uses Cloudflare D1, a distributed SQLite database, to store user accounts, locations, shelves, books, and management systems in a comprehensive multi-user architecture.

## Table Structure

### Users Table

Stores user authentication information for multiple auth providers with admin roles:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID for email/password users, Google ID for OAuth users
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT, -- NULL for OAuth users
  auth_provider TEXT DEFAULT 'email', -- 'email' or 'google'
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires DATETIME,
  user_role TEXT DEFAULT 'user', -- 'admin' or 'user'
  password_reset_token TEXT,
  password_reset_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Signup Approval Requests

Admin approval workflow for new user registrations:

```sql
CREATE TABLE IF NOT EXISTS signup_approval_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  password_hash TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT, -- Admin who approved/denied
  reviewed_at DATETIME, -- When the request was reviewed
  review_comment TEXT, -- Admin's comment on the decision
  created_user_id TEXT, -- User ID created after approval (for tracking)
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

### Locations Table

Physical locations where books are stored (e.g., "Home", "Office"):

```sql
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Location Members Table

For sharing locations between users:

```sql
CREATE TABLE IF NOT EXISTS location_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'member'
  invited_by TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (invited_by) REFERENCES users(id),
  UNIQUE(location_id, user_id)
);
```

### Location Invitations Table

System for inviting users to shared locations:

```sql
CREATE TABLE IF NOT EXISTS location_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  invited_email TEXT NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  invited_by TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);
```

### Shelves Table

Shelves within locations (e.g., "Fiction", "Reference", "Programming Books"):

```sql
CREATE TABLE IF NOT EXISTS shelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

### Books Table

Individual book records with checkout system and enhanced metadata:

```sql
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL, -- JSON array
  description TEXT,
  thumbnail TEXT,
  published_date TEXT,
  categories TEXT, -- JSON array
  shelf_id INTEGER, -- Reference to shelves table
  tags TEXT, -- JSON array
  added_by TEXT, -- NOW NULLABLE (was NOT NULL)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'available',
  checked_out_by TEXT,
  checked_out_date DATETIME,
  due_date DATETIME,
  extended_description TEXT,
  subjects TEXT,
  page_count INTEGER,
  average_rating REAL,
  ratings_count INTEGER,
  publisher_info TEXT,
  open_library_key TEXT,
  enhanced_genres TEXT,
  series TEXT,
  series_number TEXT,
  rating_count INTEGER DEFAULT 0,
  rating_updated_at DATETIME,
  user_rating INTEGER,
  google_average_rating REAL,
  google_ratings_count INTEGER,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id)
  -- Note: Removed FOREIGN KEY constraint for added_by to allow NULL
);
```

### Book Checkout History

Complete history of book checkouts and returns:

```sql
CREATE TABLE IF NOT EXISTS book_checkout_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id TEXT NOT NULL, -- User who checked out the book
  action TEXT NOT NULL, -- 'checkout' or 'return'
  action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME, -- Due date when checked out
  notes TEXT, -- Optional notes from user or admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Book Ratings System

User ratings and reviews for books:

```sql
CREATE TABLE IF NOT EXISTS book_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(book_id, user_id)
);
```

### Book Removal Requests

Admin approval workflow for book removal:

```sql
CREATE TABLE IF NOT EXISTS book_removal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  requester_id TEXT NOT NULL, -- User who requested removal
  reason TEXT NOT NULL, -- 'lost', 'damaged', 'missing', 'other'
  reason_details TEXT, -- Additional details/comments from user
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by TEXT, -- Admin who approved/denied
  review_comment TEXT, -- Admin's comment on the decision
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME, -- When the request was reviewed
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

## Indexes

Optimized indexes for common query patterns:

```sql
-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users(password_reset_expires);

-- Locations and Members
CREATE INDEX IF NOT EXISTS idx_locations_owner ON locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_location_members_location ON location_members(location_id);
CREATE INDEX IF NOT EXISTS idx_location_members_user ON location_members(user_id);
CREATE INDEX IF NOT EXISTS idx_location_invitations_token ON location_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_location_invitations_email ON location_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_location_invitations_location ON location_invitations(location_id);

-- Shelves
CREATE INDEX IF NOT EXISTS idx_shelves_location ON shelves(location_id);

-- Books
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_checked_out_by ON books(checked_out_by);

-- Checkout History
CREATE INDEX IF NOT EXISTS idx_checkout_history_book ON book_checkout_history(book_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_user ON book_checkout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_action ON book_checkout_history(action);
CREATE INDEX IF NOT EXISTS idx_checkout_history_date ON book_checkout_history(action_date);

-- Ratings
CREATE INDEX IF NOT EXISTS idx_ratings_book ON book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON book_ratings(rating);

-- Removal Requests
CREATE INDEX IF NOT EXISTS idx_removal_requests_book ON book_removal_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_requester ON book_removal_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_removal_requests_status ON book_removal_requests(status);
CREATE INDEX IF NOT EXISTS idx_removal_requests_created ON book_removal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_removal_requests_reviewed_by ON book_removal_requests(reviewed_by);

-- Signup Requests
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_approval_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_reviewed_by ON signup_approval_requests(reviewed_by);
```

## Data Relationships

### Entity Relationship Diagram

```
users (1) ←→ (n) locations
  ↓              ↓
  (1) ←→ (n) location_members
  ↓              ↓
  (1) ←→ (n) location_invitations
  ↓
  (1) ←→ (n) books (added_by)
  ↓
  (1) ←→ (n) book_checkout_history
  ↓
  (1) ←→ (n) book_ratings
  ↓
  (1) ←→ (n) book_removal_requests
  ↓
  (1) ←→ (n) signup_approval_requests (reviewed_by)

locations (1) ←→ (n) shelves
shelves (1) ←→ (n) books (shelf_id)
books (1) ←→ (n) book_checkout_history
books (1) ←→ (n) book_ratings
books (1) ←→ (n) book_removal_requests
```

### Key Relationships

1. **Users → Locations**: One user can own multiple locations
2. **Users → Location Members**: Users can be members of shared locations
3. **Users → Location Invitations**: Users can invite others to their locations
4. **Users → Books**: Users can add books to any accessible location (nullable for migration)
5. **Users → Checkout History**: Users can check out and return books
6. **Users → Ratings**: Users can rate books (one rating per user per book)
7. **Users → Removal Requests**: Users can request book removal, admins approve
8. **Users → Signup Requests**: Admins review and approve new user registrations
9. **Locations → Shelves**: Each location contains multiple shelves
10. **Shelves → Books**: Books are assigned to specific shelves
11. **Books → Checkout History**: Complete audit trail of book usage
12. **Books → Ratings**: Aggregated rating system for books
13. **Books → Removal Requests**: Workflow for removing lost/damaged books

## System Features

### Authentication System
- **Multi-provider**: Google OAuth and email/password authentication
- **Email verification**: Required for email/password users
- **Password reset**: Secure token-based password reset
- **Admin roles**: Role-based access control

### Signup Approval System
- **Admin approval**: New users must be approved by admins
- **Request tracking**: Complete audit trail of signup requests
- **Review comments**: Admins can provide feedback on decisions

### Location Sharing System
- **Invitations**: Email-based invitation system with expiring tokens
- **Role management**: Owners vs members with different permissions
- **Access control**: Comprehensive permission checking

### Book Management System
- **Enhanced metadata**: Detailed book information from multiple sources
- **Flexible organization**: Hierarchical location → shelf → book structure
- **Status tracking**: Available, checked out, maintenance states

### Checkout System
- **Check out/return**: Full circulation system for book loans
- **Due dates**: Automatic due date calculation and tracking
- **History**: Complete audit trail of all checkout activities
- **Notes**: Optional notes for special circumstances

### Rating System
- **1-5 star ratings**: Standard rating scale
- **Reviews**: Optional text reviews
- **Aggregation**: Automatic calculation of average ratings
- **One per user**: Users can only rate each book once

### Removal Request System
- **User requests**: Users can request removal of lost/damaged books
- **Admin approval**: Admins review and approve/deny requests
- **Reason tracking**: Categorized reasons (lost, damaged, missing, other)
- **Audit trail**: Complete history of removal decisions

## Common Queries

### User's Books with Full Context
```sql
SELECT 
  b.*,
  s.name as shelf_name,
  l.name as location_name,
  CASE 
    WHEN b.checked_out_by IS NOT NULL THEN 'checked_out'
    ELSE b.status
  END as current_status,
  COALESCE(avg_ratings.avg_rating, b.average_rating) as display_rating
FROM books b
LEFT JOIN shelves s ON b.shelf_id = s.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN location_members lm ON l.id = lm.location_id
LEFT JOIN (
  SELECT book_id, AVG(rating) as avg_rating 
  FROM book_ratings 
  GROUP BY book_id
) avg_ratings ON b.id = avg_ratings.book_id
WHERE b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?
ORDER BY b.created_at DESC;
```

### Checkout History for a Book
```sql
SELECT 
  bch.*,
  u.first_name || ' ' || u.last_name as user_name,
  u.email
FROM book_checkout_history bch
JOIN users u ON bch.user_id = u.id
WHERE bch.book_id = ?
ORDER BY bch.action_date DESC;
```

### User's Active Checkouts
```sql
SELECT 
  b.id,
  b.title,
  b.authors,
  b.checked_out_date,
  b.due_date,
  CASE 
    WHEN b.due_date < datetime('now') THEN 'overdue'
    WHEN b.due_date < datetime('now', '+7 days') THEN 'due_soon'
    ELSE 'current'
  END as checkout_status
FROM books b
WHERE b.checked_out_by = ? AND b.status = 'checked_out'
ORDER BY b.due_date ASC;
```

### Pending Admin Tasks
```sql
-- Signup requests needing approval
SELECT 'signup' as type, id, email, requested_at as created_at, 'pending' as status
FROM signup_approval_requests 
WHERE status = 'pending'

UNION ALL

-- Book removal requests needing approval  
SELECT 'removal' as type, br.id, b.title as email, br.created_at, br.status
FROM book_removal_requests br
JOIN books b ON br.book_id = b.id
WHERE br.status = 'pending'

ORDER BY created_at ASC;
```

### Location Access Control Check
```sql
-- Check if user has access to a location
SELECT 
  l.id,
  l.name,
  CASE 
    WHEN l.owner_id = ? THEN 'owner'
    WHEN lm.role = 'member' THEN 'member'
    ELSE NULL
  END as access_level
FROM locations l
LEFT JOIN location_members lm ON l.id = lm.location_id AND lm.user_id = ?
WHERE l.id = ? AND (l.owner_id = ? OR lm.user_id = ?);
```

## Data Validation

### Application-Level Constraints

```typescript
// User validation
interface UserValidation {
  id: string; // Required, non-empty
  email: string; // Required, valid email format
  first_name?: string;
  last_name?: string;
  user_role: 'admin' | 'user'; // Enum validation
  auth_provider: 'email' | 'google'; // Enum validation
}

// Book validation with checkout status
interface BookValidation {
  isbn: string; // Required, 10 or 13 digits
  title: string; // Required, non-empty
  authors: string[]; // Required, at least one author
  shelf_id?: number; // Optional, must exist if provided
  status: 'available' | 'checked_out' | 'maintenance'; // Enum validation
  checked_out_by?: string; // Only if status is 'checked_out'
  due_date?: Date; // Only if status is 'checked_out'
}

// Rating validation
interface RatingValidation {
  book_id: number; // Required, must exist
  user_id: string; // Required, must exist
  rating: number; // Required, 1-5 integer
  review_text?: string; // Optional, max length validation
}

// Removal request validation
interface RemovalRequestValidation {
  book_id: number; // Required, must exist
  requester_id: string; // Required, must exist
  reason: 'lost' | 'damaged' | 'missing' | 'other'; // Enum validation
  reason_details?: string; // Required if reason is 'other'
}
```

### Database Constraints

- **Foreign key constraints**: Ensure referential integrity across all relationships
- **Unique constraints**: Prevent duplicate ratings, location memberships, invitations
- **NOT NULL constraints**: Required fields enforced at database level
- **CHECK constraints**: Rating values must be 1-5
- **Indexes**: Improve query performance for common access patterns

## Migration History

### Version 1.0 (Initial)
- Simple books table with location as string field
- Single-user architecture

### Version 2.0 (Multi-User)
- Added users, locations, shelves, location_members tables
- Migrated books.location to books.shelf_id relationship
- Added authentication and access control
- Implemented hierarchical location → shelf → book structure

### Version 3.0 (Enhanced Authentication)
- Added user_role column with admin/user permissions
- Implemented role-based access control for location/shelf operations
- Added email/password authentication alongside Google OAuth
- Enhanced security with admin-only restrictions
- Added password reset functionality

### Version 4.0 (Checkout System)
- Added book checkout/return functionality
- Added book_checkout_history table for audit trail
- Enhanced books table with checkout status and due dates
- Implemented circulation management

### Version 5.0 (Rating System)
- Added book_ratings table for user reviews
- Enhanced books table with rating aggregation fields
- Implemented 1-5 star rating system with reviews

### Version 6.0 (Removal Request System)
- Added book_removal_requests table
- Implemented admin approval workflow for book removal
- Added request categorization and tracking

### Version 7.0 (Signup Approval System)
- Added signup_approval_requests table
- Implemented admin approval for new user registrations
- Enhanced user onboarding workflow

### Version 8.0 (Location Sharing)
- Added location_invitations table
- Enhanced location sharing with invitation system
- Implemented expiring invitation tokens

### Version 9.0 (Current - Enhanced Metadata)
- Enhanced books table with extended metadata fields
- Added series tracking, enhanced descriptions, publisher info
- Integrated with additional data sources (Open Library)
- Made added_by nullable for data migration flexibility

## Performance Considerations

### Query Optimization
- **Prepared statements**: All queries use parameterized statements
- **Index coverage**: Critical queries covered by appropriate indexes
- **JOIN optimization**: LEFT JOINs for optional relationships
- **Pagination**: Large result sets use LIMIT/OFFSET
- **Aggregation**: Rating calculations cached in books table

### Storage Estimates
- **Users**: ~200 bytes per user
- **Books**: ~1KB per book (with metadata)
- **Checkout History**: ~100 bytes per transaction
- **Ratings**: ~200 bytes per rating
- **Estimated capacity**: 25,000+ books per user on free tier

### Caching Strategy
- **Rating aggregations**: Calculated and cached in books table
- **User permissions**: Cached for session duration
- **Location access**: Verified once per request cycle

## Security Model

### Access Control
1. **Role-Based Access Control**: Users have admin or user roles
2. **Location Ownership**: Owners control all aspects of their locations
3. **Member Permissions**: Members can view and add books, limited shelf management
4. **Admin Privileges**: Admins can approve signups, manage removal requests
5. **Data Isolation**: Users only see locations they own or are members of
6. **Audit Trails**: All critical actions logged for accountability

### Data Privacy
- **Minimal PII**: Only names and email addresses stored
- **User control**: Users control their data and can request deletion
- **Access logging**: Administrative actions logged for audit
- **Secure tokens**: Password reset and invitation tokens are cryptographically secure

### Input Validation
- **SQL injection prevention**: All queries use prepared statements
- **XSS prevention**: All user input sanitized and escaped
- **CSRF protection**: State tokens for sensitive operations
- **Rate limiting**: API endpoints protected against abuse

## Future Enhancements

### Planned Features

1. **Advanced Circulation**
   - Holds/reservations system
   - Overdue notifications
   - Fine calculation
   - Renewal requests

2. **Enhanced Discovery**
   - Full-text search across all metadata
   - Recommendation engine based on ratings
   - Similar books suggestions
   - Reading lists and collections

3. **Reporting and Analytics**
   - Usage statistics and trends
   - Popular books and authors
   - Circulation reports
   - User activity dashboards

4. **Integration Enhancements**
   - Additional metadata sources
   - Automated ISBN enrichment
   - Cover image optimization
   - Barcode scanning improvements

5. **Social Features**
   - Book clubs and groups
   - Reading challenges
   - Social ratings and reviews
   - Activity feeds