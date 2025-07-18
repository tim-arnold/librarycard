# Architecture Overview

LibraryCard is built as a modern, serverless web application using a hybrid architecture with Netlify for frontend hosting and Cloudflare Workers for the backend API.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│  Next.js App    │◄──►│ Cloudflare Worker│◄──►│ Cloudflare D1   │
│  (Frontend)     │    │     (API)        │    │   (Database)    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│                 │    │                  │
│   Netlify       │    │ External APIs    │
│   (Hosting)     │    │ • Google Books   │
│                 │    │ • OpenLibrary    │
│                 │    │ • Resend (Email) │
└─────────────────┘    └──────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Material-UI (MUI) with theme system
- **State Management**: React hooks (useState, useEffect, useContext)
- **Build Tool**: Next.js built-in bundler
- **Package Manager**: npm

### Backend
- **Runtime**: Cloudflare Workers (V8 JavaScript engine)
- **Language**: TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **API Framework**: Native Fetch API handlers
- **Caching**: Cloudflare KV for performance optimization

### Infrastructure
- **Frontend Hosting**: Netlify
- **Backend API**: Cloudflare Workers
- **Database**: Cloudflare D1 (distributed SQLite)
- **Caching**: Cloudflare KV (key-value store)
- **CDN**: Netlify Edge Network
- **SSL**: Automatic HTTPS via Netlify
- **Email**: Resend for verification emails

### External Services
- **Book Data**: Google Books API (primary)
- **Fallback**: OpenLibrary API
- **Barcode Scanning**: ZXing library (@zxing/library)
- **Email Service**: Resend for user verification
- **Authentication**: NextAuth.js with Google OAuth and email/password

### Component Design Philosophy

The frontend follows a **modular component architecture** designed for:

1. **Token Efficiency**: Smaller, focused components reduce AI development token usage
2. **Separation of Concerns**: Each component has a single, well-defined responsibility
3. **Reusability**: Components like `BookActions` and `ShelfSelector` are used across the app
4. **Maintainability**: Bug fixes and feature additions are localized to specific components
5. **Testing**: Individual components can be tested in isolation

#### Component Hierarchy
- **Coordinator Components**: Manage state and orchestrate child components (`AddBooks`, `BookLibrary`)
- **Display Components**: Handle pure rendering logic (`BookGrid`, `BookList`, `BookPreview`)
- **Interactive Components**: Manage user input and actions (`ISBNScanner`, `BookSearch`, `BookActions`)
- **Utility Components**: Provide reusable UI elements (`ShelfSelector`, `BookFilters`)

#### Component Refactoring Results
- **BookLibrary.tsx**: Reduced from 2,574 to 538 lines (79% reduction) - **MAJOR REFACTORING COMPLETE!**
- **AddBooks.tsx**: Reduced from 1,213 to 583 lines (52% reduction)
- **Total frontend token savings**: ~2,036 lines moved to focused sub-components across 11 new components
- **Components extracted**: LibraryHeader, ActiveFilters, BookViews, ShelfTiles, ViewModeControls, MoreDetailsModal, BookRelocateModal, and others
- **Hooks created**: useBookLibrary, useBookActions, useBookFilters for clean separation of business logic

#### Backend Refactoring Results
- **workers/index.ts**: Reduced from 2,351 to 366 lines (84% reduction) - **MASSIVE IMPROVEMENT!**
- **Total backend token savings**: ~1,985 lines extracted to 8 specialized modules
- **Module breakdown**:
  - `email/` - 544 lines (email and notification system with Resend/Postmark integration)
  - `admin/` - 373 lines (admin-specific operations including signup approval and user cleanup)
  - `auth-core/` - 372 lines (core authentication functions for registration, login, and verification)
  - `invitations/` - 271 lines (complete location invitation system with email validation)
  - `admin-extended/` - 154 lines (advanced admin analytics, user management, and role controls)
  - `profile/` - 75 lines (user profile management with dynamic field validation)
  - `auth/` - 37 lines (authentication utilities and permission helpers)
  - `auth-utils/` - 35 lines (additional auth helper functions)
  - `books/` - 742 lines (book CRUD, checkout, removal requests)
  - `locations/` - 467 lines (location & shelf management)
  - `types/` - 77 lines (shared interfaces)

