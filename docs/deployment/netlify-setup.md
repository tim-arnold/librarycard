# Netlify Setup Guide

This guide walks you through the initial setup and configuration of LibraryCard on Netlify.

## Prerequisites

1. **Netlify Account**: [Sign up for free](https://app.netlify.com/signup)
2. **GitHub Repository**: Your LibraryCard repo (already done ✅)
3. **Cloudflare Worker**: Your API should be deployed and working (already done ✅)

## Initial Site Setup

### Option A: Web Interface (Recommended)

1. **Go to Netlify Dashboard**: [app.netlify.com](https://app.netlify.com)
2. **Click "Add new site"** → **"Import an existing project"**
3. **Connect to Git provider**: Choose GitHub
4. **Select repository**: Choose your `librarycard` repository
5. **Configure build settings**:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Base directory**: (leave empty)

### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init
```

## Environment Variables Setup

In your Netlify site dashboard:

1. **Go to Site Settings** → **Environment Variables**
2. **Add the following variable**:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-worker-name.your-subdomain.workers.dev`
   
   > Replace with your actual Cloudflare Worker URL from your deployment

## Configuration Files

The repository includes these Netlify-specific files:

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Custom Domain Setup (Optional)

### Using Netlify DNS
1. **Go to Domain Settings** in your site dashboard
2. **Add custom domain**: Enter your domain name
3. **Update nameservers**: Point your domain to Netlify's nameservers
4. **SSL**: Automatically provided by Netlify

### Using External DNS
1. **Add custom domain** in Netlify dashboard
2. **Create CNAME record**: Point to your Netlify site URL
3. **Verify**: Wait for DNS propagation

## Performance Optimization

### Netlify Features
- **CDN**: Global content distribution (automatic)
- **Image optimization**: Built-in with Next.js
- **Branch deploys**: Test changes on feature branches
- **Deploy previews**: Preview pull requests

### Next.js Optimizations
- Code splitting (automatic)
- Static asset optimization
- Image optimization for book covers

## Security Configuration

### Automatic HTTPS
- SSL certificates automatically provisioned
- HTTP redirects to HTTPS
- Security headers configured in `netlify.toml`

### Environment Variables
- Encrypted at rest
- Only available during build
- `NEXT_PUBLIC_*` variables exposed to browser

## Cost Considerations

**Netlify Free Tier**:
- 100 GB bandwidth per month
- 300 build minutes per month
- Unlimited personal sites
- Custom domains included

**Perfect for personal use!** LibraryCard should easily fit within free limits.

## Monitoring and Analytics Setup

### Built-in Analytics
- **Netlify Analytics**: Available in site dashboard
- **Build logs**: Monitor deployment health
- **Function logs**: Debug any issues

### Third-party Integration
- **Google Analytics**: Add tracking code if desired
- **Error monitoring**: Consider Sentry for error tracking

## Advanced Configuration

### Build Hooks
Set up webhooks to trigger builds:
```bash
# Webhook URL (from Netlify dashboard)
curl -X POST https://api.netlify.com/build_hooks/your-hook-id
```

### Branch Deploys
- **Production**: `main` branch → your main domain
- **Staging**: `develop` branch → `develop--yoursite.netlify.app`
- **Feature**: Feature branches → `featurename--yoursite.netlify.app`

### Forms (Future Enhancement)
```html
<!-- Example for contact/feedback form -->
<form netlify>
  <input type="text" name="feedback" />
  <button type="submit">Send Feedback</button>
</form>
```

## Backup Strategy

### Automatic Backups
- **Git repository**: Source code backed up to GitHub
- **Database**: Export library data regularly
- **Build artifacts**: Netlify keeps deploy history

### Manual Backup
```bash
# Export library data from the app
# Use the "Export Library" button in the UI
```

## Next Steps

After initial setup:

1. **Test all features** thoroughly
2. **Set up custom domain** if desired
3. **Configure monitoring** and analytics
4. **Set up branch deploys** for staging
5. **Review security settings**

## Getting Help

- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Community Forum**: [community.netlify.com](https://community.netlify.com)
- **Support**: Available on paid plans

---

**Last updated**: July 2025