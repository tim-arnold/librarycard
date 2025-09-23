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
- **Frontend**: Manual deployment via GitHub Actions workflow
- **Worker**: `librarycard-api-staging` (isolated Cloudflare account) - Manual deployment via GitHub Actions
- **Database**: `librarycard-db-staging-new` - Manual migrations via GitHub Actions
- **Usage**: Pre-production testing and validation
- **Deployment**: All staging deployments require manual GitHub Actions workflow triggers

### Production
- **Frontend**: `https://librarycard.tim52.io/` - Manual deployment via GitHub Actions workflow
- **Worker**: `librarycard-api-production` - Manual GitHub Actions deployment ONLY
- **Database**: `librarycard-db` - Manual migrations via GitHub Actions ONLY
- **Usage**: Live production environment
- **Deployment**: All production deployments require manual GitHub Actions workflow triggers

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
**Manual Deployment via GitHub Actions:**
1. **Go to**: GitHub Actions → "Deploy to Staging" workflow
2. **Click**: "Run workflow"
3. **Select deployment type**: Choose `frontend-only` or `full-deployment`
4. **Execute**: Click "Run workflow"

#### Health Check Verification
```bash
# Verify staging deployment
curl https://librarycard-api-staging.librarycard-staging.workers.dev/health
```

#### Alternative Local Commands (Legacy)
⚠️ **Note**: Direct wrangler commands still work for staging but SHOULD NOT be used. Use the auto-deploy workflow instead:
```bash
# Legacy staging deployment (SHOULD NOT be used - auto-deploy handles this)
npx wrangler deploy --env=staging

# Legacy database migration (SHOULD NOT be used - use GitHub Actions workflow)
npx wrangler d1 execute librarycard-db-staging --file=migrations/your-migration.sql --env=staging --remote
```

### Production Deployment

⚠️ **ENTERPRISE-GRADE AUTOMATED SYSTEM**: Production deployments use the automated migration system with enterprise safety features.

🚀 **AUTOMATED MIGRATION SYSTEM**: Complete automated deployment with smart bootstrap, rollback support, and production validation.

#### Automated Migration Workflow for Production

1. **Go to GitHub Actions**: https://github.com/tim-arnold/libarycard/actions
2. **Select "Automated Database Migrations"** workflow
3. **Click "Run workflow"** (manual trigger required)
4. **Configure deployment**:
   - **Environment**: Select `production`
   - **Dry Run**: Choose `true` for validation or `false` for execution
   - **Emergency Reason**: Provide reason for audit trail
5. **Type required confirmations** for production safety
6. **Click "Run workflow"** to execute

#### Enterprise Safety Features
- ✅ **Smart Bootstrap**: Automatic detection of existing schema with intelligent migration marking
- ✅ **Automated Backup**: Production backup created before any changes
- ✅ **Dry-Run Validation**: Complete simulation mode for safe pre-deployment testing
- ✅ **Batch Processing**: Optimized 5-row batch processing for large datasets
- ✅ **Enhanced Error Handling**: Comprehensive logging with SQL preservation for debugging
- ✅ **Rollback Support**: Automated rollback capabilities with state management
- ✅ **Production Validation**: System validated with real production data (109 books, 8 users)
- ✅ **Multi-layer Confirmations**: Multiple safety confirmations for production operations

#### Frontend Deployment
**Manual Deployment via GitHub Actions:**
1. **Go to**: GitHub Actions → "🚀 Production Deployment" workflow
2. **Click**: "Run workflow"
3. **Configure deployment**:
   - **Deployment Type**: Select `frontend-only` or `full-deployment`
   - **Reason**: Provide reason for audit trail
   - **Confirmation**: Type `CONFIRM-PRODUCTION`
4. **Execute**: Click "Run workflow"

#### Health Check Verification
```bash
# Verify production deployment
curl https://librarycard-api-production.tim-arnold.workers.dev/health
```

## Deployment Methods

### Frontend (Next.js)
- **Staging**: Manual deployment via GitHub Actions workflow
- **Production**: Manual deployment via GitHub Actions workflow
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Hosting**: Netlify with GitHub Actions integration

### Backend (Cloudflare Workers)
- **Staging**: Manual deployment via GitHub Actions workflow (isolated staging account)
- **Production**: ⚠️ **GITHUB ACTIONS ONLY** - Manual deployment required, local access blocked for security
- **Local production access**: Permanently disabled for enhanced security

### Database Migrations
- **Staging**: Manual execution via GitHub Actions workflow
- **Production**: ⚠️ **GITHUB ACTIONS ONLY** - Manual execution required via workflow dispatch
- **Safety features**: Automatic backups, pre-migration validation, rollback procedures

