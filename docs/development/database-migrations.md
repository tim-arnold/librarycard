# Database Migration System

LibraryCard uses an automated database migration system to safely apply schema changes across environments. This system prevents the manual errors that previously caused deployment issues.

## Quick Start

```bash
# Apply all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Preview what would be applied
npm run migrate:dry-run
```

## Migration Commands

| Command | Description | Environment | Status |
|---------|-------------|-------------|---------|
| `npm run migrate` | Apply pending migrations | Local (default) | ✅ Available |
| `npm run migrate:status` | Show migration status | Local (default) | ✅ Available |
| `npm run migrate:dry-run` | Preview without applying | Local (default) | ✅ Available |
| `npm run migrate:local` | Apply to local environment | Local | ✅ Available |
| `npm run migrate:staging` | Apply to staging environment | Staging | ❌ **BLOCKED** - Use GitHub Actions |
| `npm run migrate:production` | Apply to production environment | Production | ❌ **BLOCKED** - Use GitHub Actions |
| `npm run migrate:rollback` | Rollback last batch | Local (default) | ✅ Available |
| `npm run migrate:rollback:local` | Rollback last batch | Local | ✅ Available |
| `npm run migrate:rollback:staging` | Rollback last batch | Staging | ❌ **BLOCKED** - Use GitHub Actions |
| `npm run migrate:rollback:production` | Rollback last batch | Production | ❌ **BLOCKED** - Use GitHub Actions |

## How It Works

### 1. State Tracking
The system tracks which migrations have been applied using two tables:
- `migrations_applied`: Records each applied migration with checksum validation
- `migration_batches`: Tracks deployment batches for rollback capabilities

### 2. Automatic Discovery
The migration runner automatically scans the `migrations/` directory and:
- Finds all `.sql` files
- Sorts them alphabetically (ensuring chronological order for dated files)
- Compares against applied migrations to find pending ones
- Calculates checksums to detect modified migrations

### 3. Batch Processing
Migrations are applied in batches for safe deployment:
- Each migration run gets a unique batch ID
- Progress is tracked throughout the batch
- Failed migrations stop the batch and record the failure
- Successful batches are marked as completed

### 4. Checksum Validation
Each migration file is checksummed to ensure integrity:
- Prevents applying corrupted migrations
- Detects if previously applied migrations have been modified
- Warns about checksum mismatches without re-applying

## Creating Migrations

### Naming Convention
Use the format: `YYYYMMDD_descriptive-name.sql`

```
20250815_add_user_preferences.sql
20250816_update_book_schema.sql
```

For older migrations without dates, descriptive names are acceptable:
```
add_notification_system.sql
fix_book_genres_schema.sql
```

### Migration File Structure
```sql
-- Migration: Add user preferences table
-- Description: Adds user-specific preferences for UI settings

CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
```

