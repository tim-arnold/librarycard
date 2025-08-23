# LibraryCard Development Todos

This file tracks active development tasks and future enhancements for the LibraryCard project.

> **Note**: For completed features and fixes, see [CHANGELOG.md](./CHANGELOG.md)

## ✅ Recently Completed (August 2025)

### OpenLibrary API Optimization - LCWEB-135 - COMPLETE!
- [x] **Phase 1: Cover Selection Optimization**: Implemented smart conditional fetching (only call OpenLibrary if <3 Google Books covers)
- [x] **Phase 2: Smart Gap Detection**: Created intelligent metadata analysis to reduce API calls by 70-80% while maintaining quality
- [x] **Phase 3: Analytics & Monitoring**: Built comprehensive tracking system for API usage, optimization effectiveness, and performance metrics
- [x] **Phase 4: Documentation**: Created complete implementation guide and troubleshooting documentation
- [x] **Scalability Impact**: Increased supported organizations from ~10 to 30-50+ with same API quota through 70%+ API call reduction
- [x] **Quality Preservation**: Maintained or improved metadata quality through intelligent targeting of OpenLibrary enhancement
- [x] **Real-time Monitoring**: Added admin analytics endpoint for tracking optimization effectiveness and API usage patterns

## ✅ Recently Completed (July 2025)

### Enhanced Location Management with Default Permissions - GitHub Issues #88 & #127 - COMPLETE!
- [x] **Default Permissions System**: Implemented comprehensive default permissions system with database schema, API endpoints, and UI integration
- [x] **LocationOnboardingStepper**: Created guided 4-step location creation process (Details, Shelves, Permissions, Review) with proper UX flow
- [x] **PermissionsStep Component**: Built reusable permissions selection component for admin capabilities and user permissions setup
- [x] **LocationManager UI Enhancement**: Replaced card grid with Material-UI List components for better scalability and mobile responsiveness
- [x] **Default Permissions Editing**: Integrated default permissions management into LocationPermissionManager for existing locations
- [x] **React Rendering Bug Fix**: Resolved critical issue where database integer boolean values (0/1) rendered as "0" text in UI
- [x] **Permission Auto-Application**: Implemented automatic default permission assignment for new users via admin assignment and invitations
- [x] **UX Improvements**: Enhanced deletion animations, disabled accidental modal dismissal, improved permission labels and layout
- [x] **Database Migration**: Created `location_default_permissions` table with proper relationships and API integration
- [x] **API Security**: Secured all default permissions endpoints with proper authentication and permission validation

### Staging Environment Database Seeding Improvements - GitHub Issue #123 - COMPLETE!
- [x] **SQL Compatibility Fix**: Resolved SQL formatting incompatibilities between local SQLite and Cloudflare D1 remote API execution
- [x] **Database Clearing Enhancement**: Fixed foreign key constraint errors with proper PRAGMA handling and table dependency management
- [x] **Constraint Error Resolution**: Eliminated UNIQUE constraint failures by implementing INSERT OR REPLACE patterns throughout
- [x] **Local Improvements Porting**: Successfully ported all local development seeding enhancements to staging environment
- [x] **Genre System Integration**: Added comprehensive 45-genre seeding system with proper foreign key relationships
- [x] **Location Membership Management**: Implemented clean location access system with all users having access to all staging locations
- [x] **Script Execution Reliability**: Fixed interactive confirmation loops and "0 queries executed" failures with proper SQL formatting
- [x] **Safety Documentation**: Created comprehensive database safety guidelines preventing accidental production operations
- [x] **Comprehensive Data Coverage**: Staging now includes 3 users, 3 locations, 6 shelves, 45+ books matching local development scope

### Pagination State Preservation During Book Updates - GitHub Issue #118 - COMPLETE!
- [x] **Root Cause Identification**: Identified pagination reset issue in `useBookFilters.ts` where book data changes triggered pagination reset
- [x] **Logic Separation**: Separated filter/sort pagination reset from book data update pagination preservation
- [x] **Enhanced Validation**: Added safeguard to prevent current page from exceeding available pages after book updates
- [x] **Comprehensive Testing**: Verified fix works across all book view modes and update operations (covers, ratings, genres, checkout)
- [x] **User Experience**: Preserved pagination state during book modifications while maintaining filter-based reset behavior
- [x] **Edge Case Handling**: Graceful handling of pagination when filtered results change due to book updates

