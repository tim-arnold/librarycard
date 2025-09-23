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
- **UI Library**: Material-UI (MUI) with custom theme system
- **State Management**: React Context + useState/useEffect patterns
- **Authentication**: NextAuth.js with Google OAuth and email/password
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
- **Image Storage**: Cloudflare R2 buckets for custom book cover storage
- **AI Services**: Cloudflare AI for image verification and content validation

### External Services
- **Book Data**: Enhanced multi-source search (Google Books + OpenLibrary)
- **Advanced Search**: Intelligent relevance sorting and deduplication across sources
- **Barcode Scanning**: ZXing library (@zxing/library)
- **Email Service**: Resend for user verification
- **Authentication**: NextAuth.js with Google OAuth and email/password
- **Image Storage**: Cloudflare R2 for custom book cover storage
- **AI Image Verification**: Cloudflare AI (@cf/microsoft/resnet-50) for book cover validation

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
  - `series/` - 663 lines (series CRUD, approval workflow, book assignments)
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
├── app/                    # Next.js App Router pages
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main app entry point
│   ├── admin/                  # Admin-only pages
│   │   ├── analytics/          # Performance analytics dashboard
│   │   ├── locations/          # Location management interface
│   │   ├── notifications/      # Admin notification center
│   │   ├── reviews/            # Review moderation interface
│   │   ├── signup-requests/    # User approval workflow
│   │   └── users/              # User management dashboard
│   ├── auth/                   # Authentication pages
│   │   ├── signin/             # Sign-in page
│   │   └── reset-password/     # Password reset flow
│   ├── contact/                # Contact and support pages
│   │   ├── enterprise/         # Enterprise contact form
│   │   ├── success/            # Form submission success
│   │   └── support/            # General support contact
│   ├── library/                # Library browsing and filtering
│   │   └── [...filters]/       # Dynamic filter-based routing
│   ├── add-books/              # Book addition workflows
│   │   └── scan/               # OCR shelf scanning page
│   └── api/                    # Next.js API routes (auth only)
│       ├── auth/               # NextAuth.js authentication
│       ├── contact/            # Contact form processing
│       └── health/             # Health check endpoint
├── components/
│   ├── admin/                  # Administrative interfaces
│   │   ├── AdminAnalytics.tsx      # Performance metrics dashboard
│   │   ├── AdminDashboard.tsx      # Main admin overview
│   │   ├── AdminNotificationCenter.tsx # Admin notification management
│   │   ├── AdminSeriesReview.tsx   # Series approval workflow
│   │   ├── AdminSignupManager.tsx  # User signup approval interface
│   │   ├── AdminUserManager.tsx    # User management and role assignment
│   │   ├── GenreManager.tsx        # Genre CRUD operations
│   │   ├── GenreRequestManager.tsx # User genre suggestion review
│   │   ├── LocationManager.tsx     # Location and shelf management
│   │   ├── LocationPermissionManager.tsx # Permission assignment interface
│   │   ├── RemovalRequestManager.tsx # Book removal approval workflow
│   │   └── ReviewModerationComponent.tsx # Review content moderation
│   ├── auth/                   # Authentication components
│   │   ├── PasskeyManager.tsx      # WebAuthn passkey management
│   │   ├── PasskeySignIn.tsx       # Passkey authentication UI
│   │   ├── TOTPInput.tsx           # TOTP code input component
│   │   ├── TwoFactorSetup.tsx      # 2FA enrollment interface
│   │   └── TwoFactorVerification.tsx # 2FA authentication UI
│   ├── book/                   # Book management components
│   │   ├── AddBooks.tsx            # Main book addition coordinator
│   │   ├── AnimatedBookCover.tsx   # Animated cover transitions
│   │   ├── AnimatedCheckoutStatus.tsx # Checkout status animations
│   │   ├── BookActions.tsx         # Reusable action buttons
│   │   ├── BookGrid.tsx            # Card view display component
│   │   ├── BookList.tsx            # List view display component
│   │   ├── BookPreview.tsx         # Selected book display + editing
│   │   ├── BookSearch.tsx          # Google Books API search interface
│   │   ├── GenreSelector.tsx       # Genre assignment interface
│   │   ├── SecondaryActionsMenu.tsx # Context menu for book actions
│   │   ├── StarRating.tsx          # Star rating display component
│   │   ├── StarRatingInput.tsx     # Interactive star rating input
│   │   └── VirtualizedBookGrid.tsx # Performance-optimized large library view
│   ├── common/                 # Shared utility components
│   │   └── CoverAttribution.tsx    # Book cover source attribution
│   ├── dev/                    # Development and debugging components
│   │   └── PerformanceMonitor.tsx  # Performance monitoring and debugging
│   ├── layout/                 # Layout and navigation components
│   │   ├── AddBooksMobileBottomNav.tsx # Add books mobile navigation
│   │   ├── AppLayout.tsx           # Main application layout wrapper
│   │   ├── AppLayoutWithGlobalHeader.tsx # Layout with global header
│   │   ├── ConditionalAppLayout.tsx # Dynamic layout selection
│   │   ├── CookieNotice.tsx        # Privacy compliance banner
│   │   ├── DynamicMobileBottomNav.tsx # Viewport-aware mobile navigation
│   │   ├── Footer.tsx              # Application footer
│   │   ├── GlobalHeader.tsx        # Global navigation header
│   │   ├── MobileBottomNav.tsx     # Mobile bottom navigation
│   │   ├── MobileFilterDrawer.tsx  # Mobile filter sidebar
│   │   ├── PageContainer.tsx       # Page content wrapper
│   │   ├── ProfileSettingsMobileBottomNav.tsx # Profile mobile navigation
│   │   └── ThemeMenu.tsx           # Theme selection interface
│   ├── library/                # Library browsing and management
│   │   ├── ActiveFilters.tsx       # Active filter display and management
│   │   ├── BookCoverCapture.tsx    # Camera-based cover photo capture
│   │   ├── BookFilters.tsx         # Search and filter controls
│   │   ├── BookLibrary.tsx         # Main library display coordinator
│   │   ├── BookViews.tsx           # Different book view modes
│   │   ├── CartIndicator.tsx       # Selection cart indicator
│   │   ├── ISBNScanner.tsx         # ISBN barcode scanning
│   │   ├── LibraryHeader.tsx       # Library header with search and actions
│   │   ├── MobileSearchPanel.tsx   # Mobile search interface
│   │   ├── SelectionModeToggle.tsx # Bulk selection mode toggle
│   │   ├── ShelfSelector.tsx       # Shelf/location selection UI
│   │   ├── ViewModeControls.tsx    # View mode switching controls
│   │   └── sidebar/                # Library sidebar components
│   │       ├── LibrarySidebar.tsx      # Main sidebar container
│   │       ├── NewlyAdded.tsx          # Recently added books widget
│   │       ├── PopularBooks.tsx        # Popular books widget
│   │       └── RecentReviews.tsx       # Recent reviews activity widget
│   ├── marketing/              # Marketing and public pages
│   │   ├── forms/
│   │   │   └── ContactForm.tsx     # Contact form component
│   │   ├── layout/
│   │   │   ├── MarketingFooter.tsx # Marketing site footer
│   │   │   ├── MarketingHeader.tsx # Marketing site header
│   │   │   └── MarketingLayout.tsx # Marketing page layout
│   │   ├── pages/
│   │   │   └── HomePage.tsx        # Marketing homepage
│   │   ├── sections/
│   │   │   ├── FeatureGrid.tsx     # Feature showcase grid
│   │   │   ├── HeroSection.tsx     # Hero section component
│   │   │   └── PricingSection.tsx  # Pricing information section
│   │   └── ui/                     # Marketing UI components
│   │       ├── Button.tsx          # Marketing button component
│   │       ├── Card.tsx            # Marketing card component
│   │       ├── Container.tsx       # Marketing container component
│   │       ├── Icons.tsx           # Marketing icon set
│   │       └── Typography.tsx      # Marketing typography
│   ├── modals/                 # Modal dialog components
│   │   ├── AddBooksToSeriesModal.tsx # Series assignment modal
│   │   ├── AlertModal.tsx          # General alert dialog
│   │   ├── BookRelocateModal.tsx   # Book relocation interface
│   │   ├── BulkReviewModal.tsx     # Bulk review assignment
│   │   ├── ConfirmationModal.tsx   # Generic confirmation dialog
│   │   ├── ContactModal.tsx        # Contact form modal
│   │   ├── CoverSelectionModal.tsx # Book cover selection interface
│   │   ├── GenreEditModal.tsx      # Genre editing interface
│   │   ├── HelpModal.tsx           # Help and documentation modal
│   │   ├── Modal.tsx               # Base modal component
│   │   ├── MoreDetailsModal.tsx    # Book details and editing modal
│   │   ├── RatingModal.tsx         # Star rating assignment modal
│   │   ├── RemovalReasonModal.tsx  # Book removal reason selection
│   │   └── SeriesModal.tsx         # Series creation and editing modal
│   ├── performance/            # Performance monitoring components
│   │   ├── PerformanceDashboard.tsx # Performance metrics dashboard
│   │   └── PerformanceTracker.tsx  # Real-time performance tracking
│   ├── series/                 # Book series management
│   │   ├── SeriesBookView.tsx      # Series-specific book display
│   │   └── SeriesManager.tsx       # Series CRUD interface
│   ├── settings/               # User settings components
│   │   └── SecuritySettings.tsx    # Security and privacy settings
│   ├── tour/                   # User onboarding tour
│   │   ├── TourOverlay.tsx         # Tour overlay component
│   │   ├── TourProvider.tsx        # Tour context provider
│   │   └── TourTooltip.tsx         # Tour tooltip component
│   ├── ui/                     # Base UI components
│   │   ├── AccessibleIcon.tsx      # Accessibility-focused icon wrapper
│   │   └── SkipLink.tsx            # Keyboard navigation skip link
│   └── user/                   # User-specific components
│       └── UserNotificationCenter.tsx # User notification management
├── contexts/                   # React context providers
│   ├── BookSelectionContext.tsx    # Bulk selection state management
│   └── UserDataContext.tsx         # User data and preferences context
├── hooks/                      # Custom React hooks
│   ├── useAdminPendingCounts.ts    # Admin pending item counts
│   ├── useBookActions.ts           # Book action handlers
│   ├── useBookFilters.ts           # Filter state and logic
│   ├── useBookLibrary.ts           # Library state management
│   ├── useBookLibraryEnhanced.ts   # Enhanced library operations
│   ├── useBookLibraryOptimized.ts  # Performance-optimized library
│   ├── useBookLibraryQuery.ts      # React Query integration
│   ├── useMobileBreakpoints.ts     # Responsive breakpoint detection
│   ├── useModal.ts                 # Modal state management
│   ├── useNotifications.ts         # Notification system integration
│   ├── usePerformanceTracking.ts   # Performance monitoring hooks
│   ├── useRejectedReviewNotifications.ts # Review rejection handling
│   ├── useScrollLock.ts            # Scroll behavior management
│   └── useSeries.ts                # Series management hooks
└── lib/                        # Utility libraries and configurations
    ├── api.ts                      # Backend API communication (direct worker calls)
    ├── apiAnalytics.ts             # API usage analytics tracking
    ├── apiConfig.ts                # Centralized API URL configuration
    ├── auth-utils.ts               # Authentication utility functions
    ├── bookApi.ts                  # External book data fetching (Google Books/OpenLibrary)
    ├── contrast-checker.ts         # Accessibility contrast validation
    ├── contrastAnalysis.ts         # Color contrast analysis tools
    ├── domainConfig.ts             # Domain and environment configuration
    ├── featureFlags.ts             # Feature flag management
    ├── fieldSelection.ts           # GraphQL-style field selection for APIs
    ├── generateMarketingVariables.ts # Marketing theme variable generation
    ├── genreClassifier.ts          # Automatic genre classification
    ├── genreMatching.ts            # Genre matching algorithms
    ├── genreUtils.ts               # Genre utility functions
    ├── inputEventDebug.ts          # Input event debugging utilities
    ├── libraryUrls.ts              # Library URL generation and routing
    ├── pagination.ts               # Pagination utilities
    ├── performance.ts              # Performance monitoring utilities
    ├── permissions.ts              # Permission checking utilities
    ├── storage.ts                  # Local storage management
    ├── theme.ts                    # Material UI theme configuration
    ├── twoFactorApi.ts             # Two-factor authentication API
    ├── types.ts                    # TypeScript interfaces and types
    ├── urlUtils.ts                 # URL manipulation utilities
    └── webauthnApi.ts              # WebAuthn/Passkey API integration
