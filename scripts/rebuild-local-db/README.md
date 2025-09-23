# Local Database Rebuild Scripts

This directory contains scripts for rebuilding your local development database with **real production data**.

## Quick Start

```bash
# Interactive restore with local or remote backup options
cd scripts/rebuild-local-db
node restore-local-db-from-prod.js

# Choose option:
# 1. Use existing backup (lists available files in /cloudflare)
# 2. Download fresh backup (prompts for release name)
```

### Prerequisites for Remote Downloads
- **GitHub CLI**: Install with `brew install gh` (macOS) or [other methods](https://cli.github.com/)
- **Authentication**: Run `gh auth login` to authenticate with GitHub
- **Repository Access**: Must have access to the private `tim-arnold/libarycard` repository

## Scripts

### `restore-local-db-from-prod.js`
**Main script** - Interactive database restore workflow:
1. **Choice prompt**: Use local backup or download fresh one
2. **Local option**: Lists available backups in `/cloudflare` directory
3. **Remote option**: Cleans `/cloudflare`, downloads tar.gz from GitHub releases
4. **Smart extraction**: Parses release name to find correct backup file
5. **Database wipe**: Removes existing local database (`rm -rf .wrangler/state`)
6. **Import**: Runs `import-production-data.js` to rebuild from backup
7. **Completion**: Creates all tables, views, and imports real data

**Backup Format**: Downloads `cloudflare-backup-YYYYMMDD.tar.gz` files from GitHub releases

### `import-production-data.js`
**Core import engine** - Imports production data:
- Reads from `./cloudflare/prod-backup-*.json`
- Creates tables dynamically from production data structure
- Imports 500+ rows across 20+ tables
- Creates essential views (`library_ratings_agg`)

### `create-test-user.js`
**Test user utility** - Creates local test user:
- Email: `test@localhost.dev`
- Password: `password`
- Role: `admin`

## What You Get

✅ **Real production data**: 100+ real books, real users, real locations
✅ **Complete schema**: All tables, views, relationships
✅ **Working features**: Series, ratings, checkout history, permissions
✅ **Test user**: Ready-to-use local login credentials

## Replaces Legacy Scripts

This system replaces the older fake data approach:
- ~~`setup-local-db.js`~~ - Used schema.sql + migrations + fake data
- ~~`seed-local-data.js`~~ - Generated 40 fake books with hardcoded data

## Production Backup

The import requires a production backup file in `./cloudflare/prod-backup-*.json`.
These are created by `scripts/backup-production.js` and available in GitHub releases.