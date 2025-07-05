# Local Development Setup Guide

This guide covers the local development environment setup for LibraryCard, including isolated database configuration and development safeguards.

## Prerequisites

- Node.js and npm installed
- Wrangler CLI installed and authenticated
- Project dependencies installed (`npm install`)

## Local Development Environment

### Database Configuration

The local development environment uses a separate D1 database (`libarycard-db-local`) to avoid conflicts with production data.

**Database Details:**
- **Name**: `libarycard-db-local`
- **ID**: `0141eafd-6cf5-4053-b014-ae1556e01633`
- **Environment**: `local`

### Environment Configuration

The local environment is configured in `wrangler.toml` with:

```toml
[env.local]
[env.local.vars]
ENVIRONMENT = "local"
APP_URL = "http://localhost:3000"
FROM_EMAIL = "LibraryCard <noreply@localhost>"

[[env.local.d1_databases]]
binding = "DB"
database_name = "libarycard-db-local"
database_id = "0141eafd-6cf5-4053-b014-ae1556e01633"
```

### Frontend Configuration

The `.env.local` file is configured to use the local worker by default:

```env
# API URL for your Cloudflare Worker - Local development (default)
NEXT_PUBLIC_API_URL=http://localhost:8787

# For production testing - uncomment the line below and replace with your worker URL
# NEXT_PUBLIC_API_URL=https://your-worker-name.your-subdomain.workers.dev
```

## Development Workflow

### Starting the Development Environment

1. **Start the local worker** (in one terminal):
   ```bash
   npm run dev-worker
   # or
   npx wrangler dev --env local --port 8787
   ```

2. **Start the Next.js frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Seed the local database** (optional, for test data):
   ```bash
   npm run seed-local
   ```

### Development Safeguards

The local development environment includes several safeguards:

#### Environment Detection
- **Environment utilities** (`workers/environment.ts`) provide environment detection
- **Enhanced logging** for development environments
- **Detailed error messages** in non-production environments

#### Development Settings
- **Increased limits** for local development (more books/locations per user)
- **Test data allowed** in development environments
- **Debug logging enabled** for troubleshooting

#### Data Seeding
- **Sample users**: 
  - `developer@localhost` (admin role) - Dev User
  - `testuser@localhost` (user role) - Test User
- **Sample locations**: Home Library, Office Library  
- **Sample shelves**: Programming Books, Technical References, Management Books
- **Sample books**: The Pragmatic Programmer, Clean Code, Design Patterns

## Useful Commands

### Database Management
```bash
# Execute SQL on local database
npx wrangler d1 execute DB --env local --local --command "SELECT * FROM users"

# Execute SQL file on local database
npx wrangler d1 execute DB --env local --local --file=schema.sql

# List all databases
npx wrangler d1 list
```

### Development Scripts
```bash
# Start local worker
npm run dev-worker

# Seed local database
npm run seed-local

# Run frontend development server
npm run dev

# Build and lint check
npm run build
npm run lint
```

## Environment Variables

The local development environment uses these key environment variables:

- `ENVIRONMENT=local`
- `APP_URL=http://localhost:3000`
- `FROM_EMAIL=LibraryCard <noreply@localhost>`
- `NEXT_PUBLIC_API_URL=http://localhost:8787`

## Troubleshooting

### Common Issues

1. **Worker not starting**: Ensure no other processes are using port 8787
2. **Database connection issues**: Verify the local database was created and schema applied
3. **Frontend API errors**: Check that the worker is running on localhost:8787

### Debug Commands

```bash
# Check worker logs
npx wrangler tail --env local

# Test database connection
npx wrangler d1 execute DB --env local --local --command "SELECT 1"

# Verify environment configuration
npx wrangler dev --env local --port 8787 --inspect
```

## Next Steps

- Configure backup solutions (Phase 3)
- Add pre-commit hooks and workflow documentation (Phase 4)
- Test all configurations (Phase 5)