## Design Principles

### 1. Modular Architecture
- **Frontend**: Component-based architecture for maintainability
- **Backend**: Functional modules for separation of concerns
- **Token efficiency**: Smaller focused files reduce AI development overhead
- **Maintainability**: Clear boundaries make debugging and feature development easier

### 2. Serverless-First
- No server management required
- Automatic scaling
- Pay-per-use pricing model
- Global edge deployment

### 3. Progressive Enhancement
- Works without JavaScript (basic functionality)
- Camera scanning as enhancement
- Graceful fallbacks (localStorage ↔ API)
- Mobile-first responsive design

### 4. Data Ownership
- Complete data export functionality
- No vendor lock-in
- Transparent data storage
- User controls their library

### 5. Cost Optimization
- Cloudflare free tier sufficient for personal use
- Minimal API calls (cached book data)
- Efficient database queries
- Static asset optimization

## Data Flow

### Book Addition Flow
```
User scans ISBN
       ↓
ZXing library detects barcode
       ↓
Fetch book data from Google Books API
       ↓
Display book details for confirmation
       ↓
User adds location/tags and saves
       ↓
Direct POST to Cloudflare Worker (getApiBaseUrl())
       ↓
Worker authenticates via Bearer token
       ↓
Worker saves to D1 database
       ↓
Success response to frontend
```

### Library Viewing Flow
```
User opens library
       ↓
Direct GET request to Worker API (getApiBaseUrl())
       ↓
Worker authenticates via Bearer token
       ↓
Worker queries D1 database
       ↓
Return JSON book list
       ↓
Frontend renders book cards
       ↓
User can filter/search locally
```

## Component Architecture

### Frontend Components
```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main app with tab navigation
│   └── globals.css         # Global styles
├── components/
│   ├── book/
│   │   ├── AddBooks.tsx        # Main book addition coordinator
│   │   ├── ISBNScanner.tsx     # Camera scanning + manual ISBN entry
│   │   ├── BookSearch.tsx      # Google Books API search interface
│   │   ├── BookPreview.tsx     # Selected book display + editing
│   │   ├── BookLibrary.tsx     # Main library display coordinator (538 lines)
│   │   ├── BookGrid.tsx        # Card view display component
│   │   ├── BookList.tsx        # List view display component
│   │   ├── BookActions.tsx     # Reusable action buttons
│   │   ├── BookFilters.tsx     # Search and filter controls
│   │   ├── ShelfSelector.tsx   # Shelf/location selection UI
│   │   ├── StarRating.tsx      # Star rating display component
│   │   ├── StarRatingInput.tsx # Interactive star rating input
│   │   └── GenreSelector.tsx   # Genre management interface
│   ├── library/
│   │   ├── LibraryHeader.tsx   # Library header with search and actions
│   │   ├── ActiveFilters.tsx   # Filter display and management
│   │   ├── BookViews.tsx       # Different book view modes
│   │   ├── ShelfTiles.tsx      # Shelf navigation tiles
│   │   ├── ViewModeControls.tsx # View mode switching
│   │   └── ISBNScanner.tsx     # ISBN scanning functionality
│   ├── admin/
│   │   ├── LocationManager.tsx # Admin location management
│   │   ├── LocationPermissionManager.tsx # Permission management
│   │   └── AdminUserManager.tsx # User management interface
│   ├── modals/
│   │   ├── MoreDetailsModal.tsx # Book details modal
│   │   ├── BookRelocateModal.tsx # Book relocation modal
│   │   ├── RatingModal.tsx     # Star rating modal
│   │   ├── RemovalRequestManager.tsx # Admin removal requests
│   │   └── ...                 # Other modal components
│   └── layout/
│       ├── AppLayout.tsx       # Main app layout
│       └── CookieNotice.tsx    # Privacy compliance
├── hooks/
│   ├── useBookLibrary.ts       # Library state management
│   ├── useBookActions.ts       # Book action handlers
│   ├── useBookFilters.ts       # Filter state and logic
│   └── useModal.ts            # Modal state management
└── lib/
    ├── bookApi.ts          # External book data fetching
    ├── api.ts              # Backend API communication (direct worker calls)
    ├── apiConfig.ts        # Centralized API URL configuration
    ├── types.ts            # TypeScript interfaces
    ├── theme.ts            # Material UI theme configuration
    └── permissions.ts      # Permission utilities
```

