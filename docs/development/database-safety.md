# Database Safety Guidelines

## ⚠️ Critical Safety Rules

### 1. Never Run Destructive Scripts Against Production
- **NEVER** run seed scripts against production databases
- **ALWAYS** verify environment before running destructive operations
- **DOUBLE-CHECK** database names and environment flags

### 2. Environment Verification Checklist

Before running any database script:
```bash
# 1. Check which environment you're targeting
npx wrangler whoami

# 2. Verify database connection
npx wrangler d1 execute <database-name> --env <environment> --remote --command "SELECT 1"

# 3. Check current directory
pwd  # Should be in project root

# 4. Verify wrangler.toml environment settings
cat wrangler.toml | grep -A 10 "env.production"
```

### 3. Database Environment Summary

| Environment | Database Name | Database ID | Purpose |
|------------|---------------|-------------|----------|
| **local** | `libarycard-db-local` | `5365a633-7869-4993-990a-90aa12e9974e` | Local development |
| **staging** | `librarycard-db-staging` | `eb3d7f44-754e-4354-a3ce-8077c2572946` | Testing & demos |
| **production** | `librarycard-db` | `368ab7bc-fb42-4607-a4cf-761dc7795284` | ⚠️ **LIVE DATA** |

### 4. Safe Script Practices

#### ✅ Built-in Safety Features
- Environment validation before execution
- Database name verification
- Production environment detection
- Hardcoded staging-only targeting

#### ⚠️ Additional Precautions
- Always run scripts from project root
- Never modify scripts to target production without creating new production-safe versions
- Test scripts on local environment first
- Review all database commands before execution

### 5. Emergency Procedures

#### If You Accidentally Target Production:
1. **STOP IMMEDIATELY** - Kill the process (Ctrl+C)
2. Check what damage was done: `npx wrangler d1 execute librarycard-db --env production --remote --command "SELECT COUNT(*) FROM books"`
3. Restore from backups if necessary
4. Document the incident and review safety procedures

#### Backup Verification:
```bash
# Check production database status
npx wrangler d1 execute librarycard-db --env production --remote --command "SELECT COUNT(*) FROM books, COUNT(*) FROM locations"

# Never run destructive commands without explicit confirmation
# Example of what NOT to do:
# npx wrangler d1 execute librarycard-db --env production --remote --command "DELETE FROM books"  # ❌ NEVER!
```

### 6. Script Safety Standards

All destructive database scripts must include:
- Clear warnings in comments
- Environment verification checks
- Database name validation
- Production detection and prevention
- Explicit confirmation prompts for destructive operations

### 7. Recommended Development Workflow

1. **Local Development**: Use `seed-local-data.js` for local testing (includes comprehensive safety checks)
2. **Staging Testing**: Use `seed-staging-data.js` for staging demos (includes comprehensive safety checks)
3. **Production**: Create separate production-specific scripts with enhanced safety measures

### 8. Script Safety Features

Both `seed-local-data.js` and `seed-staging-data.js` now include comprehensive safety measures:

#### ✅ Multi-Layer Protection
- **Database Connection Verification**: Tests target database before execution
- **Environment Variable Checks**: Prevents execution with `NODE_ENV=production`
- **Script Content Scanning**: Detects dangerous database references in script code
- **Command-Line Validation**: Prevents accidental staging/production targeting with CLI flags

#### ✅ Local Script Safety Features (`seed-local-data.js`)
- Hardcoded to target `libarycard-db-local` only
- Prevents `--env staging` or `--env production` usage
- Scans for staging/production database references in script
- Requires `--local` flag for wrangler d1 commands

#### ✅ Staging Script Safety Features (`seed-staging-data.js`)  
- Hardcoded to target `librarycard-db-staging` only
- Multiple environment verification layers
- Production database ID detection and prevention
- Comprehensive safety warnings and confirmations

### 9. Production Database Operations

For production database changes:
- Create migration scripts instead of seed scripts
- Use version-controlled migrations
- Test migrations on staging first
- Implement rollback procedures
- Require manual confirmation for destructive operations

---

**Remember: It's better to be overly cautious than to accidentally destroy production data!**