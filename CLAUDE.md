# LibraryCard AI Assistant Context

This file contains AI-specific context and working preferences for Claude Code when working on LibraryCard.

**Project Resources**: [Active Todos](./docs/reference/TODO.md) • [Change History](./docs/reference/CHANGELOG.md) • [Architecture Guide](./docs/development/architecture.md) • [Getting Started](./docs/guides/getting-started.md) • [Performance Optimization Complete](./docs/specs/completed/performance-optimization-plan-COMPLETE.md)

## Project Context for AI

**What is LibraryCard**: Personal library management platform with ISBN scanning, Google Books API integration, and multi-user support  
**Architecture**: Next.js frontend on Netlify + Cloudflare Workers API + D1 database  
**Tech Stack**: TypeScript, Material UI, NextAuth.js, Google Books API  
**Environment**: Development with mock auth, production with email verification

## AI Development Guidelines

### Code Style & Patterns
- **Follow existing patterns**: Always examine surrounding code and imports before making changes
- **No comments**: Never add code comments unless explicitly requested
- **Component architecture**: Use the modular component pattern established in the codebase
- **TypeScript**: Maintain strict typing throughout the application
- **Material UI**: Follow the established design system and theme patterns

### Testing & Quality Assurance
- **Screenshot testing**: Use `cd testing && node screenshot.js` for UI verification
- **Build verification**: Always run `npm run build` and `npm run lint` after changes
- **Environment setup**: Screenshots require `SCREENSHOT_USER` and `SCREENSHOT_PASSWORD` in `.env.local`

### Development Workflow
- **Branch-based development**: ALL work must be done on feature/fix/enhancement branches
- **Never work directly on main**: Direct commits to main branch are prohibited
- **Pull request required**: All changes must be submitted via pull request for review
- **Branch naming conventions**:
  - **For GitHub issues**: `feature/gh{issue-number}-{feature-name}` (e.g., `feature/gh39-worker-deployment-strategy`)
  - **For bugs from issues**: `fix/gh{issue-number}-{bug-description}` (e.g., `fix/gh42-user-login-error`)
  - **For non-issue work**: `feature/{feature-name}`, `fix/{bug-description}`, `enhancement/{improvement-name}`
  - Always use kebab-case for branch names and keep descriptions concise but descriptive

### Commit Guidelines
- **Commit messages**: Use clear, descriptive messages without AI tool attribution
- **No co-authoring**: Never include "Co-Authored-By: Claude" or similar
- **Focused commits**: Make atomic commits for single features/fixes

### Codebase Navigation
- **Frontend**: `src/components/` for React components, `src/lib/` for utilities
- **Backend**: `workers/` with modular structure (auth/, books/, locations/, ocr/)
- **Documentation**: `docs/` with organized subdirectories for different content types
- **Database**: `schema.sql` for schema, `migrations/` for changes

### Development Commands
```bash
# Local development
npm run dev                    # Frontend development server
npx wrangler dev              # Local worker development

# Screenshot testing  
cd testing && node screenshot.js

# Build verification
npm run build
npm run lint

# Worker deployment
npm run deploy:staging               # ⚠️ DEPRECATED - staging auto-deploys via GitHub Actions
npm run deploy:staging-new           # ⚠️ DEPRECATED - staging auto-deploys via GitHub Actions  
npm run deploy:prod                  # ⚠️ BLOCKED - redirects to GitHub Actions for safety

# Database migrations  
npx wrangler d1 execute librarycard-db-staging-new --file=migrations/migration.sql --env=staging-new --remote  # ⚠️ Use GitHub Actions instead
npm run migrate:prod                 # ⚠️ BLOCKED - redirects to GitHub Actions for safety

# Database backup operations (Phase 2)
npm run backup:create                # Create manual production backup
npm run backup:list                  # List all available backups  
npm run backup:verify                # Verify backup integrity
npm run backup:restore               # Emergency database restore (EXTREME CAUTION)

# Environment validation
npm run validate:env                 # Validate environment before production operations

# Required Environment Variables (.env.local):
# CLOUDFLARE_API_TOKEN_STAGING_NEW=your-token  # For staging environment in new isolated account
# SCREENSHOT_USER=test-username                # For screenshot testing  
# SCREENSHOT_PASSWORD=test-password            # For screenshot testing

# CRITICAL SAFETY NOTES (Updated Phase 3 - GitHub Actions Required):
# - PRODUCTION DEPLOYMENT: MUST use GitHub Actions workflows (local commands blocked for safety)
# - STAGING DEPLOYMENT: Auto-deploys via GitHub Actions on staging branch push (manual commands deprecated)
# - Production: GitHub Actions "Deploy to Production (Enhanced Safety)" workflow ONLY
# - All production operations require manual GitHub Actions trigger + confirmation
# - Production scripts include automated backups and validation
# - Local direct wrangler commands are blocked for production environment
# - Staging manual deployment commands are deprecated - use auto-deploy workflow instead
```

## Current Technical State

**Performance**: ✅ **ENTERPRISE-GRADE** - Complete 5-phase optimization delivering 70%+ faster load times, 95%+ faster filters, 90%+ faster queries  
**Scalability**: ✅ **10,000+ BOOKS** - Virtual scrolling, code splitting, and database optimizations support large institutional libraries  
**Monitoring**: ✅ **CORE WEB VITALS** - Real-time performance tracking with LCP, INP/FID, CLS, FCP, TTFB measurement and alerting  
**Component Architecture**: Highly optimized with React.memo, memoized event handlers, virtual scrolling for large datasets  
**Backend Structure**: Modular workers with separated concerns (auth, books, locations, ocr) + performance-optimized database indexes  
**API Architecture**: All client-side API calls go directly to Cloudflare Worker with React Query caching, field selection, and batching  
**Authentication**: NextAuth.js with Google OAuth + email/password  
**Database**: Multi-user schema with role-based permissions + 11 performance indexes for sub-50ms queries  
**OCR**: Google Vision API integration for bookshelf photo scanning  
**Bundle Optimization**: 35%+ reduction through lazy-loaded admin components and intelligent code splitting  

### API Architecture Details

**IMPORTANT**: As of July 2025, all client-side API calls go directly to the Cloudflare Worker, bypassing Next.js API routes entirely.

- **Client → Worker**: All book, profile, checkout, genre operations use `getApiBaseUrl()` and hit worker directly
- **Authentication**: Uses `Authorization: Bearer ${session?.user?.email}` headers for worker calls
- **Environment**: Only `NEXT_PUBLIC_API_URL` is needed (removed `API_URL` server-side variable)
- **Next.js API routes**: Only used for auth flows (`/api/auth/*`) and contact form
- **Fallbacks**: localStorage fallbacks maintained for offline functionality

When adding new features:
- Use `getApiBaseUrl()` from `@/lib/apiConfig` for all worker API calls
- Avoid creating new Next.js API routes unless absolutely necessary for auth flows
- Include proper Bearer token authentication for all worker requests

## AI Task Patterns

### When Adding Features
1. Examine existing components for patterns
2. Check `package.json` for available libraries
3. Follow the established component architecture
4. Update TypeScript interfaces in `src/lib/types.ts`
5. Run build and lint verification

### When Debugging
1. Check browser console for client-side errors
2. Use `npx wrangler tail` for worker logs
3. Verify database schema matches expectations
4. Test with screenshot automation if UI-related

### When Refactoring
1. Maintain existing component boundaries
2. Preserve established patterns and conventions
3. Update imports consistently
4. Verify no functionality changes with testing

---

**Last updated**: June 2025