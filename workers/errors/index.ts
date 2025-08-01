// Centralized error handling to prevent information disclosure
// Provides secure error responses while maintaining debugging capability

import { Env } from '../types';

// Error categories for different types of issues
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization', 
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_API = 'external_api'
}

// Security-focused error response interface
export interface SecureErrorResponse {
  error: string;
  code?: string;
  details?: string;
  timestamp: string;
}

// Internal error details (for logging only)
interface ErrorDetails {
  category: ErrorCategory;
  originalError?: any;
  context?: Record<string, any>;
  endpoint?: string;
  userId?: string;
}

// Sanitize error messages to prevent information disclosure
function sanitizeErrorMessage(error: any, category: ErrorCategory): string {
  // Never expose raw error messages in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed';
    
    case ErrorCategory.AUTHORIZATION:
      return 'Access denied';
    
    case ErrorCategory.VALIDATION:
      // Validation errors can be more specific as they're user input related
      if (typeof error === 'string') {
        return error;
      }
      return 'Invalid input data';
    
    case ErrorCategory.NOT_FOUND:
      return 'Resource not found';
    
    case ErrorCategory.RATE_LIMIT:
      return 'Too many requests. Please try again later.';
    
    case ErrorCategory.DATABASE_ERROR:
      return isProduction ? 'A database error occurred' : `Database error: ${error?.message || error}`;
    
    case ErrorCategory.EXTERNAL_API:
      return 'External service temporarily unavailable';
    
    case ErrorCategory.SERVER_ERROR:
    default:
      return isProduction ? 'An internal server error occurred' : `Server error: ${error?.message || error}`;
  }
}

// Generate secure error code for tracking
function generateErrorCode(category: ErrorCategory): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${category.toUpperCase()}_${timestamp}_${random}`;
}

// Log error details securely (for debugging)
function logErrorSecurely(env: Env, details: ErrorDetails): void {
  // Only log detailed errors in non-production environments
  if (env.ENVIRONMENT === 'local') {
    console.error('🚨 Error Details:', {
      category: details.category,
      endpoint: details.endpoint,
      userId: details.userId,
      error: details.originalError,
      context: details.context,
      timestamp: new Date().toISOString()
    });
  } else {
    // In production, only log essential info
    console.error('Error occurred:', {
      category: details.category,
      endpoint: details.endpoint,
      timestamp: new Date().toISOString()
    });
  }
}

// Create secure error response
export function createSecureErrorResponse(
  env: Env,
  error: any,
  category: ErrorCategory,
  context?: {
    endpoint?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  }
): Response {
  const errorCode = generateErrorCode(category);
  const sanitizedMessage = sanitizeErrorMessage(error, category);
  
  // Log error details for debugging
  logErrorSecurely(env, {
    category,
    originalError: error,
    context: context?.additionalContext,
    endpoint: context?.endpoint,
    userId: context?.userId
  });

  // Determine HTTP status code
  let statusCode = 500;
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      statusCode = 401;
      break;
    case ErrorCategory.AUTHORIZATION:
      statusCode = 403;
      break;
    case ErrorCategory.VALIDATION:
      statusCode = 400;
      break;
    case ErrorCategory.NOT_FOUND:
      statusCode = 404;
      break;
    case ErrorCategory.RATE_LIMIT:
      statusCode = 429;
      break;
    case ErrorCategory.DATABASE_ERROR:
    case ErrorCategory.EXTERNAL_API:
    case ErrorCategory.SERVER_ERROR:
    default:
      statusCode = 500;
      break;
  }

  const response: SecureErrorResponse = {
    error: sanitizedMessage,
    code: errorCode,
    timestamp: new Date().toISOString()
  };

  // Add details only in development
  if (env.ENVIRONMENT === 'local' && typeof error === 'object' && error?.message) {
    response.details = error.message;
  }

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Wrapper for database operations with secure error handling
export async function withDatabaseErrorHandling<T>(
  env: Env,
  operation: () => Promise<T>,
  context?: { endpoint?: string; userId?: string }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Check if it's a database constraint violation or similar
    const errorMessage = error?.message || String(error);
    
    // Log the full error for debugging
    logErrorSecurely(env, {
      category: ErrorCategory.DATABASE_ERROR,
      originalError: error,
      endpoint: context?.endpoint,
      userId: context?.userId
    });

    // Throw a sanitized error
    throw new Error('Database operation failed');
  }
}

// Wrapper for external API calls with secure error handling
export async function withExternalAPIErrorHandling<T>(
  env: Env,
  operation: () => Promise<T>,
  apiName: string,
  context?: { endpoint?: string; userId?: string }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logErrorSecurely(env, {
      category: ErrorCategory.EXTERNAL_API,
      originalError: error,
      context: { apiName },
      endpoint: context?.endpoint,
      userId: context?.userId
    });

    throw new Error(`${apiName} service temporarily unavailable`);
  }
}

// Common error response templates
export const CommonErrors = {
  UNAUTHORIZED: (env: Env, corsHeaders: Record<string, string>) => 
    new Response(JSON.stringify({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }),

  FORBIDDEN: (env: Env, corsHeaders: Record<string, string>) =>
    new Response(JSON.stringify({
      error: 'Access denied',
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }),

  NOT_FOUND: (env: Env, corsHeaders: Record<string, string>) =>
    new Response(JSON.stringify({
      error: 'Resource not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
};

// Middleware to catch unhandled errors
export function withGlobalErrorHandling(
  env: Env,
  corsHeaders: Record<string, string>,
  handler: () => Promise<Response>,
  context?: { endpoint?: string; userId?: string }
): Promise<Response> {
  return handler().catch((error) => {
    return createSecureErrorResponse(
      env, 
      error, 
      ErrorCategory.SERVER_ERROR, 
      context
    );
  });
}