### Local Development Environment Enhancement - GitHub Issue #88 - COMPLETE!
- [x] **Environment Variable Template**: Updated `.env.example` with comprehensive examples including local development user credentials
- [x] **Genre Seeding System**: Implemented robust 45-genre seeding system (25 fiction + 20 non-fiction) with proper foreign key relationships
- [x] **Database Reset Enhancement**: Enhanced database clearing to prevent constraint conflicts on subsequent seeding runs
- [x] **Foreign Key Resolution**: Fixed genre assignment issues by using actual superadmin user instead of non-existent 'system' user
- [x] **Streamlined Book Seeding**: Removed problematic ratings seeding that caused foreign key constraint failures
- [x] **Comprehensive Local Setup**: Created complete development environment with 4 users, 3 locations, 6 shelves, and 60 books
- [x] **Optimized Performance**: Reduced seeding script execution to ~60 seconds with proper error handling and progress reporting

### Single Shelf Location Setting - GitHub Issue #84 - COMPLETE!
- [x] **Location Settings Modal**: Added single shelf location checkbox to location edit dialog with proper permission-based access control
- [x] **Database Schema**: Implemented `single_shelf_location` boolean field with default false and performance index migration
- [x] **Permission Integration**: Required `can_manage_location_settings` capability for location setting modifications
- [x] **Smart UI Behavior**: Disabled single shelf checkbox when location already has multiple shelves with explanatory help text
- [x] **Authentication Architecture Fix**: Consistently use `getApiBaseUrl()` throughout codebase, removing deprecated `API_BASE` constants
- [x] **Permission Granularity**: Only users with specific location settings capability can modify location settings
- [x] **Frontend Security**: Hide edit buttons for unauthorized admins and validate shelf count before enabling single shelf mode
- [x] **Backend Validation**: Enhanced `updateLocation` function with capability-based permission checks in workers/locations/index.ts
- [x] **Code Cleanup**: Removed unused imports from LocationPermissionManager.tsx improving bundle size and maintainability

### Enhanced Filtering System with Author Clicks and Multi-Genre Support - COMPLETE!
- [x] **Author Click Filtering**: Implemented clickable author names across all book views (card, compact, list) to enable filtering by author
- [x] **Author Filter Integration**: Click any author to filter library showing only books by that author with automatic clearing of other filters
- [x] **Multi-Genre Filter System**: Enhanced genre filtering with multi-select support allowing selection of multiple genres simultaneously
- [x] **Visual Filter Chips**: Added comprehensive dismissible filter chips system for all active filters (author, shelf, genre, location, status)
- [x] **Individual Chip Removal**: Each filter appears as color-coded chip with individual removal capability for granular control
- [x] **OR Logic Genre Filtering**: Multiple selected genres show books matching any of the selected genres for comprehensive discovery
- [x] **UI Polish**: Added text overflow ellipsis to genre chips in book cards (120px max-width) for consistent layout

### Enhanced Book Features - Bulk Operations (Phases 1-3) - COMPLETE!
- [x] **Multi-Select Capability**: Created comprehensive multi-select functionality in search results for both ISBN scan and search workflows
- [x] **Bulk Book Addition**: Implemented bulk adding with shared shelf selector and unified action buttons for efficient book management
- [x] **Shopping Cart UX**: Built shopping cart-style interface with selection mode toggle and bulk review modal for intuitive user experience
- [x] **Selection State Management**: Added persistent selection state across search pagination and component re-renders
- [x] **Bulk Review Interface**: Created dedicated bulk review modal showing all selected books with individual removal capability
- [x] **Unified Workflow**: Integrated bulk operations seamlessly into existing book addition workflow with clear visual feedback

### Admin Location Invitation Permissions Fix - COMPLETE!
- [x] **Permission System Fix**: Fixed "permission denied" errors for regular admins trying to invite users to locations they manage
- [x] **Enhanced Permission Logic**: Replaced restrictive ownership-only checks with comprehensive `canManageLocation()` function
- [x] **Location Management Consistency**: Aligned invitation permissions with other location management operations
- [x] **Multi-Role Support**: Regular admins can now invite users to locations they are assigned to manage, not just locations they own
- [x] **Invitation System Enhancement**: Applied fix to create, view, and revoke invitation operations for consistent behavior
- [x] **Error Message Improvements**: Enhanced error messages to clearly indicate permission requirements

