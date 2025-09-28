/**
 * Better Auth Configuration for LibraryCard PoC
 *
 * This file implements a proof-of-concept Better Auth setup to evaluate
 * it as a replacement for NextAuth.js as described in LCWEB-163.
 *
 * Features to implement for feature parity:
 * - Email/password authentication
 * - Google OAuth
 * - 2FA/TOTP support
 * - WebAuthn/Passkey support
 * - Role-based access control
 * - Multi-tenant (location-based) access
 */

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

// TODO: Import Better Auth plugins
// import { organization } from "better-auth/plugins/organization";
// import { twoFactor } from "better-auth/plugins/two-factor";
// import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
  // Database configuration - using SQLite for PoC
  // NOTE: This creates a local SQLite file for evaluation. Production would use D1.
  database: new Database("./poc-auth.db"),

  // Secret for signing JWTs and encrypting cookies
  secret: process.env.BETTER_AUTH_SECRET || "temporary-poc-secret-key-12345",

  // Email configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for PoC to simplify testing
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Base URL configuration
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api/better-auth-poc",

  // Plugins (to be enabled step by step)
  plugins: [
    // organization({
    //   async sendInvitationEmail(data) {
    //     // Implementation to send invitation emails
    //     console.log("Sending invitation email:", data);
    //   },
    // }),
    // twoFactor(),
    // passkey(),
  ],

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  // User configuration
  user: {
    additionalFields: {
      // Match our existing user schema
      first_name: {
        type: "string",
        required: false,
      },
      last_name: {
        type: "string",
        required: false,
      },
      user_role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      auth_provider: {
        type: "string",
        defaultValue: "email",
        required: false,
      },
      display_name_preference: {
        type: "string",
        defaultValue: "first_name",
        required: false,
      },
      custom_username: {
        type: "string",
        required: false,
      },
    },
  },

  // Advanced security options
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // May need for Cloudflare Workers
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session;