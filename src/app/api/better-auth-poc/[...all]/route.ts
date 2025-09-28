/**
 * Better Auth PoC API Route Handler
 *
 * This file handles all Better Auth endpoints for the PoC evaluation.
 * Uses a separate path to avoid conflicts with existing NextAuth routes.
 */

import { auth } from "@/lib/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

// Create route handlers using Better Auth's Next.js adapter
export const { POST, GET } = toNextJsHandler(auth);