### Backend Structure
```
workers/
├── index.ts                # Main worker entry point and routing (366 lines)
├── types/
│   └── index.ts           # Shared TypeScript interfaces (77 lines)
├── cache/
│   ├── kv.ts              # KV cache manager and utilities
│   └── genres.ts          # Cached genre service
├── books/
│   ├── cached.ts          # Cached book operations (Phase 2)
│   └── google-cached.ts   # Cached Google Books API (Phase 2)
├── email/
│   └── index.ts           # Email and notification system (544 lines)
├── admin/
│   ├── index.ts           # Admin operations and signup approval (373 lines)
│   └── cached.ts          # Cached admin analytics and user management (Phase 3)
├── auth-core/
│   └── index.ts           # Core authentication functions (372 lines)
├── auth/
│   ├── index.ts           # Authentication utilities and permissions (37 lines)
│   └── cached.ts          # Cached authentication functions
├── invitations/
│   └── index.ts           # Location invitation system (271 lines)
├── admin-extended/
│   └── index.ts           # Advanced admin analytics and user management (154 lines)
├── profile/
│   └── index.ts           # User profile management (75 lines)
├── auth-utils/
│   └── index.ts           # Additional auth helper functions (35 lines)
├── locations/
│   └── index.ts           # Location and shelf management (467 lines)
├── books/
│   └── index.ts           # Book CRUD, checkout system, removal requests (742 lines)
└── tsconfig.json          # TypeScript configuration

Schema:
└── schema.sql              # Database table definitions
```

## Database Design

### Multi-User Schema
```sql
-- Users with authentication and roles
users (
  id                          TEXT PRIMARY KEY,
  email                       TEXT UNIQUE NOT NULL,
  first_name                  TEXT,
  last_name                   TEXT,
  password_hash               TEXT,
  auth_provider               TEXT DEFAULT 'google',
  email_verified              BOOLEAN DEFAULT FALSE,
  user_role                   TEXT DEFAULT 'user',  -- 'admin' or 'user'
  created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Physical locations (homes, offices, etc.)
locations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  description     TEXT,
  owner_id        TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
)

-- Shelves within locations
shelves (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  location_id     INTEGER NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id)
)

-- Books assigned to shelves
books (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn            TEXT NOT NULL,
  title           TEXT NOT NULL,
  authors         TEXT NOT NULL,    -- JSON array
  description     TEXT,
  thumbnail       TEXT,
  published_date  TEXT,
  categories      TEXT,             -- JSON array
  shelf_id        INTEGER,
  tags            TEXT,             -- JSON array
  added_by        TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id),
  FOREIGN KEY (added_by) REFERENCES users(id)
)

-- Dynamic Genre Management System
curated_genres (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  category        TEXT NOT NULL,    -- 'fiction' or 'non-fiction'
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Many-to-many relationship between books and genres
book_genres (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id         INTEGER NOT NULL,
  genre_id        INTEGER NOT NULL,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  assigned_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES curated_genres(id) ON DELETE CASCADE,
  UNIQUE(book_id, genre_id)
)

-- User-suggested genres for admin review
genre_suggestions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,    -- 'fiction' or 'non-fiction'
  suggested_by    TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  reviewed_by     TEXT,
  reviewed_at     DATETIME,
  review_comment  TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggested_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
)

-- Signup approval requests for uninvited users
signup_approval_requests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT UNIQUE NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  password_hash   TEXT NOT NULL,
  auth_provider   TEXT DEFAULT 'email',
  status          TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'denied'
  requested_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by     TEXT,                    -- Admin who reviewed
  reviewed_at     DATETIME,                -- When reviewed
  review_comment  TEXT,                    -- Admin's comment
  created_user_id TEXT,                    -- User ID after approval
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
)
```

