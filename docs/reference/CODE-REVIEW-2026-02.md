# LibraryCard Comprehensive Code Review

**Date:** February 2026
**Scope:** Full-stack review covering security, architecture, database, frontend, backend, and infrastructure

---

## CRITICAL - Fix Immediately

### 1. Authentication Bypass via Raw Token Fallback
**`workers/auth/index.ts:52-54`** | Security, Backend

The `getUserFromRequest` function falls back to treating the Bearer token as a raw user ID if it's not a valid JWT and doesn't contain `@`. Anyone who knows or guesses a user's UUID can authenticate as that user with zero verification.

**Fix:** Remove the raw token fallback entirely. Only accept verified JWTs.

### 2. WebAuthn JWT Not Verified in NextAuth
**`src/app/api/auth/[...nextauth]/route.ts:46-48`** | Security

The WebAuthn login path base64-decodes the JWT payload without verifying the signature. An attacker can craft a fake JWT with any user's credentials and call NextAuth directly.

**Fix:** Verify the JWT signature server-side, or use a short-lived opaque token exchanged server-side.

### 3. JWT Secret Has Hardcoded Fallback + Committed to Repo
**`workers/auth/jwt.ts:15`**, **`wrangler.toml:61`** | Security, Infrastructure

The JWT secret falls back to `'default-jwt-secret-change-in-production'`. The staging config commits the same dev secret. If the production env var is missing, all JWTs are forgeable.

**Fix:** Remove the fallback (throw on missing secret). Move staging secret to Cloudflare dashboard secrets. Rotate all secrets.

### 4. Unauthenticated User Creation/Overwrite Endpoint
**`workers/auth/router.ts:42-44`** | Security

`/api/users` POST is public and runs `INSERT OR REPLACE INTO users`. An attacker can overwrite existing user records including setting `email_verified=true`.

**Fix:** Require server-to-server auth or restrict to trusted origins with a shared secret.

### 5. Error Sanitization Broken in Production
**`workers/errors/index.ts:38`** | Backend

Uses `process.env.NODE_ENV` which doesn't exist in Cloudflare Workers. Error messages are never sanitized in any environment. Combined with missing CORS headers on error responses (`errors/index.ts:161`), errors are both leaky and invisible to the frontend.

**Fix:** Use `env.ENVIRONMENT` instead. Add CORS headers to `createSecureErrorResponse`.

---

## HIGH - Fix Soon

### 6. CSRF Protection Bypassed via XMLHttpRequest Header
**`workers/csrf/index.ts:101-108`** | Security

`X-Requested-With: XMLHttpRequest` bypasses all CSRF validation, and this header is explicitly allowed in CORS config. Additionally, all `/api/auth/*` endpoints (including password change, 2FA disable) skip CSRF entirely.

### 7. No Transaction Wrapping Anywhere
**Multiple files across `workers/`** | Database, Backend

Zero use of D1's `env.DB.batch()` API. Multi-step operations (checkout, user deletion, location creation, permission updates) can leave data in inconsistent states on partial failure. The `updateLocationDefaultPermissions` deletes all permissions then inserts new ones -- if inserts fail, all permissions are lost.

### 8. Missing Critical Database Indexes
**`schema.sql`** | Database

No indexes on `books.shelf_id`, `books.added_by`, `books.checked_out_by`, `shelves.location_id`, or `locations.owner_id` -- the most commonly joined/filtered columns in the entire app. Every book query does full table scans on these joins.

### 9. N+1 Query Patterns
**`workers/books/index.ts`, `workers/books/router.ts:566-713`** | Database, Backend

- `hasUserPermission()` makes 4-5 sequential queries per book operation
- Main book listings have 2-4 correlated subqueries per row (2000-4000 subquery executions for 1000 books)
- `getLibraryActivity()` calls `getUserDisplayInfo()` individually for every review in a loop

### 10. No Automated Test Suite
**`package.json`** | Infrastructure