### Best Practices
1. **Always use `IF NOT EXISTS`** for CREATE statements
2. **Include descriptive comments** at the top of each migration
3. **Test migrations locally** before deploying
4. **One logical change per migration** (don't combine unrelated changes)
5. **Use transactions** for complex migrations when possible

## Environment Configuration

The migration runner supports multiple environments:

### Local Development
```bash
MIGRATION_ENV=local npm run migrate
```
- Database: `librarycard-db-local`
- Remote: `false` (uses local D1 database)

### Staging
```bash
MIGRATION_ENV=staging-new npm run migrate
```
- Database: `librarycard-db-staging-new`
- Remote: `true`
- Environment: `staging-new`

### Production
```bash
MIGRATION_ENV=production npm run migrate
```
- Database: `librarycard-db-production`
- Remote: `true`
- Environment: `production`

## GitHub Actions Integration

**⚠️ IMPORTANT: All staging and production operations MUST use GitHub Actions workflows.**

### Available Workflows

1. **"Automated Database Migrations"** - Apply pending migrations
   - Supports staging and production environments
   - Includes dry-run mode for preview
   - Automatic health checks and validation
   - Manual approval required for production

2. **"Automated Database Rollbacks"** - Rollback migrations
   - Supports staging and production environments  
   - Requires "CONFIRM" confirmation text
   - Mandatory reason for audit trail
   - Manual approval required for production
   - Automatic backup before production rollbacks

### How to Use GitHub Actions for Database Operations

#### **🚀 Apply Database Migrations**

**Step-by-Step Instructions:**
1. **Navigate to GitHub Actions**
   - Go to: https://github.com/tim-arnold/libarycard/actions
   - Click on "Automated Database Migrations" workflow

2. **Start the Workflow**
   - Click "Run workflow" button (top right)
   - Select your target branch (usually `main`)

3. **Configure Parameters**
   - **Environment**: Choose `staging` or `production`
   - **Dry run**: Check this box to preview changes without applying them
   - **Reason**: Optional description for audit trail

4. **Execute and Monitor**
   - Click "Run workflow" to start
   - Monitor progress in the Actions tab
   - **Production requires manual approval** - click "Review deployments" when prompted

5. **Workflow Steps** (Automatic)
   - ✅ Check migration status and count pending migrations
   - ✅ Apply migrations (or show dry-run preview)
   - ✅ Verify API health after migration
   - ✅ Display final migration status

#### **🔄 Rollback Database Migrations**

**Step-by-Step Instructions:**
1. **Navigate to GitHub Actions**
   - Go to: https://github.com/tim-arnold/libarycard/actions  
   - Click on "Automated Database Rollbacks" workflow

2. **Start the Workflow**
   - Click "Run workflow" button (top right)
   - Select your target branch (usually `main`)

3. **Configure Parameters** (All Required)
   - **Environment**: Choose `staging` or `production`
   - **Confirmation**: Type `CONFIRM` exactly (case-sensitive)
   - **Reason**: Mandatory description explaining why rollback is needed
   - **Batch ID**: Optional - leave empty to rollback last batch, or specify batch ID

4. **Safety Validation**
   - Workflow validates confirmation text and reason
   - **Production requires manual approval** - review carefully before approving

5. **Execute and Monitor**
   - Monitor progress in the Actions tab
   - Production rollbacks automatically create backups first

6. **Workflow Steps** (Automatic)
   - ✅ Validate rollback request and confirmation
   - ✅ Create backup (production only)
   - ✅ Check rollback file availability  
   - ✅ Execute rollback in reverse order
   - ✅ Verify API health after rollback
   - ✅ Display final migration status

#### **Example Workflow Outputs**

**Migration Workflow Success:**
```
✅ Staging API is healthy after migration
📊 Final migration status:
Applied migrations: 35 (+3 new)
Pending migrations: 0
🎉 STAGING MIGRATION COMPLETED SUCCESSFULLY
```

**Rollback Workflow Success:**
```
🔄 Rolling back batch batch_20250815_143022 (3 migrations)
Found rollback files for 2/3 migrations
✅ Production API is healthy after rollback
🎯 PRODUCTION ROLLBACK COMPLETED
```

#### **Workflow Security Features**

- **Environment Protection**: Production requires manual approval
- **Confirmation Required**: Rollbacks need explicit "CONFIRM" text
- **Audit Trail**: All operations logged with actor, reason, timestamp
- **Health Checks**: API validation after every operation
- **Automatic Backups**: Production rollbacks create safety backups
- **Error Handling**: Failed operations stop immediately with clear errors

#### **Workflow Parameters Reference**

**Automated Database Migrations Parameters:**
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| Environment | ✅ Yes | `staging`, `production` | Target environment for migrations |
| Dry run | ❌ No | `true`, `false` (default) | Preview changes without applying |
| Reason | ❌ No | Text string | Optional reason for audit trail |

**Automated Database Rollbacks Parameters:**
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| Environment | ✅ Yes | `staging`, `production` | Target environment for rollback |
| Confirmation | ✅ Yes | Must be `CONFIRM` | Safety confirmation text |
| Reason | ✅ Yes | Text string | Mandatory reason for rollback |
| Batch ID | ❌ No | Batch identifier | Specific batch to rollback (default: last batch) |

#### **Monitoring Workflow Execution**

**During Execution:**
1. **Actions Tab**: Monitor real-time progress at `/actions`
2. **Live Logs**: Click on running workflow to see detailed logs
3. **Approval Required**: Production workflows pause for manual approval
4. **Health Checks**: Workflows automatically verify API health

**After Completion:**
- **Success**: Green checkmark with completion message
- **Failure**: Red X with error details and logs
- **Logs Retention**: Full execution logs saved for 90 days
- **Artifacts**: Any generated outputs saved as downloadable artifacts

### Local vs GitHub Actions

| Operation | Local | Staging | Production |
|-----------|-------|---------|------------|
| Migrations | ✅ `npm run migrate:local` | ❌ GitHub Actions ONLY | ❌ GitHub Actions ONLY |
| Rollbacks | ✅ `npm run migrate:rollback` | ❌ GitHub Actions ONLY | ❌ GitHub Actions ONLY |
| Status Check | ✅ `npm run migrate:status` | ⚠️ Limited (no DB access) | ⚠️ Limited (no DB access) |

## Troubleshooting

### Migration Fails
If a migration fails:
1. Check the error message in the output
2. Review the failed migration file
3. Fix the issue and re-run the migration
4. The system will resume from where it left off

### Checksum Mismatch
If you see a checksum warning:
```
⚠️  WARNING: Migration add_user_table.sql has been modified since it was applied
```

This means the migration file has been changed after it was applied. Generally:
- **Don't modify applied migrations** - create a new migration instead
- If absolutely necessary, the system won't re-apply but will warn you

### Database Not Found
If you see "Couldn't find a D1 DB":
1. Ensure the database exists in your Cloudflare account
2. Check the `wrangler.toml` configuration
3. Verify environment variables are set correctly

### Missing Migrations Table
On first run, if the migrations tracking tables don't exist:
1. The system will detect this and apply all migrations
2. The tracking tables will be created with the first migration
3. Subsequent runs will use the tracking system

### Blocked Staging/Production Commands
If you see "BLOCKED: Direct staging-new operations are not permitted locally":
```bash
🚫 BLOCKED: Direct staging-new operations are not permitted locally

🔒 SECURITY POLICY: All staging and production operations must use GitHub Actions

✅ Use GitHub Actions workflow: "Automated Database Migrations"
   1. Go to: https://github.com/tim-arnold/libarycard/actions/workflows/automated-migrations.yml
   2. Click "Run workflow"
   3. Select environment: staging
   4. Optional: Enable dry-run for preview
   5. Optional: Add reason for audit
```

This is the intended behavior. **All staging and production database operations must use GitHub Actions** for:
- **Security**: Prevents accidental local changes to production data
- **Audit Trail**: All operations logged with approval workflows
- **Safety**: Health checks and automatic backups
- **Compliance**: Manual approval required for production changes

**Solution**: Follow the GitHub Actions instructions shown in the error message.

## Migration Status Output

The `npm run migrate:status` command shows:

```
📊 Migration Status for environment: local

Total migration files: 34
Applied migrations: 28
Pending migrations: 6

📋 Applied migrations:
   ✅ 20250712_add_permission_tables.sql (2025-08-15 10:30:45)
   ✅ 20250722_add_user_global_permissions.sql (2025-08-15 10:30:47)
   ...

📋 Pending migrations:
   ⏳ 20250815_create_migrations_tracking_system.sql
   ⏳ add_new_feature.sql
   ...
```

## Rollback Functionality

The migration system supports automated rollbacks for safe deployments:

### Quick Rollback Commands
```bash
# Rollback last batch
npm run migrate:rollback

# Rollback specific batch 
npm run migrate:rollback:staging
node scripts/migrate.js rollback batch_20250815_143022

# Rollback by environment
npm run migrate:rollback:local        # Local environment
npm run migrate:rollback:staging      # Staging environment  
npm run migrate:rollback:production   # Production environment
```

### How Rollbacks Work

1. **Rollback Files Required**: Each migration can have an optional `.rollback.sql` file
   ```
   migrations/
   ├── 20250815_add_user_table.sql
   ├── 20250815_add_user_table.rollback.sql  ← Optional rollback
   ├── 20250816_add_indexes.sql
   └── 20250816_add_indexes.rollback.sql     ← Optional rollback
   ```

2. **Automatic Detection**: The system automatically finds rollback files and reports availability
3. **Reverse Order**: Rollbacks execute in reverse chronological order
4. **Batch Tracking**: Each rollback creates a new batch for tracking and audit

### Creating Rollback Files

For migrations that need rollback support, create a corresponding `.rollback.sql` file:

**Migration: `20250815_add_user_preferences.sql`**
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT
);
```

**Rollback: `20250815_add_user_preferences.rollback.sql`**
```sql
DROP TABLE IF EXISTS user_preferences;
```

### Rollback Safety

- **Validation**: System checks for rollback files before attempting rollback
- **Data Loss Warning**: Rollbacks may result in data loss - use with caution
- **Stop on Error**: Rollback stops on first error to prevent partial state
- **Audit Trail**: All rollback operations are tracked in `migration_batches`

### Rollback Output Example

```bash
npm run migrate:rollback

