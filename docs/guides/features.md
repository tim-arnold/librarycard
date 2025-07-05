# LibraryCard Features

A comprehensive overview of LibraryCard's capabilities and functionality.

## Recent Highlights

### ✅ Recently Completed
- **🔍 Enhanced Filtering System**: Clickable author names and multi-genre selection with visual filter chips
- **🔧 Admin Permission Fixes**: Regular admins can now invite users to locations they manage
- **🔐 Super Admin Role System**: Hierarchical permission structure separating global system administration from location-scoped management
- **🎯 Enhanced Duplicate Detection**: Sophisticated three-tier algorithm with publication date comparison and "Add Anyway" override
- **Global Footer**: "Contact the Librarian" feature with professional email workflow
- **Component Architecture Refactoring**: Improved maintainability and token efficiency (32-52% line reduction)
- **Organized Documentation**: Focused subdirectories (guides/, development/, deployment/, reference/)
- **Material UI Design System**: Dark mode support and WCAG-compliant accessibility
- **Role-Based Permission System**: Three-tier role hierarchy with comprehensive access controls
- **Book Checkout System**: History tracking and admin override capabilities
- **Enhanced ISBN Scanner**: Google Books API integration with improved metadata
- **Curated Genre Classification**: 26 meaningful categories for better organization
- **Book Removal Request System**: Admin approval workflows for book management

## Core Platform Features

### 📱 Book Scanning & Data Collection

#### ISBN Scanning
- **Camera Integration**: Real-time barcode scanning using device camera
- **Manual Entry**: Fallback option for damaged or unreadable barcodes
- **Multiple Sources**: Google Books API with OpenLibrary fallback
- **Enhanced Metadata**: Automatic retrieval of title, authors, description, cover images, publication dates, and categories

- **High Accuracy**: 80-90% success rate in production environments
- **Batch Processing**: Scan entire bookshelves in a single photo
- **Smart Recognition**: Identifies book spines and extracts titles/authors

### 👥 User Management & Authentication

#### Authentication Options
- **Google OAuth**: Seamless sign-in with Google accounts
- **Email/Password**: Traditional authentication with secure password requirements
- **Email Verification**: Required for account activation and security
- **Development Mode**: Mock authentication for local testing

#### Role-Based Access Control
- **Super Admin Role**: Global system administration including user role management, system analytics, and location creation/deletion
- **Admin Role**: Location-scoped management with access to assigned locations, book oversight, and user invitations
- **User Role**: Book management within assigned locations, personal library features, and basic interactions
- **Permission Enforcement**: Hierarchical server-side validation with comprehensive access control
- **Access Indicators**: Role-appropriate UI rendering hiding unavailable features based on permission level

#### User Management Features
- **Invitation System**: Admins can invite new users to shared libraries
- **Profile Management**: Users can update personal information and preferences
- **Multi-User Libraries**: Support for shared book collections across households or organizations

### 🏠 Library Organization

#### Location & Shelf Management
- **Hierarchical Structure**: Users → Locations → Shelves → Books
- **Multi-Location Support**: Organize books across different physical spaces (home, office, storage, etc.)
- **Flexible Shelving**: Create custom shelf names and organization systems
- **Smart UX**: Simplified interface automatically adapts for single-shelf users
- **Admin Controls**: Location and shelf creation restricted to admin users

#### Book Organization Features
- **Advanced Search**: Full-text search across titles, authors, and descriptions
- **Enhanced Filtering System**: Filter by location, shelf, multiple genres, checkout status with clickable author names for instant filtering
- **Visual Filter Management**: Dismissible filter chips showing all active filters with individual removal capability
- **Multi-Genre Selection**: Select multiple genres simultaneously with OR logic for comprehensive book discovery
- **Custom Tagging**: User-defined tags for personal organization (fiction, favorites, to-read, etc.)
- **Enhanced Duplicate Detection**: Sophisticated three-tier system (exact, potential, non-duplicate) with publication date comparison and user override capabilities
- **Bulk Operations**: Select and manage multiple books simultaneously

