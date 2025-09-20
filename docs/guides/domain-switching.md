# Complete Domain Switching Guide (Same-Account Cloudflare)

**LCWEB-184**: Centralized Domain Configuration System

This guide provides step-by-step instructions for switching LibraryCard to a new domain when both current and new domains are registered with Cloudflare and managed in the same account.

## Overview

Domain changes in LibraryCard require:
1. ✅ **Application configuration updates** (environment variables)
2. ✅ **External service configurations** (Netlify, Resend, OAuth)
3. ✅ **DNS record configuration** (within same Cloudflare account)
4. ❌ **No database migration needed** (LibraryCard uses relative paths)
5. ❌ **No nameserver changes needed** (same Cloudflare account)

## Same-Account Cloudflare Benefits

Since both domains are in your existing Cloudflare account:
- ⚡ **Instant DNS changes** - No propagation delays between providers
- 🏗️ **Existing infrastructure** - Workers, D1, R2 already configured
- 🎛️ **Unified management** - All domains in one dashboard
- 🔄 **Simplified rollback** - Instant DNS record changes if needed
- ⏱️ **Faster migration** - Reduced complexity and wait times (1-2 hours vs 2-4 hours)

## Prerequisites

Before starting, ensure you have admin access to:
- ⚡ **Cloudflare account** (same account managing current domain)
- ☁️ **Netlify** (frontend hosting)
- 📧 **Resend** (email service)
- 🔐 **Google Cloud Console** (OAuth configuration)
- 📱 **Any other OAuth providers** you've configured

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

## Complete Domain Migration Process

### Phase 1: Prepare New Domain

#### 1.1 Domain Registration (Cloudflare)
- Register your new domain with Cloudflare Registrar
- Domain automatically appears in your existing Cloudflare account
- No nameserver configuration needed (already using Cloudflare)

#### 1.2 Plan Migration Timeline
- **Recommended**: Off-peak hours for your users
- **Duration**: 1-2 hours for complete migration (simplified process)
- **Downtime**: ~5-10 minutes during DNS record activation
- **Advantage**: No cross-provider coordination needed

### Phase 2: External Service Configuration

#### 2.1 Cloudflare DNS Configuration

**A. Domain Already Available**
Since your new domain is registered with Cloudflare, it's already in your account dashboard - no site addition needed.

**B. Configure DNS Records**
In your Cloudflare dashboard, go to the new domain and add these DNS records:
```
Type    Name    Content                             Proxy Status
CNAME   @       librarycard.netlify.app            Proxied
CNAME   api     librarycard-api-production.tim-arnold.workers.dev    Proxied
CNAME   images  pub-d1960ed90aca4c518d42d3f1cdeafac2.r2.dev    Proxied
TXT     @       v=spf1 include:resend.com ~all      DNS only
CNAME   _resend @resend.io                          DNS only
```

**C. Workers Custom Domain Setup**
1. Go to Workers & Pages → Your Worker → Settings → Triggers
2. Click "Add Custom Domain"
3. Enter `api.yournewdomain.com`
4. Wait for SSL certificate provisioning (~5-10 minutes)

**D. R2 Custom Domain (Optional)**
1. Go to R2 Object Storage → Your Bucket → Settings
2. Click "Connect Domain"
3. Enter `images.yournewdomain.com`
4. Configure DNS record as instructed

#### 2.2 Netlify Configuration