### Design Decisions
- **Granular permission system**: Dual-tier hierarchical access control with super admin → location admin capabilities → user permissions
- **Hierarchical structure**: Users → Locations → Shelves → Books
- **Dynamic genre system**: Replaced static hardcoded genres with database-driven curated genres
- **Many-to-many relationships**: Books can have multiple genres, genres can belong to multiple books
- **Dual registration workflow**: Users with valid invitations proceed directly, uninvited users require admin approval
- **JSON columns**: SQLite supports JSON for arrays (authors, categories, tags)
- **Text storage**: ISBN as text to preserve leading zeros
- **User isolation**: Foreign key relationships ensure data ownership
- **Flexible authentication**: Supports both OAuth and email/password

## API Design

### Direct Worker Architecture

**IMPORTANT**: As of July 2025, all client-side API calls go directly to the Cloudflare Worker, bypassing Next.js API routes entirely.

- **Direct Client → Worker**: All book, profile, checkout, genre operations use `getApiBaseUrl()` and call the worker directly
- **Authentication**: Uses `Authorization: Bearer ${session?.user?.email}` headers for worker calls  
- **Environment**: Only `NEXT_PUBLIC_API_URL` is needed (removed server-side `API_URL` variable)
- **Next.js API routes**: Only used for auth flows (`/api/auth/*`) and contact form
- **Fallbacks**: localStorage fallbacks maintained for offline functionality

### RESTful Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user with email/password (supports dual workflow: invitation-based or approval-based)
- `POST /api/auth/verify` - Verify user credentials
- `GET /api/auth/verify-email` - Verify email address

#### Signup Approval System (Admin Only)
- `GET /api/signup-requests` - List pending signup approval requests
- `POST /api/signup-requests/{id}/approve` - Approve signup request and create user account
- `POST /api/signup-requests/{id}/deny` - Deny signup request with optional comment

#### User Management
- `POST /api/users` - Create/update user (OAuth and email/password)
- `GET /api/users/check` - Check if user exists (used in invitation flow)
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile

#### Invitation System
- `GET /api/invitations/details` - Get invitation details (public)
- `POST /api/invitations/accept` - Accept location invitation
- `POST /api/locations/{id}/invite` - Create location invitation (admin)
- `GET /api/locations/{id}/invitations` - List location invitations (admin)
- `DELETE /api/invitations/{id}/revoke` - Revoke invitation (admin)

#### Location Management (Admin Only)
- `GET /api/locations` - List accessible locations
- `POST /api/locations` - Create new location
- `PUT /api/locations/:id` - Update location details
- `DELETE /api/locations/:id` - Delete location

#### Shelf Management (Admin Only)
- `GET /api/locations/:id/shelves` - List shelves in location
- `POST /api/locations/:id/shelves` - Create new shelf
- `PUT /api/shelves/:id` - Update shelf name
- `DELETE /api/shelves/:id` - Delete shelf

#### Book Management (All Users)
- `GET /api/books` - List accessible books
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book location/tags
- `DELETE /api/books/:id` - Remove book

#### Genre Management (All Users)
- `GET /api/genres` - List active curated genres
- `POST /api/books/:id/genres` - Assign genre to book
- `DELETE /api/books/:id/genres/:genreId` - Remove genre from book

#### Permission Management (Super Admins & Location Admins)
- `GET /api/admin/location-admin-capabilities` - View admin capabilities for location
- `POST /api/admin/location-admin-capabilities` - Grant admin capability
- `DELETE /api/admin/location-admin-capabilities` - Revoke admin capability
- `GET /api/admin/location-user-permissions` - View user permissions for location
- `POST /api/admin/location-user-permissions` - Grant user permission
- `DELETE /api/admin/location-user-permissions` - Revoke user permission
- `GET /api/permissions/can-manage` - Check permission management access
- `GET /api/permissions/check` - Check specific permission
- `GET /api/permissions/user` - Get all user permissions for location