### Admin User Interface Improvements - COMPLETE!
- [x] **Enhanced Location Display**: Admin user list now shows actual location names for single location users instead of "1 locations"
- [x] **Intelligent Display Logic**: Maintains count display for multiple locations (e.g., "2 locations", "3 locations") 
- [x] **Backend Enhancement**: Updated SQL queries to include location names using GROUP_CONCAT for comprehensive data
- [x] **Frontend Logic**: Created formatLocationDisplay function for smart display based on location count
- [x] **Real-time Updates**: Ensured immediate UI updates when locations are assigned/removed through existing refresh pattern
- [x] **User Experience**: Improved admin workflow with clearer location information at a glance

## ✅ Recently Completed (June 2025)

### Backend Modularization & Code Organization - COMPLETE!
- [x] **Massive Worker File Refactoring**: Extracted 1,985 lines from monolithic `workers/index.ts` into 8 specialized modules
- [x] **Token Efficiency Achievement**: Reduced main worker file from 2,351 to 366 lines (84% reduction) for AI development
- [x] **Email Module Creation**: Built comprehensive `workers/email/index.ts` (544 lines) with Resend/Postmark integration
- [x] **Admin Module Organization**: Split admin functionality into core operations (373 lines) and extended analytics (154 lines)
- [x] **Authentication Separation**: Separated core auth functions (372 lines) from utilities (37 lines) and helpers (35 lines)
- [x] **Invitation System Module**: Extracted complete invitation system (271 lines) with email validation and admin controls
- [x] **Profile Module**: Created focused user profile management module (75 lines) with dynamic field validation
- [x] **Module Architecture**: Established clear separation of concerns with proper TypeScript imports/exports
- [x] **Build Verification**: Ensured all modules compile successfully with no TypeScript errors
- [x] **Import Resolution**: Fixed module boundary conflicts and authentication utility imports
- [x] **Maintainability Enhancement**: Created foundation for efficient future development with well-organized codebase

### Enhanced Book Features - Star Rating System - COMPLETE!
- [x] **Library-Specific Star Rating System**: Implemented complete location-scoped star rating system with user ratings and library averages
- [x] **Database Schema**: Added book_ratings table with user ratings, reviews, and rating calculation columns
- [x] **Star Rating Components**: Created StarRating display component with 3 variants (display, mini, chip) for space-efficient UI
- [x] **Interactive Rating Input**: Built StarRatingInput component with hover effects and clear functionality
- [x] **Rating Modal Interface**: Developed RatingModal with book details, star input, and optional text reviews
- [x] **API Endpoints**: Implemented POST /api/books/{id}/rate and rating calculation with location-specific averages
- [x] **UI Integration**: Integrated ratings into all book views (Grid, Compact, List) with progressive disclosure design
- [x] **Google Books Separation**: Separated library ratings from Google Books ratings (Google ratings only in "More Details" modal)
- [x] **UX Design**: No empty stars shown initially, click-to-rate functionality, optional text reviews displayed in More Details

### Enhanced Duplicate Book Detection System - COMPLETE!
- [x] **Sophisticated Duplicate Detection**: Implemented three-tier duplicate detection algorithm (exact, potential, non-duplicate)
- [x] **Publication Date Comparison**: Added publication year comparison for accurate edition distinction
- [x] **ISBN Mismatch Handling**: Enhanced logic to prevent false positives when books have different ISBNs
- [x] **Add Anyway Functionality**: Created confirmation modal for potential duplicate override with detailed warnings
- [x] **False Positive Resolution**: Fixed issues with different editions being incorrectly flagged as duplicates
- [x] **User Experience Enhancement**: Improved duplicate status indicators and user feedback system

### Admin Dashboard & Management System - COMPLETE!
- [x] **Complete Admin Dashboard**: Implemented comprehensive admin dashboard with analytics, user management, and notification center
- [x] **Admin Analytics**: Created AdminAnalytics.tsx with location overview, user activity stats, and system metrics
- [x] **User Management**: Built AdminUserManager.tsx with comprehensive user management and permission controls
- [x] **Notification Center**: Developed AdminNotificationCenter.tsx for checkout reminders and removal request notifications
- [x] **Admin Integration**: Integrated all admin components into main app navigation for admin users only

