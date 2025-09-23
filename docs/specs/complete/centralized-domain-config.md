# Centralized Domain Configuration System (LCWEB-184)

**Jira Ticket**: [LCWEB-184](https://tim52.atlassian.net/browse/LCWEB-184)
**Created**: September 2025
**Status**: In Progress

## Problem Statement

Currently, LibraryCard has domain references scattered throughout the codebase, making domain changes complex and error-prone. The previous domain migration from "libarycard" to "librarycard" required updating 60+ files with 150+ references. When switching to a new domain in the future, this process should be as simple as changing a single configuration setting.

## Current State Analysis

**Current Domain**: `librarycard.tim52.io`
**Architecture**: Netlify (frontend) + Cloudflare Workers (API) + Cloudflare D1 (database)

### Current Domain References Found:
- **Configuration Files**: `wrangler.toml`, `wrangler.prod.toml`, `wrangler.staging-new.toml`
- **Environment Variables**: `APP_URL`, `FROM_EMAIL`, `NEXT_PUBLIC_API_URL`
- **Code References**: Footer component, email templates, worker configurations
- **GitHub Actions**: Backup and deployment workflows
- **Documentation**: 25+ markdown files with example URLs

### Pain Points:
1. **Scattered References**: Domain information duplicated across multiple files
2. **Manual Updates**: Each domain change requires hunting down all references
3. **Error Prone**: Easy to miss references during domain migrations
4. **Environment Inconsistency**: Different patterns for constructing URLs across environments

## Proposed Solution: Centralized Domain Configuration

### Overview
Create a single source of truth for domain configuration that can generate all required URLs and email addresses automatically based on environment settings.

### Phase 1: Core Domain Configuration Module

#### 1.1 Create `src/lib/domainConfig.ts`
```typescript
interface DomainConfig {
  domain: string
  subdomain?: string
  apiSubdomain?: string
  environment: 'local' | 'staging' | 'production'
}

interface ComputedDomainUrls {
  frontendUrl: string
  apiUrl: string
  fromEmail: string
  supportEmail: string
}

export function getDomainConfig(): DomainConfig
export function getComputedUrls(): ComputedDomainUrls
export function getApiBaseUrl(): string  // Enhanced version of existing function
export function getFrontendUrl(): string
export function getFromEmail(): string
```

#### 1.2 Environment-Driven Configuration
- **Local**: `localhost:3000` / `localhost:8787`
- **Staging**: `staging--{project}.netlify.app` / `{project}-staging.workers.dev`
- **Production**: `{domain}` / `api.{domain}` or `{project}.workers.dev`

### Phase 2: Update Core Infrastructure

#### 2.1 Worker Configuration (`workers/`)
- Replace hardcoded `APP_URL` and `FROM_EMAIL` usage
- Use domain config module for email templates
- Update CORS configuration to use computed frontend URL

#### 2.2 Frontend Configuration (`src/`)
- Update `apiConfig.ts` to use enhanced domain configuration
- Replace hardcoded domain references in components
- Update footer and other UI elements to use computed values

#### 2.3 Build Configuration
- Update `wrangler.toml` files to use environment variables consistently
- Simplify environment variable requirements
- Create deployment scripts that use centralized configuration

### Phase 3: Environment Variable Simplification

#### 3.1 Reduced Environment Variables
**Current (Multiple Variables)**:
```env
NEXT_PUBLIC_API_URL=https://api.librarycard.tim52.io
APP_URL=https://librarycard.tim52.io
FROM_EMAIL=LibraryCard <librarian@tim52.io>
```

**Proposed (Single Variable)**:
```env
DOMAIN=librarycard.tim52.io
# OR for custom configurations:
FRONTEND_DOMAIN=librarycard.tim52.io
API_DOMAIN=api.librarycard.tim52.io
EMAIL_DOMAIN=tim52.io
```

#### 3.2 Auto-Generated Configuration
All URLs and email addresses derived automatically:
- Frontend URL: `https://{domain}`
- API URL: `https://api.{domain}` or worker URL based on environment
- From Email: `LibraryCard <librarian@{email_domain}>`
- Support Email: `support@{email_domain}`

### Phase 4: Migration Utilities

#### 4.1 Domain Switching Script
Create `scripts/switch-domain.js`:
```bash
# Usage examples:
npm run switch-domain newdomain.com
npm run switch-domain --staging staging-newdomain.com
npm run switch-domain --production newdomain.com --confirm
```

#### 4.2 Validation Tools
- **Reference Checker**: Scan codebase for hardcoded domain references
- **Configuration Validator**: Verify all environments use centralized config
- **URL Tester**: Automated testing of generated URLs

### Phase 5: Documentation & Guidelines

#### 5.1 Domain Change Process
1. Update single environment variable: `DOMAIN=newdomain.com`
2. Run domain switching script
3. Deploy to staging for testing
4. Deploy to production
5. Update external integrations (DNS, etc.)

#### 5.2 Developer Guidelines
- Never hardcode domain names in code
- Always use domain config functions for URL generation
- Test domain changes in staging before production
- Update documentation examples when adding new features

## Implementation Steps

### Step 1: Create Domain Configuration Module
- [ ] Create `src/lib/domainConfig.ts` with core functions
- [ ] Add comprehensive TypeScript interfaces
- [ ] Implement environment detection logic
- [ ] Add unit tests for domain config functions

### Step 2: Update Core Components
- [ ] Update `src/lib/apiConfig.ts` to use domain config
- [ ] Update Footer component to use computed URLs
- [ ] Update worker email functions to use computed addresses
- [ ] Update CORS configuration in workers

### Step 3: Centralize Worker Configuration
- [ ] Update `workers/email/index.ts` to use domain config
- [ ] Update `workers/auth/` modules for computed URLs
- [ ] Replace hardcoded `APP_URL` usage throughout workers
- [ ] Update wrangler configuration files

### Step 4: Environment Configuration
- [ ] Simplify environment variables in all wrangler files
- [ ] Update `.env.example` with new pattern
- [ ] Update deployment workflows to use new variables
- [ ] Test configuration in all environments

### Step 5: Migration Tools
- [ ] Create domain switching script
- [ ] Create validation tools for checking hardcoded references
- [ ] Add automated tests for domain configuration
- [ ] Create domain change documentation

### Step 6: Documentation Updates
- [ ] Update all example URLs in documentation
- [ ] Create domain switching guide
- [ ] Update deployment guides
- [ ] Update troubleshooting documentation

## Testing Strategy

### Unit Tests
- Domain configuration function outputs
- URL generation across different environments
- Email address computation
- Environment detection logic

### Integration Tests
- API connectivity with computed URLs
- Email sending with computed addresses
- Frontend-to-API communication
- Worker CORS with computed frontend URLs

### End-to-End Tests
- Complete domain switching in staging environment
- Verification that all features work with new domain
- Performance testing to ensure no regression
- Rollback testing to verify easy reversion

## Risk Assessment

### Low Risk Changes
- Creating new domain configuration module
- Adding helper functions without removing existing code
- Documentation updates
- Test environment changes

### Medium Risk Changes
- Updating environment variable patterns
- Modifying worker configurations
- Changing email generation logic
- Updating deployment workflows

### High Risk Changes
- Removing existing hardcoded references
- Production environment variable changes
- DNS and domain changes
- Large-scale configuration updates

## Rollback Strategy

### Immediate Rollback (Environment Variables)
1. Revert environment variables to previous values
2. Redeploy workers with old configuration
3. Verify all services operational

### Code Rollback (Git)
1. Git revert commits related to domain configuration
2. Redeploy frontend and workers
3. Update environment variables if needed

### Infrastructure Rollback (DNS)
1. Revert DNS records to previous domain
2. Update environment variables to match
3. Test all functionality with original domain

## Success Criteria

- [ ] **Single Point of Change**: Domain changes require updating only environment variables
- [ ] **No Hardcoded References**: All domain references use centralized configuration
- [ ] **Environment Consistency**: All environments follow same configuration pattern
- [ ] **Easy Validation**: Automated tools can verify proper configuration
- [ ] **Complete Documentation**: Clear guide for domain changes
- [ ] **Tested Process**: Domain switching verified in staging environment
- [ ] **Backward Compatibility**: Existing functionality unaffected
- [ ] **Performance**: No measurable performance impact from centralized configuration

## Benefits

### For Development
- **Simplified Setup**: New developers need fewer environment variables
- **Consistent Patterns**: All URL generation follows same approach
- **Easy Testing**: Can test with different domains in development
- **Reduced Errors**: Impossible to miss domain references during changes

### For Operations
- **Quick Domain Changes**: Change domain in minutes instead of hours
- **Reliable Process**: Automated validation prevents configuration errors
- **Staging Testing**: Full domain change testing before production
- **Emergency Response**: Quick rollback if issues arise

### For Future Scaling
- **Multi-Domain Support**: Easy to add support for multiple domains
- **Environment Flexibility**: Easy to add new environments
- **Custom Configurations**: Support for complex domain setups
- **Integration Ready**: Easy integration with external domain management tools

---

**Implementation Timeline**: 1-2 weeks
**Priority**: Medium (Developer Experience / Operational Efficiency)
**Assigned**: TBD
**Epic**: LCWEB-121 (DevOps)