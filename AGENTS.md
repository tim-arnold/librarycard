# Agent Development Guide

## Build/Lint/Test Commands
- **Build**: `npm run build` (verify changes work)
- **Lint**: `npm run lint` (fix style issues)
- **TypeCheck**: `npm run typecheck` (validate TypeScript)
- **Testing**: Screenshot testing via `cd testing && node screenshot.js` (requires SCREENSHOT_USER/SCREENSHOT_PASSWORD in .env.local)
- **Dev Environment**: `npm run dev` (frontend) + `npx wrangler dev --local` (worker API)

## Code Style Guidelines
- **No comments**: Never add code comments unless explicitly requested
- **TypeScript strict mode**: All code must be properly typed using interfaces from `src/lib/types.ts`
- **Imports**: Use `@/` path aliases, import types with `import type`, group Material UI imports together
- **Components**: Use React.memo for performance, memoize event handlers, follow existing component patterns
- **API calls**: Use `getApiBaseUrl()` from `@/lib/apiConfig`, include Bearer token auth for worker calls
- **Error handling**: Use try/catch blocks, console.error for logging, graceful fallbacks
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for files

## Project Context
- **Architecture**: Next.js frontend + Cloudflare Workers API + D1 database
- **Client→Worker**: All API calls bypass Next.js routes and go directly to worker
- **Authentication**: NextAuth.js with `Authorization: Bearer ${email}` headers
- **Performance**: Virtual scrolling, React.memo, code splitting for large datasets
- **Deployment**: Feature branches → PR → staging/production via GitHub Actions