# Development Workflow Guide

This guide outlines the complete development workflow for LibraryCard, including local setup, branch management, backup procedures, and deployment processes.

## Quick Start

### 1. Initial Setup
```bash
# Clone repository
git clone https://github.com/your-username/librarycard.git
cd librarycard

# Install dependencies
npm install

# Set up local environment
cp .env.example .env.local
# Edit .env.local with local API URL

# Start local development
npm run dev-worker  # Terminal 1
npm run dev         # Terminal 2
```

### 2. Development Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test locally
npm run build  # Verify build
npm run lint   # Check linting

# Commit and push
git add .
git commit -m "feat: your feature description"
git push -u origin feature/your-feature-name

# Create pull request on GitHub
gh pr create --title "feat: your feature" --body "Description"
```

## Branch Management

### Branch Naming Conventions
- **Features**: `feature/gh[issue#]-description` (e.g., `feature/gh31-user-metrics`, `feature/gh45-book-ratings`)
- **Bug fixes**: `fix/gh[issue#]-description` (e.g., `fix/gh12-auth-bug`, `fix/gh23-isbn-scanner`)
- **Enhancements**: `enhancement/gh[issue#]-description` (e.g., `enhancement/gh56-ui-improvements`)
- **Documentation**: `docs/gh[issue#]-description`
- **Refactoring**: `refactor/gh[issue#]-description`
- **Performance**: `perf/gh[issue#]-description`

### Branch Protection Rules
🚨 **IMPORTANT**: Never work directly on the `main` branch!

1. **All work must be done on feature branches**
2. **Pull requests required** for all changes to main
3. **Code review recommended** for significant changes
4. **Build must pass** before merging
5. **Delete feature branches** after merging

### Example Workflow
```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch with GitHub issue number
git checkout -b feature/gh42-add-book-ratings

# Work on feature
# ... make changes ...

# Test locally
npm run dev        # Test functionality
npm run build      # Verify build
npm run lint       # Check code quality

# Commit changes
git add .
git commit -m "feat: add book rating system

- Add star rating component
- Implement rating storage
- Add rating display in book cards"

# Push and create PR
git push -u origin feature/gh42-add-book-ratings
gh pr create --title "feat: add book rating system" \
             --body "Implements 5-star rating system for books"

# After PR approval and merge
git checkout main
git pull origin main
git branch -d feature/gh42-add-book-ratings
```

## Local Development Environment

### Environment Configuration
LibraryCard uses isolated local development with separate database:

- **Local Database**: `libarycard-db-local`
- **Local Worker**: `http://localhost:8787`
- **Local Frontend**: `http://localhost:3000`

### Starting Development
```bash
# Terminal 1: Start local worker
npm run dev-worker
# or: npx wrangler dev --env local --port 8787

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Seed local database (optional)
npm run seed-local
```

### Development Commands
```bash
# Database management
npm run seed-local                    # Seed with test data
npx wrangler d1 list                 # List databases
npx wrangler d1 execute DB --env local --local --command "SELECT * FROM books"

# Development servers
npm run dev                          # Frontend development server
npm run dev-worker                   # Worker development server

# Testing and validation
npm run build                        # Build production bundle
npm run lint                         # ESLint checking
npm run typecheck                    # TypeScript checking
```

### Test User Accounts
Local seeding creates these test accounts:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `adminuser@localhost` | `Admin123!` | admin | Development testing |
| `testuser@localhost` | `Test123!` | user | User role testing |
| `superadmin@localhost` | `Super123!` | superadmin | Super admin testing |

## Code Quality Standards

### Pre-commit Checklist
Before committing code, ensure:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes without errors
- [ ] `npm run typecheck` passes
- [ ] Code follows existing patterns
- [ ] No console.log statements in production code
- [ ] No hardcoded personal URLs or credentials

### Commit Message Format
Follow conventional commits:
```
type(scope): description

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```bash
git commit -m "feat: add book checkout system"
git commit -m "fix: resolve ISBN scanning timeout issue"
git commit -m "docs: update API reference for new endpoints"
```

## Deployment Process

### Staging-First Development Workflow

**Recommended branch workflow**:
```
feature/gh31-my-feature → staging (for testing)
feature/gh31-my-feature → main (after testing passes)
```

#### Why NOT merge staging → main:
- **Staging pollution** - Staging may accumulate test data, experimental configs, or temporary fixes
- **Merge conflicts** - If multiple features are tested in staging simultaneously  
- **History clarity** - Feature commits should come directly from feature branches to main
- **Staging-specific changes** - Like seed scripts, which are staging infrastructure

#### Best Practice Workflow:
1. **Create feature branch** from `main`
2. **Deploy to staging** for testing (merge or push to staging branch)
3. **After testing passes** → merge feature branch directly to `main`
4. **Auto-deploy main** to production
5. **Keep staging** as a persistent testing environment

### Development Deployment
1. **Local Testing**: Test thoroughly in local environment
2. **Build Verification**: Ensure `npm run build` succeeds
3. **Push to Feature Branch**: Push changes to feature branch
4. **Deploy to Staging**: Test in staging environment first
5. **Create Pull Request**: Use GitHub PR for code review
6. **Merge to Main**: After approval, merge feature branch directly to main

### Staging Environment
**Purpose**: Integration testing and staging-specific tooling
- **Frontend**: `https://staging--libarycard.netlify.app/`
- **Worker**: `https://librarycard-api-staging.tim-arnold.workers.dev`
- **Database**: `librarycard-db-staging`
- **Auto-deployment**: Triggered by pushes to `staging` branch

**Test Accounts**:
| Email | Password | Role |
|-------|----------|------|
| `superadmin@staging.localhost` | `Super123!` | super_admin |
| `adminuser@staging.localhost` | `Admin123!` | admin |
| `testuser@staging.localhost` | `Test123!` | user |

**Staging Data Management**:
```bash
# Reset staging environment with fresh test data
node scripts/seed-staging-data.js
```

### Production Deployment
Production deployment is automatic via:
- **Netlify**: Automatically deploys from `main` branch
- **Cloudflare Workers**: Auto-deployed via GitHub Actions on push to `main`

**Manual deployment** (if needed):
```bash
# Manual worker deployment to production
npx wrangler deploy --env production
```

## Backup Procedures

### Automated Backups
- **Netlify**: Daily automated backup via GitHub Actions
- **Cloudflare**: Daily automated backup via GitHub Actions
- **Retention**: Backups stored as GitHub Releases

### Manual Backup Commands
```bash
# Frontend backup
./scripts/backup-netlify.sh

# Cloudflare backup (Workers + D1)
./scripts/backup-cloudflare.sh

# D1 data backup (run after Cloudflare backup)
./backups/cloudflare-*/backup-d1-data.sh
```

### Backup Contents
**Netlify Backup**:
- Complete source code
- Build artifacts (.next)
- Configuration files
- Deployment metadata

**Cloudflare Backup**:
- Worker source code
- Database schema
- Configuration files
- Migration files
- Database statistics

## Environment Management

### Environment Variables
**Local Development** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**Production** (Netlify Dashboard):
- `NEXT_PUBLIC_API_URL`: Your Cloudflare Worker URL

**Worker Secrets** (Cloudflare):
- API keys and sensitive configuration

### Never Use .env.production Files
❌ **Don't**: Create `.env.production` files
✅ **Do**: Use platform dashboards for production variables

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection Issues**:
```bash
# Check local database
npx wrangler d1 list
npx wrangler d1 execute DB --env local --local --command "SELECT 1"
```

**Worker Not Starting**:
```bash
# Check port availability
lsof -i :8787
# Kill process if needed, then restart
npm run dev-worker
```

### Debug Commands
```bash
# Worker logs
npx wrangler tail --env local

# Database inspection
npx wrangler d1 execute DB --env local --local --command ".tables"

# Environment check
npx wrangler dev --env local --port 8787 --inspect
```

## Security Best Practices

### Code Security
- **No hardcoded secrets**: Use environment variables
- **No personal URLs**: Use generic placeholders in docs
- **Input validation**: Validate all user inputs
- **Error handling**: Don't expose sensitive errors

### Development Security
- **Local isolation**: Use separate local database
- **Safe defaults**: Default to local development URLs
- **Backup encryption**: Secure backup storage
- **Access control**: Limit production access

## Best Practices

### Code Organization
- **Follow existing patterns**: Match established code style
- **Component modularity**: Keep components focused and small
- **Error boundaries**: Handle errors gracefully
- **TypeScript**: Maintain strict typing

### Performance
- **Build optimization**: Monitor bundle size
- **Database queries**: Use efficient queries with indexes
- **Caching**: Leverage browser and CDN caching
- **Image optimization**: Use Next.js Image component

### Maintenance
- **Regular updates**: Keep dependencies current
- **Monitor logs**: Check for errors and issues
- **Backup verification**: Test restore procedures
- **Documentation**: Keep docs updated with changes

## Support and Resources

### Documentation
- [Local Development Setup](./local-development.md)
- [API Reference](./api-reference.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Architecture Overview](./architecture.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers)
- [Netlify Documentation](https://docs.netlify.com)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler)

### Getting Help
1. Check troubleshooting guide first
2. Review recent commit history for similar issues
3. Check worker logs with `wrangler tail`
4. Test in clean local environment
5. Create detailed issue reports with logs

---

This workflow ensures reliable, secure, and maintainable development practices for LibraryCard.