### Design Decisions
- **Hierarchical permission system**: Three-tier access control (super admin → location admin capabilities → user permissions)
- **Authentication**: NextAuth.js with Google OAuth and email/password
- **CORS enabled**: Allows browser requests from any origin
- **Error handling**: Consistent JSON error responses
- **Multi-user support**: User isolation and location-based access control

## Security Considerations

### Data Protection
- **HTTPS only**: Camera API requires secure context
- **CORS policy**: Configured for browser access
- **No secrets**: No API keys stored in frontend
- **Input validation**: Server-side validation of all inputs

### Privacy
- **No tracking**: No analytics or user tracking
- **Secure authentication**: Email verification and strong password requirements
- **Data export**: User owns and can export all data
- **ISBN only**: Only book ISBNs sent to external APIs
- **Role indicators**: Clear UI feedback for user permissions

## Performance Optimizations

### Frontend
- **Static generation**: Next.js optimizes bundle size
- **Code splitting**: Automatic route-based splitting
- **Image optimization**: Next.js Image component
- **Local caching**: Browser storage for offline functionality

### Backend
- **Edge computing**: Workers run close to users globally
- **Database indexes**: Optimized queries for common operations
- **Connection pooling**: D1 handles database connections
- **KV caching**: Phase 3 comprehensive caching system with 70-80% query reduction
  - Authentication and permissions (30-min TTL)
  - Book operations and metadata (10-min TTL)
  - Google Books API and external data (24-hour TTL)
  - Genre data and user preferences (1-hour TTL)
  - Admin analytics and dashboard data (1-hour TTL)
  - Proactive cache warming and performance monitoring
- **Caching**: Static assets cached via Cloudflare CDN

### Network
- **Global CDN**: Cloudflare's global network
- **HTTP/2**: Modern protocol support
- **Compression**: Automatic asset compression
- **Caching headers**: Optimized cache policies

## Deployment Architecture

### Development
```
Local Machine
├── Next.js dev server (localhost:3000)
├── Wrangler dev server (localhost:8787)
└── Local D1 database (SQLite file)
```

### Production
```
Hybrid Architecture
├── Netlify (Frontend hosting & CDN)
├── Cloudflare Workers (API endpoints)
├── Cloudflare D1 (Distributed database)
└── Resend (Email service)
```

## Monitoring and Observability

### Available Metrics
- **Workers Analytics**: Request volume, latency, errors
- **D1 Analytics**: Query performance, storage usage
- **Netlify Analytics**: Traffic, performance metrics, deployment stats
- **Real User Monitoring**: Core Web Vitals

### Logging
- **Worker logs**: Via `wrangler tail`
- **Error tracking**: Console errors and API failures
- **Performance monitoring**: Built-in Cloudflare metrics

## Scalability Considerations

### Current Limits
- **Cloudflare D1**: 25 GB storage, 5M reads, 100K writes/day
- **Cloudflare Workers**: 100K requests/day
- **Netlify**: 100 GB bandwidth/month, 300 build minutes/month
- **Resend**: 3,000 emails/month (free tier)

### Growth Strategy
- **Vertical scaling**: Upgrade to paid Cloudflare plans
- **Horizontal scaling**: Multiple databases/workers if needed
- **Caching**: Phase 3 KV caching implemented - comprehensive caching system complete
- **CDN**: Already leveraging global edge network

## Future Architecture Enhancements

### Potential Improvements
1. **Location sharing**: Invitation system for shared libraries
2. **Real-time updates**: WebSocket support for live updates
3. **Image storage**: Cloudflare Images for cover art
4. **Search enhancement**: Full-text search with enhanced filtering
5. **Mobile app**: React Native version using same API
6. **Backup integration**: Automated backups to external storage
7. **Advanced permissions**: Location-scoped user access and granular roles