# Better Auth Migration Checklist

**Document Type**: Implementation Checklist
**Related**: `/docs/specs/better-auth-implementation-guide.md`
**Timeline**: 2-3 weeks total
**Updated**: September 2025

## Quick Reference

| **Primary Document** | `/docs/specs/better-auth-implementation-guide.md` |
|---------------------|---------------------------------------------------|
| **Timeline** | 2-3 weeks with AI assistance |
| **Production Users** | Only 3 users to migrate |
| **Deployment** | GitHub Actions workflows (NOT manual commands) |
| **Architecture** | Next.js → Better Auth → better-auth-cloudflare → D1 |

## Phase 1: Local PoC Completion (3-5 days)

### Current Status
- ✅ Better Auth PoC environment ready (`/poc-auth-test`)
- ✅ Basic configuration complete
- ⏳ Feature parity testing needed

### Tasks
- [ ] **Test email/password authentication**
  ```bash
  npm run dev
  # Navigate to http://localhost:3000/poc-auth-test
  # Test signup/signin flows
  ```

- [ ] **Test Google OAuth integration**
  ```bash
  # Use existing Google OAuth credentials
  # Test OAuth flow in PoC environment
  ```

- [ ] **Run screenshot automation**
  ```bash
  cd testing && node screenshot.js
  # Extend for Better Auth endpoints
  ```

- [ ] **Validate API compatibility**
  ```bash
  # Test Better Auth sessions with worker authentication
  # Verify Bearer token handling
  ```

- [ ] **Complete feature parity checklist**
  - [ ] Email/password authentication ✅
  - [ ] Google OAuth ✅
  - [ ] 2FA/TOTP setup (via plugin)
  - [ ] WebAuthn/Passkey (via plugin)
  - [ ] Session management
  - [ ] Role-based permissions

### Success Criteria
- [ ] All auth flows work locally
- [ ] Screenshot tests pass
- [ ] No blocking issues identified

---

## Phase 2: Staging Migration (1 week)

### Pre-Migration Setup
- [ ] **Create migration branch**
  ```bash
  git checkout staging
  git checkout -b better-auth-staging-migration
  ```

- [ ] **Prepare user migration data**
  ```typescript
  // Only 3 production users need mapping
  const userMigrations = [
    { oldId: "librarian@tim52.io", newId: "uuid-1", email: "librarian@tim52.io" },
    { oldId: "107996687018417654176", newId: "uuid-2", email: "fiercefamily@gmail.com" },
    { oldId: "tim.arnold+finsbury@gmail.com", newId: "uuid-3", email: "tim.arnold+finsbury@gmail.com" }
  ];
  ```

### Database Migration
- [ ] **Generate Better Auth schema**
  ```bash
  npx @better-auth/cli generate
  # Review generated schema files
  ```

- [ ] **Deploy to staging via GitHub Actions**
  1. Navigate to **Actions** → **"Deploy to Staging (Enhanced)"**
  2. Select options:
     - ✅ `full-deployment`
     - ✅ `automated-migrations`
  3. **Manual trigger** from `better-auth-staging-migration` branch
  4. **Monitor deployment** for success/failure

### Staging Environment Variables
```bash
# Add to GitHub Secrets for staging
BETTER_AUTH_SECRET="staging-secret-32-chars-minimum"
BETTER_AUTH_URL="https://librarycard-staging.tim52.io/api/auth"
WEBAUTHN_RP_ID="librarycard-staging.tim52.io"
WEBAUTHN_ORIGIN="https://librarycard-staging.tim52.io"
```

### Testing in Staging
- [ ] **Verify Better Auth endpoints**
  ```bash
  curl https://librarycard-staging.tim52.io/api/auth/session
  # Should return Better Auth session data
  ```

- [ ] **Test authentication flows**
  - [ ] Email/password signup/signin
  - [ ] Google OAuth flow
  - [ ] Session persistence
  - [ ] API authentication with workers

- [ ] **Run automated testing**
  ```bash
  cd testing
  SCREENSHOT_USER=staging-test node screenshot.js
  ```

- [ ] **Validate permissions system**
  - [ ] Role-based access (admin/user/super_admin)
  - [ ] Location-based permissions
  - [ ] API endpoint access control

### Success Criteria
- [ ] All auth flows work in staging
- [ ] API integration with workers functional
- [ ] No performance regressions
- [ ] Permission system preserved

---

## Phase 3: Production Deployment (2-3 days)

### Pre-Production Checklist
- [ ] **Staging validation complete**
- [ ] **Production backup strategy confirmed**
  - GitHub Actions automatically creates backup
  - Rollback procedure tested in staging
- [ ] **User migration plan finalized**
  - Only 3 users: manual migration acceptable
  - Session continuity strategy defined

### Production Deployment Process

⚠️ **IMPORTANT**: Use GitHub Actions workflows ONLY

- [ ] **Deploy via GitHub Actions**
  1. Navigate to **Actions** → **"Deploy to Production (Enhanced Safety)"**
  2. **Required inputs**:
     - Confirmation: `CONFIRM-PRODUCTION`
     - Deployment reason: "Better Auth migration - enterprise auth modernization"
  3. **Manual approval** required (GitHub environment protection)
  4. **Automated safety checks**:
     - Pre-deployment backup creation
     - Migration dry-run validation
     - Health check verification