### 📚 Book Management System

#### Core Book Operations
- **Add Books**: Multiple methods (ISBN scan, photo scan, manual entry)
- **Edit Metadata**: Update book details, locations, and tags
- **Move Books**: Transfer between shelves and locations
- **Remove Books**: Delete with optional admin approval workflow

#### Checkout System
- **Borrow Tracking**: Record who has checked out which books
- **Return Management**: Simple return process with history preservation
- **Admin Override**: Administrators can manage all checkouts regardless of user
- **Checkout History**: Complete audit trail of book borrowing patterns

#### Removal Request System
- **User Requests**: Non-admin users can request book removal
- **Admin Approval**: Centralized approval workflow for book deletions
- **Request Management**: Track and respond to removal requests
- **Audit Trail**: Complete history of removal decisions

### 🎨 User Interface & Experience

#### Material UI Design System
- **Professional Appearance**: Clean, modern interface following Material Design principles
- **WCAG Compliance**: Accessibility features for users with disabilities
- **Responsive Design**: Mobile-first approach that works on all screen sizes
- **Consistent Components**: Reusable UI elements throughout the application

#### Dark Mode Support
- **Theme Toggle**: Switch between light and dark modes
- **System Preference**: Automatic theme detection based on device settings
- **Persistent Selection**: Theme choice saved across sessions
- **Full Coverage**: Dark mode support for all interface elements

#### Navigation & Usability
- **Tab-Based Navigation**: Clean separation between Add Books and Library views
- **Quick Actions**: One-click operations for common tasks
- **Contextual Menus**: Actions available based on user permissions and book status
- **Loading States**: Clear feedback during API operations

### 🔍 Advanced Features

#### Search & Discovery
- **Instant Search**: Real-time filtering as you type
- **Multi-Field Search**: Search across titles, authors, descriptions, and tags
- **Category Browsing**: Explore books by genre and subject
- **Smart Suggestions**: Relevant book recommendations based on library content

#### Data Management
- **Export Functionality**: Download complete library data in various formats
- **Import Capabilities**: Bulk import from exported data
- **Data Ownership**: Complete user control over personal library data
- **Backup Integration**: Regular data export for external backup solutions

#### Performance Optimizations
- **Component Architecture**: Modular design for fast loading and reduced resource usage
- **Lazy Loading**: On-demand loading of book images and details
- **Caching**: Intelligent caching of book metadata and API responses
- **Pagination**: Efficient handling of large book collections

## Technical Capabilities

### API Integration
- **Google Books API**: Primary source for book metadata
- **OpenLibrary API**: Fallback for missing or incomplete data
- **Resend Email API**: Professional email delivery for notifications

### Security Features
- **HTTPS Enforcement**: Secure communication for all API operations
- **Input Validation**: Server-side validation of all user inputs
- **Role Enforcement**: Database-level permission checking
- **No Data Tracking**: Privacy-focused design with no user tracking or analytics

### Deployment & Infrastructure
- **Serverless Architecture**: Cloudflare Workers for API with global edge deployment
- **CDN Integration**: Fast content delivery through Cloudflare and Netlify networks
- **Database Optimization**: Efficient queries and indexing for fast performance
- **Auto-Scaling**: Automatic resource scaling based on usage patterns

## Future Roadmap

### Planned Enhancements
- **Real-Time Updates**: WebSocket support for live library updates
- **Mobile App**: React Native version using the same API
- **Advanced Permissions**: Location-scoped access and granular role management
- **Enhanced Search**: Full-text search with advanced filtering options
- **Image Storage**: Cloudflare Images integration for custom cover art
- **Backup Automation**: Scheduled exports to external storage services

For detailed implementation history, see [CHANGELOG.md](../reference/CHANGELOG.md).