No `test` script, no unit tests, no integration tests, no e2e tests. ESLint is disabled during builds (`next.config.js:9-11`) and in CI (`DISABLE_ESLINT_PLUGIN=true`). Zero quality gates exist in the deployment pipeline.

### 11. Legacy Password Hashing
**`workers/auth-core/index.ts:533-543`** | Security

Legacy passwords use SHA-256 with a static hardcoded salt `'salt'` and non-constant-time comparison. Trivially crackable with rainbow tables.

### 12. `book_series.book_id` Type Mismatch
**`schema.sql:288-295`** | Database

`book_series.book_id` is TEXT but `books.id` is INTEGER. Queries use `CAST(b.id AS TEXT)` to work around this, preventing index usage and FK enforcement.

### 13. Puppeteer in Production Dependencies
**`package.json:69`** | Infrastructure

Puppeteer (~280MB Chromium download) is in `dependencies` instead of `devDependencies`. Inflates every `npm ci` and potentially Netlify builds.

### 14. Node 18 EOL on Netlify
**`netlify.toml:5`** | Infrastructure

Netlify builds use Node 18 (EOL April 2025) while CI uses Node 20. Version mismatch between build environments.

---

## MEDIUM - Plan and Address

### Architecture & Code Quality
| # | Finding | Location |
|---|---------|----------|
| 15 | **Four competing `useBookLibrary` hooks** -- enhanced wrapper runs BOTH hooks every render | `src/hooks/useBookLibrary*.ts` |
| 16 | **Dual data loading** -- `UserDataContext` fetches outside React Query, duplicating data | `src/contexts/UserDataContext.tsx` |
| 17 | **Type duplication** -- frontend and backend define overlapping but different types | `src/lib/types.ts` vs `workers/types/index.ts` |
| 18 | **211 `as any` casts** across 25 worker files; D1/KV/R2 typed as `any` | `workers/types/index.ts:2-4` |
| 19 | **localStorage fallback creates silent data loss** -- no sync mechanism | `src/lib/api.ts:82-87` |
| 20 | **Inconsistent error response formats** -- mix of `{error}`, `{success, error}`, `{message}` | Various worker routers |

### Frontend
| # | Finding | Location |
|---|---------|----------|
| 21 | **MoreDetailsModal: 1,694 lines** with 7 effects, 12+ state vars, potential re-render loop | `src/components/modals/MoreDetailsModal.tsx` |
| 22 | **GlobalHeader: 1,392 lines** with duplicated theme menu (desktop/mobile) and massive inline styles | `src/components/layout/GlobalHeader.tsx` |
| 23 | **HelpModal: 1,310 lines** of mostly static content that should be data, not JSX | `src/components/modals/HelpModal.tsx` |
| 24 | **119 console.log statements** across 30 files | Various components |
| 25 | **No React Error Boundaries** -- unhandled errors cause white-screen crashes | App-wide |
| 26 | **Dual theme system** -- MUI + marketing CSS variables intermixed, dark mode bugs likely | GlobalHeader, marketing pages |

### Database
| # | Finding | Location |
|---|---------|----------|
| 27 | **JSON-in-columns** -- authors, categories, tags stored as JSON TEXT, preventing indexing/querying | `schema.sql:73-79` |
| 28 | **Missing FK constraints** on `book_genres`, `genre_requests`, `genre_suggestions`, `series` | `schema.sql` various |
| 29 | **Missing CHECK constraints** on status fields (`books.status`, removal/signup request statuses) | `schema.sql` various |
| 30 | **Redundant rating columns** -- `user_rating`, `average_rating`, `google_average_rating` overlap | `schema.sql:88-101` |
| 31 | **No pagination on `getUserBooks`** -- super admin path returns ALL books unbounded | `workers/books/index.ts` |

