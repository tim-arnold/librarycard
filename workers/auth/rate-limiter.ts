import { Env } from '../types';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// Rate limit configurations for different endpoints
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth-login': { windowMs: 15 * 60 * 1000, maxAttempts: 5 }, // 5 attempts per 15 minutes
  'auth-register': { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 attempts per hour
  'auth-forgot-password': { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 attempts per hour
  'auth-reset-password': { windowMs: 60 * 60 * 1000, maxAttempts: 5 }, // 5 attempts per hour
  'api-general': { windowMs: 60 * 1000, maxAttempts: 100 }, // 100 requests per minute for general API
};

export class RateLimiter {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  private getKey(identifier: string, type: string): string {
    return `rate_limit:${type}:${identifier}`;
  }

  async checkRateLimit(
    identifier: string, 
    type: keyof typeof RATE_LIMITS
  ): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    const config = RATE_LIMITS[type];
    if (!config) {
      // If no rate limit configured, allow the request
      return { allowed: true };
    }

    const key = this.getKey(identifier, type);
    const now = Date.now();

    try {
      // Get current rate limit data
      const dataStr = await this.env.CACHE.get(key);
      let data: RateLimitData;

      if (dataStr) {
        data = JSON.parse(dataStr);
        
        // Check if the window has expired
        if (now > data.resetTime) {
          // Reset the counter
          data = { count: 1, resetTime: now + config.windowMs };
        } else {
          // Increment the counter
          data.count += 1;
        }
      } else {
        // First request in this window
        data = { count: 1, resetTime: now + config.windowMs };
      }

      // Store updated data with TTL
      const ttl = Math.ceil((data.resetTime - now) / 1000);
      await this.env.CACHE.put(key, JSON.stringify(data), {
        expirationTtl: ttl
      });

      // Check if limit exceeded
      if (data.count > config.maxAttempts) {
        return {
          allowed: false,
          resetTime: data.resetTime,
          remaining: 0
        };
      }

      return {
        allowed: true,
        resetTime: data.resetTime,
        remaining: config.maxAttempts - data.count
      };

    } catch (error) {
      // If rate limiting fails, allow the request to avoid breaking functionality
      console.error('Rate limiting error:', error);
      return { allowed: true };
    }
  }

  async recordAttempt(identifier: string, type: keyof typeof RATE_LIMITS): Promise<void> {
    // This method can be used to record failed attempts without checking the limit
    await this.checkRateLimit(identifier, type);
  }

  getClientIdentifier(request: Request): string {
    // Try to get client IP from Cloudflare headers
    const cfConnectingIp = request.headers.get('CF-Connecting-IP');
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    const xRealIp = request.headers.get('X-Real-IP');
    
    return cfConnectingIp || xForwardedFor || xRealIp || 'unknown';
  }

  createRateLimitResponse(resetTime: number): Response {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    return new Response(JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString()
      }
    });
  }
}