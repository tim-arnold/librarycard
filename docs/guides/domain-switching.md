# Domain Switching Guide

**LCWEB-184**: Centralized Domain Configuration System

LibraryCard now supports seamless domain switching through centralized configuration. This guide explains how to change your domain with minimal effort.

## Overview

Domain changes in LibraryCard require only:
1. ✅ **Configuration updates** (environment variables)
2. ✅ **DNS changes** (external)
3. ❌ **No database migration needed** (LibraryCard uses relative paths)

## Quick Domain Switch

### Using the Domain Switching Script

```bash
# Local development
npm run switch-domain mynewdomain.com

# Staging environment
npm run switch-domain staging.mynewdomain.com --staging

# Production environment (requires confirmation)
npm run switch-domain mynewdomain.com --production --confirm
```

### Manual Environment Variable Updates

For each environment, update these variables:

**Local Development** (`.env.local`):
```env
DOMAIN=mynewdomain.com
EMAIL_DOMAIN=mynewdomain.com
```

**Staging** (`wrangler.staging-new.toml`):
```toml
DOMAIN = "staging.mynewdomain.com"
EMAIL_DOMAIN = "mynewdomain.com"
```

**Production** (`wrangler.prod.toml`):
```toml
DOMAIN = "mynewdomain.com"
EMAIL_DOMAIN = "mynewdomain.com"
API_SUBDOMAIN = "api"  # Optional: creates api.mynewdomain.com
```

## What Gets Updated Automatically

The centralized domain configuration automatically updates:

### Frontend URLs
- Main application URL
- API endpoint URLs
- Authentication redirects

### Backend Configuration
- CORS allowed origins
- WebAuthn domain settings
- Email template URLs

### Email Addresses
- System email sender addresses
- Support and admin email addresses
- Notification email addresses

### Image Storage URLs
- Custom book cover images
- R2 storage public URLs

## Deployment Steps

### 1. Update Configuration
```bash
# Use the switching script or manually update environment variables
npm run switch-domain mynewdomain.com --production --confirm
```

### 2. Deploy Workers
```bash
# Deploy with new domain configuration
npm run deploy:prod
```

### 3. Update DNS Records
Point your new domain to:
- **Frontend**: Netlify deployment
- **API**: Cloudflare Workers custom domain (if using subdomain)
- **Images**: R2 public domain (if using custom images domain)

### 4. Update External Services

**OAuth Providers** (Google, etc.):
- Update redirect URLs to new domain
- Update authorized origins

**Email Services** (Resend, Postmark):
- Verify new domain for email sending
- Update SPF/DKIM records

**CDN/SSL**:
- Update SSL certificates
- Configure CDN settings for new domain

## Validation

### Check Domain Configuration
```bash
# Validate all domain references are centralized
npm run validate-domain-config
```

### Test New Domain
1. **Frontend**: Verify application loads at new domain
2. **API**: Test API calls work from new frontend domain
3. **Authentication**: Test login/logout functionality
4. **Email**: Test password reset and notification emails
5. **Image Upload**: Test custom book cover uploads (if applicable)

## Rollback

If issues arise, rollback is simple:

### Immediate Rollback
```bash
# Switch back to previous domain
npm run switch-domain oldddomain.com --production --confirm

# Redeploy
npm run deploy:prod
```

### DNS Rollback
1. Point DNS back to old domain
2. Revert OAuth and email service settings
3. Test all functionality

## Architecture Benefits

LibraryCard's domain-agnostic architecture means:

✅ **No database changes needed** - All URLs stored as relative paths
✅ **No user data affected** - Email addresses remain unchanged
✅ **No hardcoded references** - All domains computed from configuration
✅ **Environment consistency** - Same process works for all environments

## Troubleshooting

### Common Issues

**CORS Errors**:
- Verify `DOMAIN` environment variable is set correctly
- Check that frontend and API domains match configuration

**Authentication Issues**:
- Update OAuth provider redirect URLs
- Verify WebAuthn domain configuration
- Check session cookie domain settings

**Email Not Working**:
- Verify email domain DNS records (SPF, DKIM)
- Check email service domain verification
- Test with domain email validation tools

**Image Loading Issues**:
- Update R2 custom domain settings
- Verify image subdomain DNS configuration
- Clear browser cache

### Getting Help

If you encounter issues:

1. **Check Configuration**: Run `npm run validate-domain-config`
2. **Check Build**: Run `npm run build` to verify no TypeScript errors
3. **Check Logs**: Use `npx wrangler tail` to see worker logs
4. **Test Staging**: Always test domain changes in staging first

## Script Reference

### Domain Switching Script Options

```bash
node scripts/switch-domain.js <domain> [options]

Options:
  --staging          Update staging environment
  --production       Update production environment
  --confirm          Skip confirmation prompt (required for production)
  --help, -h         Show help message
```

### Validation Script

```bash
node scripts/validate-domain-config.js

# Scans codebase for hardcoded domain references
# Reports centralized vs hardcoded references
# Ensures all domains use centralized configuration
```

---

**Related**: [LCWEB-184 Implementation Plan](../specs/centralized-domain-config.md)
**Updated**: September 2025