## Automated Migration System Workflow

### 1. Local Development
```bash
# Test migration locally with automated runner
npm run migrate

# Check migration status
npm run migrate:status

# Test dry-run locally
npm run migrate:dry-run
```

### 2. Staging Validation
# Apply migrations to staging using automated system
# Via GitHub Actions: "Automated Database Migrations" 
# - Environment: staging
# - Dry Run: false

# Alternative: Manual staging migration (for local testing)
npm run migrate:staging

# ⚠️ DEPRECATED: Direct wrangler commands (use automated system instead)
# npx wrangler d1 execute librarycard-db-staging --file=migrations/new-migration.sql --env=staging --remote

# Proper method: Use GitHub Actions workflow for database migrations
# Worker will auto-deploy when staging branch is pushed
# Test functionality on staging environment after auto-deployment
```

### 3. Production Deployment

🚀 **AUTOMATED MIGRATION SYSTEM**: Enterprise-grade automated deployment with complete safety validation.

#### Step 1: Pre-deployment Validation
1. **Dry-Run First**: Always run production dry-run for validation
   - **Go to**: GitHub Actions → "Automated Database Migrations"
   - **Environment**: `production`
   - **Dry Run**: `true`
   - **Execute**: Validates without making changes

#### Step 2: Production Execution
1. **Go to**: GitHub Actions → "Automated Database Migrations"
2. **Configure**:
   - **Environment**: `production`
   - **Dry Run**: `false`
   - **Emergency Reason**: Required for audit trail
3. **Safety Confirmations**: Multiple confirmation steps required
4. **Execute**: System applies migrations with smart bootstrap

#### Smart Bootstrap Features
- **Existing Schema Detection**: Automatically detects manually applied migrations
- **Intelligent Marking**: Marks historical migrations as applied without re-execution
- **New Migration Application**: Applies only new migrations safely
- **Tracking System Setup**: Establishes automated migration tracking for future use

#### Enhanced Safety Features
- ✅ **Automated Pre-backup**: Production backup created automatically
- ✅ **Smart Bootstrap**: No re-execution of existing schema changes
- ✅ **Batch Processing**: Optimized processing for large datasets
- ✅ **Error Recovery**: Enhanced error handling with SQL preservation
- ✅ **Rollback Ready**: Complete rollback capabilities with state tracking

## GitHub Actions Deployment Workflows

**Enterprise-Grade Automated Migration System**: Complete automation with smart bootstrap, rollback support, and production validation.

### Automated Database Migrations
**Primary workflow for all migration operations across environments.**

1. **Go to**: GitHub Actions → "Automated Database Migrations" workflow
2. **Configure deployment**:
   - **Environment**: `staging` or `production`
   - **Dry Run**: `true` for validation, `false` for execution
   - **Emergency Reason**: Required for production operations
3. **Execute**: Click "Run workflow"

### Current Deployment Architecture
- ❌ **No automatic deployments**: All deployments require manual GitHub Actions workflow triggers
- ✅ **Manual production workflow triggers**: All production worker and database changes require explicit workflow execution
- ✅ **Manual staging workflow triggers**: All staging deployments require explicit workflow execution
- ❌ **Local production access blocked**: `npm run deploy:prod` and `npm run migrate:prod` redirect to GitHub Actions
- ✅ **Enhanced staging isolation**: Separate Cloudflare account for staging environment
- ✅ **Multi-layer safety**: Confirmations, backups, validation, and rollback procedures

### Automated Migration System Features
- ✅ **Smart Bootstrap**: Detects existing schema and applies only new migrations
- ✅ **Cross-Environment**: Supports staging and production with proper isolation
- ✅ **Dry-Run Validation**: Complete simulation mode for safe testing
- ✅ **Enhanced Logging**: Comprehensive error handling and SQL preservation

### Backup & Restore Workflows

#### Production Backup System
1. **Go to**: GitHub Actions → "Cloudflare Workers & D1 Backup" workflow
2. **Configure**: Provide backup reason for audit trail
3. **Execute**: Creates validated production backup with integrity checks

#### Emergency Restore System
1. **Go to**: GitHub Actions → "🚨 PRODUCTION Cloudflare Database Restore" workflow
2. **Configure**:
   - **Backup Tag**: GitHub release tag of backup to restore
   - **Dry Run**: `true` for validation, `false` for execution
   - **Emergency Reason**: Required for audit trail
   - **Confirmations**: Multiple safety confirmations required
3. **Execute**: Restores production database from validated backup

**Production-Validated Features**:
- ✅ **Batch Processing**: 5-row batch processing for optimal performance
- ✅ **SQL Escaping**: Handles complex JSON arrays and special characters
- ✅ **File-Based Execution**: Supports large migration files
- ✅ **Error Recovery**: Enhanced error logging with detailed debugging

#### Production-to-Staging Sync
1. **Go to**: GitHub Actions → "Sync Production Data to Staging" workflow
2. **Execute**: Synchronizes complete production dataset to staging
3. **Use Case**: Testing backup/restore workflows with real data

### Automated Rollback System
1. **Go to**: GitHub Actions → "Automated Database Rollbacks" workflow
2. **Configure**:
   - **Environment**: `staging` or `production`
   - **Rollback Type**: Migration batch or specific migration
   - **Emergency Reason**: Required for audit trail
3. **Execute**: Performs automated rollback with state management

### Important Enterprise Features
- ✅ **Production-Validated**: System tested with real production data (109 books, 8 users)
- ✅ **Smart Bootstrap**: No re-execution of existing migrations
- ✅ **Enterprise Safety**: Multiple confirmations, backups, and validation
- ✅ **Complete Automation**: From development to production with full safety
- ✅ **Rollback Ready**: Automated rollback capabilities with state tracking

## Verification Steps

After deployment:

### Frontend Verification
1. **Test the site**: Visit your deployment URL
2. **Check camera access**: Ensure HTTPS works for camera API
3. **Test ISBN scanning**: Try scanning a book barcode
4. **Test library view**: Ensure books display properly

### Backend Verification
1. **Health check**: 
   - Staging: `curl https://librarycard-api-staging.librarycard-staging.workers.dev/health`
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
| Staging | `https://librarycard-api-staging.librarycard-staging.workers.dev` |
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
**Manual Rollback via GitHub Actions:**
1. **Identify previous working commit**: Check git history or GitHub releases
2. **Revert problematic commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. **Deploy via GitHub Actions**: Use "🚀 Production Deployment" workflow
4. **Select deployment type**: Choose `frontend-only`
5. **Provide required confirmations**: Type `CONFIRM-PRODUCTION`

