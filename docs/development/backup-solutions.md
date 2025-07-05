# Backup Solutions

LibraryCard implements a comprehensive backup strategy covering both frontend (Netlify) and backend (Cloudflare Workers + D1) infrastructure with automated and manual backup capabilities.

## Overview

### Backup Strategy
- **Automated Daily Backups**: GitHub Actions workflows
- **Manual On-Demand Backups**: Shell scripts for immediate backup creation
- **Source Code Protection**: Git version control with GitHub
- **Multiple Recovery Points**: Historical backups stored as GitHub Releases

### What Gets Backed Up
- **Frontend**: Complete source code, build artifacts, configuration files
- **Backend**: Worker source code, database schema, configuration files
- **Data**: Database schema, statistics, and manual export scripts
- **Configuration**: Environment variable documentation and deployment guides

## Automated Backup System

### Daily Backup Schedule
- **2:00 AM UTC**: Netlify frontend backup (GitHub Actions)
- **3:00 AM UTC**: Cloudflare Workers & D1 backup (GitHub Actions)

### GitHub Actions Workflows

#### Frontend Backup (`.github/workflows/netlify-backup.yml`)
- **Triggers**: Daily at 2 AM UTC + manual trigger
- **Creates**: Complete source code backup with build artifacts
- **Stores**: GitHub Releases with tag `backup-{run-number}-{date}`
- **Includes**: Deployment instructions and environment variable documentation

#### Backend Backup (`.github/workflows/cloudflare-backup.yml`)
- **Triggers**: Daily at 3 AM UTC + manual trigger  
- **Creates**: Worker source + database schema backup
- **Stores**: GitHub Releases with tag `cf-backup-{run-number}-{date}`
- **Includes**: Database statistics and restoration guides

### Backup Storage
- **Location**: GitHub Releases (attached as assets)
- **Format**: Compressed tar.gz archives
- **Retention**: Manual cleanup (no automatic deletion)
- **Access**: Available to repository collaborators

## Manual Backup Scripts

### Frontend Backup Script
```bash
# Quick backup
./scripts/backup-netlify.sh

# Custom location
./scripts/backup-netlify.sh ./my-backup-directory
```

**What it backs up**:
- Complete source code (excluding node_modules)
- Built application (.next directory)
- Configuration files (package.json, netlify.toml, etc.)
- Environment variable templates
- Deployment metadata and restoration instructions

### Backend Backup Script
```bash
# Quick backup
./scripts/backup-cloudflare.sh

# Custom location  
./scripts/backup-cloudflare.sh ./my-cloudflare-backup
```

**What it backs up**:
- Worker source code (workers/ directory)
- Database schema and statistics
- Configuration files (wrangler.toml, schema.sql)
- Migration files
- Deployment information and restoration guides

### Database Data Backup
```bash
# After running cloudflare backup, run data export
cd your-backup-directory
./backup-d1-data.sh
```

**Note**: D1 data backup requires separate step due to platform limitations.

## Backup Contents

### Frontend Backup Structure
```
backup-directory/
├── source-code.tar.gz          # Complete source (2-3 MB)
├── build-artifacts.tar.gz      # Built .next directory (150+ MB)
├── package.json               # Dependencies manifest
├── package-lock.json          # Dependency tree lock
├── netlify.toml               # Netlify configuration
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment template
├── backup-metadata.json       # Backup information
├── RESTORE.md                 # Restoration instructions
└── backup-summary.txt         # Backup summary
```

### Backend Backup Structure
```
backup-directory/
├── worker-source.tar.gz        # Complete worker code
├── wrangler.toml              # Worker configuration
├── schema.sql                 # Database schema
├── migrations.tar.gz          # Migration files (if present)
├── database-schema.sql        # Current schema backup
├── database-stats.txt         # Table row counts
├── backup-d1-data.sh          # Data export script
├── worker-deployment-info.txt # Deployment status
├── RESTORE-GUIDE.md           # Restoration instructions
└── backup-metadata.json       # Backup metadata
```

## Restoration Procedures

### Frontend Restoration

#### Quick Restoration (Existing Netlify Site)
```bash
# 1. Extract source code
tar -xzf source-code.tar.gz

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Worker API URL

# 4. Deploy to existing site
netlify deploy --prod --dir .next
```

#### New Site Setup
1. **Create new Netlify site** from dashboard
2. **Upload build artifacts** or connect to Git
3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`
4. **Set environment variables**:
   - `NEXT_PUBLIC_API_URL`: Your Cloudflare Worker URL

### Backend Restoration

#### Worker Restoration
```bash
# 1. Extract worker source
tar -xzf worker-source.tar.gz

# 2. Install dependencies  
npm install

# 3. Authenticate with Cloudflare
wrangler auth login

# 4. Deploy worker
cd workers
wrangler deploy
```

#### Database Restoration
```bash
# 1. Create new D1 database
wrangler d1 create librarycard-db-restored

