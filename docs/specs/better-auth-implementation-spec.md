# Better Auth Implementation Specification

**Document Type**: Technical Specification
**Status**: Draft
**Created**: September 2025
**Priority**: High
**Category**: Authentication Architecture
**Related**: LCWEB-163

## Overview

This document provides the complete technical specification for migrating LibraryCard from NextAuth.js to Better Auth, including database schema, API endpoints, feature parity requirements, and implementation details.

## Architecture Overview

### Current Authentication Stack
```
Frontend (Next.js) → NextAuth.js → Cloudflare Workers → D1 Database
                 ↘ Google OAuth ↗
```

### Target Authentication Stack
```
Frontend (Next.js) → Better Auth → better-auth-cloudflare → D1 Database
                 ↘ Google OAuth + Enterprise SSO ↗
```

## Database Schema Migration

### Current NextAuth Schema (Preserve)
```sql
-- Core user table (preserve data for 3 production users)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Mixed: emails, Google IDs, UUIDs
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',    -- 'email' | 'google'
  email_verified BOOLEAN DEFAULT FALSE,
  user_role TEXT DEFAULT 'user',         -- 'user' | 'admin' | 'super_admin'
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  webauthn_enabled BOOLEAN DEFAULT FALSE,
  display_name_preference TEXT DEFAULT 'first_name',
  custom_username VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session management
CREATE TABLE jwt_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  token_hash TEXT NOT NULL,
  issued_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  -- Additional session metadata
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- WebAuthn credentials
CREATE TABLE webauthn_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type TEXT, -- 'platform' | 'cross-platform'
  device_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Better Auth Schema (Target)
```sql
-- Better Auth generated schema (via CLI)
-- Generated with: npx @better-auth/cli generate

