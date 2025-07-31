import { SignJWT, jwtVerify } from 'jose';
import { Env } from '../types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Generate JWT secret key from environment
async function getJWTSecret(env: Env): Promise<Uint8Array> {
  // Use a consistent secret based on environment
  const secret = env.JWT_SECRET || 'default-jwt-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, env: Env): Promise<string> {
  const secret = await getJWTSecret(env);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hour expiration
    .sign(secret);
}

export async function verifyJWT(token: string, env: Env): Promise<JWTPayload | null> {
  try {
    const secret = await getJWTSecret(env);
    
    const { payload } = await jwtVerify(token, secret);
    
    return payload as JWTPayload;
  } catch (error) {
    if (env.ENVIRONMENT === 'local') {
      console.log('🔍 JWT: Token verification failed:', error);
    }
    return null;
  }
}

export async function refreshJWT(oldToken: string, env: Env): Promise<string | null> {
  const payload = await verifyJWT(oldToken, env);
  if (!payload) {
    return null;
  }
  
  // Create new token with same payload but fresh expiration
  return await generateJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  }, env);
}