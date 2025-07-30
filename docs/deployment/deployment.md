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
```bash
# Deploy worker to staging
npx wrangler deploy --env=staging

# Deploy frontend - automatic via GitHub push to staging branch
git push origin staging

# Run database migrations on staging
npx wrangler d1 execute librarycard-db-staging --file=migrations/your-migration.sql --env=staging --remote

# Verify staging deployment
curl https://librarycard-api-staging.tim-arnold.workers.dev/health
```

### Production Deployment

⚠️ **CRITICAL SAFETY NOTE**: Production deployments require safety procedures. NEVER use direct wrangler commands.

```bash
# SAFE production worker deployment (with confirmations and validation)
npm run deploy:prod

# Deploy frontend - automatic via GitHub push to main branch
git push origin main

# SAFE database migrations on production (with backup validation and confirmations)
npm run migrate:prod

# Verify production deployment
curl https://librarycard-api-production.tim-arnold.workers.dev/health
```

## Automatic Deployments

### Frontend (Netlify)
- **Staging**: Automatic on pushes to `staging` branch
- **Production**: Automatic on pushes to `main` branch
- **Build command**: `npm run build`
- **Output directory**: `.next`

### Backend (Cloudflare Workers)
- **Staging**: Manual via `npx wrangler deploy --env=staging`
- **Production**: Manual via `npx wrangler deploy --env=production`
- **GitHub Actions**: Available for automated worker deployment

### Database Migrations
- **Manual execution required** for both environments
- **Available via GitHub Actions workflow dispatch**

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
```bash
# Only after staging validation
npx wrangler d1 execute librarycard-db --file=migrations/new-migration.sql --env=production --remote

# Deploy production worker
npx wrangler deploy --env=production
```

## GitHub Actions Database Deployment

Both staging and production environments support database migrations via GitHub Actions workflow dispatch:

### Staging Environment
1. Go to GitHub Actions → "Deploy to Staging" workflow
2. Click "Run workflow"
3. Enter migration filename (e.g., `20250722_add_user_global_permissions.sql`)
4. Click "Run workflow"

### Production Environment
1. Go to GitHub Actions → "Deploy to Production" workflow  
2. Click "Run workflow"
3. Enter migration filename (e.g., `20250722_add_user_global_permissions.sql`)
4. Click "Run workflow"

### Important Notes
- Worker deployments happen automatically on branch pushes
- Database migrations only run when manually triggered via workflow dispatch
- Always test migrations on staging before running on production
- Migration filename should be just the filename (not the full path)

## Verification Steps

After deployment:

### Frontend Verification
1. **Test the site**: Visit your deployment URL
2. **Check camera access**: Ensure HTTPS works for camera API
3. **Test ISBN scanning**: Try scanning a book barcode
4. **Test library view**: Ensure books display properly

### Backend Verification
1. **Health check**: `curl https://your-worker-url/health`
2. **API connection**: Verify books save to database
3. **Authentication**: Test login/logout flows
4. **Database queries**: Verify data operations work

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
```bash
# Wrong environment flag
# Solution: Use correct environment
npx wrangler deploy --env=production

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
```bash
# Deploy previous version
npx wrangler deploy --env=production

# Or use specific version if needed
```

### Database Issues
```bash
# Database changes are harder to rollback
# Always backup before major schema changes
# Test thoroughly on staging first
```

---

**Last updated**: July 2025