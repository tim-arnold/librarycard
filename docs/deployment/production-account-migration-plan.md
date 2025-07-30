# Production Cloudflare Account Migration Plan

**Document Version**: 1.0  
**Created**: July 29, 2025  
**Status**: Ready for Execution  
**Risk Level**: High - Production Migration  

## Executive Summary

This plan details the migration of LibraryCard's production infrastructure from the shared development Cloudflare account to a dedicated production account, completing Phase 2 of the production safety enhancements.

## Current State Analysis

### Existing Infrastructure
```
Shared Account: 4bef1453ad78da6e3bb7e83b421e26df
├── librarycard-api-local (local development)
├── librarycard-api-staging (staging environment)
└── librarycard-api-production (PRODUCTION - needs migration)
```

### Resources to Migrate
1. **Cloudflare Worker**: `librarycard-api-production`
2. **D1 Database**: `librarycard-db` (ID: 368ab7bc-fb42-4607-a4cf-761dc7795284)
3. **KV Namespace**: Production cache (ID: 8f5a86fc82a64b10ba946d749f2dc8f4)
4. **Custom Domain**: `librarycard.tim52.io` routing
5. **Environment Variables**: Production secrets and configuration

## Migration Strategy

### Option 1: Blue-Green Migration (Recommended)

**Advantages**: Zero downtime, easy rollback, minimal risk
**Timeline**: 2-3 hours
**Complexity**: Medium

**Process**:
1. Create new production account and resources
2. Deploy to new account (blue environment)
3. Test new environment thoroughly
4. Switch DNS/routing to new account
5. Monitor and verify
6. Decommission old resources (green environment)

### Option 2: Direct Migration

**Advantages**: Simpler process
**Timeline**: 1-2 hours
**Complexity**: Low
**Risk**: Higher - requires brief downtime

## Detailed Migration Plan

### Pre-Migration Phase (Day -1)

#### 1. Account Setup
```bash
# Create new Cloudflare account
# Account name: "LibraryCard Production"
# Email: production-admin@yourdomain.com (separate from dev account)
```

**Tasks**:
- [ ] Create new Cloudflare account with separate email
- [ ] Enable 2FA on production account
- [ ] Set up billing for production account
- [ ] Generate production API token with minimal permissions
- [ ] Document new account ID and credentials securely

#### 2. Resource Preparation
```bash
# Create production D1 database
wrangler d1 create librarycard-db-prod --account-id=NEW_PROD_ACCOUNT_ID

# Create production KV namespace
wrangler kv:namespace create "CACHE" --account-id=NEW_PROD_ACCOUNT_ID
```

**Tasks**:
- [ ] Create new D1 database in production account
- [ ] Create new KV namespace in production account
- [ ] Document new resource IDs
- [ ] Prepare updated `wrangler.prod.toml` with new IDs

#### 3. Data Backup and Export
```bash
# Create comprehensive backup before migration
npm run backup:create pre-account-migration

# Export current production data
node scripts/export-production-data.js
```

**Tasks**:
- [ ] Create full production backup using existing backup system
- [ ] Export all production data to migration-ready format
- [ ] Verify backup integrity
- [ ] Store backup in secure location

### Migration Phase (Day 0)

#### Hour 1: Infrastructure Setup

**Step 1.1: Update Configuration**
```bash
# Update wrangler.prod.toml with new account details
```

**File Updates Needed**:
```toml
# wrangler.prod.toml
account_id = "NEW_PRODUCTION_ACCOUNT_ID"

[[d1_databases]]
binding = "DB"
database_name = "librarycard-db-prod"
database_id = "NEW_DATABASE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "NEW_KV_NAMESPACE_ID"
```

**Step 1.2: Database Schema Setup**
```bash
# Deploy schema to new database
wrangler d1 execute librarycard-db-prod --config=wrangler.prod.toml --file=schema.sql --env=production --remote
```

**Step 1.3: Data Migration**
```bash
# Import production data to new database
node scripts/import-production-data.js --target=new-account
```

#### Hour 2: Application Deployment

**Step 2.1: Deploy Worker to New Account**
```bash
# Deploy production worker to new account
npm run deploy:prod

# Verify deployment
curl https://librarycard-api-production-NEW.tim-arnold.workers.dev/health
```

**Step 2.2: Environment Testing**
- [ ] Test API endpoints
- [ ] Verify database connectivity
- [ ] Check authentication flows
- [ ] Test critical user journeys
- [ ] Verify data integrity

#### Hour 3: DNS and Routing Updates

**Step 3.1: Custom Domain Migration**
```bash
# Add custom domain to new worker
wrangler domains add librarycard.tim52.io --account-id=NEW_PROD_ACCOUNT_ID
```

**Step 3.2: DNS Configuration**
- [ ] Update DNS records to point to new worker
- [ ] Verify SSL certificate provisioning
- [ ] Test custom domain functionality

**Step 3.3: Final Verification**
- [ ] Test production site at custom domain
- [ ] Verify all functionality works
- [ ] Check error rates and monitoring
- [ ] Confirm user authentication works

### Post-Migration Phase (Day +1)

#### Monitoring and Validation
- [ ] Monitor error rates for 24 hours
- [ ] Verify all user flows work correctly
- [ ] Check database performance
- [ ] Validate backup system works with new account

#### Cleanup
- [ ] Remove old production worker from shared account
- [ ] Archive old production database (keep for 30 days)
- [ ] Remove old KV namespace
- [ ] Update documentation with new account details
- [ ] Update GitHub Actions with new API tokens

