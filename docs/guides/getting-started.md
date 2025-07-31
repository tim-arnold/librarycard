# Getting Started with LibraryCard

LibraryCard is a personal book library management system that lets you scan ISBN barcodes to automatically catalog your books with location tracking and custom tagging.

## For End Users

### Sign Up & Access

1. **Visit LibraryCard**: Go to your LibraryCard instance URL
2. **Create Account**: Choose from Google OAuth or email/password registration
3. **Verify Email**: Check your inbox and click the verification link (email accounts only)
4. **Sign In**: Access your personal library dashboard

### First Steps

1. **Create Your First Location**: Set up a location like "Home Library" or "Office"
2. **Add Shelves**: Create shelves within your location (e.g., "Living Room", "Bedroom")
3. **Start Adding Books**: Use the barcode scanner or manual entry to catalog your collection

## For Developers

> **Developer Setup**: For local development and deployment, see the [Local Development Guide](../development/local-development.md)

## Using LibraryCard

### Adding Books

**ISBN Scanning** (Recommended)
1. Click "Add Books" from the main navigation
2. Select "Scan ISBN Barcode"
3. Allow camera permissions
4. Point camera at book barcode
5. Book details auto-populate from Google Books API
6. Choose location and shelf
7. Click "Add to Library"

**Manual Entry**
1. Click "Add Books" → "Manual Entry"
2. Enter ISBN number
3. Book details auto-populate
4. Choose location and shelf
5. Click "Add to Library"

## Core Features

LibraryCard is a sophisticated library management platform with comprehensive features:

### 📱 Book Scanning & Management
- **ISBN Scanning**: Camera-based barcode scanning with Google Books API integration
- **Manual Entry**: ISBN entry option with automatic book data retrieval
- **Enhanced Metadata**: Title, author, description, cover images, publication dates, and categories

### 👥 Multi-User Support
- **Authentication**: Google OAuth + email/password with email verification
- **Role-Based Permissions**: Admin and user roles with appropriate access controls
- **User Management**: Invitation system for shared libraries
- **Book Checkout System**: Track who has borrowed books with history

### 🏠 Library Organization
- **Multi-Location Support**: Organize books across different physical locations
- **Shelf Management**: Create and manage shelves within locations
- **Smart UX**: Simplified interface for single-shelf users
- **Advanced Features**: Book removal requests, pagination, duplicate detection

### 🎨 Modern Interface
- **Material UI Design**: Professional, accessible interface with WCAG compliance
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design that works on all devices
- **Search & Filtering**: Advanced book discovery and organization tools

## Browser Requirements

### Camera Access
- **HTTPS Required**: Camera only works on HTTPS or localhost
- **Permissions**: Browser will request camera access
- **Mobile Friendly**: Optimized for phone cameras

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Data Storage

### Local Development
- Data stored in browser localStorage
- Persists across browser sessions
- Export functionality available

### Production
- Data stored in Cloudflare D1 database
- Accessible from any device
- Automatic backup through Cloudflare

## Next Steps

1. **Test locally**: Try scanning a book or entering an ISBN
2. **Deploy to production**: Follow the [Cloudflare Setup Guide](./cloudflare-setup.md)
3. **Customize locations**: Update location lists in the components
4. **Add books**: Start building your digital library!

## Common Use Cases

### New Book Acquisition
1. Scan ISBN with phone camera
2. Verify book details
3. Select physical location
4. Add custom tags
5. Save to library

### Book Organization
1. Use location filter to see books by room
2. Search by title or author
3. Update book locations as needed
4. Add tags for better categorization

### Library Management
1. Export library data for backup
2. Browse by category or genre
3. Track reading progress with tags
4. Maintain physical organization

## Tips for Best Results

### Scanning
- Ensure good lighting
- Hold camera steady
- Position barcode clearly in frame
- Use manual entry if scanning fails

### Organization
- Be consistent with location names
- Use descriptive tags
- Regular data exports for backup
- Keep physical and digital libraries in sync

## Troubleshooting

See the [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.