```

### Backend Structure
```
workers/
├── index.ts                # Main worker entry point and routing (366 lines)
├── router.ts               # Main router configuration and middleware
├── environment.ts          # Environment variable configuration and validation
├── permissions-worker.ts   # Permission checking middleware
├── types/
│   └── index.ts           # Shared TypeScript interfaces and type definitions
├── admin/                  # Administrative operations
│   ├── index.ts           # Admin operations and signup approval (373 lines)
│   ├── cached.ts          # Cached admin analytics and user management
│   └── router.ts          # Admin route definitions and handlers
├── admin-extended/         # Extended admin functionality
│   └── index.ts           # Advanced admin analytics and user management (154 lines)
├── admin-migration/        # Admin data migration utilities
│   └── index.ts           # Database migration tools and utilities
├── analytics/              # Analytics and tracking
│   └── openLibraryAnalytics.ts # OpenLibrary API usage analytics
├── auth/                   # Authentication and authorization
│   ├── index.ts           # Authentication utilities and permissions (37 lines)
│   ├── cached.ts          # Cached authentication functions
│   ├── jwt.ts             # JSON Web Token utilities
│   ├── rate-limiter.ts    # Authentication rate limiting
│   ├── router.ts          # Authentication route handlers
│   ├── totp.ts            # Time-based One-Time Password (TOTP) implementation
│   ├── two-factor.ts      # Two-factor authentication logic
│   └── webauthn.ts        # WebAuthn/Passkey authentication
├── auth-core/              # Core authentication functions
│   └── index.ts           # Core authentication functions (372 lines)
├── auth-utils/             # Authentication utility functions
│   └── index.ts           # Additional auth helper functions (35 lines)
├── books/                  # Book management and operations
│   ├── index.ts           # Book CRUD, checkout system, removal requests (742 lines)
│   ├── cached.ts          # Cached book operations and performance optimization
│   ├── google-cached.ts   # Cached Google Books API integration
│   ├── loc-cached.ts      # Library of Congress cached operations
│   ├── images.ts          # R2 image storage and management
│   ├── imageVerification.ts # Cloudflare AI image verification
│   └── router.ts          # Book-related route handlers
├── cache/                  # Caching layer and utilities
│   ├── kv.ts              # Cloudflare KV cache manager and utilities
│   └── genres.ts          # Cached genre service and operations
├── csrf/                   # Cross-Site Request Forgery protection
│   └── index.ts           # CSRF token generation and validation
├── email/                  # Email and notification services
│   └── index.ts           # Email and notification system (544 lines)
├── errors/                 # Error handling and reporting
│   └── index.ts           # Centralized error handling and logging
├── genres/                 # Genre management
│   └── index.ts           # Genre CRUD operations and classification
├── in-app-notifications/   # In-application notification system
│   └── index.ts           # Real-time notification delivery and management
├── invitations/            # User invitation system
│   └── index.ts           # Location invitation system (271 lines)
├── locations/              # Location and shelf management
│   ├── index.ts           # Location and shelf management (467 lines)
│   └── router.ts          # Location-related route handlers
├── notification-preferences/ # User notification preferences
│   └── index.ts           # Notification preference management
├── notifications/          # Notification delivery system
│   └── index.ts           # Notification processing and delivery
├── permissions/            # Permission and access control
│   └── index.ts           # Permission checking and role management
├── privacy/                # Privacy and data protection
│   └── index.ts           # Privacy settings and GDPR compliance
├── profile/                # User profile management
│   ├── index.ts           # User profile management (75 lines)
│   └── router.ts          # Profile-related route handlers
├── series/                 # Book series management
│   ├── index.ts           # Series CRUD, approval workflow, book assignments (663 lines)
│   └── router.ts          # Series-related route handlers
├── user-privacy/           # User-specific privacy controls
│   └── index.ts           # Individual user privacy management
├── utils/                  # Utility functions and helpers
│   └── domainConfig.ts    # Domain configuration and routing utilities
└── validation/             # Input validation and sanitization
    └── index.ts           # Request validation and data sanitization