### Data Quality & Duplicate Prevention - COMPLETE!
- [x] **Duplicate Location Fix**: Resolved duplicate locations issue for admin users who are both owners and members
- [x] **Duplicate Books Fix**: Fixed duplicate books appearing in admin dropdowns and lists due to multiple user roles
- [x] **Database Query Optimization**: Implemented DISTINCT queries in getUserLocations and getUserBooks
- [x] **Admin Interface Cleanup**: Optimized admin book and location data fetching for cleaner interface

### Genre System Refinements - COMPLETE!
- [x] **Genre Chip Restoration**: Restored genre chip display on book cards after user feedback
- [x] **Dropdown/Filter Separation**: Separated dropdown generation logic from filtering logic for better management
- [x] **Enhanced Genre Filtering**: Improved genre filtering to find books with Fantasy in OpenLibrary subjects
- [x] **Genre System Balance**: Optimized balance between dropdown simplicity and comprehensive search

### OCR Feature Removal - COMPLETE!
- [x] **Strategic Decision**: Removed OCR bookshelf scanning feature due to reliability issues and complexity concerns
- [x] **Frontend Cleanup**: Removed BookshelfScanner component and all OCR-related state from AddBooks.tsx
- [x] **Code Simplification**: Eliminated ~700+ lines of OCR-related code for better maintainability
- [x] **User Experience Focus**: Streamlined book addition to two reliable methods (ISBN scanning and search)
- [x] **Resource Reallocation**: Development focus shifted to Enhanced Book Features multi-select system

### Google OAuth Invitation Support - COMPLETE!
- [x] **Google OAuth Invitation Flow**: Implemented complete Google OAuth support for invitation acceptance workflow
- [x] **Authentication Choice**: Enhanced sign-in page to offer all authentication options for invited users
- [x] **Seamless Integration**: Added automatic invitation token handling in Google OAuth callback URLs
- [x] **User Experience**: Created smooth invitation acceptance flow without requiring email/password registration
- [x] **Authentication Reliability**: Fixed critical user creation bugs and verification status management
- [x] **Invitation System Robustness**: Enhanced invitation revocation with verification checks and error handling

### Admin Signup Approval System - COMPLETE!
- [x] **Database Schema Enhancement**: Created signup_approval_requests table with comprehensive tracking fields
- [x] **Dual Registration Workflow**: Implemented invitation-based vs approval-based registration paths
- [x] **Admin Approval Interface**: Built AdminSignupManager component with table-based request management
- [x] **Email Notification System**: Added admin notifications for new requests and user notifications for decisions
- [x] **API Endpoints**: Created complete approval workflow with get, approve, and deny endpoints
- [x] **User Experience Enhancement**: Modified signup form to handle pending approval states with clear messaging
- [x] **Security Implementation**: Added role-based access control and duplicate prevention
- [x] **Error Handling**: Implemented graceful email notification failures to prevent approval flow disruption

### Privacy Compliance & Cookie Notice System - COMPLETE!
- [x] **Cookie Consent Banner**: Implemented comprehensive "We value your privacy" cookie notice with customizable consent options
- [x] **Granular Consent Categories**: Created essential vs functional cookie categories with detailed explanations
- [x] **Privacy Policy Page**: Built complete privacy policy explaining data collection, storage, and user rights
- [x] **Storage Utility System**: Created consent-aware storage utilities that respect user preferences
- [x] **Component Integration**: Updated all localStorage usage across components to use new consent-aware storage system
- [x] **User Experience**: Designed non-intrusive bottom banner with expand/collapse options and clear messaging

### Admin Tab Consolidation & UI Simplification - COMPLETE!
- [x] **Redundant Tab Removal**: Removed main navigation tabs (Locations, Requests) for admin users that duplicated admin dashboard functionality
- [x] **Navigation Simplification**: Simplified admin main navigation to: Libraries, Add Books, Admin Dashboard for cleaner user experience
- [x] **Session Storage Updates**: Enhanced legacy tab handling to automatically redirect users with saved 'locations' or 'requests' tabs to admin dashboard
- [x] **Functionality Preservation**: Ensured all location/request management remains accessible through centralized admin dashboard
- [x] **Code Organization**: Improved organization by removing duplicate imports and tab rendering logic

