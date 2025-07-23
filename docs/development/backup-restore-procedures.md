# Backup and Restore Procedures

Complete guide for backing up and restoring LibraryCard's frontend and backend infrastructure.

## Overview

LibraryCard uses a hybrid backup strategy:
- **Automated Daily Backups**: GitHub Actions create daily backups
- **Manual Backup Scripts**: On-demand backup creation
- **Version Control**: Source code backed up via Git
- **Release Storage**: Backups stored as GitHub Releases

## Backup Architecture

```
LibraryCard Backup System
├── Frontend (Netlify)
│   ├── Source code backup
│   ├── Build artifacts (.next)
│   ├── Configuration files
│   └── Environment variable documentation
├── Backend (Cloudflare)
│   ├── Worker source code
│   ├── Database schema
│   ├── Configuration files
│   └── Migration files
└── Data (D1 Database)
    ├── Schema backup
    ├── Table statistics
    └── Manual data export scripts
```

## Automated Backup System

### GitHub Actions Workflows

**Daily Schedule**:
- **2:00 AM UTC**: Netlify frontend backup
- **3:00 AM UTC**: Cloudflare Workers & D1 backup

**Manual Triggers**: Both workflows can be triggered manually from GitHub Actions tab.

### Backup Storage
- **Location**: GitHub Releases
- **Retention**: Manual cleanup (no automatic deletion)
- **Naming**: `backup-{run-number}-{date}` and `cf-backup-{run-number}-{date}`
- **Format**: Compressed archives with metadata

## Manual Backup Procedures

### Frontend Backup (Netlify)

#### Quick Backup
```bash
# Run backup script
./scripts/backup-netlify.sh

# Optional: specify output directory
./scripts/backup-netlify.sh ./my-backup-location
```

#### What's Backed Up
- Complete source code (excluding node_modules)
- Built application (.next directory)
- Configuration files (package.json, netlify.toml, etc.)
- Environment variable templates
- Deployment metadata and instructions

#### Backup Contents
```
backup-directory/
├── source-code.tar.gz          # Complete source code
├── build-artifacts.tar.gz      # Built .next directory
├── package.json               # Dependencies
├── package-lock.json          # Dependency tree
├── netlify.toml               # Netlify configuration
├── .env.example               # Environment template
├── backup-metadata.json       # Backup information
├── RESTORE.md                 # Restoration guide
└── backup-summary.txt         # Backup summary
```

### Backend Backup (Cloudflare)

#### Quick Backup
```bash
# Run Cloudflare backup script
./scripts/backup-cloudflare.sh

# Optional: specify output directory
./scripts/backup-cloudflare.sh ./my-cloudflare-backup
```

#### What's Backed Up
- Worker source code
- Database schema
- Configuration files (wrangler.toml)
- Migration files
- Database statistics
- Deployment information

#### Data Backup (Additional Step)
```bash
# After running main backup, run data backup
cd your-backup-directory
./backup-d1-data.sh
```

#### Backup Contents
```
backup-directory/
├── worker-source.tar.gz        # Complete Worker code
├── wrangler.toml              # Worker configuration
├── schema.sql                 # Database schema
├── migrations.tar.gz          # Migration files
├── database-schema.sql        # Current schema backup
├── database-stats.txt         # Table statistics
├── backup-d1-data.sh          # Data backup script
├── worker-deployment-info.txt # Deployment info
├── RESTORE-GUIDE.md           # Restoration guide
└── backup-metadata.json       # Backup metadata
```

## Accessing Backup Files

Before restoration, you need to download the backup files from GitHub Releases.

### Downloading Backups from GitHub Releases

1. **Navigate to Releases**:
   - Go to your LibraryCard GitHub repository
   - Click "Releases" tab (or go to `/releases`)
   - Look for releases named `backup-{run-number}-{date}` (frontend) or `cf-backup-{run-number}-{date}` (backend)

2. **Download Backup Files**:
   ```bash
   # Example URLs (replace with actual repository):
   # Frontend backup:
   wget https://github.com/yourusername/librarycard/releases/download/backup-123-20250723/backup-123-20250723.tar.gz
   
   # Backend backup:
   wget https://github.com/yourusername/librarycard/releases/download/cf-backup-456-20250723/cf-backup-456-20250723.tar.gz
   ```

3. **Extract Downloaded Backup**:
   ```bash
   # Extract the main backup archive
   tar -xzf backup-123-20250723.tar.gz
   
   # This creates a directory with the backup contents:
   # backup-123-20250723/
   # ├── source-code.tar.gz
   # ├── build-artifacts.tar.gz
   # ├── package.json
   # └── ... (other backup files)
   ```

4. **Choose the Right Backup**:
   - **Latest backup**: Most recent date for current restoration
   - **Specific date**: Choose backup from before a known issue occurred
   - **Check metadata**: Look at `backup-metadata.json` for backup details

### Manual Backup Location

If you've run manual backups, they're typically in:
```bash
# Default locations from backup scripts:
./backups/netlify-backup-YYYYMMDD/    # Frontend backups
./backups/cloudflare-backup-YYYYMMDD/ # Backend backups
```

## Restoration Procedures

### Frontend Restoration (Netlify)

#### Scenario 1: Complete Site Restoration
```bash
# 1. Navigate to extracted backup directory
cd backup-123-20250723/  # Use your actual backup directory name

# 2. Extract source code
tar -xzf source-code.tar.gz

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# 5. Test locally
npm run dev

# 6. Deploy to Netlify
netlify deploy --prod --dir .next
```