Configuration:
├── tsconfig.json          # TypeScript configuration
└── wrangler.toml          # Cloudflare Workers configuration

Database Schema:
├── schema.sql             # Main database table definitions
└── migrations/            # Database migration files (40+ migrations)
    ├── 20250901_add_privacy_system.sql         # Privacy and user display system
    ├── 20250902_add_complete_series_system.sql # Book series management system
    ├── 20250903_add_can_create_series_permission.sql # Series permissions
    ├── 20250813_add_notification_system.sql   # In-app notification system
    ├── 20250805_webauthn_passkeys_implementation.sql # WebAuthn/Passkey support
    ├── 20250801_security_authentication_upgrade.sql # Authentication security
    ├── 20250816_add_book_notes_feature.sql     # Book notes and annotations
    ├── add_custom_cover_support.sql            # Custom book cover support
    ├── add_book_cover_selection.sql            # Book cover selection system
    ├── add_book_checkout_system.sql            # Book checkout functionality
    ├── add_book_rating_system.sql              # Star rating system
    ├── add_book_removal_requests.sql           # Book removal workflow
    ├── add_invitation_system.sql               # User invitation system
    ├── add_signup_approval_system.sql          # Admin signup approval
    ├── add_user_roles.sql                      # Role-based access control
    ├── archive/                                # Historical migration archive
    └── [30+ additional migration files]        # Performance, features, security
