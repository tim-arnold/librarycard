#!/bin/bash

# Manual Netlify Frontend Backup Script
# Usage: ./scripts/backup-netlify.sh [output-directory]

set -e

# Configuration
BACKUP_DIR="${1:-./backups/netlify-$(date +%Y%m%d-%H%M%S)}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "🔄 Starting Netlify frontend backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup metadata
echo "📋 Creating backup metadata..."
cat > "$BACKUP_DIR/backup-metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "commit_sha": "$(git rev-parse HEAD)",
  "commit_message": "$(git log -1 --pretty=%B | tr '\n' ' ')",
  "branch": "$(git branch --show-current)",
  "backup_type": "manual",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)"
}
EOF

# Backup configuration files
echo "⚙️ Backing up configuration files..."
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/"
cp netlify.toml "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
cp next.config.js "$BACKUP_DIR/"

# Backup environment template
if [ -f .env.example ]; then
  cp .env.example "$BACKUP_DIR/"
fi

# Create source code backup
echo "📦 Creating source code archive..."
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    -czf "$BACKUP_DIR/source-code.tar.gz" .

# Build the application (if dependencies are installed)
if [ -d "node_modules" ]; then
  echo "🏗️ Building application..."
  npm run build
  
  # Archive build artifacts
  tar -czf "$BACKUP_DIR/build-artifacts.tar.gz" .next
  echo "✅ Build artifacts archived"
else
  echo "⚠️ Dependencies not installed - skipping build"
  echo "Run 'npm install' before backup to include build artifacts"
fi

# Create restoration instructions
cat > "$BACKUP_DIR/RESTORE.md" << EOF
# Netlify Frontend Restoration Guide

## Quick Restore
\`\`\`bash
# 1. Extract source code
tar -xzf source-code.tar.gz

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# 4. Deploy to Netlify
netlify deploy --prod --dir .next
\`\`\`

## Manual Netlify Dashboard Setup
1. **Create new site** in Netlify dashboard
2. **Connect to Git** or upload build artifacts
3. **Configure build settings:**
   - Build command: \`npm run build\`
   - Publish directory: \`.next\`
   - Node version: 18
4. **Set environment variables:**
   - \`NEXT_PUBLIC_API_URL\`: Your Cloudflare Worker URL

## Environment Variables Required
- \`NEXT_PUBLIC_API_URL\`: Points to your Cloudflare Worker API

## Build Information
- **Backup Date:** $TIMESTAMP
- **Git Commit:** $(git rev-parse HEAD)
- **Node.js:** $(node --version)
- **npm:** $(npm --version)

## Verification Steps
1. Build succeeds: \`npm run build\`
2. Linting passes: \`npm run lint\`
3. Application starts: \`npm run dev\`
4. Camera scanning works (HTTPS required)
EOF

# Create backup summary
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
cat > "$BACKUP_DIR/backup-summary.txt" << EOF
Netlify Frontend Backup Summary
==============================

Backup Date: $TIMESTAMP
Backup Size: $BACKUP_SIZE
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)

Contents:
- source-code.tar.gz: Complete source code
- build-artifacts.tar.gz: Built .next directory (if available)
- Configuration files: package.json, netlify.toml, etc.
- backup-metadata.json: Backup metadata
- RESTORE.md: Restoration instructions

This backup can be used to completely restore the LibraryCard frontend.
EOF

echo ""
echo "✅ Netlify frontend backup completed!"
echo "📁 Location: $BACKUP_DIR"
echo "📊 Size: $BACKUP_SIZE"
echo ""
echo "📋 Backup contents:"
ls -la "$BACKUP_DIR"
echo ""
echo "🔧 To restore: see $BACKUP_DIR/RESTORE.md"