### Security (Medium)
| # | Finding | Location |
|---|---------|----------|
| 32 | **Rate limiter fails open** -- disabled on KV outage, catches return `allowed: true` | `workers/auth/rate-limiter.ts` |
| 33 | **User enumeration** via `/api/users/check` (reveals email existence + verification status) | `workers/auth-utils/index.ts:18-27` |
| 34 | **Profile update has zero input validation** -- no length limits, no sanitization | `workers/profile/index.ts:24-76` |
| 35 | **2FA not session-bound** -- accepts arbitrary `user_id` in completion, can be brute-forced separately | `workers/auth-core/index.ts:808-835` |

### Infrastructure
| # | Finding | Location |
|---|---------|----------|
| 36 | **CSP `connect-src` allows any HTTP/HTTPS** -- defeats XSS data exfiltration prevention | `netlify.toml:26` |
| 37 | **No concurrency controls** on GitHub Actions deployment workflows | `.github/workflows/` |
| 38 | **Performance monitoring is placeholder-only** -- console + localStorage, no real alerting | `src/lib/performance.ts` |
| 39 | **SQL injection in migration runner** -- filenames interpolated into SQL strings | `scripts/migrate.js:334-338` |
| 40 | **850-line Node.js script inline in YAML** with leftover debug code | `sync-production-to-staging.yml:173-1017` |

### Backend Bugs
| # | Finding | Location |
|---|---------|----------|
| 41 | **`updateAppeal` is broken** -- receives string userId but accesses `.user_role` property | `workers/appeals/index.ts:772-785` |
| 42 | **OpenLibrary analytics excludes super_admins** -- checks `!== 'admin'` only | `workers/admin/router.ts:736-747` |
| 43 | **Appeals module missing Content-Type headers** on all responses | `workers/appeals/index.ts` |

---

## LOW - Improve When Convenient

- Deprecated `images.domains` config (use `remotePatterns` for Next.js 14+)
- `@types/*` packages in production dependencies
- ESLint 8 is EOL (upgrade to 9 with flat config)
- Redundant `swcMinify: true` and `compress: true` in next.config.js
- Dead `CF_PAGES` code path in next.config.js
- `workers/index.original.ts.backup` checked into repo
- Non-RESTful URL patterns (`/api/books/:id/email-overdue-user`)
- 46+ migration files with no consolidation, unused rollback system
- Redundant triple-nested env checks in books debug logging
- Missing HSTS and Permissions-Policy headers

---

## Positive Observations

- **SQL injection prevention**: All D1 queries use parameterized `.bind()` -- no string concatenation in query values
- **Current password hashing**: PBKDF2 with 100k iterations, random salt, constant-time comparison
- **Worker modularization**: Clean refactor from monolithic 1,936 lines to domain-separated routers
- **Field selection system**: Typed field sets reduce API payloads intelligently
- **Code splitting**: Good use of `dynamic()` for lazy-loading modals
- **Virtual scrolling**: Handles large datasets well with configurable thresholds
- **Rate limiting architecture**: Well-configured limits for auth endpoints (5 login/15min, 3 register/hour)
- **Permission system**: Granular location-level + global permissions with role-based access
- **KV caching layer**: Books and admin data properly cached at the edge
- **Migration runner**: Smart bootstrap, checksums, batch tracking, rollback architecture

---

## Recommended Priority Order

1. **Authentication fixes** (#1-4) -- active vulnerabilities
2. **Add missing indexes** (#8) -- biggest performance win for minimal effort
3. **Transaction batching** (#7) -- data integrity risk
4. **Error handling fix** (#5) -- production errors are leaky and invisible
5. **CSRF fixes** (#6) -- active security gap
6. **Add basic test suite** (#10) -- no quality gates currently exist
7. **Clean up console.logs** (#24) -- quick win, production hygiene
8. **Decompose large components** (#21-23) -- maintainability
9. **Consolidate hook variants** (#15-16) -- remove dead code paths
10. **Fix type system** (#17-18) -- prevent future bugs