### Rollback Worker

⚠️ **MANUAL WORKFLOW REQUIRED**: Use GitHub Actions workflow for rollback:

1. **Identify previous working commit**: Check git history or GitHub releases
2. **Go to**: GitHub Actions → "🚀 Production Deployment"
3. **Select**: `worker-only` deployment type
4. **Provide reason**: Explain rollback necessity
5. **Confirm**: Type `CONFIRM-PRODUCTION`
6. **Execute**: Workflow will deploy the current main branch version

**Alternative**: Revert git commits and trigger workflow:
```bash
git revert <problematic-commit-hash>
git push origin main
# Then use GitHub Actions workflow for deployment
```

### Database Issues

**Enterprise-Grade Backup & Restore System**:
- ✅ **Automated backups**: Created before every production operation
- ✅ **Production-validated restore**: Tested with real production data (109 books, 8 users)
- ✅ **Smart batch processing**: 5-row batches with enhanced error handling
- ✅ **Emergency dry-run**: Complete validation before any restore operation

#### Available Commands
```bash
# Local migration commands
npm run migrate                    # Apply migrations locally
npm run migrate:status             # Check migration status
npm run migrate:dry-run            # Test migrations without applying

# Production-ready commands (use GitHub Actions for production)
npm run migrate:staging            # Apply to staging environment
```

#### GitHub Actions Emergency Procedures
```bash
# Emergency backup creation
# Use: "Cloudflare Workers & D1 Backup" workflow

# Emergency restore (PRODUCTION-VALIDATED)
# Use: "🚨 PRODUCTION Cloudflare Database Restore" workflow
# - Always run dry-run first (dry_run: true)
# - Complete validation before execution
# - Multiple safety confirmations required

# Automated rollback
# Use: "Automated Database Rollbacks" workflow
# - Batch-aware rollback with state management
# - Cross-environment support (staging/production)
```

#### Migration System Recovery
```bash
# Reset migration tracking (if needed)
wrangler d1 execute librarycard-db --config=wrangler.prod.toml --env=production --remote --command="$(cat migrations/20250815_create_migrations_tracking_system.sql)"

# Re-bootstrap existing database
# Use: "Automated Database Migrations" workflow with smart bootstrap
```

**Production-Validated Safety**: All backup/restore operations have been tested with complete production datasets including complex edge cases (JSON arrays, special characters, large datasets).

---

**Last updated**: August 2025 - Enterprise-Grade Automated Migration System Complete
