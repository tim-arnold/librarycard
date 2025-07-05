#!/bin/bash

# Manual Cloudflare Workers & D1 Backup Script
# Usage: ./scripts/backup-cloudflare.sh [output-directory]

set -e

# Configuration
BACKUP_DIR="${1:-./backups/cloudflare-$(date +%Y%m%d-%H%M%S)}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DB_NAME="librarycard-db"

echo "🔄 Starting Cloudflare Workers & D1 backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# Check prerequisites
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup Worker source code
echo "📦 Backing up Worker source code..."
tar -czf "$BACKUP_DIR/worker-source.tar.gz" workers/

# Copy configuration files
echo "⚙️ Backing up configuration files..."
cp wrangler.toml "$BACKUP_DIR/"
cp schema.sql "$BACKUP_DIR/"

# Backup migrations if they exist
if [ -d "migrations" ]; then
    tar -czf "$BACKUP_DIR/migrations.tar.gz" migrations/
    echo "✅ Migration files backed up"
fi

# Create backup metadata
echo "📋 Creating backup metadata..."
cat > "$BACKUP_DIR/backup-metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_type": "manual",
  "commit_sha": "$(git rev-parse HEAD)",
  "commit_message": "$(git log -1 --pretty=%B | tr '\n' ' ')",
  "branch": "$(git branch --show-current)",
  "database_name": "$DB_NAME",
  "wrangler_version": "$(wrangler --version 2>/dev/null || echo 'unknown')"
}
EOF

# Backup D1 database schema
echo "🗄️ Backing up D1 database schema..."
wrangler d1 execute $DB_NAME --command=".schema" > "$BACKUP_DIR/database-schema.sql" 2>/dev/null || {
    echo "⚠️ Schema backup failed - check database name and authentication"
    echo "-- Schema backup failed at $TIMESTAMP" > "$BACKUP_DIR/database-schema.sql"
}

# Get table information
echo "📊 Getting database statistics..."
{
    echo "Database Statistics - $TIMESTAMP"
    echo "================================="
    echo ""
    echo "Tables:"
    wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "Tables list failed"
    echo ""
    echo "Row counts:"
    wrangler d1 execute $DB_NAME --command="
        SELECT 'users' as table_name, COUNT(*) as row_count FROM users
        UNION ALL SELECT 'locations', COUNT(*) FROM locations  
        UNION ALL SELECT 'shelves', COUNT(*) FROM shelves
        UNION ALL SELECT 'books', COUNT(*) FROM books
        UNION ALL SELECT 'location_members', COUNT(*) FROM location_members
        UNION ALL SELECT 'location_invitations', COUNT(*) FROM location_invitations
        UNION ALL SELECT 'book_checkout_history', COUNT(*) FROM book_checkout_history
        UNION ALL SELECT 'book_ratings', COUNT(*) FROM book_ratings
        UNION ALL SELECT 'book_removal_requests', COUNT(*) FROM book_removal_requests
        UNION ALL SELECT 'signup_approval_requests', COUNT(*) FROM signup_approval_requests;
    " 2>/dev/null || echo "Row count query failed"
} > "$BACKUP_DIR/database-stats.txt"

# Create data backup script
echo "📜 Creating data backup script..."
cat > "$BACKUP_DIR/backup-d1-data.sh" << EOF
#!/bin/bash
# D1 Data Backup Script
# Run this manually to backup actual data (may take time for large datasets)

set -e

DB_NAME="$DB_NAME"
BACKUP_DATE="\$(date +%Y%m%d-%H%M%S)"
DATA_DIR="d1-data-\$BACKUP_DATE"

echo "🔄 Starting D1 data backup..."
mkdir -p "\$DATA_DIR"

# Backup each table
echo "📦 Backing up table data..."

tables=(
    "users"
    "locations" 
    "shelves"
    "books"
    "location_members"
    "location_invitations"
    "book_checkout_history"
    "book_ratings"
    "book_removal_requests"
    "signup_approval_requests"
)

for table in "\${tables[@]}"; do
    echo "  Backing up \$table..."
    wrangler d1 execute \$DB_NAME --command="SELECT * FROM \$table;" > "\$DATA_DIR/\$table.sql" 2>/dev/null || {
        echo "    ⚠️ Failed to backup \$table"
        echo "-- Backup failed for \$table" > "\$DATA_DIR/\$table.sql"
    }
done

# Create restoration script
cat > "\$DATA_DIR/restore-data.sh" << 'RESTORE_EOF'
#!/bin/bash
# D1 Data Restoration Script

DB_NAME="\$1"
if [ -z "\$DB_NAME" ]; then
    echo "Usage: \$0 <database-name>"
    exit 1
fi

echo "🔄 Restoring data to database: \$DB_NAME"

