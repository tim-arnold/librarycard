# CLI Safety Guide - Production Operations

**Version**: 1.0  
**Last Updated**: July 29, 2025  
**Status**: Active  

## Overview

This guide provides safe procedures for production operations, preventing accidental damage through multiple layers of protection.

## ⚠️ CRITICAL SAFETY RULES

1. **NEVER** run production commands directly
2. **ALWAYS** use the safety wrapper scripts
3. **VERIFY** staging environment before production deployment
4. **CONFIRM** all backups before database operations
5. **MONITOR** production for 30 minutes after any changes

## Safe Production Commands

### Production Deployment

❌ **DANGEROUS** (Never use):
```bash
npx wrangler deploy --env=production
```

✅ **SAFE** (Always use):
```bash
npm run deploy:prod
# or
node scripts/prod-deploy.js
```

**What the safe script does**:
- Validates you're on the main branch
- Checks working directory is clean
- Requires double confirmation
- Logs all deployment attempts
- Provides post-deployment checklist

### Database Migration

❌ **DANGEROUS** (Never use):
```bash
npx wrangler d1 execute librarycard-db --file=migrations/file.sql --env=production --remote
```

✅ **SAFE** (Always use):
```bash
npm run migrate:prod
# or
node scripts/prod-migrate.js
```

**What the safe script does**:
- Lists available migration files
- Validates SQL for dangerous operations
- Confirms backup exists
- Shows migration preview
- Requires triple confirmation
- Provides rollback guidance

### Environment Validation

Before any production operation:
```bash
npm run validate:env
# or
node scripts/validate-environment.js
```

**What validation checks**:
- Git repository state
- Branch status and cleanliness
- Configuration file integrity
- Required dependencies
- Environment variable safety

## Safety Script Features

### Multi-Layer Confirmation

All production operations require multiple confirmations:

1. **Environment Validation**: Automatic checks pass
2. **First Confirmation**: Type exact phrase (e.g., "PRODUCTION")
3. **Second Confirmation**: Type exact phrase with timestamp
4. **Final Warning**: Acknowledge risk understanding

### Automatic Logging

All production operations are logged to `production-audit.log`:
```
2025-07-29T10:30:00.000Z - DEPLOYMENT_START: User: developer | Commit: abc123def
2025-07-29T10:35:00.000Z - DEPLOYMENT_SUCCESS: User: developer | Commit: abc123def
```

### Pre-flight Checks

Before any operation:
- Branch validation (must be on main)
- Clean working directory
- Configuration file validation
- Dependency availability

### Post-operation Guidance

After successful operations, scripts provide checklists:
- Health monitoring steps
- Verification procedures
- Rollback instructions if needed

## Script Details

### prod-deploy.js

**Purpose**: Safe production worker deployment

**Safety Features**:
- Environment validation
- Pre-deployment checks
- Double confirmation required
- Audit logging
- Post-deployment checklist

**Usage**:
```bash
node scripts/prod-deploy.js
```

### prod-migrate.js

**Purpose**: Safe database migration

**Safety Features**:
- Interactive migration selection
- SQL validation and preview
- Backup confirmation
- Triple confirmation required
- Dangerous operation detection
- Complete audit trail

**Usage**:
```bash
node scripts/prod-migrate.js
```

### validate-environment.js

**Purpose**: Environment safety validation

**Checks**:
- Git repository status
- Branch and commit status
- Configuration integrity
- Dependency availability
- Environment variable safety

**Usage**:
```bash
node scripts/validate-environment.js
```

## Emergency Procedures

### If Production Deployment Fails

1. **Check Status**: Verify if production site is still accessible
2. **Review Logs**: Check `production-audit.log` for error details
3. **Consider Rollback**: Use GitHub Actions to revert to previous commit
4. **Team Notification**: Alert team of production issue

### If Database Migration Fails

1. **Assess Damage**: Check if application is still functional
2. **Review Error**: Analyze migration failure details
3. **Emergency Rollback**: Use prepared rollback procedures
4. **Data Verification**: Verify data integrity
5. **Incident Response**: Follow incident response procedures

## Package.json Scripts

Add these to your package.json for easy access:

```json
{
  "scripts": {
    "deploy:prod": "node scripts/prod-deploy.js",
    "migrate:prod": "node scripts/prod-migrate.js",
    "validate:env": "node scripts/validate-environment.js",
    "deploy:staging": "wrangler deploy --env=staging",
    "migrate:staging": "wrangler d1 execute librarycard-db-staging --file=migrations/$npm_config_file --env=staging --remote"
  }
}
```

## Developer Training

### New Developer Onboarding

1. Review this safety guide completely
2. Practice using wrapper scripts in local environment
3. Understand the confirmation process
4. Know emergency procedures
5. Never use direct production commands

### Regular Reminders

- Monthly safety review meetings
- Quarterly emergency drill practice
- Annual procedure updates
- Continuous reinforcement of safety practices

## Audit and Compliance

### Audit Log Review

- Weekly review of `production-audit.log`
- Monthly analysis of deployment patterns
- Quarterly safety procedure effectiveness review

### Compliance Requirements

- All production operations must use safety scripts
- All operations must be logged
- Emergency procedures must be documented
- Team must be trained on safety procedures

## Troubleshooting

### Common Issues

**"Not on main branch" error**:
```bash
git checkout main
git pull origin main
```

**"Working directory not clean" error**:
```bash
git status
git add . && git commit -m "Description"
# or
git stash
```

**"Migration file not found" error**:
- Verify migration file exists in `migrations/` directory
- Check file permissions
- Ensure exact filename is used

### Getting Help

If you encounter issues with safety scripts:
1. Check this documentation first
2. Review script error messages
3. Consult with team lead
4. Create issue if script has bugs

## Updates and Maintenance

This safety system requires regular maintenance:

- **Scripts**: Update for new requirements
- **Documentation**: Keep procedures current
- **Training**: Regular team training updates
- **Emergency Procedures**: Test and refine regularly

## Conclusion

These safety procedures are designed to prevent production accidents while maintaining development velocity. Following these procedures is mandatory for all production operations.

**Remember**: It's better to be overly cautious with production than to risk data loss or service outages.

---

**For Questions**: Contact the infrastructure team  
**For Emergencies**: Follow incident response procedures  
**For Updates**: Submit pull request with safety procedure changes