#### Scenario 2: New Netlify Site Setup
1. **Create new site** in Netlify dashboard
2. **Connect to Git** or upload build artifacts
3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18
4. **Set environment variables**:
   - `NEXT_PUBLIC_API_URL`: Your Cloudflare Worker URL

### Backend Restoration (Cloudflare)

#### Scenario 1: Worker Restoration
```bash
# 1. Navigate to extracted backup directory
cd cf-backup-456-20250723/  # Use your actual backup directory name

# 2. Extract worker source
tar -xzf worker-source.tar.gz

# 3. Install dependencies
npm install

# 4. Authenticate with Cloudflare
wrangler auth login

# 5. Deploy worker
cd workers
wrangler deploy
```

#### Scenario 2: Database Restoration
```bash
# 1. Create new database
wrangler d1 create librarycard-db-restored

# 2. Update wrangler.toml with new database ID

# 3. Apply schema
wrangler d1 execute librarycard-db-restored --file=schema.sql

# 4. Restore data (see Data Restoration section)
```

#### Scenario 3: Complete Infrastructure Restoration
1. **Create new D1 database**
2. **Update wrangler.toml** with new database ID
3. **Deploy worker** with new configuration
4. **Apply database schema**
5. **Restore data** using backup scripts
6. **Update frontend** environment variables
7. **Test complete system**

### Data Restoration (D1 Database)

Due to D1 platform limitations, data restoration requires manual steps:

#### Export Current Data
```bash
# Run the data backup script from backup
./backup-d1-data.sh
```

#### Import Data to New Database
```bash
# Create restoration script for each table
# Example for users table:
wrangler d1 execute new-db-name --command="
INSERT INTO users (id, email, first_name, ...)
VALUES ('user1', 'user@example.com', 'John', ...);
"

# Repeat for each table with actual data
```

#### Automated Data Migration (When Available)
```bash
# Future: When D1 supports direct import/export
wrangler d1 export source-db > backup.sql
wrangler d1 import target-db < backup.sql
```

## Emergency Recovery Procedures

### Scenario 1: Frontend Down
1. **Quick Deploy**: Use latest GitHub release backup
2. **Extract and Deploy**: Follow frontend restoration
3. **Verify**: Test critical functionality
4. **Monitor**: Check for any missing features

### Scenario 2: Backend/Database Issues
1. **Worker Issues**: Redeploy from backup using `wrangler deploy`
2. **Database Issues**: Create new DB, apply schema, restore critical data
3. **Gradual Restoration**: Restore data in priority order (users, locations, books)

### Scenario 3: Complete Infrastructure Loss
1. **Prioritize**: Start with worker deployment and database schema
2. **Core Functionality**: Get basic book scanning working
3. **Data Recovery**: Restore user data and core books
4. **Full Restoration**: Complete data restoration in background

## Backup Verification

### Regular Verification Tasks
```bash
# Monthly verification
# 1. Download latest backup
# 2. Test restoration in development environment
# 3. Verify all functionality works
# 4. Check data integrity
```

### Verification Checklist
- [ ] Backup files download successfully
- [ ] Source code extracts without errors
- [ ] Dependencies install correctly
- [ ] Application builds successfully
- [ ] Database schema applies cleanly
- [ ] Sample data restores properly
- [ ] All major features function correctly

## Backup Best Practices

### Frequency
- **Automated**: Daily backups via GitHub Actions
- **Manual**: Before major changes or deployments
- **Data**: Export critical data before schema changes

### Storage
- **Primary**: GitHub Releases (automated)
- **Secondary**: Local backups for immediate access
- **Archive**: Consider external storage for long-term retention

### Security
- **Access Control**: Limit who can access production backups
- **Encryption**: Consider encrypting sensitive backup data
- **Verification**: Regular restore testing in development

### Monitoring
- **Backup Success**: Monitor GitHub Actions for failures
- **Storage Usage**: Monitor GitHub storage usage
- **Retention**: Periodically clean up old backups

## Troubleshooting Backup Issues

### GitHub Actions Failures
```bash
# Check workflow logs in GitHub Actions tab
# Common issues:
# 1. Missing secrets (CLOUDFLARE_API_TOKEN)
# 2. Permission issues with database access
# 3. Build failures due to dependency issues
```

### Manual Script Failures
```bash
# Frontend backup issues
npm install           # Ensure dependencies are installed
npm run build        # Verify build works
./scripts/backup-netlify.sh

# Backend backup issues
wrangler auth login  # Ensure authenticated
wrangler whoami     # Verify authentication
./scripts/backup-cloudflare.sh
```

### Restoration Issues
- **Database Name Mismatches**: Check wrangler.toml configuration
- **Permission Errors**: Verify Cloudflare API token permissions
- **Build Failures**: Ensure Node.js version compatibility
- **Missing Environment Variables**: Check .env.local configuration

## Recovery Testing

### Monthly Recovery Test
1. **Download latest backup**
2. **Set up clean test environment**
3. **Follow complete restoration procedure**
4. **Test all major functionality**
5. **Document any issues discovered**
6. **Update procedures if needed**

### Emergency Drill
1. **Simulate complete infrastructure loss**
2. **Time the recovery process**
3. **Identify bottlenecks and issues**
4. **Update emergency procedures**
5. **Train team on recovery process**

## Contact and Support

### Emergency Contacts
- **Primary Admin**: Check CLAUDE.md for current admin
- **Cloudflare Support**: For D1 and Workers issues
- **Netlify Support**: For frontend deployment issues

### Documentation
- [Development Workflow](./development-workflow.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Local Development Setup](./local-development-setup.md)

---

**Remember**: The best backup is one you've tested restoring from. Regular verification of backup and restore procedures is essential for reliable disaster recovery.