### Super Admin Role System - COMPLETE!
- [x] **Database Schema Enhancement**: Added super_admin role to user_role column with migration path
- [x] **Permission System Implementation**: Created comprehensive role-based permission checking functions
- [x] **API Security Updates**: Protected global functions with super admin checks while maintaining admin location-scoped access
- [x] **Frontend Permission Integration**: Implemented role-based UI components and permission hooks throughout application
- [x] **Role Migration**: Successfully promoted designated users to super admin with SQL commands
- [x] **Permission Boundary Testing**: Validated all role boundaries and permission enforcement
- [x] **Codebase Consistency**: Updated all role checking logic to use centralized permission functions

### User Invitation System Refactoring - PARTIALLY COMPLETE!
- [x] **Phase 1**: Moved invitation management from LocationManager to AdminUserManager component
- [x] **Phase 3**: Added enhanced features (bulk invitations, location selection, improved status tracking)
- [ ] **Phase 2**: Implement global invitation overview across all locations with filtering and search
- [ ] **Phase 4**: Create new API endpoints for admin-level invitation management and analytics

### Complete Password Reset System - COMPLETE!
- [x] **Database Migration**: Added password_reset_token and password_reset_expires fields to users table
- [x] **Backend API Endpoints**: Implemented forgot password, token verification, and password reset endpoints
- [x] **Enhanced Sign-in Page**: Added "Forgot Password?" functionality with professional UI
- [x] **Password Reset Page**: Created professional password reset page with token validation
- [x] **Email Templates**: Built professional email templates with security warnings and 1-hour expiration
- [x] **Security Upgrades**: Upgraded password hashing from SHA-256 to PBKDF2 (100,000 iterations)
- [x] **Backward Compatibility**: Maintained compatibility with existing password hashes
- [x] **Security Features**: Implemented no user enumeration, one-time tokens, and password reuse prevention

### Search Result Pagination & UX Enhancements - COMPLETE!
- [x] **Pagination State Preservation**: Implemented complete state preservation across book search workflow - users return to exact same page after adding/cancelling book selections
- [x] **Progressive Loading**: Enhanced search results to show 40 books with progressive loading (10 initially, "Load more" for additional batches)
- [x] **Smart Autoscroll**: Added autoscroll functionality that takes users to newly added books marked as "Book Added!" in search results
- [x] **Cancel Workflow Enhancement**: Created autoscroll to cancelled books when returning from book selection screen for seamless navigation
- [x] **State Management Architecture**: Moved search results state to parent component for persistence across component re-renders
- [x] **Auto-search Prevention**: Prevented unwanted auto-search triggers when returning from cancelled book selections
- [x] **Technical Infrastructure**: Enhanced BookSearch component with comprehensive prop interface and robust scroll effect system

## Active Development Todos

### High Priority - Next Session Focus

- [x] **Dynamic Genre Management System - COMPLETE!** (See [detailed plan](../specs/complete/genre-classifier-plan.md))
  - [x] Transform static genre classification into dynamic, user-manageable system
  - [x] Create global curated_genres table with admin-controlled genre creation
  - [x] Implement interactive genre selection in Add Books workflow
  - [x] Add many-to-many book-genre relationships with auto-suggestion support
  - [x] Migrate existing enhanced_genres data to new flexible system

- [ ] **Additional Admin Features**
  - [ ] User permission granularity (allow users to delete books, add/delete shelves, etc.)
  - [ ] Add bulk actions for admin users (bulk book approval, multi-user invitations, etc.)

### Low Priority - Future Enhancements

- [ ] **User Invitation System Refactoring - Remaining Phases** (See [detailed plan](../specs/user-invitation-refactor-plan.md))
  - [ ] **Phase 2**: Implement global invitation overview across all locations with filtering and search
  - [ ] **Phase 4**: Create new API endpoints for admin-level invitation management and analytics

- [ ] **Future Admin Enhancements**
  - [ ] Implement automated email notifications for admin actions
  - [ ] Add configurable notification preferences for admin users
  - [ ] Expand notification system with more detailed reporting features

---

**Last updated**: July 2025