## Risk Mitigation

### Pre-Migration Risks

**Risk**: Data loss during migration
**Mitigation**: Comprehensive backup system, data export verification

**Risk**: Configuration errors
**Mitigation**: Staged deployment, thorough testing phase

**Risk**: DNS propagation issues
**Mitigation**: Blue-green deployment, DNS TTL reduction

### Migration Risks

**Risk**: Service downtime
**Mitigation**: Blue-green deployment strategy, rollback plan

**Risk**: Authentication failures
**Mitigation**: Test authentication before DNS switch

**Risk**: Database connectivity issues
**Mitigation**: Connection testing, fallback procedures

### Rollback Plan

**If Migration Fails in Hour 1-2**:
1. Keep old infrastructure running
2. Fix issues in new account
3. Retry migration steps

**If Migration Fails After DNS Switch**:
1. Immediately revert DNS to old worker
2. Investigate issues in new account
3. Schedule retry migration

**Emergency Rollback Procedure**:
```bash
# Immediate DNS revert
# Update DNS records back to old worker
# Verify old infrastructure still functional
# Notify team of rollback
```

## GitHub Actions Updates

### New Secrets Required
```yaml
# Production account secrets
CLOUDFLARE_API_TOKEN_PROD: "production-only-token"
CLOUDFLARE_ACCOUNT_ID_PROD: "new-production-account-id"
```

### Workflow Updates
```yaml
# .github/workflows/deploy-production.yml
- name: Deploy to Production
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN_PROD }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID_PROD }}
    command: deploy --config=wrangler.prod.toml --env=production
```

## Verification Checklist

### Pre-Migration Verification
- [ ] New Cloudflare account created and configured
- [ ] Production API token generated with minimal permissions
- [ ] New D1 database and KV namespace created
- [ ] Comprehensive backup completed and verified
- [ ] Migration scripts tested on staging data
- [ ] Rollback procedures documented and tested

### Post-Migration Verification
- [ ] Production site loads correctly at custom domain
- [ ] User authentication and authorization working
- [ ] Database reads and writes functioning
- [ ] KV cache operations working
- [ ] All API endpoints responding correctly
- [ ] Error monitoring and logging active
- [ ] Backup system working with new account
- [ ] GitHub Actions deploying to new account

### Success Criteria
- [ ] Zero user-facing errors during migration
- [ ] All functionality works identically to pre-migration
- [ ] Response times maintained or improved
- [ ] No data loss or corruption
- [ ] Monitoring and alerting functional
- [ ] Development team can no longer access production resources

## Security Improvements

### Account-Level Isolation
- **Before**: All environments in single account
- **After**: Production completely isolated

### API Token Isolation
- **Before**: Shared tokens could access all environments
- **After**: Production tokens only access production resources

### Permission Separation
- **Before**: Developers had potential access to production
- **After**: Production access requires separate account credentials

### Audit Improvements
- **Before**: Mixed development and production audit logs
- **After**: Clean separation of production operations

## Cost Implications

### Expected Changes
- **Additional Account**: Minimal monthly fee for separate account
- **Resource Costs**: Same compute/storage costs, just separated
- **Management Overhead**: Slightly increased due to account separation

### Benefits
- **Cost Transparency**: Clear separation of production vs development costs
- **Budget Control**: Production costs tracked independently
- **Resource Optimization**: Better visibility into production resource usage

## Timeline Summary

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Pre-Migration | 4-6 hours | Account setup, resource creation, backup |
| Migration | 3-4 hours | Data migration, deployment, DNS switch |
| Post-Migration | 24-48 hours | Monitoring, validation, cleanup |
| **Total** | **2-3 days** | **Complete migration process** |

## Communication Plan

### Stakeholder Notifications

**Pre-Migration (24 hours before)**:
- [ ] Notify all team members of migration schedule
- [ ] Send user notification of potential brief service interruption
- [ ] Alert monitoring systems of planned changes

**During Migration**:
- [ ] Real-time updates in team communication channel
- [ ] Status page updates if any issues occur
- [ ] Monitoring dashboard active

**Post-Migration**:
- [ ] Confirm successful completion to team
- [ ] User notification of successful upgrade
- [ ] Documentation updates completed

## Success Metrics

### Technical Metrics
- Migration completed within planned timeframe
- Zero data loss or corruption
- Service availability > 99.9% during migration window
- All functionality tests pass post-migration

### Security Metrics
- Production account completely isolated
- No development team access to production account
- Audit logs cleanly separated
- API tokens properly isolated

### Operational Metrics
- GitHub Actions successfully deploying to new account
- Backup system functioning with new infrastructure
- Monitoring and alerting working correctly
- Documentation updated and accurate

## Conclusion

This migration represents the final and most critical step in Phase 2 of the production safety enhancements. Upon completion, LibraryCard will have:

- **Complete Production Isolation**: Physical separation at the account level
- **Enhanced Security**: No accidental development access to production
- **Improved Auditability**: Clean separation of production operations
- **Better Cost Management**: Clear production cost visibility
- **Reduced Risk**: Eliminated shared account vulnerabilities

The migration requires careful execution but provides significant long-term security and operational benefits.

---

**Next Steps**: 
1. Review and approve this migration plan
2. Schedule migration window with stakeholders
3. Execute pre-migration setup
4. Perform migration with rollback capability ready
5. Complete post-migration validation and cleanup