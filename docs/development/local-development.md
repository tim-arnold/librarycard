# Local Development Guide

This guide covers setting up LibraryCard for local development, including both frontend and backend components.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Wrangler CLI**: For Cloudflare Workers development

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/tim-arnold/librarycard.git
cd librarycard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 4. Environment Configuration

```bash
cp .env.example .env.local
```

For local development, use:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Development Modes

### Frontend Only (localStorage)

For UI development without backend:

```bash
npm run dev
```

- App runs at `http://localhost:3000`
- Uses localStorage for data persistence
- No database or API required
- Good for testing UI changes

### Full Stack Development

For complete functionality with local database:

#### Terminal 1: Start Frontend
```bash
npm run dev
```

#### Terminal 2: Start Worker API
```bash
npm run dev-worker
# or manually: npx wrangler dev --env local --port 8787
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:8787`
- Uses local SQLite database
- Full feature testing

## Database Setup (Local)

⚠️ **Important**: Use the automated setup process documented in [Local Development Setup Guide](./local-development-setup.md) for the complete isolated local environment.

### Quick Setup

The project now includes automated local database setup:

```bash
# Start local worker (uses local database automatically)
npm run dev-worker

# Seed local database with test data
npm run seed-local
```

### Test User Accounts

After seeding, you can log in with these test accounts:

| Email | Password | Role | Name | Purpose |
|-------|----------|------|------|---------|
| `developer@localhost` | *(No password - use magic link)* | admin | Dev User | Admin testing and development |
| `testuser@localhost` | *(No password - use magic link)* | user | Test User | Regular user testing |

**Note**: Local development uses email verification tokens for authentication. Check the worker logs for magic login links when testing authentication.

### Manual Database Setup

If you need to manually create the local database:

```bash
# Create local D1 database (done automatically in setup)
npx wrangler d1 create libarycard-db-local

# Apply schema (production-synchronized)
npx wrangler d1 execute DB --env local --local --file=schema.sql
```

The local environment configuration is already set up in `wrangler.toml`:

```toml
[env.local]
[env.local.vars]
ENVIRONMENT = "local"
APP_URL = "http://localhost:3000"

[[env.local.d1_databases]]
binding = "DB"
database_name = "libarycard-db-local"
database_id = "5365a633-7869-4993-990a-90aa12e9974e"
```

## Development Workflow

### Typical Development Session

1. **Start both servers**:
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run dev-worker
   ```

2. **Make changes** to code
3. **Test in browser** at `http://localhost:3000`
4. **Check API logs** in the wrangler terminal
5. **Commit changes** when ready

### Hot Reloading

- **Frontend**: Automatic reload on file changes
- **Workers**: Automatic reload on worker code changes
- **Database**: Schema changes require manual reapplication

## Testing Features

### Automated Screenshot Testing

Puppeteer script for UI testing and documentation:

```bash
# Setup (first time only)
# Add to .env.local:
# SCREENSHOT_USER=your-email@domain.com
# SCREENSHOT_PASSWORD=your-password

# Run screenshots
cd testing
node screenshot.js
```

**Captures:**
- Login screen (`testing/screenshots/login-screen_TIMESTAMP.png`)
- Signin page (`testing/screenshots/signin-screen_TIMESTAMP.png`)
- Authenticated library view (`testing/screenshots/library-screen_TIMESTAMP.png`)

**Features:**
- Timestamped filenames prevent conflicts
- Automated email/password authentication
- Full-page screenshots for documentation
- Error debugging with failure screenshots

### Camera Scanning

Camera scanning works on localhost:

1. Open `http://localhost:3000`
2. Click "Start Camera Scanner"
3. Allow camera permissions
4. Test with any book barcode

### API Testing

Test API endpoints directly:

```bash
# Get all books
curl http://localhost:8787/api/books

# Add a book
curl -X POST http://localhost:8787/api/books \
  -H "Content-Type: application/json" \
  -d '{"isbn":"9780451524935","title":"1984","authors":["George Orwell"]}'
```

### Database Testing

Query local database:

```bash
# List all books
npx wrangler d1 execute DB --env local --local --command="SELECT * FROM books;"

# Count books
npx wrangler d1 execute DB --env local --local --command="SELECT COUNT(*) FROM books;"

# Check seeded data
npx wrangler d1 execute DB --env local --local --command="SELECT COUNT(*) as count, 'users' as table_name FROM users"
```

## Common Development Tasks

### Adding New Features

1. **Frontend changes**: Edit files in `src/`
2. **API changes**: Edit `workers/index.ts`
3. **Database changes**: Update `schema.sql` and reapply
4. **Styling**: Edit `src/app/globals.css`

### Debugging

#### Frontend Debugging
- Use browser developer tools
- Console logs appear in browser console
- React DevTools for component debugging

#### API Debugging
- Worker logs appear in wrangler terminal
- Add `console.log()` statements in worker code
- Use `wrangler tail` for production debugging

#### Database Debugging
- Query database directly with wrangler commands
- Check schema with: `PRAGMA table_info(books);`
- Inspect data with: `SELECT * FROM books LIMIT 5;`

### Code Style

The project uses TypeScript with strict mode:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

### Database Migrations

When updating schema:

1. **Update** `schema.sql`
2. **Apply to local database**:
   ```bash
   # Apply schema changes to local database
   npx wrangler d1 execute DB --env local --local --file=schema.sql
   
   # Or recreate database completely if needed
   npx wrangler d1 delete libarycard-db-local
   npx wrangler d1 create libarycard-db-local
   # Update database_id in wrangler.toml, then apply schema
   ```

## File Structure for Development

```
librarycard/
├── src/                    # Frontend code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/              # Utility functions
├── workers/               # Backend code
│   └── index.ts          # Worker API
├── testing/               # Test utilities
│   ├── screenshot.js     # Puppeteer screenshot script
│   └── screenshots/      # Generated screenshots
├── docs/                  # Documentation
│   ├── development/      # Technical documentation
│   ├── deployment/       # Infrastructure guides
│   ├── guides/           # User guides
│   └── reference/        # Project tracking
├── .env.local            # Local environment variables
├── wrangler.toml         # Worker configuration
└── schema.sql            # Database schema
```

## Performance Testing

### Local Performance
- Use browser DevTools Performance tab
- Monitor API response times in Network tab
- Check database query performance

### Load Testing
```bash
# Simple load test for API
for i in {1..100}; do
  curl -s http://localhost:8787/api/books > /dev/null &
done
wait
```

## Troubleshooting Development Issues

### Common Problems

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

#### Camera Not Working
- Ensure you're using `http://localhost:3000` (not 127.0.0.1)
- Check browser permissions
- Try in incognito mode

#### Database Connection Issues
```bash
# Reset local database
npx wrangler d1 execute DB --env local --local --command="DROP TABLE IF EXISTS books;"
npx wrangler d1 execute DB --env local --local --file=schema.sql

# Or recreate from scratch
npm run seed-local
```

#### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. **Check logs**: Both browser console and wrangler terminal
2. **Verify setup**: Ensure all prerequisites are installed
3. **Clean install**: Delete node_modules and reinstall
4. **Check versions**: Ensure Node.js and npm are up to date

## Deployment Testing

Before deploying to production:

1. **Test locally** with production API URL
2. **Run type checking**: `npm run typecheck`
3. **Run linting**: `npm run lint`
4. **Test build**: `npm run build`
5. **Test worker deployment**: `wrangler deploy --dry-run`

## Development Best Practices

### Code Organization
- Keep components small and focused
- Use TypeScript interfaces for type safety
- Follow React hooks best practices
- Organize imports consistently

### Database Practices
- Always use prepared statements
- Add indexes for frequently queried fields
- Keep schema changes documented
- Test migrations locally first

### API Development
- Return consistent error formats
- Include CORS headers
- Validate all inputs
- Use appropriate HTTP status codes

### Version Control
- Commit frequently with descriptive messages
- Use feature branches for major changes
- Keep .env files out of version control
- Document breaking changes in commit messages