**A. Update Site Domain**
1. Log in to [Netlify Dashboard](https://app.netlify.com)
2. Go to your LibraryCard site → Site Settings → Domain Management
3. Click "Add custom domain"
4. Enter your new domain: `yournewdomain.com`
5. Follow DNS verification steps

**B. SSL Certificate**
- Netlify automatically provisions SSL certificates
- Wait for "Certificate provisioned" status (~10-15 minutes)

**C. Environment Variables**
1. Go to Site Settings → Build & deploy → Environment variables
2. Update `NEXT_PUBLIC_API_URL` to: `https://api.yournewdomain.com`
3. Trigger a new deployment

#### 2.3 Resend Email Configuration

**A. Add New Domain**
1. Log in to [Resend Dashboard](https://resend.com/dashboard)
2. Go to Domains → Add Domain
3. Enter your new domain (e.g., `yournewdomain.com`)
4. Copy the DNS records provided

**B. Configure DNS Records at Cloudflare**
Add these records to your Cloudflare DNS:
```
Type    Name                Content                     Proxy Status
TXT     @                   v=spf1 include:resend.com ~all    DNS only
CNAME   resend._domainkey   [provided by Resend]       DNS only
TXT     _dmarc              v=DMARC1; p=none;          DNS only
```

**C. Verify Domain**
- Wait for DNS propagation (~15-30 minutes)
- Click "Verify" in Resend dashboard
- Status should change to "Verified"

#### 2.4 Google OAuth Configuration

**A. Update OAuth Client**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Update "Authorized JavaScript origins":
   - Add: `https://yournewdomain.com`
   - Keep old domain temporarily for rollback
5. Update "Authorized redirect URIs":
   - Add: `https://yournewdomain.com/api/auth/callback/google`
   - Keep old domain temporarily

**B. Test OAuth Flow**
- Test login with Google after domain switch
- Remove old domain entries after successful testing

### Phase 3: Application Configuration

#### 3.1 Update LibraryCard Configuration
```bash
# Switch to new domain (production)
npm run switch-domain yournewdomain.com --production --confirm

# Verify configuration
npm run validate-domain-config

# Build and test
npm run build
```

#### 3.2 Deploy Updated Configuration
```bash
# Deploy workers with new domain config
npm run deploy:prod

# Verify deployment
curl https://api.yournewdomain.com/health
```

### Phase 4: DNS Activation

#### 4.1 Activate DNS Records
Since both domains are in the same Cloudflare account:
1. DNS records are instantly active (no nameserver changes needed)
2. SSL certificates begin provisioning immediately
3. Custom domains start resolving within 1-2 minutes

#### 4.2 Verify DNS Resolution
- **Time**: 1-2 minutes for record activation
- **Check**: Use `dig yournewdomain.com` to verify resolution
- **Verify**: Visit `https://yournewdomain.com` in browser (may take 5-10 minutes for SSL)

### Phase 5: Testing & Validation

#### 5.1 Comprehensive Testing Checklist

**Frontend Testing**:
- [ ] Application loads at `https://yournewdomain.com`
- [ ] All pages render correctly
- [ ] No console errors
- [ ] Images and assets load properly

**API Testing**:
- [ ] API health check: `https://api.yournewdomain.com/health`
- [ ] Authentication works (login/logout)
- [ ] Book operations (add, edit, delete)
- [ ] Location management
- [ ] Search functionality

**Email Testing**:
- [ ] Password reset emails send and deliver
- [ ] Registration emails work
- [ ] Notification emails deliver
- [ ] Email links redirect to new domain

**Authentication Testing**:
- [ ] Google OAuth login works
- [ ] Email/password login works
- [ ] Session persistence across domain
- [ ] WebAuthn/passkeys work (if enabled)

#### 5.2 Performance Verification
```bash
# Check site speed
curl -w "@curl-format.txt" -o /dev/null -s "https://yournewdomain.com"

# Test API response times
curl -w "%{time_total}\n" -o /dev/null -s "https://api.yournewdomain.com/health"
```

### Phase 6: Post-Migration Cleanup

#### 6.1 Update External References
- **Documentation**: Update any hardcoded references
- **Marketing materials**: Update website URLs
- **Social media**: Update profile links
- **Email signatures**: Update domain references

#### 6.2 Monitor for Issues
- **24-48 hours**: Monitor error logs and user reports
- **Check analytics**: Verify traffic is reaching new domain
- **Email deliverability**: Monitor email bounce rates

#### 6.3 Old Domain Handling
**Option A: Redirect (Recommended)**
- Keep old domain active for 30-90 days
- Set up 301 redirects to new domain
- Gradually phase out old domain

**Option B: Immediate Cutover**
- Remove old domain configurations
- Clean up OAuth and email settings
- Monitor for any lingering references

## Emergency Rollback Procedure

If critical issues arise, quick rollback steps (same-account Cloudflare):

### 1. Immediate DNS Rollback (Instant)
```bash
# In Cloudflare dashboard:
# 1. Go to old domain DNS settings
# 2. Re-enable/update DNS records
# 3. Changes are instant - no propagation delay
```

### 2. Application Rollback
```bash
# Switch back to old domain configuration
npm run switch-domain oldomain.com --production --confirm

# Redeploy workers
npm run deploy:prod
```

### 3. Service Rollback
- **Netlify**: Switch custom domain back to old domain (instant)
- **OAuth**: Old domain should still be in authorized origins (if kept)
- **Email**: Old domain verification remains active in Resend
- **Workers**: Custom domain changes are instant in same account

## Advanced Configuration

### Custom API Subdomain
If you want `api.yournewdomain.com`:
```bash
# Set API subdomain in environment
DOMAIN=yournewdomain.com
API_SUBDOMAIN=api
```

### Custom Images Domain
For `images.yournewdomain.com`:
1. Configure R2 custom domain in Cloudflare
2. Update DNS records as provided
3. No application changes needed (automatically configured)

### Multiple Environment Domains
```bash
# Development
npm run switch-domain dev.yournewdomain.com --staging

# Production
npm run switch-domain yournewdomain.com --production --confirm
```

## Security Considerations

### SSL/TLS Certificates
- **Cloudflare**: Automatic SSL (Full/Strict mode recommended)
- **Netlify**: Automatic Let's Encrypt certificates
- **Monitor**: Check certificate expiration dates

### CORS Configuration
- LibraryCard automatically updates CORS for new domain
- No manual CORS configuration needed
- Verify with browser developer tools

### Email Security
- **SPF**: `v=spf1 include:resend.com ~all`
- **DKIM**: Configure through Resend
- **DMARC**: Start with `p=none`, gradually strengthen

## Cost Implications

### New Costs
- **Domain registration**: $10-50/year depending on TLD
- **Cloudflare**: Free tier sufficient, Pro ($20/month) for advanced features

### No Additional Costs
- **Netlify**: Same hosting plan
- **Resend**: Same email volume limits
- **Google OAuth**: No additional cost

## Timeline Reference (Same-Account Cloudflare)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Domain registration (Cloudflare) | 5 minutes | Payment method |
| DNS record configuration | 5 minutes | Domain access |
| Resend configuration | 10 minutes | DNS records |
| OAuth updates | 5 minutes | Google Console access |
| Application deployment | 5 minutes | Code access |
| DNS activation | 1-2 minutes | Record creation |
| SSL provisioning | 5-10 minutes | DNS activation |
| Testing & validation | 20 minutes | All services live |
| **Total** | **1-2 hours** | Simplified process |

**Key Advantages:**
- ❌ No nameserver changes needed
- ❌ No DNS propagation delays
- ⚡ Instant DNS record activation
- 🔄 Instant rollback capability

## Common Issues & Solutions

### DNS Issues

**Problem**: Domain not resolving immediately
**Solution**:
```bash
# Check DNS resolution (should be instant)
dig yournewdomain.com
nslookup yournewdomain.com

# If not resolving: Check DNS record configuration in Cloudflare
```

**Problem**: Subdomain not working (api.domain.com)
**Solution**:
- Verify CNAME record in Cloudflare DNS
- Check Cloudflare Workers custom domain setup
- Wait for SSL certificate provisioning (5-10 minutes max)
- Records are instant, SSL takes a few minutes

### SSL Certificate Issues

**Problem**: "Not Secure" or SSL warnings
**Solution**:
- Wait 10-15 minutes for automatic certificate provisioning
- Check Cloudflare SSL/TLS settings (Full or Full/Strict mode)
- Verify domain ownership in Cloudflare

### Email Delivery Issues

**Problem**: Password reset emails not delivering
**Solution**:
```bash
# Check domain verification in Resend
# Verify SPF record
dig TXT yournewdomain.com | grep spf1

# Check DKIM record
dig TXT resend._domainkey.yournewdomain.com
```

### OAuth Login Issues

**Problem**: Google login fails after domain change
**Solution**:
- Verify authorized origins in Google Cloud Console
- Check redirect URIs include new domain
- Clear browser cache and cookies
- Test in incognito mode

### Application Loading Issues

**Problem**: Site loads but API calls fail
**Solution**:
- Check `NEXT_PUBLIC_API_URL` in Netlify environment variables
- Verify Workers deployment with `curl https://api.yournewdomain.com/health`
- Check browser console for CORS errors

### Performance Issues

**Problem**: Site loads slowly after migration
**Solution**:
- Enable Cloudflare proxy (orange cloud) for performance
- Check Cloudflare caching settings
- Monitor Core Web Vitals in browser dev tools

## Pre-Migration Checklist

Before starting your domain migration, ensure you have:

### Access & Credentials
- [ ] Cloudflare account with admin access (same account as current domain)
- [ ] Netlify account with site admin access
- [ ] Resend account with domain management access
- [ ] Google Cloud Console project admin access
- [ ] GitHub repository access (for code deployment)

### Preparation
- [ ] New domain registered with Cloudflare (appears automatically in account)
- [ ] Backup of current configuration files
- [ ] Users notified of planned maintenance window (shorter window needed)
- [ ] Testing plan prepared
- [ ] Rollback plan documented (instant rollback capability)

### Environment Setup
- [ ] Local development environment working
- [ ] Access to staging environment for testing
- [ ] Production deployment access configured

## Post-Migration Monitoring

### Week 1: Critical Monitoring
- **Daily**: Check error logs for domain-related issues
- **Daily**: Monitor email delivery rates
- **Daily**: Verify core functionality (login, book operations)
- **Monitor**: SSL certificate status and renewal dates (no DNS propagation needed)

### Week 2-4: Performance Monitoring
- **Weekly**: Check site performance metrics
- **Weekly**: Review user feedback and support tickets
- **Weekly**: Monitor SEO impact (if applicable)
- **Verify**: All integrations working properly

### Month 1+: Long-term Optimization
- **Remove**: Old domain references from OAuth providers
- **Update**: Any external integrations or webhooks
- **Optimize**: Cloudflare settings for performance
- **Review**: SSL certificate renewal dates

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

## Quick Reference Commands

### Domain Switching
```bash
# Production domain switch
npm run switch-domain yournewdomain.com --production --confirm

# Staging domain switch
npm run switch-domain staging.yournewdomain.com --staging

# Validate configuration
npm run validate-domain-config

# Deploy with new configuration
npm run deploy:prod
```

### Health Checks
```bash
# Check API health
curl https://api.yournewdomain.com/health

# Check frontend response
curl -I https://yournewdomain.com

# Test DNS resolution
dig yournewdomain.com
dig api.yournewdomain.com
```

### Troubleshooting (Same-Account Cloudflare)
```bash
# Check worker logs
npx wrangler tail librarycard-api-production

# Check DNS resolution (instant in same account)
nslookup yournewdomain.com

# Verify SSL certificate
openssl s_client -connect yournewdomain.com:443 -servername yournewdomain.com

# Check Cloudflare SSL status
# Go to domain → SSL/TLS → Overview in Cloudflare dashboard
```

## Support Resources

### Service Documentation
- **Cloudflare**: [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- **Netlify**: [Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- **Resend**: [Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- **Google OAuth**: [Setting up OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### DNS Tools
- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Email Deliverability**: https://mxtoolbox.com

### LibraryCard Resources
- **Implementation Plan**: [LCWEB-184 Spec](../specs/centralized-domain-config.md)
- **Architecture Guide**: [Development Architecture](../development/architecture.md)
- **Deployment Guide**: [Production Deployment](../development/deployment.md)

---

**Created**: September 2025
**Updated**: September 2025
**Version**: 1.0
**Ticket**: [LCWEB-184](https://tim52.atlassian.net/browse/LCWEB-184)