# 2. Update wrangler.toml with new database ID

# 3. Apply schema
wrangler d1 execute librarycard-db-restored --file=schema.sql

# 4. Restore data (manual process - see data restoration section)
./backup-d1-data.sh
```

### Data Restoration Process

Due to D1 platform limitations, data restoration requires manual steps:

1. **Export current data** using backup script
2. **Convert SELECT output** to INSERT statements
3. **Import data table by table** using wrangler d1 execute
4. **Verify row counts** match original statistics

```bash
# Example data restoration for users table
wrangler d1 execute new-db --command="
INSERT INTO users (id, email, first_name, last_name, ...)
VALUES ('user1', 'user@example.com', 'John', 'Doe', ...);
"
```

## Emergency Recovery

### Complete Infrastructure Loss

**Priority Order**:
1. **Worker Deployment**: Get API functional first
2. **Database Schema**: Apply schema to new database
3. **Frontend Deployment**: Deploy frontend with new API URL
4. **Critical Data**: Restore user accounts and core data
5. **Full Data**: Complete data restoration in background

**Quick Recovery Steps**:
```bash
# 1. Deploy worker from latest backup
cd workers && wrangler deploy

# 2. Create new database and apply schema
wrangler d1 create librarycard-db-emergency
wrangler d1 execute librarycard-db-emergency --file=schema.sql

# 3. Deploy frontend to Netlify
netlify deploy --prod --dir .next

# 4. Update environment variables with new endpoints
```

### Partial Recovery Scenarios

**Frontend Only**:
- Extract and deploy from latest frontend backup
- Update API URL if needed
- Test all functionality

**Backend Only**:
- Deploy worker from source backup
- Restore database schema
- Gradually restore data by priority

**Database Only**:
- Create new D1 database
- Apply schema from backup
- Run data restoration scripts

## Backup Verification

### Monthly Verification Process
1. **Download latest backups** from GitHub Releases
2. **Set up clean test environment**
3. **Follow complete restoration procedure**
4. **Test all critical functionality**
5. **Document any issues discovered**
6. **Update procedures if needed**

### Verification Checklist
- [ ] Backup files download successfully
- [ ] Source code extracts without errors
- [ ] Dependencies install correctly (`npm install`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Database schema applies cleanly
- [ ] Worker deploys without errors
- [ ] Frontend connects to restored backend
- [ ] Critical features work (auth, book scanning, library view)

## Backup Monitoring

### GitHub Actions Monitoring
- **Check daily**: Verify backup workflows completed successfully
- **Review failures**: Investigate any failed backup runs
- **Storage usage**: Monitor GitHub storage consumption
- **Access control**: Ensure proper permissions for backup access

### Backup Health Indicators
- ✅ **Healthy**: Daily backups completing successfully
- ⚠️ **Warning**: Occasional failures or missing backups
- ❌ **Critical**: Multiple consecutive backup failures

### Troubleshooting Failed Backups

**Common Issues**:
- **Missing secrets**: Verify `CLOUDFLARE_API_TOKEN` is configured
- **Permission errors**: Check API token has required permissions
- **Build failures**: Resolve dependency or code issues
- **Storage limits**: Clean up old releases if storage is full

**Resolution Steps**:
1. **Check workflow logs** in GitHub Actions tab
2. **Verify environment secrets** are configured correctly
3. **Test manual backup scripts** locally
4. **Update API tokens** if expired
5. **Re-run failed workflows** after fixing issues

## Best Practices

### Backup Frequency
- **Automated**: Daily backups for regular protection
- **Manual**: Before major changes or deployments
- **Critical**: Export data before schema changes

### Backup Security
- **Access control**: Limit who can access production backups
- **Sensitive data**: Don't include secrets in backups
- **Storage**: Use secure storage for long-term archives

### Backup Testing
- **Regular testing**: Monthly restoration verification
- **Documentation**: Keep procedures up to date
- **Training**: Ensure team knows restoration process

### Storage Management
- **Regular cleanup**: Remove old backups after 6+ months
- **Archive**: Move old backups to external storage if needed
- **Monitoring**: Track storage usage and costs

## Recovery Time Objectives

### Expected Recovery Times
- **Frontend only**: 15-30 minutes
- **Backend only**: 30-45 minutes  
- **Complete infrastructure**: 1-2 hours
- **Full data restoration**: 2-4 hours (depending on data size)

### Factors Affecting Recovery Time
- **Data size**: Larger datasets take longer to restore
- **Network speed**: Download and upload speeds
- **Manual steps**: D1 data restoration requires manual intervention
- **Verification**: Time needed to test restored systems

---

This backup solution provides comprehensive protection for LibraryCard with automated daily backups, manual on-demand capabilities, and detailed restoration procedures for various disaster scenarios.