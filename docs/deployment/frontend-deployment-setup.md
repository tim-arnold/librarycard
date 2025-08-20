# Frontend Deployment Control - Setup Guide

This guide explains how to set up and use the new frontend deployment control options for LibraryCard.

## Overview

LibraryCard now supports 4 deployment types:
- **`worker-only`** - Deploy API/backend only
- **`automated-migrations`** - Deploy API + run database migrations  
- **`full-deployment`** - Deploy API + migrations + frontend
- **`frontend-only`** - Deploy frontend only

## Setup Requirements

### 1. Netlify Build Hooks

You need to set up Netlify build hooks and add them as GitHub Secrets.

#### Creating Build Hooks
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Navigate to your LibraryCard site
3. Go to **Site Settings** → **Build & Deploy** → **Build Hooks**
4. Click **Add build hook**
5. Name it (e.g., "Production Frontend Deploy")
6. Select the branch (usually `main` for production)
7. Copy the generated webhook URL

#### Required GitHub Secrets
Add these secrets to your GitHub repository:

- **`NETLIFY_PROD_BUILD_HOOK`** - Production Netlify build hook URL
- **`NETLIFY_STAGING_BUILD_HOOK`** - Staging Netlify build hook URL

**To add secrets:**
1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret with the webhook URL as the value

## Usage

### Production Deployment
1. Go to **Actions** tab in GitHub
2. Select **"🚀 Production Deployment"** workflow
3. Click **Run workflow**
4. Choose your deployment type:
   - **frontend-only**: For UI changes, legal pages, styling
   - **worker-only**: For API changes, bug fixes
   - **automated-migrations**: For API + database changes
   - **full-deployment**: For coordinated frontend + backend changes
5. Fill in required fields and run

### Staging Deployment
Staging has two modes:

#### Auto-Deploy (Default)
- Pushes to `staging` branch automatically deploy backend + frontend
- Uses the existing auto-deploy behavior

#### Manual Deploy (New)
1. Go to **Actions** → **"Staging Auto-Deploy"**
2. Click **Run workflow**
3. Select deployment type (same 4 options as production)
4. Manually trigger specific components

## Use Cases

### Frontend-Only Deployment
**When to use:**
- UI updates, new components
- Legal pages, documentation
- Styling changes, theme updates
- Bug fixes in client-side code

**Benefits:**
- Fast deployment (no backend build)
- No backend disruption
- Perfect for design/UX work

### Worker-Only Deployment  
**When to use:**
- API bug fixes
- Backend logic changes
- Worker configuration updates
- Performance improvements

**Benefits:**
- No unnecessary frontend builds
- Faster deployment cycle
- Ideal for backend-focused work

### Full Deployment
**When to use:**
- New features requiring both frontend and backend
- Major version releases
- Coordinated API + UI changes

**Benefits:**
- Ensures frontend/backend compatibility
- Single deployment process
- Complete system update

## Safety Features

All existing safety measures are maintained:
- **Production**: Requires `CONFIRM-PRODUCTION` confirmation
- **Branch validation**: Must run from correct branch
- **Staging health checks**: Validates staging before production
- **Rollback instructions**: Clear rollback procedures for each type

## Monitoring

### Build Status
- Netlify builds can be monitored at: https://app.netlify.com
- GitHub Actions logs show detailed deployment progress
- Frontend verification includes retry logic and clear error messages

### Verification
- **Frontend verification**: Tests site accessibility after deployment
- **API verification**: Tests worker health endpoints
- **Comprehensive health checks**: Validates complete system

## Troubleshooting

### Build Hook Not Configured
**Error**: `NETLIFY_PROD_BUILD_HOOK secret not configured`
**Solution**: Add the required GitHub Secrets (see Setup section above)

### Frontend Build Failed
**Error**: Frontend verification fails after build trigger
**Solutions**:
1. Check Netlify dashboard for build errors
2. Verify build hook URL is correct
3. Ensure branch configuration matches in Netlify
4. Check for environment variable issues

### Frontend Takes Too Long
**Issue**: Build timeout or slow verification
**Solutions**:
1. Current implementation waits 3 minutes for builds
2. Future enhancement will poll Netlify API for real-time status
3. Check Netlify build performance in dashboard

## Rollback Procedures

### Frontend Rollback
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Navigate to your LibraryCard site
3. Click **Deploys**
4. Find the last successful deploy
5. Click **Publish deploy**
6. Rollback is immediate

### Backend Rollback
- Use existing backup/restore procedures
- Worker rollbacks through Cloudflare dashboard
- Database rollbacks using automated backup system

## Future Enhancements

**Planned improvements:**
- Real-time Netlify build status polling
- Intelligent build completion detection
- Build status notifications
- Advanced error handling and retry logic

## Getting Help

- **Deployment issues**: Check GitHub Actions logs and Netlify dashboard
- **Build hook setup**: See Netlify documentation
- **General support**: Refer to main LibraryCard documentation

---

**Last updated**: August 2025