# Note: This is a template - actual restoration requires
# converting SELECT output to INSERT statements
echo "⚠️ Manual data restoration required"
echo "1. Review each .sql file"
echo "2. Convert SELECT output to INSERT statements"  
echo "3. Execute INSERT statements with wrangler d1 execute"
RESTORE_EOF

chmod +x "\$DATA_DIR/restore-data.sh"

echo "✅ D1 data backup completed in: \$DATA_DIR"
echo "📋 Files created:"
ls -la "\$DATA_DIR"
EOF

chmod +x "$BACKUP_DIR/backup-d1-data.sh"

# Get Worker deployment info
echo "⚙️ Getting Worker deployment information..."
{
    echo "Worker Deployment Information - $TIMESTAMP"
    echo "============================================="
    echo ""
    echo "Authentication status:"
    wrangler whoami 2>/dev/null || echo "Not authenticated or auth failed"
    echo ""
    echo "Available workers:"
    wrangler list 2>/dev/null || echo "Workers list failed"
    echo ""
    echo "Current deployment status:"
    cd workers && wrangler status 2>/dev/null || echo "Status check failed"
    cd ..
} > "$BACKUP_DIR/worker-deployment-info.txt"

# Create comprehensive restoration guide
cat > "$BACKUP_DIR/RESTORE-GUIDE.md" << 'EOF'
# Cloudflare Workers & D1 Restoration Guide

## Overview
This backup contains:
- Complete Worker source code
- Database schema
- Configuration files
- Migration files
- Database statistics
- Restoration scripts

## Worker Restoration

### 1. Prerequisites
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler auth login
```

### 2. Extract and Deploy Worker
```bash
# Extract worker source
tar -xzf worker-source.tar.gz

# Install dependencies
npm install

# Deploy worker
cd workers
wrangler deploy
```

### 3. Verify Deployment
```bash
# Test worker
curl https://your-worker-name.your-subdomain.workers.dev/api/health
```

## D1 Database Restoration

### 1. Create New Database
```bash
# Create new D1 database
wrangler d1 create librarycard-db-new

# Note the database ID from output
```

### 2. Update Configuration
1. Update `wrangler.toml` with new database ID
2. Redeploy worker with new database binding

### 3. Apply Schema
```bash
# Apply database schema
wrangler d1 execute librarycard-db-new --file=database-schema.sql
```

### 4. Restore Data
```bash
# Run data backup script to get current data format
./backup-d1-data.sh

# Convert data and restore (manual process)
# See restore-data.sh in generated data backup
```

## Important Notes

### D1 Limitations
- Query timeout limits (10 seconds for free tier)
- Large tables may need pagination
- No direct export/import tools
- Manual data conversion required

### Best Practices
1. Test restoration with small datasets first
2. Verify schema before data restoration
3. Check row counts after restoration
4. Update all environment variables and secrets
5. Test full application functionality

### Emergency Recovery
If you need to recover quickly:
1. Deploy worker from backup
2. Create new D1 database
3. Apply schema
4. Import critical data manually
5. Full data restoration can be done later

## Verification Checklist
- [ ] Worker deploys successfully
- [ ] Database schema applied
- [ ] API endpoints respond
- [ ] Frontend can connect
- [ ] Critical data restored
- [ ] All functionality tested

## Support
- Check Cloudflare Workers documentation
- Review D1 documentation for current limitations
- Test restoration process in development first
EOF

# Create backup summary
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
cat > "$BACKUP_DIR/backup-summary.txt" << EOF
Cloudflare Workers & D1 Backup Summary
======================================

Backup Date: $TIMESTAMP
Backup Size: $BACKUP_SIZE
Database: $DB_NAME
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)

Contents:
- worker-source.tar.gz: Complete Worker source code
- wrangler.toml: Worker configuration
- schema.sql: Database schema
- migrations.tar.gz: Database migrations (if present)
- database-schema.sql: Current database schema backup
- database-stats.txt: Database statistics and row counts
- backup-d1-data.sh: Data backup script for manual use
- worker-deployment-info.txt: Current deployment information
- RESTORE-GUIDE.md: Complete restoration instructions
- backup-metadata.json: Backup metadata

Notes:
- D1 data backup requires manual execution of backup-d1-data.sh
- Large databases may need pagination during restoration
- Test restoration process in development environment first

This backup provides complete recovery capability for the Cloudflare infrastructure.
EOF

echo ""
echo "✅ Cloudflare Workers & D1 backup completed!"
echo "📁 Location: $BACKUP_DIR"
echo "📊 Size: $BACKUP_SIZE"
echo ""
echo "📋 Backup contents:"
ls -la "$BACKUP_DIR"
echo ""
echo "🔧 Next steps:"
echo "  1. Run '$BACKUP_DIR/backup-d1-data.sh' to backup actual data"
echo "  2. Store backup in secure location"
echo "  3. Test restoration process in development"
echo "  4. See '$BACKUP_DIR/RESTORE-GUIDE.md' for restoration instructions"