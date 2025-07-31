# LibraryCard Deployment Guide

Complete deployment procedures for LibraryCard across all environments.

## Environment Structure

We use a clean three-environment deployment strategy:

### Local Development
- **Frontend**: `http://localhost:3000`
- **Worker**: `librarycard-api-local` (local only)
- **Database**: `libarycard-db-local` 
- **Usage**: Development and testing

### Staging
- **Frontend**: `https://staging--libarycard.netlify.app/`
- **Worker**: `librarycard-api-staging`
- **Database**: `librarycard-db-staging`
- **Usage**: Pre-production testing and validation
- **Auto-deployment**: Triggered by pushes to `staging` branch

### Production
- **Frontend**: `https://librarycard.tim52.io/`
- **Worker**: `librarycard-api-production`
- **Database**: `librarycard-db`
- **Usage**: Live production environment
- **Auto-deployment**: Triggered by pushes to `main` branch

## Deployment Commands

### Local Development
```bash
# Start local development server
npm run dev

# Start local worker (in separate terminal)
npx wrangler dev
```

### Staging Deployment

**Phase 3 Enhancement**: Enhanced staging workflow with isolated Cloudflare account for better production safety.

#### Enhanced GitHub Actions Staging Workflow
1. **Go to**: GitHub Actions → "Deploy to Staging (Enhanced Safety)" workflow
2. **Click**: "Run workflow"
3. **Select deployment type**:
   - `worker-only`: Deploy only the Cloudflare Worker
   - `database-migration`: Run database migration only
   - `full-deployment`: Deploy worker + run migration
4. **Execute**: Click "Run workflow"

#### Enhanced Features
- 🔒 **Isolated environment**: Separate Cloudflare account for staging
- ✅ **Smoke tests**: Automated post-deployment verification
- 📊 **Production readiness**: Report on deployment status
- 🔄 **Safe testing**: No impact on production environment

#### Frontend Deployment
```bash
# Deploy frontend - automatic via GitHub push to staging branch
git push origin staging
```

#### Health Check Verification
```bash
# Verify staging deployment
curl https://librarycard-api-staging.tim-arnold.workers.dev/health
```

#### Alternative Local Commands (Legacy)
⚠️ **Note**: Direct wrangler commands still work for staging but enhanced workflow is recommended:
```bash
# Legacy staging deployment (still supported)
npx wrangler deploy --env=staging

# Legacy database migration (still supported)
npx wrangler d1 execute librarycard-db-staging --file=migrations/your-migration.sql --env=staging --remote
```

### Production Deployment

⚠️ **CRITICAL SAFETY NOTE**: As of Phase 3 Production Safety Enhancements, production deployments MUST use GitHub Actions workflows.

🚨 **LOCAL PRODUCTION ACCESS BLOCKED**: The `npm run deploy:prod` and `npm run migrate:prod` commands now block and redirect to GitHub Actions for security.

#### Required GitHub Actions Workflow for Production

1. **Go to GitHub Actions**: https://github.com/tim-arnold/libarycard/actions
2. **Select "Deploy to Production (Enhanced Safety)"** workflow
3. **Click "Run workflow"** (manual trigger required)
4. **Select deployment type**:
   - `worker-only`: Deploy only the Cloudflare Worker
   - `database-migration`: Run database migration only
   - `full-deployment`: Deploy worker + run migration
5. **Type `CONFIRM-PRODUCTION`** in the confirmation field
6. **Click "Run workflow"** to execute

#### Enhanced Safety Features
- ✅ Pre-deployment staging verification
- ✅ Automatic production backup creation
- ✅ Multi-step confirmation process
- ✅ Rollback instructions provided
- ✅ Audit logging of all production changes

#### Frontend Deployment
```bash
# Frontend deploys automatically via Netlify on main branch push
git push origin main
```

#### Health Check Verification
```bash
# Verify production deployment
curl https://librarycard-api-production.tim-arnold.workers.dev/health
```

## Deployment Methods

### Frontend (Netlify)
- **Staging**: Automatic on pushes to `staging` branch
- **Production**: Automatic on pushes to `main` branch
- **Build command**: `npm run build`
- **Output directory**: `.next`