🔄 Rolling back batch batch_20250815_143022 (3 migrations)

Found rollback files for 2/3 migrations
🔄 Rolling back: 20250816_add_indexes.sql
   ✅ Rolled back successfully
🔄 Rolling back: 20250815_add_user_preferences.sql  
   ✅ Rolled back successfully
⚠️  Skipping 20250814_update_schema.sql (no rollback file)

🎉 Rollback completed successfully!
Rolled back 2 migrations from batch batch_20250815_143022
```

## Benefits Over Manual Process

### Before (Manual Process)
❌ Developer must remember which migration files belong to a feature  
❌ Easy to miss migrations during deployment  
❌ No way to know which migrations have been applied  
❌ Manual GitHub Actions workflow for each file  
❌ Production errors from missed migrations  

### After (Automated System)
✅ Automatic discovery of pending migrations  
✅ Single command applies all necessary migrations  
✅ Complete state tracking and batch management  
✅ Checksum validation prevents corruption  
✅ Integration-ready for CI/CD pipelines  
✅ Clear error reporting and recovery  

## Getting Help

For migration system issues:
1. Check this documentation first
2. Run `npm run migrate:status` to see current state
3. Use `npm run migrate:dry-run` to preview changes
4. Review migration file syntax and Cloudflare D1 documentation
5. Contact the development team for complex issues