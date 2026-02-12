# LibraryCard Context Library

Quick reference for common tasks, constraints, and file locations.

## Common Tasks

### Adding a New Feature
1. Create Jira issue: `./scripts/jira-create-issue.sh LCWEB Task "Summary" "Description" [EPIC-KEY]`
2. Create branch: `git checkout -b LCWEB-XXX-feature-name`
3. Follow patterns in CLAUDE.md → "When Adding Features"
4. Commit with Jira reference: `git commit -m "LCWEB-XXX feat: description"`
5. Run verification: `npm run build && npm run lint`
6. Create PR via GitHub (see CLAUDE.md for PR workflow)

### Database Changes
- **Local migration**: `npm run migrate`
- **Check status**: `npm run migrate:status`
- **Dry run**: `npm run migrate:dry-run`
- **Staging/Prod**: GitHub Actions ONLY (local commands blocked)
- **Rollback (local only)**: `npm run migrate:rollback`

### Deployment
- **Local dev**: `npm run dev` (frontend) + `npx wrangler dev` (worker)
- **Staging**: Auto-deploys on push to staging branch
- **Production**: GitHub Actions "Deploy to Production" workflow ONLY

### Testing
- **Screenshot tests**: `cd testing && node screenshot.js` (requires SCREENSHOT_USER/PASSWORD in .env.local)
- **Build verification**: `npm run build`
- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`

## Critical Constraints

### Git Workflow
- ❌ NEVER commit directly to main
- ✅ ALWAYS use feature/fix branches
- ✅ Branch naming: `LCWEB-XXX-description` or `feature/name`, `fix/name`
- ✅ Commit format: `LCWEB-XXX <message>`
- ❌ NO "Co-Authored-By: Claude" or AI attribution tags

### Code Style
- ❌ NO code comments (unless explicitly requested)
- ✅ Follow existing patterns before making changes
- ✅ Maintain strict TypeScript typing
- ✅ Use Material UI design system
- ❌ NO emojis unless explicitly requested

### Jira Workflow
- Move tickets to "Testing" when complete (not "Done")
- Use comments for updates (don't edit descriptions)
- Include branch name and commit details in completion comments

## Key File Locations

### Frontend
- Components: `src/components/`
- Utilities: `src/lib/`
- Types: `src/lib/types.ts`
- API config: `src/lib/apiConfig.ts`

### Backend (Cloudflare Workers)
- Auth: `workers/auth/`
- Books: `workers/books/`
- Locations: `workers/locations/`
- OCR: `workers/ocr/`

### Database
- Schema: `schema.sql`
- Migrations: `migrations/`

### Documentation
- AI context: `CLAUDE.md`
- Architecture: `docs/development/architecture.md`
- API reference: `docs/development/api-reference.md`
- Database schema: `docs/development/database-schema.md`

### Scripts
- Jira issue creation: `scripts/jira-create-issue.sh`
- Migration runner: `scripts/migrate.js`
- Backup/restore: `scripts/auto-backup.js`, `scripts/restore-backup.js`

## Architecture Quick Facts

### API Flow (Important!)
- **Client → Worker**: ALL client-side API calls go DIRECTLY to Cloudflare Worker
- **No Next.js API routes**: Except `/api/auth/*` (NextAuth) and contact form
- **Authentication**: `Authorization: Bearer ${session?.user?.email}` headers
- **Use**: `getApiBaseUrl()` from `@/lib/apiConfig` for all worker calls

### Performance Optimizations
- Virtual scrolling for large datasets (react-window)
- React.memo on expensive components
- Code splitting with lazy loading
- 11 database indexes for sub-50ms queries
- React Query caching with field selection

### Environment Variables
Required in `.env.local`:
- `CLOUDFLARE_API_TOKEN_STAGING_NEW` - For staging operations
- `SCREENSHOT_USER` / `SCREENSHOT_PASSWORD` - For testing
- `JIRA_API_TOKEN` - For Jira automation

## EPICs (for Jira issue creation)
- `LCWEB-124` - Library Features
- `LCWEB-123` - Admin Features
- `LCWEB-122` - UX/UI
- `LCWEB-121` - DevOps

## When Things Break

### Database Issues
See: `docs/development/database-safety.md`, `docs/development/troubleshooting.md`

### Deployment Issues
See: `docs/development/deployment.md`, `docs/development/cli-safety-guide.md`

### API Issues
Check: API architecture in CLAUDE.md, `docs/development/api-reference.md`

### Worker Debugging
- Local logs: `npx wrangler tail`
- Check worker modules in `workers/` directory

---
Last updated: 2025-10-16

## How to Use This File
- Bookmark common command sequences here
- Add shortcuts for frequently referenced docs
- Update when workflow patterns change
- Keep it concise - this is for quick lookups, not comprehensive docs