### Backend (Cloudflare Workers)
- **Staging**: Enhanced GitHub Actions workflow (isolated staging account)
- **Production**: ⚠️ **GITHUB ACTIONS ONLY** - Manual local deployment blocked for security
- **Local production access**: Permanently disabled in Phase 3 safety enhancements

### Database Migrations
- **Staging**: Available via enhanced GitHub Actions workflow
- **Production**: ⚠️ **GITHUB ACTIONS ONLY** - Manual execution required via workflow dispatch
- **Safety features**: Automatic backups, pre-migration validation, rollback procedures

## Database Migration Workflow

### 1. Develop Locally
```bash
# Test migration locally first
npx wrangler d1 execute libarycard-db-local --file=migrations/new-migration.sql
```

### 2. Test on Staging
```bash
# Deploy to staging database
npx wrangler d1 execute librarycard-db-staging --file=migrations/new-migration.sql --env=staging --remote

# Deploy staging worker if needed
npx wrangler deploy --env=staging

# Test functionality on staging environment
```

### 3. Deploy to Production

⚠️ **PHASE 3 SAFETY**: Direct wrangler commands blocked. Use GitHub Actions:

1. **Go to**: https://github.com/tim-arnold/libarycard/actions
2. **Select**: "Deploy to Production (Enhanced Safety)"
3. **Choose**: `database-migration` deployment type
4. **Confirm**: Type `CONFIRM-PRODUCTION`
5. **Execute**: Click "Run workflow"

**Enhanced Safety Features**:
- ✅ Automatic pre-deployment backup
- ✅ Migration validation
- ✅ Rollback instructions provided
- ✅ Production environment isolation

## GitHub Actions Deployment Workflows

**Phase 3 Enhancement**: Enhanced safety workflows with isolated environments and multi-layer protection.

### Staging Environment (Enhanced)
1. **Go to**: GitHub Actions → "Deploy to Staging (Enhanced Safety)" workflow
2. **Click**: "Run workflow"
3. **Select deployment type**: `worker-only`, `database-migration`, or `full-deployment`
4. **Execute**: Click "Run workflow"
5. **Features**: Isolated staging Cloudflare account, smoke tests, production readiness reporting

### Production Environment (Enhanced Safety)
1. **Go to**: GitHub Actions → "Deploy to Production (Enhanced Safety)" workflow
2. **Click**: "Run workflow" (manual trigger required)
3. **Select deployment type**: `worker-only`, `database-migration`, or `full-deployment`
4. **Confirm**: Type `CONFIRM-PRODUCTION` (required)
5. **Execute**: Click "Run workflow"
6. **Safety features**: 
   - Pre-deployment staging verification
   - Automatic production backup creation
   - Multi-step confirmation process
   - Rollback instructions provided
   - Audit logging

### Important Phase 3 Changes
- ❌ **No automatic production deployments**: All production changes require manual workflow triggers
- ❌ **Local production access blocked**: `npm run deploy:prod` and `npm run migrate:prod` redirect to GitHub Actions
- ✅ **Enhanced staging isolation**: Separate Cloudflare account for staging environment
- ✅ **Multi-layer safety**: Confirmations, backups, validation, and rollback procedures

## Verification Steps

After deployment:

### Frontend Verification
1. **Test the site**: Visit your deployment URL
2. **Check camera access**: Ensure HTTPS works for camera API
3. **Test ISBN scanning**: Try scanning a book barcode
4. **Test library view**: Ensure books display properly

### Backend Verification
1. **Health check**: 
   - Staging: `curl https://librarycard-api-staging.tim-arnold.workers.dev/health`
   - Production: `curl https://librarycard-api-production.tim-arnold.workers.dev/health`
2. **API connection**: Verify books save to database
3. **Authentication**: Test login/logout flows
4. **Database queries**: Verify data operations work
5. **Phase 3 Enhanced**: GitHub Actions workflows provide automated smoke tests

### Full Integration Test
1. **Add a book**: Test complete book addition workflow
2. **View library**: Ensure books display correctly
3. **Search functionality**: Test search and filtering
4. **Export data**: Verify export functionality works

## Troubleshooting