```

## Database Architecture

LibraryCard uses **Cloudflare D1** (distributed SQLite) with a sophisticated multi-user schema supporting hierarchical organization, advanced authentication, and content management workflows.

### Core Design Principles
- **Hierarchical Organization**: Users → Locations → Shelves → Books
- **Multi-User Architecture**: Role-based access control with user isolation
- **Content Moderation**: Admin approval workflows for user-generated content
- **Advanced Authentication**: Multiple auth methods with 2FA and WebAuthn support
- **Performance Optimization**: Strategic indexing and efficient query patterns
- **Data Integrity**: Comprehensive foreign key relationships and constraints

### Key Schema Components
- **User Management**: Authentication, roles, permissions, and privacy settings
- **Content Organization**: Locations, shelves, books with metadata and custom covers
- **Advanced Features**: Series management, checkout system, rating system
- **Security Systems**: Two-factor auth, WebAuthn/passkeys, audit trails
- **Communication**: In-app notifications, approval workflows, email integration

For detailed table definitions and relationships, see **[Database Schema Documentation](./database-schema.md)**

## API Architecture

LibraryCard uses a **sophisticated Cloudflare Workers API** with modular routers, comprehensive authentication, and performance-optimized caching. The API serves a React frontend with direct worker calls for optimal performance.

### Core API Principles
- **Direct Worker Architecture**: Client-side calls bypass Next.js API routes and go directly to Cloudflare Workers
- **Modular Router System**: Specialized routers for authentication, books, admin, locations, profiles, and series
- **Advanced Security**: CSRF protection, rate limiting, JWT authentication, and secure error handling
- **Performance Optimization**: Extensive KV caching with intelligent invalidation strategies
- **Multi-Authentication**: Email/password, Google OAuth, 2FA/TOTP, and WebAuthn/Passkeys support

### API Features
- **80+ Endpoints**: Comprehensive REST API covering all application functionality
- **Role-Based Access**: Three-tier permission system (super admin → location admin → user)
- **Content Moderation**: Admin approval workflows for user-generated content
- **Real-Time Features**: In-app notification system with preference management
- **Developer Tools**: Health checks, analytics, debug endpoints, and monitoring

### Key Router Modules
- **AuthRouter**: Authentication, 2FA, WebAuthn, password management
- **BooksRouter**: Book CRUD, checkout system, ratings, image management
- **AdminRouter**: Analytics, user management, content moderation
- **LocationsRouter**: Location/shelf management, invitation system
- **ProfileRouter**: User profiles, dashboard, notification preferences
- **SeriesRouter**: Book series with approval workflows

For complete endpoint documentation, authentication flows, and integration examples, see **[API Design Documentation](./api-design.md)**

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

## Advanced Features

### Series Management System
Allows users to organize books into custom collections with admin approval workflows. Features include:
- **Custom Groupings**: "Science Fiction", "Book Club Picks", "To Read", etc.
- **Approval Workflow**: Content moderation and admin oversight
- **Visual Organization**: Color coding and clickable series filtering
- **Hierarchical Access**: Admin approval required for public visibility

### Photo Book Cover System
AI-powered custom book cover uploads with Cloudflare integration:
- **Camera Integration**: Mobile-optimized photo capture with cropping tools
- **AI Verification**: Cloudflare AI ensures uploaded images are book covers
- **Cloud Storage**: R2 storage with global CDN distribution
- **Smart Processing**: WebP/JPEG optimization and metadata extraction

### Advanced Authentication
Multi-layered security system supporting:
- **Traditional Auth**: Email/password with secure hashing
- **OAuth Integration**: Google sign-in with seamless account linking
- **Two-Factor Auth**: TOTP-based 2FA with backup recovery codes
- **WebAuthn/Passkeys**: Modern passwordless authentication

### Real-Time Features
- **In-App Notifications**: Real-time notification system with user preferences
- **Activity Feeds**: Privacy-aware user activity with display controls
- **Content Moderation**: Admin approval workflows for user-generated content


## Mobile Enhancement Architecture

### Dynamic Viewport Management
**DynamicMobileBottomNav Component**:
- Real-time visual viewport height tracking
- Automatic toolbar positioning adjustments
- Support for dynamic browser UI changes (address bar hiding/showing)
- Transform animations for smooth repositions
- Safe area inset compliance for modern devices

**Technical Implementation**:
- Visual Viewport API integration with fallbacks
- Debounced viewport change detection (60fps)
- CSS transform-based positioning
- Environment variable responsive breakpoints

### Mobile Navigation Enhancements
**Features**:
- Touch-optimized button sizes (44px minimum)
- Keyboard navigation support with arrow keys
- Screen reader accessibility improvements
- Haptic-like visual feedback with scale animations
- Progressive enhancement for feature detection

## Future Architecture Enhancements

### Potential Improvements
1. **Location sharing**: Invitation system for shared libraries
2. **Real-time updates**: WebSocket support for live updates
3. **Image storage**: Cloudflare Images for cover art
4. **Search enhancement**: Full-text search with enhanced filtering
5. **Mobile app**: React Native version using same API
6. **Backup integration**: Automated backups to external storage
7. **Advanced permissions**: Location-scoped user access and granular roles
8. **Smart series**: Auto-populate series based on rules (author, genre, etc.)