### Production Environment Variables
```bash
# Add to GitHub Secrets for production
BETTER_AUTH_SECRET="production-secret-from-secure-source"
BETTER_AUTH_URL="https://librarycard.tim52.io/api/auth"
WEBAUTHN_RP_ID="librarycard.tim52.io"
WEBAUTHN_ORIGIN="https://librarycard.tim52.io"
```

### User Migration Strategy
```typescript
// Manual migration for 3 users
const productionMigration = [
  {
    action: "CREATE_BETTER_AUTH_USER",
    oldId: "librarian@tim52.io",
    newId: "550e8400-e29b-41d4-a716-446655440001",
    email: "librarian@tim52.io",
    role: "super_admin",
    preserveData: ["location_memberships", "permissions", "webauthn_credentials"]
  }
  // ... repeat for other 2 users
];
```

### Session Continuity Plan
- [ ] **Parallel operation period**
  - Both NextAuth and Better Auth active during migration
  - Users may need to re-authenticate once
  - Gradual user migration over 24-48 hours

- [ ] **Rollback capability**
  - Keep NextAuth.js installed during transition
  - Database backup available for immediate restore
  - Frontend can switch back to NextAuth endpoints

### Production Validation
- [ ] **Health checks**
  ```bash
  # Automated via GitHub Actions
  curl https://librarycard.tim52.io/api/auth/session
  curl https://librarycard.tim52.io/api/health
  ```

- [ ] **User authentication testing**
  - [ ] Test with each of the 3 production users
  - [ ] Verify permission preservation
  - [ ] Check location access
  - [ ] Validate WebAuthn credentials

- [ ] **Performance monitoring**
  - [ ] Auth response times ≤ current system
  - [ ] API authentication latency
  - [ ] Session management overhead

### Success Criteria
- [ ] All 3 production users migrated successfully
- [ ] Zero data loss confirmed
- [ ] All auth flows functional
- [ ] Performance maintained or improved
- [ ] Rollback capability verified

---

## Post-Migration Tasks

### Cleanup & Optimization
- [ ] **Remove NextAuth.js dependencies** (after 1-2 weeks monitoring)
  ```bash
  npm uninstall next-auth
  # Remove NextAuth API routes
  # Clean up NextAuth configuration files
  ```

- [ ] **Update documentation**
  - [ ] Update authentication guides
  - [ ] Update API documentation
  - [ ] Update developer setup instructions

- [ ] **Performance monitoring**
  - [ ] Set up auth metrics tracking
  - [ ] Monitor session management
  - [ ] Track authentication latency

### Enterprise Feature Implementation
- [ ] **Phase 2: SSO Integration** (Q2 2025)
  ```bash
  # Add SAML and Azure AD plugins
  npm install @better-auth/saml @better-auth/azure-ad
  ```

- [ ] **Phase 3: Compliance Features**
  - GDPR data portability
  - SOC 2 audit trails
  - Advanced session monitoring

---

## Troubleshooting Guide

### Common Issues & Solutions

#### **Database Connection Issues**
```bash
# Check D1 binding in wrangler.toml
# Verify DATABASE_ID in environment variables
npx wrangler d1 list --env=staging
```

#### **Authentication Flow Failures**
```bash
# Check Better Auth configuration
# Verify environment variables
# Review browser developer console
```

#### **API Integration Issues**
```bash
# Test worker authentication
curl -H "Authorization: Bearer <token>" <worker-endpoint>
# Check CORS configuration
# Verify token format
```

#### **Session Management Problems**
```bash
# Check cookie settings
# Verify session expiration
# Test session refresh
```

### Emergency Rollback Procedure
1. **Immediate response** (< 15 minutes)
   ```bash
   # Use GitHub Actions "Deploy to Production (Enhanced Safety)"
   # Select rollback option
   # Restore from automated backup
   ```

2. **Database restore** (if needed)
   ```bash
   # GitHub Actions provides automated backup restore
   # Rollback to pre-migration state
   ```

3. **Frontend rollback**
   ```bash
   git checkout main
   # Redeploy previous NextAuth version
   ```

---

## Command Reference

### Development Commands
```bash
npm run dev                    # Local development server
cd testing && node screenshot.js  # Run automated tests
```

### Better Auth CLI Commands
```bash
npx @better-auth/cli generate  # Generate database schema
npx @better-auth/cli migrate   # Run migrations
```

### GitHub Actions Workflows
- **"Deploy to Staging (Enhanced)"** - Staging deployment with safety checks
- **"Deploy to Production (Enhanced Safety)"** - Production deployment with approvals
- **"Automated Database Migrations"** - Database migrations with rollback

### Environment Variable Verification
```bash
echo $BETTER_AUTH_SECRET      # Should be 32+ characters
echo $BETTER_AUTH_URL         # Should match environment
echo $WEBAUTHN_RP_ID         # Should match domain
```

---

## Quick Implementation Summary

**Timeline**: 2-3 weeks
**Effort**: 3-5 days PoC + 1 week staging + 2-3 days production
**Users**: Only 3 production users to migrate
**Safety**: Enterprise-grade GitHub Actions workflows
**Rollback**: < 15 minutes with automated backups

**Key Success Factors**:
1. Use GitHub Actions workflows (NOT manual commands)
2. Test thoroughly in isolated staging environment
3. Manual migration for 3 users is acceptable and safe
4. Preserve existing permission system integration
5. Monitor performance and have rollback ready

**Next Steps**: Begin Phase 1 (PoC completion) when ready to proceed with implementation.