### Build Failures

#### Frontend Build Issues
```bash
# Node.js version mismatch
# Solution: Check netlify.toml has correct Node version

# Missing dependencies
# Solution: Ensure package.json includes all dependencies

# TypeScript errors
# Solution: Run npm run typecheck locally first
```

#### Worker Build Issues
**Phase 3 Note**: Use GitHub Actions workflows for reliable deployments

```bash
# For staging: Use enhanced GitHub Actions workflow (recommended)
# Legacy option: npx wrangler deploy --env=staging

# For production: MUST use GitHub Actions workflow
# Direct wrangler commands are blocked for security

# Missing wrangler.toml configuration
# Solution: Verify environment sections exist
```

### Runtime Issues

#### API Connection Problems
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check CORS headers in your Cloudflare Worker
- Test API endpoint directly
- Verify worker deployment succeeded

#### Database Connection Issues
```bash
# Check database connection
npx wrangler d1 execute [database-name] --command="SELECT 1;" --env=[environment] --remote

# Verify binding in wrangler.toml
```

#### Frontend Issues
- **Camera not working**: Ensure site is served over HTTPS (automatic on Netlify)
- **Environment variables**: Check browser network tab for API calls
- **Build artifacts**: Clear browser cache and test

## Environment Information

### Worker URLs
| Environment | Worker URL |
|-------------|------------|
| Local | `http://localhost:8787` (via wrangler dev) |
| Staging | `https://librarycard-api-staging.tim-arnold.workers.dev` |
| Production | `https://librarycard-api-production.tim-arnold.workers.dev` |

### Database IDs
| Environment | Database Name | Database ID |
|-------------|---------------|-------------|
| Local | `libarycard-db-local` | `5365a633-7869-4993-990a-90aa12e9974e` |
| Staging | `librarycard-db-staging` | `eb3d7f44-754e-4354-a3ce-8077c2572946` |
| Production | `librarycard-db` | `368ab7bc-fb42-4607-a4cf-761dc7795284` |

### Environment Variables

Each environment has its own configuration in `wrangler.toml`:

- **ENVIRONMENT**: `"local"`, `"staging"`, or `"production"`
- **APP_URL**: Frontend URL for that environment
- **FROM_EMAIL**: Email address for outbound emails

**Frontend Environment Variables (Netlify)**:
- **NEXT_PUBLIC_API_URL**: Worker URL for API calls

## Deployment Best Practices

1. **Always test migrations on staging first**
2. **Use the `--remote` flag for production database operations**
3. **Verify deployments with health checks**
4. **Keep staging database in sync with production schema**
5. **Use descriptive migration file names with timestamps**
6. **Test frontend and backend deployments together**
7. **Monitor both environments after deployment**
8. **Run full integration tests after major deployments**

## Emergency Procedures

### Rollback Frontend
```bash
# Netlify: Use deploy history in dashboard to rollback
# Or revert git commits and redeploy
git revert <commit-hash>
git push origin main
```

### Rollback Worker

⚠️ **PHASE 3 SAFETY**: Use GitHub Actions workflow for rollback:

1. **Identify previous working commit**: Check git history or GitHub releases
2. **Go to**: GitHub Actions → "Deploy to Production (Enhanced Safety)"
3. **Select**: `worker-only` deployment type
4. **Confirm**: Type `CONFIRM-PRODUCTION`
5. **Execute**: Workflow will deploy the current main branch version

**Alternative**: Revert git commits and trigger workflow:
```bash
git revert <problematic-commit-hash>
git push origin main
# Then use GitHub Actions workflow
```

### Database Issues

**Phase 3 Enhanced Backup System**:
- ✅ **Automatic backups**: Created before every production migration
- ✅ **Backup verification**: Integrity checks performed automatically
- ✅ **Emergency restore**: Available via `npm run backup:restore` (EXTREME CAUTION)

```bash
# List available backups
npm run backup:list

# Verify backup integrity
npm run backup:verify

# Emergency restore (EXTREME CAUTION - requires multiple confirmations)
npm run backup:restore
```

**Important**: All backup operations include multiple safety confirmations and audit logging.

---

**Last updated**: July 2025