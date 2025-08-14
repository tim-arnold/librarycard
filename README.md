# LibraryCard 📚

A personal book collection management app that allows you to scan ISBN barcodes to automatically add books to your digital library.

## Features

- 📱 **ISBN Scanning**: Use your phone's camera to scan book barcodes
- 📖 **Book Management**: Automatically fetch book details from Google Books API
- 🏠 **Location Tracking**: Tag books with physical locations (basement, rooms, etc.)
- 🏷️ **Custom Tags**: Add your own tags for better organization
- 🔍 **Search & Filter**: Find books by title, author, location, or category
- 📊 **Library Overview**: See distribution of books across locations
- 💾 **Export**: Download your library as JSON

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Scanning**: ZXing library for barcode detection
- **Database**: Cloudflare D1 (SQLite)
- **API**: Cloudflare Workers
- **Hosting**: Netlify (Frontend) + Cloudflare Workers (API)
- **Book Data**: Google Books API + OpenLibrary fallback

## Deployment

### Prerequisites

1. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. Authenticate with Cloudflare: `wrangler login`

### Database Setup

1. Create a D1 database:
   \`\`\`bash
   wrangler d1 create librarycard-db
   \`\`\`

2. Update \`wrangler.toml\` with your database ID

3. Initialize the database schema:
   \`\`\`bash
   wrangler d1 execute librarycard-db --file=./schema.sql
   \`\`\`

### Worker Deployment

1. Deploy the API worker:
   \`\`\`bash
   cd workers
   wrangler deploy
   \`\`\`

2. Note the worker URL for frontend configuration

### Frontend Deployment

1. Create \`.env.local\`:
   \`\`\`
   NEXT_PUBLIC_API_URL=https://api.librarycard.tim52.io
   \`\`\`

2. Build the frontend:
   \`\`\`bash
   npm run build
   \`\`\`

3. Deploy to Cloudflare Pages:
   - Connect your GitHub repo to Cloudflare Pages
   - Set build command: \`npm run build\`
   - Set output directory: \`out\` (if using static export)
   - Add environment variable: \`NEXT_PUBLIC_API_URL\`

## Local Development

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up local database with sample data:
   \`\`\`bash
   cp .env.example .env.local
   node scripts/setup-local-db.js
   \`\`\`

3. Start development servers:
   \`\`\`bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Worker API
   npx wrangler dev --local
   \`\`\`

The setup script will automatically:
- Initialize the database schema
- Apply all migrations
- Seed with sample users, locations, and 60 books

## Component Architecture

The app features a modular component architecture for improved maintainability:

### Book Management Components
- **AddBooks.tsx** - Main coordinator for adding books to the library
- **ISBNScanner.tsx** - Camera barcode scanning and manual ISBN entry
- **BookSearch.tsx** - Google Books API search and results display
- **BookPreview.tsx** - Selected book display with editing capabilities
- **ShelfSelector.tsx** - Location and shelf selection interface

### Library Display Components  
- **BookLibrary.tsx** - Main coordinator for viewing the library
- **BookGrid.tsx** - Card-based grid view for books
- **BookList.tsx** - Compact list view for books
- **BookActions.tsx** - Reusable action buttons (checkout, delete, etc.)
- **BookFilters.tsx** - Search and filtering controls

This modular approach reduces token usage for AI development assistance and improves code maintainability.

## Book Locations

Locations and shelves are managed dynamically through the admin interface. The app supports multiple locations with role-based permissions for:
- Admin users: Can create/manage locations and shelves
- Regular users: Can add books to existing shelves

## Contributing

This is a personal project, but feel free to fork and adapt for your own use!

Update to trigger a build again, and again, and again, and again