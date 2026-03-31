# GitHub Actions Workflows

CI/CD, backup, and disaster recovery workflows for LibraryCard.

## Deployment

| Workflow | File | Trigger |
|----------|------|---------|
| [Production Deployment](#production-deployment) | `deploy-production-enhanced.yml` | Manual (main branch) |
| [Staging Deployment](#staging-deployment) | `deploy-staging-enhanced.yml` | Manual (staging branch) |

### Production Deployment

Full production deployment pipeline with safety gates at every stage.

**Deployment types:** `worker-only`, `automated-migrations`, `full-deployment`, `frontend-only`

**Safety requirements:**
- Must be on `main` branch
- Confirmation text: `CONFIRM-PRODUCTION`
- Minimum 10-character deployment reason
- Staging health verified before proceeding
- Pre-deployment backup created automatically
- 30-second pause before production operations
- Post-deployment health checks

**Secrets:** `CLOUDFLARE_API_TOKEN`, `NETLIFY_PROD_BUILD_HOOK`

### Staging Deployment

Deploys to the isolated staging Cloudflare account with smoke tests.

**Deployment types:** `worker-only`, `automated-migrations`, `full-deployment`, `frontend-only`

**Secrets:** `CLOUDFLARE_API_TOKEN_STAGING_NEW`, `NETLIFY_STAGING_BUILD_HOOK`

---

## Database Migrations

| Workflow | File | Trigger |
|----------|------|---------|
| [Automated Migrations](#automated-migrations) | `automated-migrations.yml` | Manual |
| [Automated Rollbacks](#automated-rollbacks) | `automated-rollbacks.yml` | Manual |
| [Staging Migration](#staging-migration) | `staging-migration.yml` | Manual (staging branch) |
| [Check Production Schema](#check-production-schema) | `check-production-schema.yml` | Manual |

### Automated Migrations

Applies pending database migrations to staging or production. Supports dry-run mode to preview changes without executing them. Production migrations include pre-migration backups and API health verification.

**Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_TOKEN_STAGING_NEW`

### Automated Rollbacks

Rolls back the last migration batch or a specific batch ID. Requires confirmation text (`CONFIRM`) and a mandatory reason for the audit trail. Production rollbacks create a pre-rollback backup.

**Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_TOKEN_STAGING_NEW`

### Staging Migration

Applies a single specified migration file to the staging database. Validates the file exists before running.

**Secrets:** `CLOUDFLARE_API_TOKEN_STAGING_NEW`

### Check Production Schema

Read-only diagnostic that inspects production database tables and their structure. Requires confirmation text `CHECK SCHEMA`.

**Secrets:** `CLOUDFLARE_API_TOKEN`

---

## Backups

| Workflow | File | Trigger | Schedule |
|----------|------|---------|----------|
| [Production Workers & DB Backup](#production-workers--db-backup) | `cloudflare-backup.yml` | Manual / Scheduled | Daily 3 AM UTC |
| [Production Frontend Backup](#production-frontend-backup) | `netlify-backup.yml` | Manual / Scheduled | Daily 2 AM UTC |
| [Staging Workers & DB Backup](#staging-workers--db-backup) | `staging-cloudflare-backup.yml` | Manual | -- |
| [Staging Frontend Backup](#staging-frontend-backup) | `netlify-backup-staging.yml` | Manual / Scheduled | Daily 4 AM UTC |

### Production Workers & DB Backup

Archives Worker source code, configuration files, migration files, and a full D1 database export. Includes a generated restoration guide. Uploaded to GitHub Releases.

**Secrets:** `CLOUDFLARE_API_TOKEN`

### Production Frontend Backup

Builds the production frontend and archives build artifacts plus source code to GitHub Releases.

### Staging Workers & DB Backup

Same scope as production backup but targets the staging Cloudflare account. Tagged as prerelease.

**Secrets:** `CLOUDFLARE_API_TOKEN_STAGING_NEW`

### Staging Frontend Backup

Builds the staging frontend and archives build artifacts plus source code. Tagged as prerelease.

---

## Restore & Recovery

| Workflow | File | Trigger |
|----------|------|---------|
| [Production Database Restore](#production-database-restore) | `production-cloudflare-restore.yml` | Manual |
| [Staging Database Restore](#staging-database-restore) | `staging-cloudflare-restore.yml` | Manual |
| [Sync Production to Staging](#sync-production-to-staging) | `sync-production-to-staging.yml` | Manual |

### Production Database Restore

Restores the production D1 database from a GitHub Releases backup tag. This is the most safety-gated workflow in the repository.

**Safety requirements:**
- Two separate confirmation strings: `RESTORE PRODUCTION DATABASE` and `I UNDERSTAND THIS IS IRREVERSIBLE`
- Mandatory emergency reason
- Dry-run mode available (validates backup without restoring)
- Backup integrity verification before restore
- 30-second consideration pause
- Environment approval required
- Tables cleared and restored in dependency order with batched inserts

**Secrets:** `CLOUDFLARE_API_TOKEN`

### Staging Database Restore

Restores the staging D1 database from a GitHub Releases backup tag. Confirmation text: `RESTORE STAGING`. Uses the same dependency-ordered, batched restore process as production.

**Secrets:** `CLOUDFLARE_API_TOKEN_STAGING_NEW`

### Sync Production to Staging

Copies production data into staging by downloading a production backup, recreating the staging database from scratch, and importing all data. Creates a staging backup before syncing.

**Secrets:** `CLOUDFLARE_API_TOKEN_STAGING_NEW`

---

## Required Secrets

| Secret | Used By |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | All production Cloudflare workflows |
| `CLOUDFLARE_API_TOKEN_STAGING_NEW` | All staging Cloudflare workflows |
| `NETLIFY_PROD_BUILD_HOOK` | Production frontend deployment |
| `NETLIFY_STAGING_BUILD_HOOK` | Staging frontend deployment |