CREATE TABLE user (
  id TEXT PRIMARY KEY,                    -- UUIDs only
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Custom fields
  firstName TEXT,
  lastName TEXT,
  userRole TEXT DEFAULT 'user',
  authProvider TEXT DEFAULT 'email',
  displayNamePreference TEXT DEFAULT 'first_name',
  customUsername TEXT
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  providerUserId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Two-factor authentication
CREATE TABLE twoFactor (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  secret TEXT NOT NULL,
  backupCodes TEXT, -- JSON array
  verified BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- WebAuthn credentials
CREATE TABLE passkey (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  credentialId TEXT UNIQUE NOT NULL,
  publicKey TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  deviceName TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### Data Migration Strategy

#### User ID Standardization
```typescript
// Migration script: migrate-user-ids.ts
interface UserMigration {
  oldId: string;
  newId: string; // UUID v4
  email: string;
  migrationDate: string;
}

const productionUserMigrations: UserMigration[] = [
  {
    oldId: "librarian@tim52.io",
    newId: "550e8400-e29b-41d4-a716-446655440001",
    email: "librarian@tim52.io",
    migrationDate: "2025-01-15"
  },
  {
    oldId: "107996687018417654176", // Google numeric ID
    newId: "550e8400-e29b-41d4-a716-446655440002",
    email: "fiercefamily@gmail.com",
    migrationDate: "2025-01-15"
  },
  {
    oldId: "tim.arnold+finsbury@gmail.com",
    newId: "550e8400-e29b-41d4-a716-446655440003",
    email: "tim.arnold+finsbury@gmail.com",
    migrationDate: "2025-01-15"
  }
];
```

## Authentication Configuration

### Better Auth Configuration
```typescript
// src/lib/better-auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db-cloudflare";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite"
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "email", "profile"],
    },
    // Future enterprise SSO
    // saml: { ... },
    // azureAd: { ... },
  },

  // Plugins
  plugins: [
    twoFactor({
      issuer: "LibraryCard",
      totpOptions: {
        period: 30,
        digits: 6,
        algorithm: "SHA1",
      },
      backupCodes: {
        count: 8,
        length: 8,
      },
    }),

    passkey({
      rpName: "LibraryCard",
      rpID: process.env.WEBAUTHN_RP_ID,
      origin: process.env.WEBAUTHN_ORIGIN,
    }),

    organization({
      // For multi-tenant location permissions
      async sendInvitationEmail(data) {
        // Custom implementation
      },
    }),
  ],

  // User fields
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      userRole: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      authProvider: {
        type: "string",
        defaultValue: "email",
        required: false,
      },
      displayNamePreference: {
        type: "string",
        defaultValue: "first_name",
        required: false,
      },
      customUsername: {
        type: "string",
        required: false,
      },
    },
  },

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    updateAge: 60 * 60 * 24, // 24 hours
  },

  // Advanced security
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    csrfProtection: {
      enabled: true,
    },
  },

  // Rate limiting
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 100, // requests per window
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

### Client Configuration
```typescript
// src/lib/better-auth-client.ts
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    twoFactorClient(),
    passkeyClient(),
    organizationClient(),
  ],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  usePasskeys,
  useTwoFactor,
} = authClient;
```

## API Endpoints Migration

### Current NextAuth Endpoints
```
/api/auth/signin                 → Better Auth: /api/auth/sign-in/email
/api/auth/signup                 → Better Auth: /api/auth/sign-up/email
/api/auth/signin/google          → Better Auth: /api/auth/sign-in/google
/api/auth/2fa/setup             → Better Auth: /api/auth/two-factor/setup
/api/auth/2fa/verify            → Better Auth: /api/auth/two-factor/verify
/api/auth/webauthn/register/*   → Better Auth: /api/auth/passkey/register
/api/auth/webauthn/authenticate/* → Better Auth: /api/auth/passkey/authenticate
```

### Better Auth Route Handler
```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

## Feature Parity Requirements

### Core Authentication
- [x] Email/password authentication
- [x] Google OAuth integration
- [x] Email verification
- [x] Password reset functionality
- [x] Session management

### Multi-Factor Authentication
- [x] TOTP/Authenticator app support
- [x] Backup codes (8 codes, XXXX-XXXX format)
- [x] QR code generation for setup
- [x] Recovery flow

### WebAuthn/Passkeys
- [x] Platform authenticator support
- [x] Cross-platform authenticator support
- [x] Device naming and management
- [x] Credential exclusion (prevent duplicates)

### Role-Based Access Control
- [x] User roles: user, admin, super_admin
- [x] Hierarchical permissions (super_admin > admin > user)
- [x] Location-scoped permissions
- [x] Custom permission system

### Security Features
- [x] CSRF protection
- [x] Rate limiting per endpoint
- [x] Security audit logging
- [x] Session security (secure cookies, IP tracking)

## Multi-Tenant Permission System

### Location Permissions (Custom Implementation)
```typescript
// src/lib/permissions-better-auth.ts
interface LocationPermission {
  locationId: number;
  userId: string;
  permission:
    | 'can_add_books'
    | 'can_delete_books'
    | 'can_move_books'
    | 'can_create_shelves'
    | 'can_edit_genres'
    | 'can_create_series'
    | 'allow_checkout_override';
  grantedBy: string;
  grantedAt: Date;
}

interface AdminCapability {
  locationId: number;
  userId: string;
  capability:
    | 'can_control_user_capabilities'
    | 'can_invite_users'
    | 'can_manage_shelves'
    | 'can_manage_location_settings';
  grantedBy: string;
  grantedAt: Date;
}

// Integration with Better Auth user context
export async function checkLocationPermission(
  user: User,
  locationId: number,
  permission: string
): Promise<boolean> {
  // Implementation using Better Auth user context
  // + custom location permission tables
}
```

## Environment Variables

### Development
```bash
# Better Auth
BETTER_AUTH_SECRET="dev-secret-key-32-chars-minimum"
BETTER_AUTH_URL="http://localhost:3000/api/auth"

# OAuth (reuse existing)
GOOGLE_CLIENT_ID="existing-google-client-id"
GOOGLE_CLIENT_SECRET="existing-google-client-secret"

# WebAuthn
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_ORIGIN="http://localhost:3000"

# Database (better-auth-cloudflare)
DATABASE_URL="file:./dev-auth.db"
```

### Staging
```bash
# Better Auth
BETTER_AUTH_SECRET="staging-secret-key-32-chars-minimum"
BETTER_AUTH_URL="https://librarycard-staging.tim52.io/api/auth"

# WebAuthn
WEBAUTHN_RP_ID="librarycard-staging.tim52.io"
WEBAUTHN_ORIGIN="https://librarycard-staging.tim52.io"

# Cloudflare
CLOUDFLARE_DATABASE_ID="staging-d1-database-id"
```

### Production
```bash
# Better Auth
BETTER_AUTH_SECRET="production-secret-key-from-secrets"
BETTER_AUTH_URL="https://librarycard.tim52.io/api/auth"

# WebAuthn
WEBAUTHN_RP_ID="librarycard.tim52.io"
WEBAUTHN_ORIGIN="https://librarycard.tim52.io"

# Cloudflare
CLOUDFLARE_DATABASE_ID="production-d1-database-id"
```

## Testing Strategy

### Unit Tests
```typescript
// tests/auth/better-auth.test.ts
describe('Better Auth Integration', () => {
  test('email/password authentication', async () => {
    // Test email/password flow
  });

  test('Google OAuth flow', async () => {
    // Test OAuth integration
  });

  test('2FA setup and verification', async () => {
    // Test TOTP flow
  });

  test('WebAuthn registration', async () => {
    // Test passkey flow
  });

  test('permission system integration', async () => {
    // Test role-based access
  });
});
```

### Integration Tests
```typescript
// tests/auth/integration.test.ts
describe('Auth System Integration', () => {
  test('Cloudflare Workers API authentication', async () => {
    // Test worker JWT validation
  });

  test('Multi-tenant permission enforcement', async () => {
    // Test location-based access
  });

  test('Session persistence across requests', async () => {
    // Test session management
  });
});
```

### End-to-End Tests
```javascript
// testing/better-auth-e2e.js
// Extend existing screenshot.js for Better Auth
const testBetterAuthFlows = async () => {
  // Test complete auth flows with Puppeteer
  await testEmailPasswordAuth();
  await testGoogleOAuth();
  await test2FASetup();
  await testWebAuthnFlow();
  await testRolePermissions();
};
```

## Migration Checklist

### Pre-Migration
- [ ] Complete Better Auth PoC feature parity
- [ ] Create user ID migration mapping
- [ ] Extend screenshot testing for Better Auth
- [ ] Document current custom auth features
- [ ] Set up better-auth-cloudflare adapter

### Staging Migration
- [ ] Deploy Better Auth schema to staging D1
- [ ] Configure staging environment variables
- [ ] Run parallel testing (NextAuth + Better Auth)
- [ ] Validate API integration with workers
- [ ] Test permission system compatibility

### Production Migration
- [ ] Create production database backup
- [ ] Deploy Better Auth schema to production
- [ ] Migrate 3 production users manually
- [ ] Switch frontend to Better Auth endpoints
- [ ] Monitor session continuity
- [ ] Validate all auth flows in production

### Post-Migration
- [ ] Remove NextAuth.js dependencies
- [ ] Update documentation
- [ ] Monitor performance metrics
- [ ] Implement enterprise plugins (SSO, compliance)

## Risk Assessment

### High Risk
- **Session continuity**: Users may need to re-authenticate
- **Permission system**: Custom location permissions need careful testing
- **WebAuthn credentials**: Device registration may need re-setup

### Medium Risk
- **API integration**: Worker authentication patterns may need updates
- **Environment configuration**: Multiple env vars need coordination
- **Performance impact**: Auth response times need monitoring

### Low Risk
- **Basic auth flows**: Email/password and OAuth are well-supported
- **Database migration**: Only 3 users to migrate manually
- **Deployment safety**: Existing GitHub Actions provide rollback

## Success Criteria

### Functional Requirements
- [ ] All current auth flows work identically
- [ ] 3 production users migrated successfully
- [ ] API authentication maintains compatibility
- [ ] Permission system preserves access controls
- [ ] Performance equals or exceeds current system

### Non-Functional Requirements
- [ ] Zero user data loss during migration
- [ ] < 1 hour downtime for auth system
- [ ] Rollback capability within 15 minutes
- [ ] All security features preserved or enhanced

## Future Enterprise Features

### SSO Integration (Phase 2)
```typescript
// Enterprise SSO plugins
import { saml } from "better-auth/plugins/saml";
import { azureAd } from "better-auth/plugins/azure-ad";
import { oidc } from "better-auth/plugins/oidc";

// Add to Better Auth config
socialProviders: {
  saml: {
    entityId: "librarycard",
    ssoUrl: "https://sso.enterprise.com/saml/sso",
    certificate: process.env.SAML_CERTIFICATE,
  },
  azureAd: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID,
  },
}
```

### Compliance Features (Phase 3)
- GDPR data portability and deletion
- SOC 2 Type II audit trails
- Advanced session monitoring
- Compliance reporting dashboards

---

**Document Status**: Draft - Ready for Implementation
**Next Review**: After PoC completion
**Implementation Start**: Q1 2025