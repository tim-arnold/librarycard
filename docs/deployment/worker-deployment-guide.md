# Worker Deployment Guide

This guide covers the deployment strategy for Cloudflare Workers across different environments.

## Environment Structure

We use a clean two-environment deployment strategy:

### Local Development
- **Worker**: `librarycard-api-local` (local only)
- **Database**: `libarycard-db-local` 
- **Frontend**: `http://localhost:3000`
- **Usage**: Development and testing

### Staging
- **Worker**: `librarycard-api-staging`
- **Database**: `librarycard-db-staging`
- **Frontend**: `https://librarycard-staging.tim52.io/`
- **Usage**: Pre-production testing and validation

### Production
- **Worker**: `librarycard-api-production`
- **Database**: `librarycard-db`
- **Frontend**: `https://librarycard.tim52.io/`
- **Usage**: Live production environment

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

# Run database migrations on staging
npx wrangler d1 execute librarycard-db-staging --file=migrations/your-migration.sql --env=staging --remote

# Verify staging deployment
curl https://librarycard-api-staging.tim-arnold.workers.dev/health
```

### Production Deployment
```bash
# Deploy worker to production
npx wrangler deploy --env=production

# Run database migrations on production (after testing on staging)
npx wrangler d1 execute librarycard-db --file=migrations/your-migration.sql --env=production --remote

# Verify production deployment
curl https://librarycard-api-production.tim-arnold.workers.dev/health
```

## Database Migration Workflow

The recommended workflow for database changes:

1. **Develop Locally**
   ```bash
   # Test migration locally first
   npx wrangler d1 execute libarycard-db-local --file=migrations/new-migration.sql
   ```

2. **Test on Staging**
   ```bash
   # Deploy to staging database
   npx wrangler d1 execute librarycard-db-staging --file=migrations/new-migration.sql --env=staging --remote
   
   # Deploy staging worker if needed
   npx wrangler deploy --env=staging
   
   # Test functionality on staging environment
   ```

3. **Deploy to Production**
   ```bash
   # Only after staging validation
   npx wrangler d1 execute librarycard-db --file=migrations/new-migration.sql --env=production --remote
   
   # Deploy production worker
   npx wrangler deploy --env=production
   ```

## Environment Variables

Each environment has its own configuration in `wrangler.toml`:

- **ENVIRONMENT**: `"local"`, `"staging"`, or `"production"`
- **APP_URL**: Frontend URL for that environment
- **FROM_EMAIL**: Email address for outbound emails

## Worker URLs

| Environment | Worker URL |
|-------------|------------|
| Local | `http://localhost:8787` (via wrangler dev) |
| Staging | `https://librarycard-api-staging.tim-arnold.workers.dev` |
| Production | `https://librarycard-api-production.tim-arnold.workers.dev` |

## Database IDs

| Environment | Database Name | Database ID |
|-------------|---------------|-------------|
| Local | `libarycard-db-local` | `5365a633-7869-4993-990a-90aa12e9974e` |
| Staging | `librarycard-db-staging` | `eb3d7f44-754e-4354-a3ce-8077c2572946` |
| Production | `librarycard-db` | `368ab7bc-fb42-4607-a4cf-761dc7795284` |

## Troubleshooting

### Worker Not Found
If you get a 404 error, ensure you're using the correct environment flag:
```bash
# Wrong (creates confusing names)
npx wrangler deploy --env=production-production

# Correct
npx wrangler deploy --env=production
```

### Database Connection Issues
Verify the database binding in wrangler.toml matches the worker environment:
```bash
# Check database connection
npx wrangler d1 execute [database-name] --command="SELECT 1;" --env=[environment] --remote
```

### Environment Variable Issues
Check that environment variables are correctly set in each environment section of wrangler.toml.

## Best Practices

1. **Always test migrations on staging first**
2. **Use the `--remote` flag for production database operations**
3. **Verify deployments with health checks**
4. **Keep staging database in sync with production schema**
5. **Use descriptive migration file names with timestamps**

---

**Last updated**: July 2025